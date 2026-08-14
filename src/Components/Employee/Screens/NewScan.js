import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { useFocusEffect } from '@react-navigation/native';
import OnBoarding from '../OnBoarding';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScanFrameProcessor } from '../../utils/useScanFrameProcessor';
import { useScanPermissions } from '../../utils/useScanPermissions';
import { useSettings } from '../../utils/useSettings';
import { useLocationShared } from '../../utils/useLocation';
import { useAxios } from '../../utils/useAxios';
import { Fonts, SIZE } from '../../utils/Styles';

import CommonButton from '../../CommonButton';
import { FaceScanOverlay } from './FaceScanOverlay';

const NewScan = ({ navigation }) => {
  const device = useCameraDevice('front');

  const { fetchData } = useAxios();


  const [isActive, setIsActive] = useState(false);

  const axiosSignal = useRef(null);
  const camera = useRef(null);

  const [loading, setLoading] = useState(false);
  const lastRunRef = useRef(0);
  const lastActiveTimeRef = useRef(Date.now());
  const [showModal, setShowModal] = useState(false);
  const isModalVisible = useSharedValue(false);
  const insets = useSafeAreaInsets();

  const [error, setError] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceObj, setFaceObj] = useState(null);

  const isCapturingRef = useRef(false);
  const processingStartRef = useRef(null);


  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const isProcessingFrame = useSharedValue(false);
  const location = useSharedValue({ latitude: 0, longitude: 0 });
  const isLocationReady = useSharedValue(false);
  const settings = useSettings();
  const { callLocation } = useLocationShared();

  // Stable (zero-dependency) - only touches refs and React setState setters,
  // both of which are guaranteed stable across renders. Keeping this a stable
  // reference lets handleUpdateState below stay stable too, see comment there.
  const updateState = useCallback(async updates => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'loading':
          // Only start the watchdog clock on the false->true transition. The
          // worklet's own ~2.5s self-heal re-sends loading:true repeatedly
          // while a capture attempt is stuck, and restarting the clock on
          // every one of those meant the 6s watchdog below could never
          // actually elapse.
          if (value) {
            if (!processingStartRef.current) {
              processingStartRef.current = Date.now();
            }
          } else {
            processingStartRef.current = null;
          }
          setLoading(value);
          break;
        case 'status':
          setStatus(value);
          break;
        case 'error':
          setError(value);
          break;
        default:
      }
    });
  }, []);

  // useRunOnJS memoizes via the dependency array (like useMemo) - omitting it
  // (as this previously did) means React recreates the underlying native JSI
  // binding on EVERY render. Vision Camera's useFrameProcessor docs warn that
  // an unstable dependency forces the Camera to reset its whole Frame
  // Processor Context, which on Android especially caused visible stutter and
  // could drop an in-flight processFace() call while stuck mid-capture,
  // leaving isProcessingFrame stuck true with no matching JS call ever
  // completing (the "stuck Processing your face" bug). Passing real
  // dependency arrays here keeps these bindings stable across renders.
  const handleUpdateState = useRunOnJS((status, loading, error) => {
    updateState({ status, loading, error });
  }, [updateState]);

  const markActive = useRunOnJS(() => {
    lastActiveTimeRef.current = Date.now();
  }, []);

  const captureFrame = async (base64, rollAngle = 0) => {
    // Unconditional diagnostic: confirms whether the worklet->JS bridge call
    // is reaching JS at all for this attempt, and with what payload size.
    // Cheap and safe to leave in - if "stuck" recurs, logcat will show
    // whether this line fires every attempt (bridge OK, something downstream
    // fails every time) or stops firing entirely (bridge call itself is lost).
    console.log(`📸 captureFrame invoked, base64Len=${base64?.length ?? 0}, isCapturing=${isCapturingRef.current}`);

    if (isCapturingRef.current) {
      // A capture is already in flight - its own try/finally will settle the
      // UI state when it completes, so leave status/loading alone here.
      return;
    }

    if (!base64) {
      // The worklet only calls processFace when it has a croppedBase64, so
      // reaching here with nothing usable means the value was lost/corrupted
      // crossing the worklet->JS bridge. The worklet already set the UI to
      // "Processing your face..." before this call - without resetting it
      // here, the screen is stuck on that text forever with the API never
      // called, since nothing else will touch this state until the face
      // leaves and re-enters the frame.
      console.warn('⚠️ captureFrame: received empty/invalid base64, resetting scan state');
      isProcessingFrame.value = false;
      updateState({
        loading: false,
        error: false,
        status: 'Please align your face within the frame',
      });
      return;
    }

    // Claim the in-flight slot synchronously, before any `await`, so no other
    // frame's captureFrame call can slip through the guard above while this
    // one is still doing its location fetch. Logs confirmed multiple
    // "isCapturing=false" invocations landing within the same ~1s window -
    // this was a genuine race: the flag used to only get set after the
    // location-fetch await (up to 1200ms) below, leaving a window where
    // concurrent frames all saw isCapturingRef.current as false and each
    // launched their own overlapping request.
    isCapturingRef.current = true;

    let lat = location.value?.latitude || 0;
    let lng = location.value?.longitude || 0;

    if ((!lat || !lng) && settings?.['Location Tracking']) {
      try {
        const response = await Promise.race([
          callLocation(),
          new Promise(resolve => setTimeout(() => resolve({ latitude: 0, longitude: 0 }), 1200)),
        ]);
        if (response?.latitude && response?.longitude) {
          lat = response.latitude;
          lng = response.longitude;
        }
      } catch (error) {
        console.warn('⚠️ Failed to get location in captureFrame:', error);
      }
    }

    if (!lat || isNaN(lat)) lat = 0;
    if (!lng || isNaN(lng)) lng = 0;

    updateState({
      error: false,
      status: 'Matching your face encoding...',
      loading: true,
    });

    try {
      const postPayload = {
        latitude: lat,
        longitude: lng,
        base64: base64,
      };

      // Hard local timeout, independent of axios's own `timeout` option -
      // logs confirmed a real request can hang past 15s+ with the awaited
      // promise never settling at all (neither resolving nor rejecting),
      // which left isCapturingRef stuck true forever since the `finally`
      // below only runs once this await settles. This guarantees captureFrame
      // always completes within ~10s regardless of what the network/axios
      // layer does.
      const data = await Promise.race([
        fetchData({
          url: 'compare-face',
          method: 'POST',
          data: postPayload,
          signal: axiosSignal.current?.signal,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 10000),
        ),
      ]);


      if (data?.message === 'success') {
        updateState({
          status: 'Response received',
          loading: false,
          error: false,
        });
        navigation.navigate('Status', {
          username: data?.details?.fullname,
          direction: data?.details?.direction,
          workingHours: data?.details?.working_time,
        });
        isCapturingRef.current = false;
        isProcessingFrame.value = false;
        return;
      } else {
        updateState({
          error: true,
          status: data?.message || 'Face not recognized. Try again.',
          loading: false,
          duration: Date.now(),
        });
      }
    } catch (err) {
      if (
        err.name === 'AbortError' ||
        err.name === 'CanceledError' ||
        err.code === 'ERR_CANCELED' ||
        err.message === 'canceled'
      ) {
        console.log('⏹️ Request aborted');
        updateState({
          loading: false,
          error: false,
          status: 'Please align your face within the frame',
        });
        return;
      }

      console.log(
        '❌ Upload error:',
        err?.response?.data?.message || err.message,
      );
      const errorMessage = 'Connection failed. Please try again.';

      updateState({
        loading: false,
        error: true,
        status: err?.response?.data?.message || errorMessage,
        processing: false,
        duration: Date.now(),
      });
    } finally {
      // 2.0s Cooldown lock to prevent flickering, screen jitter, and 12 req/sec API spamming
      setTimeout(() => {
        isCapturingRef.current = false;
        isProcessingFrame.value = false;
      }, 2000);
    }
  };

  // captureFrame closes over settings/callLocation/fetchData/navigation, which
  // are not worth threading through a dependency array - instead keep a ref
  // to the latest closure (updated every render, cheap) and give processFace
  // itself a permanently stable identity via an empty dependency array, so
  // its native JSI binding (see comment above handleUpdateState) is only ever
  // created once.
  const captureFrameRef = useRef(captureFrame);
  captureFrameRef.current = captureFrame;

  const processFace = useRunOnJS((base64, rollAngle) => {
    captureFrameRef.current(base64, rollAngle);
  }, []);

  const { permission, initLocation } = useScanPermissions({
    settings,
    updateState,
    callLocation,
    location,
    isLocationReady,
    isProcessingFrame,
  });

  // Stable for the same reason as updateState above - onFaceStateChange /
  // onFaceBoundsChange are read by notifyFaceState / notifyFaceBounds inside
  // useScanFrameProcessor, and must stay stable to keep the frame processor
  // itself stable across renders.
  const handleFaceStateChange = useCallback(detected => {
    setIsFaceDetected(detected);
  }, []);

  const handleFaceBoundsChange = useCallback(face => {
    setFaceObj(face);
  }, []);

  const { frameProcessor } = useScanFrameProcessor({
    isLocationReady,
    isModalVisible,
    isProcessingFrame,
    markActive,
    handleUpdateState,
    processFace,
    onFaceStateChange: handleFaceStateChange,
    onFaceBoundsChange: handleFaceBoundsChange,
  });

  const getversion = async () => {
    try {
      const res = await fetchData({
        url: 'app-version',
      });
      if (res?.message === 'success') {
        const platform = Platform.OS;
        if (res?.[platform]?.force) {
          checkForUpdate(res?.[platform]?.version);
        }
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      axiosSignal.current = new AbortController();
      getversion();
      setIsActive(true);
      lastActiveTimeRef.current = Date.now();
      initLocation();
      return () => {
        axiosSignal.current?.abort();
        setIsActive(false);
      };
    }, [settings]),
  );

  useEffect(() => {
    isModalVisible.value = showModal;

    let interval;
    if (!showModal) {
      interval = setInterval(() => {
        if (isActive && Date.now() - lastActiveTimeRef.current > 10000) {
          setShowModal(true);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showModal, isActive]);

  // Watchdog: recover if "Processing your face..." gets stuck (e.g. a dropped
  // worklet->JS bridge call or a hung request) instead of relying on the user
  // moving out of frame and back in to force a reset.
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (
        processingStartRef.current &&
        Date.now() - processingStartRef.current > 6000
      ) {
        console.log('⏱️ Processing watchdog: resetting stuck scan state');
        processingStartRef.current = null;
        isCapturingRef.current = false;
        isProcessingFrame.value = false;
        updateState({
          loading: false,
          error: false,
          status: 'Please align your face within the frame',
        });
      }
    }, 1000);
    return () => clearInterval(watchdog);
  }, [isProcessingFrame, updateState]);

  const navigateToAdmin = () => {
    navigation.navigate('Authentication', {
      isNewScan: true,
      settings: settings?.['List Employees'],
    });
  };

  const format = useMemo(
    () => device?.formats?.find(f => f.videoWidth === 720 && f.videoHeight === 1280)
      ?? device?.formats?.find(f => f.videoWidth === 1280 && f.videoHeight === 720),
    [device],
  );

  // Cap the frame processor rate so the ML face-detection work run per frame
  // has a realistic time budget on lower-end Android CPUs, instead of racing
  // at the format's max supported fps and dropping/lagging frames.
  const fps = useMemo(() => {
    if (!format?.minFps || !format?.maxFps) return undefined;
    return Math.max(format.minFps, Math.min(30, format.maxFps));
  }, [format]);

  if (!device) {
    return (
      <View style={styles.cameraLoadingContainer}>
        <StatusBar
          translucent
          backgroundColor={'transparent'}
          barStyle={'dark-content'}
        />

        <ActivityIndicator size="large" color="#153CD8" />
        <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission || permission.camera !== 'granted') {
    return (
      <View style={styles.cameraLoadingContainer}>
        <StatusBar
          translucent
          backgroundColor={'transparent'}
          barStyle={'dark-content'}
        />

        <Text style={{ ...styles.cameraLoadingText, marginBottom: SIZE(10) }}>
          {permission?.camera === 'blocked'
            ? 'Camera access is blocked. Please enable it in Settings.'
            : 'Waiting for camera permission...'}
        </Text>
        <CommonButton
          backgroundColor="#153CD8"
          color="#FFFFFF"
          title="Open Settings"
          onPress={() => Linking.openSettings()}
        />
      </View>
    );
  }

  if (showModal) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <OnBoarding
          resumeCamera={() => {
            lastActiveTimeRef.current = Date.now();
            setShowModal(false);
          }}
          navigateToAdmin={navigateToAdmin}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        device={device}
        format={format}
        fps={fps}
        isActive={isActive}
        ref={camera}
        video={false}
        photo={false}
        style={StyleSheet.absoluteFill}
        frameProcessor={frameProcessor}
      />
      <View style={{ ...styles.header, left: 20, right: undefined }}>
        <TouchableOpacity
          hitSlop={10}
          onPress={navigateToAdmin}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Animated Futuristic Face Scan & Real-Time Tracking Overlay */}
      <FaceScanOverlay
        status={status}
        isFaceDetected={isFaceDetected}
        isProcessing={loading}
        isError={error}
        faceObj={faceObj}
      />
    </View>
  );
};

export default NewScan;

const styles = StyleSheet.create({
  cameraLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: SIZE(30),
  },
  cameraLoadingText: {
    color: '#000000',
    fontSize: SIZE(16),
    marginTop: SIZE(10),
    fontFamily: Fonts?.Regular,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    zIndex: 25,
    top: 50,
    right: 20,
  },
  adminButton: {
    backgroundColor: '#FFFFFF33',
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(30),
    height: SIZE(40),
    justifyContent: 'center',
    alignContent: 'center',
  },
  adminText: {
    fontSize: SIZE(14),
    color: '#FFFFFF',
    lineHeight: SIZE(16),
    fontFamily: Fonts?.Regular,
  },
  statusContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 25,
    alignItems: 'center',
  },
  statusMessage: {
    borderRadius: SIZE(8),
    width: SIZE(350),
    height: SIZE(34),
    paddingHorizontal: SIZE(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: SIZE(12),
    lineHeight: SIZE(14),
    color: '#E2E2E2',
    fontFamily: Fonts?.Regular || 'System',
    marginLeft: SIZE(10),
  },
});
