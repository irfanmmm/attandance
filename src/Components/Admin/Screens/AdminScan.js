import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  Linking,
  BackHandler,
} from 'react-native';
import {
  Camera,
  runAsync,
  useCameraDevice,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useFocusEffect } from '@react-navigation/native';
import { Fonts, SIZE } from '../../utils/Styles';
import CommonButton from '../../CommonButton';
import ErrorIcon from '../../../assets/svg/error.svg';
import ScanIcon from '../../../assets/svg/scan.svg';
import { BASE_URL } from '../../utils/urls';
import { Context } from '../../Redux/Store';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { crop } from 'vision-camera-cropper';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import RNFS from 'react-native-fs';

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  model: 'fast',
});
export default function AdminScan({ navigation, route }) {
  const device = useCameraDevice('front');
  const abortControllerRef = useRef(null);
  const cameraRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [updateImage, setUpdateImage] = useState(null);

  const [isProcessing, setIsProcessing] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState('Capture');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const { fetchData } = useAxios();
  const toast = useToast();
  const isProcessingFrame = useSharedValue(false);
  const frameBase64 = useSharedValue(null);

  const insets = useSafeAreaInsets();

  const { state } = useContext(Context);
  const code = state?.userData?.company_code;
  const {
    fullname,
    employeecode,
    isEdit,
    selectedData,
    branch,
    isNewScan,
    agency,
    gender,
    fromEmpaire,
  } = route.params || {};
  // const { isEdit } = route?.params || {};
  // const { selectedData } = route?.params || {};
  // const { branch } = route?.params || {};
  // console.log(co);

  console.log(loading, 'loadingloadingloading');

  const isUploadingRef = useRef(false);

  const retakeEmployeeFace = async base64 => {
    try {
      const data = await fetchData({
        url: 'edit-employee-face',
        method: 'POST',
        data: {
          employeecode: employeecode,
          base64: base64,
        },
      });

      if (data?.status) {
        // toast.show(data?.message, { type: 'success' });
        navigation.goBack();
      } else {
        setStatus(data?.message);
        setLoading(false);
        setFailed(true);
      }
    } catch (err) {
      console.log('Authentication error:', err?.message);
    }
  };

  useEffect(() => {
    const backAction = () => {
      // Navigate to the login page
      // if (fromEmpaire) {
      navigation.goBack();
      // } else if (isEdit) {
      //   navigation.navigate('AddEmployee', {
      //     isEdit,
      //     selectedData: selectedData,
      //   });
      // } else {
      //   navigation.navigate('AddEmployee', {
      //     isNewScan: isNewScan,
      //   });
      // }

      return true; // Prevent default back action (e.g., exiting the app)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  // Handle camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const cameraPermission =
          Platform.OS === 'ios'
            ? PERMISSIONS.IOS.CAMERA
            : PERMISSIONS.ANDROID.CAMERA;

        const status = await check(cameraPermission);
        console.log('Camera permission status:', status);

        if (status === RESULTS.GRANTED) {
          setHasPermission(true);
          setIsProcessing(false);
          setStatus('Capture');
        } else if (status === RESULTS.DENIED) {
          const result = await request(cameraPermission);
          console.log('Permission request result:', result);
          setHasPermission(result === RESULTS.GRANTED);
          if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
            setIsProcessing(true);
            setStatus('Camera permission denied');
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
          } else if (result === RESULTS.GRANTED) {
            setIsProcessing(false);
            setStatus('Capture');
          }
        } else if (status === RESULTS.BLOCKED) {
          setHasPermission(false);
          setIsProcessing(true);
          setStatus('Camera permission blocked');
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
        console.log('Permission error:', err);
        setHasPermission(false);
        setIsProcessing(true);
        setStatus('Error requesting camera permission');
      }
    };

    requestPermissions();
  }, []);

  // Handle screen focus/unfocus
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('Aborted fetch due to screen unfocus');
        }
      };
    }, []),
  );

  // Handle back button
  // useEffect(() => {
  //   const backAction = () => {
  //     navigation.navigate('AddEmployee');
  //     setIsActive(false);
  //     setHasPermission(false);
  //     return true;
  //   };
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );
  //   return () => backHandler.remove();
  // }, [navigation]);

  // Upload image to server
  // const uploadImage = async pictureUri => {
  //   if (isUploadingRef.current || !fullname || !employeecode) {
  //     setStatus('Missing employee data');
  //     setIsProcessing(false);
  //     setLoading(false);
  //     setFailed(true);
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     isUploadingRef.current = true;
  //     setStatus('Verifying identity...');

  //     const formData = new FormData();
  //     formData.append('file', {
  //       uri: `file://${pictureUri}`,
  //       name: `image.jpg`,
  //       type: 'image/jpeg',
  //     });
  //     formData.append('fullname', fullname);
  //     formData.append('employeecode', employeecode);
  //     // formData.append('compony_code', code);
  //     formData.append('branch', branch);
  //     formData.append('agency', agancy);

  //     // const controller = new AbortController();
  //     // const timeoutId = setTimeout(() => controller.abort(), 15000);
  //     abortControllerRef.current = new AbortController();

  //     // const response = await fetch(url, {
  //     //   method: 'POST',
  //     //   body: formData,
  //     //   signal: controller.signal,
  //     //   headers: { 'Content-Type': 'multipart/form-data' },
  //     // });

  //     const data = await fetchData({
  //       url: 'add-employee-face',
  //       method: 'POST',
  //       data: formData,
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //       signal: abortControllerRef.current.signal,
  //     });
  //     console.log(data, '==============');

  //     setLoading(false);
  //     if (data?.message === 'success') {
  //       navigation.navigate('AdminStatus');
  //     } else {
  //       console.log(data);

  //       setFailed(true);
  //       setStatus(data?.message || 'Failed to verify, try again!');
  //       toast.show(data?.message || 'Something went wrong', { type: 'danger' });
  //       setIsProcessing(false);
  //     }
  //   } catch (error) {
  //     toast.show('Something went wrong', { type: 'danger' });
  //     setFailed(true);
  //     setLoading(false);
  //     console.log('Upload error:', error);
  //     setStatus('Failed to verify, try again!');
  //     setIsProcessing(false);
  //   } finally {
  //     isUploadingRef.current = false;
  //   }
  // };

  const updateImage1 = async base64 => {
    try {
      if (base64) {
        const response = await fetchData({
          url: 'add-employee-face',
          method: 'POST',
          data: {
            base64: base64,
            boundry: null,
            branch: branch,
            agency: agency,
            gender: gender,
            employeecode: employeecode,
            fullname: fullname,
          },
        });
        if (response?.message === 'success') {
          navigation.navigate('AdminStatus', {
            // isNewScan: isNewScan,
            // isEdit: isEdit,
          });
          setLoading(false);
        } else {
          setLoading(false);
          setFailed(true);
          setStatus(response?.message || 'Failed to verify, try again!');
          toast.show(response?.message || 'Something went wrong', {
            type: 'danger',
          });
          setIsProcessing(false);
        }
      } else {
        setLoading(false);
        toast.show('Your face not proper', {
          type: 'danger',
        });
      }
    } catch (error) {
      console.log(error);
      toast.show('Something went wrong', { type: 'danger' });
      setFailed(true);
      setLoading(false);

      console.log('Upload error:', error);
      setStatus('Failed to verify, try again!');
      setIsProcessing(false);
    } finally {
      // setLoading(false);
      isProcessingFrame.value = false;
    }
  };

  // Take picture
  const takePicture = async () => {
    if (!cameraRef.current || isUploadingRef.current) return;
    setFailed(false);
    setLoading(true);
    setStatus('Verifying identity...');
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'quality',
        enableShutterSound: false,
      });

      const base64 = await RNFS.readFile(photo.path, 'base64');
      console.log('Photo taken:', base64);
      if (isEdit) {
        await retakeEmployeeFace(base64);
      } else {
        await updateImage1(base64);
      }
    } catch (error) {
      setStatus('Failed to verify, try again!');
      setLoading(false);
      setFailed(true);
      setIsProcessing(false);
    }
  };

  const format = device.formats.find(
    f => f.videoWidth === 1280 && f.videoHeight === 720,
  );

  // const updateBase64 = useRunOnJS(base64 => {
  //   setUpdateImage({ base64 });
  // });

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';

    console.log(isProcessingFrame.value);

    if (!isProcessingFrame.value) return;

    const faces = xyzFrameProcessor?.call(frame);

    console.log(faces);
    if (Array.isArray(faces) && faces.length !== 0) {
      if (faces.length == 1) {
        const face = faces[0];
        if (face?.bounds) {
          const result = crop(frame, {
            includeImageBase64: true,
            saveAsFile: false,
          });

          if (result.base64) {
            frameBase64.value = result.base64;
          }
        }
      }
    }
  }, []);

  if (!device) {
    return (
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <ActivityIndicator size="large" color="#153CD8" />
        <Text allowFontScaling={false} style={styles.text}>
          Initializing camera...
        </Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.cameraLoadingContainer}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />
        <Text style={{ ...styles.cameraLoadingText, marginBottom: SIZE(10) }}>
          {status}
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

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <Camera
        style={styles.camera}
        ref={cameraRef}
        photo
        format={format}
        video={false}
        isActive={isActive && hasPermission}
        device={device}
      />
      <View style={styles.frameContainer}>
        <View style={styles.titileContainer}>
          <Text allowFontScaling={false} style={styles.scanFaceText}>
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
          <Text style={styles.scanText}>
            Please align your face within the frame
          </Text>
        </View>
      </View>
      <View
        style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom }]}
      >
        <CommonButton
          disabled={loading}
          loader={loading}
          failed={failed}
          title={status}
          backgroundColor={failed ? '#ffffff' : '#153CD8'}
          color={failed ? '#E40D0D' : '#ffffff'}
          onPress={takePicture}
        />
      </View>
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const frameWidth = screenWidth * 0.8; // Responsive frame width
const frameHeight = screenWidth * 0.8; // Responsive frame height

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
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
  bottomButtonContainer: {
    paddingHorizontal: SIZE(30),
    position: 'absolute',
    zIndex: 200,
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: SIZE(30),
  },
  titileContainer: {
    // position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    top: -20, // Responsive positioning
  },
  scanFaceText: {
    fontSize: SIZE(20),
    lineHeight: SIZE(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Regular,
  },
  scanStatus: {
    flexDirection: 'row',
    // position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    bottom: -20,
  },
  scanText: {
    fontSize: SIZE(16),
    fontFamily: Fonts.Regular,
    lineHeight: SIZE(18),
    color: '#FFFFFF',
    marginLeft: SIZE(5),
  },
  cameraLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZE(30),
  },
  cameraLoadingText: {
    fontSize: SIZE(16),
    fontFamily: Fonts.Regular,
    color: '#000000',
    textAlign: 'center',
  },
  text: {
    fontSize: SIZE(16),
    fontFamily: Fonts.Regular,
    color: '#000000',
    textAlign: 'center',
  },
});
