import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts, SIZE } from "../utils/Styles";
import CommonButton from "../CommonButton";

export default function OnBoarding() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top }}>
        <View style={styles.headerTitleContent}>
          <Text style={styles.employyText}>
            Ready to <Text style={{ color: "#153CD8" }}>Scan!</Text>
          </Text>
          <Text style={styles.subText}>
            We’re ready when you are. Start by scanning your face.
          </Text>
        </View>
        <View style={styles.imageBackround}>
          {/* <Image
            width={'100%'}
            height={'100%'}
            resizeMode="contain"
            source={require("../../assets/onboarding.png")}
          /> */}
        </View>
      </View>
      <View style={styles.bottomButtonContainer}>
        <CommonButton
          scan={true}
          backgroundColor={"#153CD8"}
          title={"Start Scan"}
          onPress={() => {
            handleNavigate();
          }}
          color={"#FFFFFF"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: SIZE(25),
    // alignItems: "center",
  },
  headerTitleContent: {
    paddingTop: SIZE(70),
    alignItems: "center",
  },
  employyText: {
    fontSize: SIZE(26),
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(28),
    color: "#000000",
    textAlign: "center",
  },
  subText: {
    width: SIZE(250),
    textAlign: "center",
    marginTop: SIZE(16),
    marginBottom: SIZE(40),
    fontSize: SIZE(14),
    lineHeight: SIZE(22),
    fontFamily: Fonts.Regular,
    color: "#000000",
  },
  imageBackround: {
    width: 10,
    height: 10,
    // position:'absolute',
    // left:0,

    // width: SIZE(120),
    // height: SIZE(352),
    // alignItems:'center',
    // overflow:'hidden'
  },
  bottomButtonContainer: {
    paddingHorizontal: SIZE(30),

    position: "absolute",
    zIndex: 200,
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: SIZE(30),
  },
});
