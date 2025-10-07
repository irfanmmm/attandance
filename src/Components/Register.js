import {
  Image,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React from 'react';
import { SIZE } from './utils/Styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommonButton from './CommonButton';

export default function Register() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ ...styles.container }}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS == 'android' ? SIZE(-100) : SIZE(100)}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: insets.top }}
      >
        <View style={styles.brandIconContainer}>
          <Image
            source={require('../assets/brand.png')}
            style={styles.brandIcon}
            resizeMode="cover"
          />
        </View>
  
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: SIZE(25),
    paddingTop: SIZE(140),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
    brandIconContainer: {
    width: SIZE(220),
    height: SIZE(46),
    marginBottom: SIZE(60),
    marginTop:SIZE(150)
  },
    brandIcon: {
    width: '100%',
    height: '100%',
  },
});
