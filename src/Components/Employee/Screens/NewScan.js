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
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import BackgroundService from 'react-native-background-actions';
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
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
import Geolocation from '@react-native-community/geolocation';

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  model: 'fast',
});
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'always',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

const NewScan = ({ navigation }) => {
  const device = useCameraDevice('front');
  const refLocation = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [permission, setPermission] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [locationLoad, setLocationLoad] = useState(false);
  const camera = useRef(null);
  const latituderef = useRef(null);
  const longituderef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isFrameProcessorEnabled, setIsFrameProcessorEnabled] = useState(true);
  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const [isProcessing, setIsProcessing] = useState(true);
  const { state,dispatch } = useContext(Context);
  const code = state.userData.company_code;
  const [showModal, setShowModal] = useState(false);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState(false);
  const [landMarks, setLandMarks] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
  });



  const [isHighAccuracy, setIsHighAccuracy] = useState(true);

  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));

  const abortControllerRef = useRef(null);

  const veryIntensiveTask = async taskDataArguments => {
    console.log('thanish');

    while (BackgroundService.isRunning()) {
      console.log('task  running fine ----');
      try {
        const location = await getCurrentLocation();
      
        console.log('locatin', location);

        const { latitude, longitude } = location.coords;
     

        console.log(`📍 Background Location: ${latitude}, ${longitude}`);
        latituderef.current = latitude;
        longituderef.current = longitude;
          dispatch({
          type: 'UPDATE_USER_DATA',
          userData: {
            ...state.userData,
            latitude: latituderef.current ,
            longitude: longituderef.current
          },
        });
        // await new Promise(resolve => setTimeout(resolve, 5000)); // Update every 5s
        await sleep(5000);
      } catch (error) {
        console.log('❌ Background location error:', error);
      }
    }
  };

  const getLocationPermission = async () => {
    console.log('Requesting location and camera permissions...');

    try {
      if (Platform.OS === 'android') {
        // Request camera and location permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);

        const locationGranted =
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted';
        const cameraGranted =
          granted['android.permission.CAMERA'] === 'granted';

        if (locationGranted && cameraGranted) {
          setPermission('authorized');
          console.log('✅ Camera and location permissions granted');

          // Request background location permission
          const backgroundResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Background Location Access',
              message:
                'Allow this app to access your location even when the app is closed or not in use?',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );

          // if (backgroundResult === 'granted') {
          //   console.log('✅ Background location permission granted');
          //   setHasBackgroundPermission(true);
          // } else {
          //   console.log('⚠️ Background location permission denied');
          //   setHasBackgroundPermission(false);
          // }

          // Start background service only if permissions are granted
          try {
            await BackgroundService.start(veryIntensiveTask, {
              taskName: 'LocationTracking',
              taskTitle: 'Location Tracking',
              taskDesc: 'Tracking your location for attendance',
              taskIcon: {
                name: 'ic_launcher',
                type: 'mipmap',
              },
              color: '#153CD8',
              linkingURI: '',
            });
            console.log('✅ Background Service Started');
          } catch (bgError) {
            console.log(
              '❌ Failed to start background service:',
              bgError.message,
            );
          }
        } else {
          setPermission('blocked');
          console.log('❌ Camera or location permission denied');
          console.log('Location granted:', locationGranted);
          console.log('Camera granted:', cameraGranted);
        }
      } else {
        // iOS permission handling
        try {
          const cameraPermission = await check(PERMISSIONS.IOS.CAMERA);
          const locationPermission = await check(
            PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
          );

          if (
            cameraPermission === RESULTS.GRANTED &&
            locationPermission === RESULTS.GRANTED
          ) {
            setPermission('authorized');
            console.log('✅ iOS permissions already granted');

            // Start background service for iOS
            try {
              await BackgroundService.start(veryIntensiveTask, {
                taskName: 'LocationTracking',
                taskTitle: 'Location Tracking',
                taskDesc: 'Tracking your location for attendance',
                taskIcon: {
                  name: 'ic_launcher',
                  type: 'mipmap',
                },
                color: '#153CD8',
                linkingURI: '',
              });
              console.log('✅ Background Service Started on iOS');
            } catch (bgError) {
              console.log(
                '❌ Failed to start background service on iOS:',
                bgError.message,
              );
            }
          } else {
            // Request permissions if not granted
            const cameraResult = await request(PERMISSIONS.IOS.CAMERA);
            const locationResult = await request(
              PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
            );

            if (
              cameraResult === RESULTS.GRANTED &&
              locationResult === RESULTS.GRANTED
            ) {
              setPermission('authorized');
              console.log('✅ iOS permissions granted after request');

              // Start background service
              try {
                await BackgroundService.start(veryIntensiveTask, {
                  taskName: 'LocationTracking',
                  taskTitle: 'Location Tracking',
                  taskDesc: 'Tracking your location for attendance',
                  taskIcon: {
                    name: 'ic_launcher',
                    type: 'mipmap',
                  },
                  color: '#153CD8',
                  linkingURI: '',
                });
                console.log('✅ Background Service Started on iOS');
              } catch (bgError) {
                console.log(
                  '❌ Failed to start background service on iOS:',
                  bgError.message,
                );
              }
            } else {
              setPermission('blocked');
              console.log('❌ iOS permissions denied');
            }
          }
        } catch (iosError) {
          console.log('❌ iOS permission error:', iosError.message);
          setPermission('error');
        }
      }
    } catch (error) {
      console.log('❌ Permission request error:', error.message);
      setPermission('error');
    }
  };

  const stopBackgroundTracking = async () => {
    await BackgroundService.stop();
    console.log('🛑 Background Service Stopped');
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve(position),
        error => {
          console.log('timouted', error.code);
          if (error.code === 3) {
            setIsHighAccuracy(false);
          }
          reject(error.message);
        },
        {
          enableHighAccuracy: isHighAccuracy,
          timeout: 2000,
          maximumAge: 0,
          interval: 0,
          distanceFilter: 0,
        },
      );
    });
  };

  useEffect(() => {
    getLocationPermission();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsActive(true);
      setIsHighAccuracy(true);
      return () => {
        setIsActive(false);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('Aborted fetch due to screen unfocus');
        }
      };
    }, []),
  );

  // Cleanup background service on unmount
  useEffect(() => {
    return () => {
      stopBackgroundTracking();
    };
  }, []);

  const updateState = updates => {
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
        case 'processing':
          setIsProcessing(value);
          break;
        default:
      }
    });
  };

  //   useEffect(() => {
  //   const backAction = () => {
  //     // Exit the app directly
  //     BackHandler.exitApp();
  //     return true; // prevent default navigation behavior
  //   };

  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction
  //   );

  //   return () => backHandler.remove(); // cleanup on unmount
  // }, []);

  const drawFaceBox = (face, frameWidth, frameHeight) => {
    if (!device) return { left: 0, top: 0, width: 0, height: 0 };
    return {
      left: face.left, // ML Kit already gives correct left
      top: face.top,
      right: face.right, // ML Kit already gives correct top
      bottom: face.bottom, // ML Kit already gives correct top
      // ML Kit already gives correct top
      width: face.width,
      height: face.height,
    };
  };

  const captureFrame = Worklets.createRunOnJS(async facelandmarks => {
    if (!camera.current || isCapturingRef.current) {
      updateState({ loading: true, error: false });
      return;
    }

    // console.log(facelandmarks);

    isCapturingRef.current = true;

    updateState({ status: 'Verifying identity...',loading: true  });
    try {
      // setLoading(true);

      // if(Platform.OS === 'ios')
      setIsFrameProcessorEnabled(false);
      const photo = await camera.current?.takePhoto({
        flash: 'off',
        qualityPrioritization: 'speed',
        enableShutterSound: false,
      });

      // setIsActive(false);
      console.log('📸 Captured photo:', photo.path);

      const formData = new FormData();
      formData.append('file', {
        uri: `file://${photo.path}`,
        name: 'face.jpg',
        type: 'image/jpeg',
      });
      formData.append('compony_code', code);

      console.log(latituderef.current, 'currentLocation?.latitude');
      formData.append('latitude', latituderef.current ?? '');
      formData.append('longitude', longituderef.current ?? '');

      // const controller = new AbortController();
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef?.current?.abort(),
        15000,
      );

      const response = await fetch(`${BASE_URL}compare-face`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef?.current?.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      console.log(data?.details?.direction, 'fgh');
      
      if (data.message === 'success') {
        updateState({ status: 'Response received', loading: false });
        navigation.navigate('Status', {
          username: data?.details?.fullname,
          direction: data?.details?.direction,
        });
        setIsActive(false);
        // setLoading(false);
        isCapturingRef.current = false;
      } else {
        updateState({
          error: true,
          status: data?.message || 'Face not recognized. Try again.',
          loading: false,
        });
        // setLoading(false);
        isCapturingRef.current = false;
      }
    } catch (err) {
      console.log('❌ Upload error:', err?.message);
      const errorMessage =
        err.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Connection failed. Please try again.';

      updateState({
        loading: false,
        error: true,
        status: errorMessage,
        processing: false,
      });
      // setLoading(false);
      isCapturingRef.current = false;
    } finally {
      setTimeout(() => {
        setIsFrameProcessorEnabled(true);
      }, 2000);
    }
  });

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const result = xyzFrameProcessor?.call(frame);
    // console.log(result);

    if (result.faces === 1) {
      captureFrame(result);
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

  const resumeCamera = () => {
    setShowModal(false);
    setIsActive(true);
    startTimer();
  };

  const format = device?.formats?.find(
    f => f.videoWidth === 1280 && f.videoHeight === 720,
  );

  // Render based on permission and device status
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
            ? 'Camera and Location access is blocked. Please enable it in settings.'
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
  // console.log(isActive, 'isActiveisActiveisActiveisActive');

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
      <View
        style={{
          // width:100,
          // height:100,
          // backgroundColor:'red',
          position: 'absolute',
          top: landMarks.top,
          bottom: landMarks.bottom,
          right: landMarks.right,

          left: landMarks.left,
          width: landMarks.width,
          height: landMarks.height,
          borderWidth: 2,
          borderColor: 'lime',
          borderRadius: 8,
          // top:landMarks.top,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={10}
          onPress={() => {
            navigation.navigate('Authentication');
          }}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            Admin
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

      <View style={styles.statusContainer}>
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

// Styles remain the same as in your original code
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
    bottom: 30,
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
    // position: 'absolute',
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
    // position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    bottom: -20,
  },
});
