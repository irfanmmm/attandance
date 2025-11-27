import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { useSelector } from "react-redux";
import { Fonts, SIZE, SIZES } from "../../utils/Styles";
import CommonButton from "../../CommonButton";
import ErrorIcon from "../../../assets/svg/error.svg";
import ScanIcon from "../../../assets/svg/scan.svg";
import CheckInScreen from "./Status";
import { useIsFocused } from "@react-navigation/native";
import { BASE_URL } from "../../utils/urls";
import { Context } from "../../Redux/Store";

export default function Face({ navigation }) {
  const [camera, setCamera] = useState(null);
  const [detectCount, setDetectCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [status, setStatus] = useState("Requesting camera permission...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  


  // Use useIsFocused to track screen focus
  const isFocused = useIsFocused();

  // Use useRef to prevent unnecessary re-renders
  const detectCountRef = useRef(0);
  const isUploadingRef = useRef(false);



  



  // Reset states when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Reset camera-related states
      setIsCameraReady(false);
      setError(false);
      detectCountRef.current = 0;
      setDetectCount(0);
      isUploadingRef.current = false;
      
      if (hasPermission) {
        setStatus("Please align your face within the frame");
        setIsProcessing(false);
      }
    } else {
      // Clean up when screen loses focus
      setIsCameraReady(false);
      setIsProcessing(true);
    }
  }, [isFocused, hasPermission]);

  // Camera ready callback
  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
    setStatus("Please align your face within the frame");
  }, []);

  // Memoized upload function
  const uploadImage = useCallback(
    async (pictureUri) => {
      // Early exit if already uploading
      if (isUploadingRef.current) return;

      // Batch state updates to reduce re-renders
      const updateState = (updates) => {
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

      updateState({ loading: true, error: false });
      isUploadingRef.current = true;

      try {
        updateState({ status: "Verifying identity..." });

        // Prepare request data
        const formData = new FormData();
        formData.append("file", {
          uri: pictureUri,
          name: `image.jpg`,
          type: "image/jpeg",
        });
        formData.append("compony_code", code);

        // Use AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        // Make request with optimized headers and timeout
        const response = await fetch(`${BASE_URL}compare-face`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();
        console.log("Received Response:", data);

        updateState({ status: "Response received", loading: false });

        // Handle response
        if (data?.message === "success") {
          navigation.navigate("Status");
        } else {
          updateState({
            error: true,
            status: "Face not recognized. Try again.",
            processing: false,
          });
        }
      } catch (error) {
        console.error("Upload error:", error);

        // More specific error handling
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
      } finally {
        isUploadingRef.current = false;
      }
    },
    [ navigation]
  );

  const takePicture = useCallback(async () => {
    if (!camera || isUploadingRef.current || !isCameraReady) return;

    try {
      setStatus("Taking picture...");
      const photo = await camera.takePictureAsync({
        quality: 0.3,
        exif: false,
        skipProcessing: true,
      });

      await uploadImage(photo.uri);
    } catch (error) {
      console.error("Picture taking error:", error);
      setStatus("Failed to take picture. Try again.");
      setIsProcessing(false);
    }
  }, [camera, uploadImage, isCameraReady]);

  const handleFacesDetected = useCallback(
    ({ faces }) => {
      if (isUploadingRef.current || !isCameraReady) return;
      
      if (faces.length > 0) {
        setStatus(`Face detected`);
        detectCountRef.current += 1;

        if (detectCountRef.current >= 3) {
          detectCountRef.current = 0;
          setDetectCount(0);
          takePicture();
        } else {
          setDetectCount(detectCountRef.current);
        }
      } else {
        setStatus("Please align your face within the frame");
        detectCountRef.current = 0;
        setDetectCount(0);
      }
    },
    [takePicture, isCameraReady]
  );

  useEffect(() => {
    // const requestPermissions = async () => {
    //   try {
    //     const { status } = await Camera.requestCameraPermissionsAsync();
    //     setHasPermission(status === "granted");

    //     if (status === "granted") {
    //       setIsProcessing(false);
    //     } else {
    //       setIsProcessing(true);
    //     }
    //   } catch (error) {
    //     console.error("Permission error:", error);
    //     setIsProcessing(true);
    //   }
    // };

    // requestPermissions();
  }, []);

  const navigateToAdmin = () => {
    navigation.navigate("AdminStackNavigator");
  };

  // Don't render camera if screen is not focused
  const shouldShowCamera = isFocused && !isProcessing && hasPermission;

  if (hasPermission === null) {
    return (
      <View style={styles.spotlightMain}>
        <ActivityIndicator size="large" color="#153CD8" />
        <Text allowFontScaling={false} style={styles.mainText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.spotlightMain}>
        <View style={styles.bottom}>
          <Text allowFontScaling={false} style={styles.mainText}>
            Camera permission denied
          </Text>
          <Text allowFontScaling={false} style={styles.subXText}>
            Please enable camera access in your device settings
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera - Only render when focused and ready */}
      {/* {shouldShowCamera && (
        <Camera
          style={styles.camera}
          ref={setCamera}
          type={Camera.Constants.Type.front}
          onCameraReady={onCameraReady} // Add camera ready callback
          onFacesDetected={(face) => {
            if (!error && isCameraReady) {
              handleFacesDetected(face);
            }
          }}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
            minDetectionInterval: 800,
            tracking: true,
          }}
        />
      )} */}

      {/* Show loading when camera is not ready */}
      {shouldShowCamera && !isCameraReady && (
        <View style={styles.cameraLoadingContainer}>
          <ActivityIndicator size="large" color="#153CD8" />
          <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
        </View>
      )}

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
        <Text style={{...styles.scanText,fontSize:SIZE(14),marginLeft:SIZE(5)}}>
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
            backgroundColor: !error ? "#00000099" : null,
          }}
        >
          {loading && <ActivityIndicator color={"#ffffff"} size={"small"} />}
          {error && <ErrorIcon width={24} height={24} />}
          <Text allowFontScaling={false} style={styles.statusText}>
            {status}
          </Text>
        </View>
        {error && (
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
        )}
      </View>
    </View>
  );
}

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
    color: '#ffffff',
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
    color: "#000000",
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
    backdropFilter: "blur(10px)",
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

    alignItems:'center',
    flexDirection: "row",
    position: "absolute",
    alignSelf: "center",
    zIndex: 20,
    top: 580,
  },
});