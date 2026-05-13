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
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import ScanIcon from '../../../assets/svg/scan.svg';
import { Context } from '../../Redux/Store';
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
    if (lastRunRef.current > Date.now() - 700) return;
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'loading':
          setLoading(value);
          break;
        case 'status':
          setStatus(value);
          break;
        case 'duration':
          lastRunRef.current = value;
          break;
        case 'error':
          setError(value);
          break;
        case 'processing':
          setStatus(value);
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

  const captureFrame = async (base64, boundry = null) => {
    if (!camera.current || isCapturingRef.current) {
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
      const data = await fetchData({
        url: 'compare-face',
        method: 'POST',
        data: {
          base64: base64,
          boundry: boundry,
          latitude: lat,
          longitude: lng,
        },
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
        err.code === 'ERR_CANCELED'
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
      if (isActive) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      isCapturingRef.current = false;
      isProcessingFrame.value = false;
    }
  };

  const processFace = useRunOnJS((base64, lat, long) => {
    captureFrame(base64, lat, long);
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

  const checkForUpdate = latestVersion => {
    const currentVersion = DeviceInfo.getVersion();
    if (currentVersion < latestVersion) {
      Alert.alert(
        'Update Required',
        'Please update the app to continue.',
        [
          {
            text: 'Update Now',
            onPress: () => {
              const link =
                Platform.OS === 'android'
                  ? 'https://play.google.com/store/apps/details?id=com.officekitlence'
                  : 'https://apps.apple.com/us/app/facekit/id6753619593';

              Linking.openURL(link);
            },
          },
        ],
        { cancelable: false },
      );
    }
  };

  const navigateToAdmin = () => {
    navigation.navigate('Authentication', {
      isNewScan: true,
      settings: settings?.['List Employees'],
    });
  };

  const format = device?.formats?.find(
    f => f.videoWidth === 1280 && f.videoHeight === 720,
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
      <View style={styles.frameContainer}>
        <View style={styles.titileContainer}>
          <Text allowFontScaling={false} style={styles.scanText}>
            Scan your Face
          </Text>
        </View>
        <View>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.scanStatus}>
          <ScanIcon width={SIZE(16)} height={SIZE(16)} />
          <Text
            style={{
              ...styles.scanText,
              fontSize: SIZE(16),
              marginLeft: SIZE(5),
            }}
          >
            Please align your face within the frame
          </Text>
        </View>
      </View>
      <View style={[styles.statusContainer, { bottom: insets.bottom + 30 }]}>
        <View
          style={{
            ...styles.statusMessage,
            backgroundColor: !error ? '#00000099' : '#FF0000',
          }}
        >
          {loading && <ActivityIndicator color={'#ffffff'} size={'small'} />}
          <Text allowFontScaling={false} style={styles.statusText}>
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default NewScan;

const frameWidth = 310;
const frameHeight = 310;

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
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  frame: {
    width: frameWidth + 7,
    height: frameHeight + 7,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#CDCDCD',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
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
    fontFamily: Fonts.Regular,
    marginLeft: SIZE(10),
  },
  titileContainer: {
    alignSelf: 'center',
    zIndex: 20,
    top: -20,
  },
  scanText: {
    fontSize: SIZE(20),
    lineHeight: SIZE(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Regular,
  },
  scanStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    zIndex: 20,
    bottom: -20,
  },
});
