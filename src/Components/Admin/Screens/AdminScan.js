import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
} from 'react-native-vision-camera';
// import { Camera } from "expo-camera";
// import * as FaceDetector from "expo-face-detector";
import { useDispatch, useSelector } from 'react-redux';
import { Fonts, SIZE } from '../../utils/Styles';
import CommonButton from '../../CommonButton';
import ErrorIcon from '../../../assets/svg/error.svg';
import ScanIcon from '../../../assets/svg/scan.svg';

export default function AdminScan({ navigation, route }) {
  const device = useCameraDevice('front');

  const [camera, setCamera] = useState(null);
  const [detectCount, setDetectCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [status, setStatus] = useState('Capture');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loader, setLoader] = useState(false);
  const [fialed, setFailed] = useState(false);
  const isLogged = useSelector(state => state.logIn);
  const dispatch = useDispatch();

  const { fullname, employeecode } = route.params;

  // Use useRef to prevent unnecessary re-renders
  const detectCountRef = useRef(0);
  const isUploadingRef = useRef(false);

  const status_1 = useSelector(state => state.statusInOut);
  const API_URL = useSelector(state => state.appApiUrl);

  // Memoized upload function
  const uploadImage = useCallback(
    async pictureUri => {
      if (isUploadingRef.current) return;

      setLoading(true);
      try {
        isUploadingRef.current = true;
        setLoader(true);
        setStatus('Verifying identity...');

        const url = `${API_URL}add-employee-face`;
        const formData = new FormData();

        formData.append('file', {
          uri: `file://${pictureUri}`,
          name: `${status_1}.jpg`,
          type: 'image/jpeg',
        });

        formData.append('fullname', fullname);
        formData.append('employeecode', employeecode);
        formData.append('compony_code', isLogged);
        console.log('Received Response:', formData);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // if (!response.ok) {
        //   throw new Error(`HTTP error! status: ${response.status}`);
        // }

        const data = await response.json();

        setLoader(false);
        if (data.message == 'success') {
          dispatch({ type: 'updateStatus', data: 'true' });
          navigation.navigate('AdminStatus');
        } else {
          setFailed(true);
          setLoader(false);

          setStatus('Failed to Verify, Try again!');
          setIsProcessing(false);
        }
      } catch (error) {
        setFailed(true);
        setLoader(false);

        console.error('Upload error:', error);
        setStatus('Failed to Verify, Try again!');
        setError(true);
        // Alert.alert("Error", "Failed to connect to server. Please try again.");
        setIsProcessing(false);
      } finally {
        isUploadingRef.current = false;
      }
    },
    [API_URL, status_1, navigation],
  );

  const takePicture = useCallback(async () => {
    setFailed(false);
    if (!camera || isUploadingRef.current) return;
    setLoader(true);
    setStatus('Verifying identity...');
    try {
      const photo = await camera.takePhoto({ flash: "off" });

      console.log('Photo taken:', photo);
      await uploadImage(photo.path);
      // setIsProcessing(true);
    } catch (error) {
      console.error('Picture taking error:', error);
      setStatus('Failed to Verify, Try again!');
      setLoader(false);
      setFailed(true);
      setIsProcessing(false);
    }
  }, [camera, uploadImage]);
  useEffect(() => {
    (async () => {
      const p = await Camera.requestCameraPermission();

      if (p === 'denied') {
        setHasPermission(false);
      } else {
        setHasPermission(true);
        setIsProcessing(p);
      }
      console.log(p, 'asasd');
    })();
  }, []);

  const navigateToAdmin = () => {
    navigation.navigate('AdminStackNavigator');
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="green" />
        <Text allowFontScaling={false} style={styles.text}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text allowFontScaling={false} style={styles.text}>
          Camera permission denied
        </Text>
        <Text allowFontScaling={false} style={styles.subText}>
          Please enable camera access in your device settings
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      {isProcessing && (
        <Camera
          style={styles.camera}
          ref={setCamera}
          photo
          isActive
          device={device}
          // faceDetectorSettings={{
          //   mode: FaceDetector.FaceDetectorMode.fast,
          //   detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          //   runClassifications: FaceDetector.FaceDetectorClassifications.none,
          //   minDetectionInterval: 800,
          //   tracking: true,
          // }}
        />
      )}

      {/* Title */}
      <View style={styles.titileContainer}>
        <Text allowFontScaling={false} style={styles.scanFaceText}>
          Scan your Face
        </Text>
      </View>
      {/* {scan status} */}
      <View style={styles.scanStatus}>
        <ScanIcon width={SIZE(16)} height={SIZE(16)} />
        <Text style={styles.scanText}>
          Please align your face within the frame
        </Text>
      </View>

      {/* Dark Overlay with Clear Frame Area */}
      <View style={styles.overlayContainer}>
        {/* Top overlay */}
        <View style={styles.overlayTop} />

        {/* Middle section with side overlays and clear center */}
        <View style={styles.overlayMiddle}>
          <View style={styles.overlayLeft} />
          <View style={styles.frameArea} />
          <View style={styles.overlayRight} />
        </View>

        {/* Bottom overlay */}
        <View style={styles.overlayBottom} />
      </View>

      {/* Frame Corners */}
      <View style={styles.frameContainer}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>

      <View style={styles.bottomButtonContainer}>
        <CommonButton
          loader={loader}
          failed={fialed}
          title={status}
          backgroundColor={fialed ? '#ffffff' : '#153CD8'}
          color={fialed ? '#E40D0D' : '#ffffff'}
          onPress={() => {
            takePicture();
          }}
        />
      </View>
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const frameWidth = 310;
const frameHeight = 310;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },

  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    pointerEvents: 'none',
  },
  overlayTop: {
    height: (screenHeight - frameHeight) / 2 + 18,
    backgroundColor: '#00000066',
  },
  overlayMiddle: {
    height: frameHeight,
    flexDirection: 'row',
  },
  overlayLeft: {
    width: (screenWidth - frameWidth) / 2,
    backgroundColor: '#00000066',
  },
  frameArea: {
    width: frameWidth,
    backgroundColor: 'transparent',
  },
  overlayRight: {
    width: (screenWidth - frameWidth) / 2,
    backgroundColor: '#00000066',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: '#00000066',
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
  statusMessage: {
    borderRadius: SIZE(8),
    width: SIZE(350),
    height: SIZE(34),
    paddingHorizontal: SIZE(10),

    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  eyeIcon: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'transparent',
  },

  verificationContainer: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
    zIndex: 25,
    alignItems: 'center',
  },
  verificationMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
    fontFamily: Fonts?.Regular,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    fontFamily: Fonts?.Regular,
  },
  subText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    fontFamily: Fonts?.Regular,
  },
  titileContainer: {
    position: 'absolute',
    alignSelf: 'center',

    zIndex: 20,
    top: 200,
  },
  scanFaceText: {
    fontSize: SIZE(20),
    lineHeight: SIZE(24),
    color: '#FFFFFF',
    fontFamily: Fonts.Regular,
  },
  scanStatus: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 20,
    top: 580,
  },
  scanText: {
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    lineHeight: SIZE(16),
    color: '#FFFFFF',
    marginLeft: SIZE(5),
  },
});
