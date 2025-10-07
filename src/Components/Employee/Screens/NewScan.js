import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Linking,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  model: 'fast',
});
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const NewScan = ({ navigation }) => {
  const device = useCameraDevice('front');
  const [isActive, setIsActive] = useState(false);
  const [permission, setPermission] = useState(null);
  const camera = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isFrameProcessorEnabled, setIsFrameProcessorEnabled] = useState(true);
  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState(
    'Please align your face within the frame',
  );
  const [isProcessing, setIsProcessing] = useState(true);
  const { state } = useContext(Context);
  const code = state.userData.company_code;
  const [showModal, setShowModal] = useState(false);
  const [landMarks, setLandMarks] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,

  });

  const abortControllerRef = useRef(null);
  // const inactivityTimer = useRef(null);

  // Function to start/reset the inactivity timer
  // const startTimer = () => {
  //   if (inactivityTimer.current) {
  //     clearTimeout(inactivityTimer.current);
  //   }
  //   inactivityTimer.current = setTimeout(() => {
  //     setIsActive(false);
  //     setShowModal(true);
  //   }, 60000);
  // };

  // useEffect(() => {
  //   return () => {
  //     if (inactivityTimer.current) {
  //       clearTimeout(inactivityTimer.current);
  //     }
  //   };
  // }, []);

  // useEffect(() => {
  //   const backAction = () => {
  //     BackHandler.exitApp();
  //     setIsActive(false);
  //     return true;
  //   };
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );
  //   return () => backHandler.remove();
  // }, []);



  // Handle camera permission
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const cameraPermission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA;

        // Check permission status
        const status = await check(cameraPermission);
        console.log('Camera permission status:', status);

        if (status === RESULTS.GRANTED) {
          setPermission('authorized');
        } else if (status === RESULTS.DENIED) {
          // Request permission
          const result = await request(cameraPermission);
          console.log('Permission request result:', result);
          setPermission(result === RESULTS.GRANTED ? 'authorized' : result);
          if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
            Alert.alert(
              'Camera Permission Required',
              'Please enable camera access in settings to use this feature.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          }
        } else if (status === RESULTS.BLOCKED) {
          setPermission('blocked');
          Alert.alert(
            'Camera Permission Blocked',
            'Camera access is blocked. Please enable it in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ],
          );
        }
      } catch (err) {
        console.log('Permission check error:', err);
        setPermission('error');
      }
    };

    checkCameraPermission();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsActive(true);
      // startTimer();
      return () => {
        setIsActive(false);
        // if (inactivityTimer.current) {
        //   clearTimeout(inactivityTimer.current);
        // }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('Aborted fetch due to screen unfocus');
        }
      };
    }, []),
  );

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
      }
    });
  };

  const drawFaceBox = (face, frameWidth, frameHeight) => {
    if (!device) return { left: 0, top: 0, width: 0, height: 0 };
  return {
    left: face.left ,                 // ML Kit already gives correct left
    top:  face.top,
    right:  face.right,                  // ML Kit already gives correct top
    bottom:  face.bottom,                  // ML Kit already gives correct top
                      // ML Kit already gives correct top
    width: face.width,
    height: face.height
  };
  };

  const captureFrame = Worklets.createRunOnJS(async facelandmarks => {
    if (!camera.current || isCapturingRef.current) {
      updateState({ loading: true, error: false });
      return;
    }

    // console.log(facelandmarks);
    

    isCapturingRef.current = true;

    try {
      setLoading(true);
      updateState({ status: 'Verifying identity...'});

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

      // const controller = new AbortController();
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => abortControllerRef?.current?.abort(), 15000);

      const response = await fetch(`${BASE_URL}compare-face`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef?.current?.signal,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearTimeout(timeoutId);

      const data = await response.json();

      
      console.log(data?.details?.direction, 'fgh');
      updateState({ status: 'Response received', loading: false });

      if (data.message === 'success') {
        navigation.navigate('Status', {
          username: data?.details?.fullname,
          direction: data?.details?.direction,
        });
        setIsActive(false);
        setLoading(false);
        isCapturingRef.current = false;
      } else {
        updateState({
          error: true,
          status: 'Face not recognized. Try again.',
          processing: false,
        });
        setLoading(false);
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
      setLoading(false);
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
    console.log(result);
    
    if(result.faces === 1){
      captureFrame(result);
    }
  }, []);

  const activeFrameProcessor = useMemo(() => {
    if (!isFrameProcessorEnabled && Platform.OS === 'ios') return undefined;
    return frameProcessor;
  }, [isFrameProcessorEnabled]);

  const navigateToAdmin = () => {
    navigation.navigate('Authentication');
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
            ? 'Camera access is blocked. Please enable it in settings.'
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
  // console.log(isActive, 'isActiveisActiveisActiveisActive');

  if (permission === 'error') {
    return (
      <View style={styles.cameraLoadingContainer}>
        <Text style={styles.cameraLoadingText}>
          Error checking camera permission. Please try again.
        </Text>
      </View>
    );
  }




  return (
    <View style={{ flex:1}}>
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
          onPress={navigateToAdmin}
          style={styles.adminButton}
          activeOpacity={0.7}
        >
          <Text allowFontScaling={false} style={styles.adminText}>
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titileContainer}>
        <Text allowFontScaling={false} style={styles.scanText}>
          Scan your Face
        </Text>
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

      <View style={styles.frameContainer}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
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
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    top: 200,
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
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    bottom: 200,
  },
});
