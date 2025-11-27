import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import { Fonts, SIZE, SIZES } from './utils/Styles';
// import { ActivityIndicator } from "react-native-paper";
import FailedIcon from '../assets/svg/failed.svg';
import ArrowIcon from '../assets/svg/rightArrow';
import ScanIcon from '../assets/svg/scan.svg';

export default function CommonButton({
  title,
  onPress,
  backgroundColor,
  color,
  loader,
  failed,
  arrow,
  scan,
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        hitSlop={10}
        style={{ ...styles.button, backgroundColor: backgroundColor }}
      >
        {loader ? (
          <ActivityIndicator
            color={'#ffffff'}
            size={'small'}
            style={{ marginRight: SIZE(8) }}
          />
        ) : failed ? (
          <FailedIcon
            width={SIZE(20)}
            hieght={SIZE(20)}
            style={{ marginRight: SIZE(8) }}
          />
        ) : scan ? (
          <ScanIcon
            style={{ marginRight: SIZE(8) }}
            width={SIZE(20)}
            hieght={SIZE(20)}
          />
        ) : null}
        <Text style={{ ...styles.text, color: color }} allowFontScaling={false}>
          {title}
        </Text>
        {arrow && (
          <ArrowIcon
            style={{ marginLeft: SIZE(5), marginTop: SIZE(2) }}
            width={SIZE(20)}
            hieght={SIZE(20)}
          />
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZE(30),
    // hieght: SIZE(100),
    height: SIZE(50),

    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    lineHeight: SIZE(20),
    textAlign: 'center',
  },
});
