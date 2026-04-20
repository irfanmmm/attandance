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
  runAsync,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import {
  useRunOnJS,
  useSharedValue,
  useWorklet,
  worklet,
  Worklets,
} from 'react-native-worklets-core';
// import {} from 'react-native-reanimated'
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
// import {} from 'react-native-geolocation-service';
import { useSettings } from '../../utils/useSettings';
import { PermissionsService } from '../../utils/permissions';
import { useAxios } from '../../utils/useAxios';
import { useLocationShared } from '../../utils/useLocation';
import DeviceInfo from 'react-native-device-info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { crop } from 'vision-camera-cropper';
import Geolocation from 'react-native-geolocation-service';

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  model: 'fast',
});
const NewScan = ({ navigation }) => {
  const device = useCameraDevice('front');
  const { fetchData } = useAxios();
  const [isActive, setIsActive] = useState(false);
  const [permission, setPermission] = useState(null);
  const axiosSignal = useRef(null);
  const camera = useRef(null);
  // const { callLocation } = useLocationShared();

  const locationShared = useSharedValue({
    latitude: null,
    longitude: null,
    timestamp: null,
  });

  // console.log(locationShared.value, 'new scan section----')
  const settings = useSettings();

  const [loading, setLoading] = useState(false);
  const lastRunRef = useRef(0);
  const insets = useSafeAreaInsets();

  const [error, setError] = useState(false);
  const [isFrameProcessorEnabled, setIsFrameProcessorEnabled] = useState(true);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 0,
    longitude: 0,
    isValid: false,
  });

  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const { state } = useContext(Context);

  const isAdmin = state.userData.is_admin;

  const isProcessingFrame = useSharedValue(false);
  const { callLocation } = useLocationShared();

  const location = useSharedValue({ latitude: 0, longitude: 0 });
  const isLocationReady = useSharedValue(false);

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
      setIsActive(true);
      initLocation();
      console.log('📱 NewScan screen unfocused - cleaning up');
      return () => {
        axiosSignal?.current?.abort();
        setIsActive(false);
        console.log('unmount this screen');
      };
    }, [settings]),
  );

  const initLocation = async () => {
    if (!settings?.['Location Tracking']) {
      setCurrentLocation({ latitude: 0, longitude: 0, isValid: true });
      return;
    }

    const res = await PermissionsService.requestCameraAndLocation();
    setPermission(res);
    if (res.location !== 'granted') return;

    updateState({
      status: 'Finding your location...',
      loading: true,
      error: false,
    });

    try {
      const res = await callLocation();

      if (res?.latitude && res?.longitude) {
        // Use setState instead of shared value
        // setCurrentLocation({
        //   latitude: res.latitude,
        //   longitude: res.longitude,
        //   isValid: true,
        // });

        location.value = {
          latitude: res.latitude,
          longitude: res.longitude,
        };
        isLocationReady.value = true;
        isProcessingFrame.value = false;
        updateState({
          status: 'Please align your face within the frame',
          loading: false,
          error: false,
        });
      } else {
        throw new Error('Invalid location');
      }
    } catch (err) {
      setCurrentLocation({ latitude: 0, longitude: 0, isValid: false });
      updateState({
        status:
          'Unable to get location. Move outdoors and enable High Accuracy GPS.',
        loading: false,
        error: true,
      });
    }
  };

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
        { cancelable: false }, // User cannot skip
      );
    }
  };

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
      console.warn('⚠️ Invalid location:', {
        lat,
        lng,
      });

      updateState({
        error: true,
        status: 'Getting location... Please wait.',
        loading: true,
      });

      try {
        const response = await callLocation();
        if (response.latitude && response.longitude) {
          lat = response.latitude;
          lng = response.longitude;
          updateState({
            error: false,
            status: 'Location acquired. Processing...',
            loading: true,
          });
        } else {
          updateState({
            error: true,
            status: 'Location unavailable. Please enable GPS and try again.',
            loading: false,
          });
          isProcessingFrame.value = false;
          return;
        }
      } catch (error) {
        updateState({
          error: true,
          status: 'Location error. Please check GPS settings.',
          loading: false,
        });
        isProcessingFrame.value = false;
        return;
      }
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
    } finally {
      await new Promise(resolve => setTimeout(resolve, 3000));
      isCapturingRef.current = false;
      isProcessingFrame.value = false;
      setIsFrameProcessorEnabled(true);
    }
  };

  const handleUpdateState = useRunOnJS((status, loading, error) => {
    updateState({ status, loading, error });
  });

  const processFace = useRunOnJS((base64, lat, long) => {
    captureFrame(base64, lat, long);
  });

  const clearrequest = useRunOnJS(() => {
    axiosSignal?.current?.abort();
  });

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';

    if (!isLocationReady.value) return;
    if (isProcessingFrame.value) return;
    // if (frame.timestamp % 30 !== 0) return;
    const faces = xyzFrameProcessor?.call(frame);
    if (Array.isArray(faces) && faces.length !== 0) {
      if (faces.length > 1) {
        handleUpdateState('Multiple Face Detected', false, false);
        clearrequest();
        isProcessingFrame.value = false;
      } else {
        const face = faces[0];
        handleUpdateState('Processing your face', true, false);
        if (!face?.bounds) {
          clearrequest();
          isProcessingFrame.value = false;
          return;
        }
        try {
          isProcessingFrame.value = true;
          handleUpdateState('Encoding your face...', true, false);
          const result = crop(frame, {
            includeImageBase64: true,
            saveAsFile: false,
          });

          handleUpdateState('Uploading your face...', true, false);
          processFace(
            result.base64,
            // locationData.latitude,
            // locationData.longitude,
          );
        } catch (err) {
          isProcessingFrame.value = false;
          clearrequest();
        }
      }
    } else {
      isProcessingFrame.value = false;
      clearrequest();
      handleUpdateState(
        'Please align your face within the frame',
        false,
        false,
      );
    }
  }, []);

  const navigateToAdmin = () => {
    //  navigation.navigate('Authentication');
    navigation.navigate('Authentication', {
      isNewScan: true,
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
        frameProcessor={frameProcessor}
      />
      {/* {console.log(!settings?.['Individual Login'])}
      {console.log(isAdmin,'isAdminisAdminisAdmin')} */}

      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={10}
          onPress={() => {
            clearrequest();
              navigation.navigate('Authentication');

            // if (!settings?.['Individual Login']) {
            //   navigation.navigate('Authentication');
            // } else if (isAdmin) {
            //   navigation.navigate('EmpManagement');
            // } else {
            //   navigation.navigate('SingleEmployeeReport', {
            //     isNewScan: true,
            //   });
            // }
   
          }}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            Admin
            {/* {!settings?.['Individual Login']
              ? 'Admin'
              : isAdmin
              ? 'Admin'
              : 'Attndance Report'} */}
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

      <View style={[styles.statusContainer, { bottom: insets.bottom + 30 }]}>
        <View
          style={{
            ...styles.statusMessage,
            // marginBottom: error ? SIZE(7) : null,
            backgroundColor: !error ? '#00000099' : '#FF0000',
          }}
        >
          {loading && <ActivityIndicator color={'#ffffff'} size={'small'} />}
          {/* {error && <ErrorIcon width={24} height={24} />} */}
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
