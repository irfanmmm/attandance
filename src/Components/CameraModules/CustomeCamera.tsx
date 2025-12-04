import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useMemo } from 'react';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
} from 'react-native-vision-camera';
import { Fonts, SIZE } from '../utils/Styles';

const CustomeCamera = () => {
  const device = useCameraDevice('front');

  const format = useMemo(
    () =>
      device?.formats?.find(
        f => f.videoWidth === 1280 && f.videoHeight === 720,
      ),
    [device],
  );

  if (!device)
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

  return (
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
  );
};

export default CustomeCamera;

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
});
