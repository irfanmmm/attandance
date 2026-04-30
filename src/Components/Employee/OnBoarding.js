import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, SIZE } from '../utils/Styles';
import CommonButton from '../CommonButton';

export default function OnBoarding({ resumeCamera, navigateToAdmin }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: insets.top + 20, right: 20, zIndex: 10 }}>
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
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.headerTitleContent}>
          <Text style={styles.employyText}>
            Ready to <Text style={{ color: '#153CD8' }}>Scan!</Text>
          </Text>
          <Text style={styles.subText}>
            We’re ready when you are. Start by scanning your face.
          </Text>
        </View>
        <View style={styles.imageBackround}>
          <Image
            width={'100%'}
            height={'100%'}
            resizeMode="contain"
            source={require("../../assets/onboarding.png")}
          />
        </View>
      </View>
      <View style={styles.bottomButtonContainer}>
        <CommonButton
          scan={true}
          backgroundColor={'#153CD8'}
          title={'Start Scan'}
          onPress={resumeCamera}
          color={'#FFFFFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SIZE(25),
    // alignItems: "center",
  },
  adminButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(8),
    borderWidth: 1,
    borderColor: '#153CD8',
    justifyContent: 'center',
    alignContent: 'center',
  },
  adminText: {
    fontSize: SIZE(14),
    color: '#153CD8',
    lineHeight: SIZE(16),
    fontFamily: Fonts?.Medium,
  },
  headerTitleContent: {
    paddingTop: SIZE(100),
    alignItems: 'center',
  },
  employyText: {
    fontSize: SIZE(26),
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(28),
    color: '#000000',
    textAlign: 'center',
  },
  subText: {
    width: SIZE(300),
    textAlign: 'center',
    marginTop: SIZE(16),
    marginBottom: SIZE(40),
    fontSize: SIZE(16),
    lineHeight: SIZE(22),
    fontFamily: Fonts.Regular,
    color: '#000000',
  },
  imageBackround: {
    width: '100%',
    height: SIZE(350),
    alignItems: 'center',
    justifyContent: 'center',
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
});
