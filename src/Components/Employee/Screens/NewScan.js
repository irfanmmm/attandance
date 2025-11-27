import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { faceDetectorPluggin } from 'react-native-face-detector-mlkit';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BackgroundService from 'react-native-background-actions';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { Worklets, useRunOnJS } from 'react-native-worklets-core';
import { BASE_URL } from '../../utils/urls';
import { Fonts, SIZE } from '../../utils/Styles';
import CommonButton from '../../CommonButton';
import ErrorIcon from '../../../assets/svg/error.svg';
import ScanIcon from '../../../assets/svg/scan.svg';
import { Context } from '../../Redux/Store';
import { useFocusEffect } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { SystemBars } from 'react-native-edge-to-edge';
import OnBoarding from '../OnBoarding';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import { useSettings } from '../../utils/useSettings';
import { PermissionsService } from '../../utils/permissions';
import { useAxios } from '../../utils/useAxios';
import { useLocationShared } from '../../utils/useLocation';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  model: 'fast',
});
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'always',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

const NewScan = ({ navigation }) => {
  const device = useCameraDevice('front');
  const { fetchData } = useAxios();
  const [isActive, setIsActive] = useState(false);
  const [permission, setPermission] = useState(null);
  const camera = useRef(null);
  const { locationShared, callLocation } = useLocationShared();
  const settings = useSettings();

  const [loading, setLoading] = useState(false);
  const lastRunRef = useRef(0);
  const insets = useSafeAreaInsets();

  const [error, setError] = useState(false);
  const [isFrameProcessorEnabled, setIsFrameProcessorEnabled] = useState(true);

  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const { state } = useContext(Context);

  const isAdmin = state.userData.is_admin;
  const isHighAccuracyRef = useRef(true);

  const abortControllerRef = useRef(null);
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 NewScan screen focused');
      setIsActive(true);
      isHighAccuracyRef.current = true;

      let watchId;
      // if(settings?.['Location Tracking']){

      // }
      PermissionsService.requestCameraAndLocation().then(res => {
        setPermission(res);
        if (res.location === 'granted') {
          callLocation();
        }
      });

      return () => {
        console.log('📱 NewScan screen unfocused - cleaning up');
        setIsActive(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('Aborted fetch due to screen unfocus');
        }
      };
    }, []),
  );

  const getversion = async () => {
    try {
      const res = await fetchData({
        url: 'app-version',
        // method: 'POST',
        // data: { compony_code: code },
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
      getversion();
      settings?.['Location Tracking'] && callLocation();
    }, [settings]),
  );
  const checkForUpdate = latestVersion => {
    // Change this to your latest version
    // const latestVersion = "2.0.0";                    // ← UPDATE THIS
    const currentVersion = DeviceInfo.getVersion(); // e.g., 1.5.3
    console.log(currentVersion, 'currentVersion');

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
        { cancelable: false }, // User cannot skip
      );
    }
  };

  const updateState = updates => {
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

  const captureFrame = async () => {
    if (
      !camera.current ||
      isCapturingRef.current ||
      lastRunRef.current > Date.now() - 800
    ) {
      return;
    }
    updateState({
      status: 'Verifying identity...',
      loading: true,
      error: false,
    });

    isCapturingRef.current = true;
    try {
      setIsFrameProcessorEnabled(false);
      const photo = await camera.current?.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
        enableShutterSound: false,
      });

      console.log('📸 Captured photo:', photo?.path);

      const formData = new FormData();
      formData.append('file', {
        uri: `file://${photo?.path}`,
        name: 'face.jpg',
        type: 'image/jpeg',
      });

      const location = locationShared.value;

      formData.append('latitude', location.latitude ?? '');
      formData.append('longitude', location.longitude ?? '');

      const data = await fetchData({
        url: 'compare-face',
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
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
        });
        setIsActive(false);

        isCapturingRef.current = false;
      } else {
        updateState({
          error: true,
          status: data?.message || 'Face not recognized. Try again.',
          loading: false,
          duration: Date.now(),
        });

        isCapturingRef.current = false;
      }
    } catch (err) {
      console.log('❌ Upload error:', err.response.data.message);
      const errorMessage =
        err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Connection failed. Please try again.';
      updateState({
        loading: false,
        error: true,
        status: errorMessage,
        processing: false,
        duration: Date.now(),
      });
      isCapturingRef.current = false;
    } finally {
      setTimeout(() => {
        setIsFrameProcessorEnabled(true);
      }, 2000);
    }
  };

  const handleUpdateState = useRunOnJS((status, loading, error) => {
    updateState({ status, loading, error });
  });

  const processFace = useRunOnJS(() => {
    captureFrame();
  });

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';

    const result = xyzFrameProcessor?.call(frame);
    if (result && result[0]?.liveness) {
      processFace();
    } else {
      handleUpdateState(
        'Please align your face within the frame',
        false,
        false,
      );
    }
  }, []);

  const activeFrameProcessor = useMemo(() => {
    if (!isFrameProcessorEnabled && Platform.OS === 'ios') return undefined;
    return frameProcessor;
  }, [isFrameProcessorEnabled]);

  const navigateToAdmin = () => {
    navigation.navigate('AddEmployee', {
      isNewScan: true,
    });
    setIsActive(false);
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

  if (!permission || permission === 'denied' || permission === 'blocked') {
    return (
      <View style={styles.cameraLoadingContainer}>
        <StatusBar
          translucent
          backgroundColor={'transparent'}
          barStyle={'dark-content'}
        />

        <Text style={{ ...styles.cameraLoadingText, marginBottom: SIZE(10) }}>
          {permission === 'blocked'
            ? 'Camera or Location access is blocked. Please enable both in Settings.'
            : 'Waiting for camera and location permission...'}
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

  if (permission === 'error') {
    return (
      <View style={styles.cameraLoadingContainer}>
        <Text style={styles.cameraLoadingText}>
          Error checking camera and location permissions. Please try again.
        </Text>
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
        frameProcessor={activeFrameProcessor}
      />
      {/* {console.log(!settings?.['Individual Login'])}
      {console.log(isAdmin,'isAdminisAdminisAdmin')} */}

      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={10}
          onPress={() => {
            if (!settings?.['Individual Login']) {
          

              navigation.navigate('Authentication');
            } else if (isAdmin) {
              navigation.navigate('EmpManagement');
            } else {
              navigation.navigate('SingleEmployeeReport', {
                isNewScan: true,
              });
            }
            // settings?.['Individual Login']? navigation.navigate('Authentication'):
            // isAdmin
            //   ? navigation.navigate('EmpManagement')
            //   : navigation.navigate('SingleEmployeeReport', {
            //       isNewScan: true,
            //     });
            // isAdmin
            //   ? navigation.navigate('EmpManagement')
            //   : navigation.navigate('Authentication');
          }}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            {!settings?.['Individual Login']
              ? 'Admin'
              : isAdmin
              ? 'Admin'
              : 'Attndance Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ ...styles.header, left: 20, right: undefined }}>
        <TouchableOpacity
          hitSlop={10}
          onPress={navigateToAdmin}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            Add Face
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

      <View style={[styles.statusContainer,{  bottom: insets.bottom+ 30,}]}>
        <View
          style={{
            ...styles.statusMessage,
            marginBottom: error ? SIZE(7) : null,
            backgroundColor: !error ? '#00000099' : '#FF0000',
          }}
        >
          {loading && <ActivityIndicator color={'#ffffff'} size={'small'} />}
          {error && <ErrorIcon width={24} height={24} />}
          <Text allowFontScaling={false} style={styles.statusText}>
            {status}
          </Text>
        </View>
      </View>

      {/* <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <OnBoarding resumeCamera={resumeCamera} />
      </Modal> */}
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
