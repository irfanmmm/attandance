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


  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const isProcessingFrame = useSharedValue(false);
  const location = useSharedValue({ latitude: 0, longitude: 0 });
  const isLocationReady = useSharedValue(false);
  const settings = useSettings();
  const { callLocation } = useLocationShared();

  const updateState = async updates => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'loading':
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
  };

  const handleUpdateState = useRunOnJS((status, loading, error) => {
    updateState({ status, loading, error });
  });

  const markActive = useRunOnJS(() => {
    lastActiveTimeRef.current = Date.now();
  });

  const captureFrame = async (base64, rollAngle = 0) => {
    if (!base64 || isCapturingRef.current) {
      isProcessingFrame.value = false;
      return;
    }

    let lat = location.value.latitude;
    let lng = location.value.longitude;

    if (
      lat === null ||
      lng === null ||
      lat === 0 ||
      lng === 0 ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      if (
        settings?.['Location Tracking'] &&
        permission?.location === 'granted'
      ) {
        updateState({
          error: false,
          status: 'Getting location... Please wait.',
          loading: true,
        });

        try {
          const response = await callLocation();
          if (response.latitude && response.longitude) {
            lat = response.latitude;
            lng = response.longitude;
          }
        } catch (error) {
          console.warn('⚠️ Failed to get location in captureFrame:', error);
        }
      }

      if (!lat || isNaN(lat)) lat = 0;
      if (!lng || isNaN(lng)) lng = 0;
    }

    updateState({
      error: false,
      status: 'Matching your face encoding...',
      loading: true,
    });

    isCapturingRef.current = true;

    try {
      const postPayload = {
        latitude: lat,
        longitude: lng,
        base64: base64,
      };

      const data = await fetchData({
        url: 'compare-face',
        method: 'POST',
        data: postPayload,
        signal: axiosSignal.current?.signal,
      });


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

  const processFace = useRunOnJS((base64, rollAngle) => {
    captureFrame(base64, rollAngle);
  });

  const { permission, initLocation } = useScanPermissions({
    settings,
    updateState,
    callLocation,
    location,
    isLocationReady,
    isProcessingFrame,
  });

  const { frameProcessor } = useScanFrameProcessor({
    isLocationReady,
    isModalVisible,
    isProcessingFrame,
    markActive,
    handleUpdateState,
    processFace,
    onFaceStateChange: detected => {
      setIsFaceDetected(detected);
    },
    onFaceBoundsChange: face => {
      setFaceObj(face);
    },


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
        isActive={isActive}
        ref={camera}
        video={false}
        photo
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
