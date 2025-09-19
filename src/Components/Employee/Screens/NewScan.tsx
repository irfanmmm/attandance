import { ActivityIndicator, Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View, } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Camera, useCameraDevice, useFrameProcessor, VisionCameraProxy, } from 'react-native-vision-camera'
import { Worklets } from 'react-native-worklets-core'
import { BASE_URL } from './../../utils/urls'
import { Fonts, SIZE } from '../../utils/Styles'
import CommonButton from "../../CommonButton";
import ErrorIcon from "../../../assets/svg/error.svg";
import ScanIcon from "../../../assets/svg/scan.svg";
import { useSelector } from 'react-redux'


// const plugin = VisionCameraProxy.('scanFaces') as VisionCameraPlugin | undefined;
const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', { model: 'fast' })

const NewScan = ({ navigation }: any) => {

  const device = useCameraDevice('front');
  const [permission, setPermission] = useState<any>(false);
  const camera = useRef<Camera>(null);
  const [loading, setLoading] = useState<any>(false)
  const [error, setError] = useState<any>(false);
  const isCapturingRef = useRef(false);
  const [status, setStatus] = useState<any>("Please alighn your face within the frame");
  const [isProcessing, setIsProcessing] = useState<any>(true);

  const API_URL = useSelector((state: any) => state.appApiUrl);
  useEffect(() => {
    (async () => {
      const p = await Camera.requestCameraPermission()

      console.log(p)
      setPermission(p)
    })()
  }, [])


  const updateState = (updates: any) => {
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case "loading":
          setLoading(value);
          break;
        case "status":
          setStatus(value);
          break;
        case "error":
          setError(value);
          break;
        case "processing":
          setIsProcessing(value);
          break;
      }
    });
  };

  const captureFrame = Worklets.createRunOnJS(async () => {
    if (!camera.current) return;

    // 🚫 Prevent capture if already capturing
    if (isCapturingRef.current) {
      updateState({ loading: true, error: false });
      return;
    }

    isCapturingRef.current = true; // mark as busy

    try {
      setLoading(true);
      updateState({ status: "Verifying identity..." });

      // 📸 Capture photo
      const photo = await camera.current.takePhoto({ flash: "off" });
      console.log("📸 Captured photo:", photo.path);

      // 📝 FormData
      const formData = new FormData();
      formData.append("file", {
        uri: Platform.OS === "android" ? `file://${photo.path}` : photo.path,
        name: "face.jpg",
        type: "image/jpeg",
      });
      formData.append("compony_code", "A565");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      // 🌐 Upload
      const response = await fetch(`${API_URL}compare-face`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      updateState({ status: "Response received", loading: false });

      if (data.message === "success") {
        navigation.navigate("Status", {
          username: data?.details?.fullname,
        });
        setLoading(false);
        isCapturingRef.current = false;
      } else {
        updateState({
          error: true,
          status: "Face not recognized. Try again.",
          processing: false,
        });
        setLoading(false);
        isCapturingRef.current = false;
      }
    } catch (err: any) {
      console.error("❌ Upload error:", err?.message || err);
      const errorMessage =
        error.name === "AbortError"
          ? "Request timed out. Please try again."
          : "Connection failed. Please try again.";

      updateState({
        loading: false,
        error: true,
        status: errorMessage,
        processing: false,
      });
      setLoading(false);
      isCapturingRef.current = false;
    } finally {
    }
  });



  const frameProcessor = useFrameProcessor((frame: any) => {
    'worklet'
    const result = xyzFrameProcessor?.call(frame) as any

    if (result?.faces > 0) {
      captureFrame()
    }
  }, [])


  const handlePress = async () => {
    try {
      if (!camera.current) return;
      const formData = new FormData();
      const photo = await camera.current.takePhoto({ flash: "off" });

      console.log(photo)
      formData.append("file", {
        uri: Platform.OS === "android" ? `file://${photo.path}` : photo.path,
        name: "face.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("fullname", "Thansih Ahammad");
      formData.append("employeecode", "10275");
      formData.append("compony_code", "A565");

      const response = await fetch(`${BASE_URL}add-employee-face`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      console.log(data)
    } catch (error) {
      console.log(error)
    }
  }

  const navigateToAdmin = () => {
    navigation.navigate("AdminStackNavigator");
  };
  if (!device) return (<View style={styles.cameraLoadingContainer}>
    <ActivityIndicator size="large" color="#153CD8" />
    <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
  </View>)
  if (permission === 'authorized') return <Text>No camera</Text>




  return (
    <View style={styles.container}>
      {/* <Button title='Capture' onPress={handlePress} /> */}
      <Camera
        device={device}
        isActive={true}
        ref={camera}
        photo
        style={{
          flex: 1
        }}
        frameProcessor={frameProcessor}
      />

      {/* Admin Button */}
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

      {/* Title */}
      <View style={styles.titileContainer}>
        <Text allowFontScaling={false} style={styles.scanText}>
          Scan your Face
        </Text>
      </View>

      {/* Scan status */}
      <View style={styles.scanStatus}>
        <ScanIcon width={SIZE(16)} height={SIZE(16)} />
        <Text style={{ ...styles.scanText, fontSize: SIZE(14), marginLeft: SIZE(5) }}>
          Please align your face within the frame
        </Text>
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

      <View style={styles.statusContainer}>
        <View
          style={{
            ...styles.statusMessage,
            marginBottom: error ? SIZE(7) : null,
            backgroundColor: !error ? "#00000099" : '#FF0000',
          }}
        >
          {loading && <ActivityIndicator color={"#ffffff"} size={"small"} />}
          {error && <ErrorIcon width={24} height={24} />}
          <Text allowFontScaling={false} style={styles.statusText}>
            {status}
          </Text>
        </View>
        {/* {error && (
          <CommonButton
            backgroundColor={"#ffffff"}
            color={"#000000"}
            title={"Retry Scan"}
            onPress={() => {
              setError(false);
              setStatus("Please align your face within the frame");
              setLoading(false);
              detectCountRef.current = 0;
              setDetectCount(0);
            }}
          />
        )} */}
      </View>
    </View>
  )
}

export default NewScan

// Add new styles for camera loading
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const frameWidth = 310;
const frameHeight = 310;

const styles = StyleSheet.create({
  // ... (keep all your existing styles)

  // Add new styles for camera loading
  cameraLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cameraLoadingText: {
    color: '#fff',
    fontSize: SIZE(16),
    marginTop: SIZE(10),
    fontFamily: Fonts?.Regular,
  },

  // ... (rest of your existing styles)
  spotlightMain: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spotlight: {
    width: SIZE(300),
    height: SIZE(300),
    marginBottom: SIZE(32),
  },
  bottom: {},
  mainText: {
    color: "#000",
    fontSize: SIZE(20),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: SIZE(12),
  },
  subXText: {
    color: "#686868",
    fontSize: SIZE(16),
    fontWeight: "400",
    textAlign: "center",
    marginBottom: SIZE(24),
    lineHeight: SIZE(23),
    width: SIZE(347),
  },
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    zIndex: 25,
    top: 70,
    right: 20,
  },
  adminButton: {
    backgroundColor: "#FFFFFF33",
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(30),
    paddingVertical: SIZE(15),
  },
  adminText: {
    fontSize: SIZE(14),
    color: "#FFFFFF",
    lineHeight: SIZE(16),
    fontFamily: Fonts?.Regular,
  },
  frameContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    pointerEvents: "none",
  },
  frame: {
    width: frameWidth + 7,
    height: frameHeight + 7,
    position: "relative",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderColor: "#CDCDCD",
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
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    zIndex: 25,
    alignItems: "center",
  },
  statusMessage: {
    borderRadius: SIZE(8),
    width: SIZE(350),
    height: SIZE(34),
    paddingHorizontal: SIZE(10),
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: SIZE(12),
    lineHeight: SIZE(14),
    color: "#E2E2E2",
    fontFamily: Fonts.Regular,
    marginLeft: SIZE(10),
  },
  titileContainer: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 20,
    top: 200,
  },
  scanText: {
    fontSize: SIZE(20),
    lineHeight: SIZE(24),
    color: "#FFFFFF",
    fontFamily: Fonts.Regular,
  },
  scanStatus: {

    alignItems: 'center',
    flexDirection: "row",
    position: "absolute",
    alignSelf: "center",
    zIndex: 20,
    top: 580,
  },
});



