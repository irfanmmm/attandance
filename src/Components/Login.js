import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useContext, useRef, useState } from 'react';
import { Fonts, SIZE } from './utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommonButton from './CommonButton';
import { Context } from './Redux/Store';
import { API_URL } from './utils/urls';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useToast } from 'react-native-toast-notifications';
import { decription } from './utils/decription';
import { useAxios } from './utils/useAxios';

export default function Login({ navigation }) {
  const insets = useSafeAreaInsets();
  const { fetchData } = useAxios();
  const inputRef2 = useRef(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const toast = useToast();
  const [status, setStatus] = useState('*Please enter code');
  const { state, dispatch } = useContext(Context);
  const [loader, setLoader] = useState(false);

  const handleLogin = async () => {
    setLoader(true);
    setError(false);
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError(true);
      setLoader(false);
      return;
    }
    // dispatch({
    //   type: 'UPDATE_USER_DATA',
    //   userData: {
    //     ...state.userData,
    //     is_logged: true,
    //     company_code: code,
    //   },
    // });
    //  dispatch({ type: "loginSuccess", data: true });

    try {
      // if (!code.trim()) {
      //   setError(true);
      //   setLoader(false)
      //   return;
      // }
      // const response = await fetch(`${API_URL}/auth/verify-compony-code`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     code: code,
      //   }),
      // });

      const data = await fetchData({
        url: 'auth/verify-compony-code',
        method: 'POST',
        data: {
          code: cleanCode,
        },
      });

      console.log(
        data,
        'Performance improvementPerformance improvementPerformance improvement',
      );

      // const data = await response.json();
      if (data?.message === 'success') {
        const decript = decription(data?.token);
        console.log(decript, 'datadatadatadata');

        const loginenabled = decript?.settings?.find(
          va => va.setting_name === 'Individual Login',
        ).value;

        // console.log(loginenabled);

        dispatch({
          type: 'UPDATE_USER_DATA',
          userData: {
            ...state.userData,
            is_logged: !loginenabled,
            token: data?.token,
            company_code: decript?.compony_code,
            settings: decript?.settings,
          },
        });
        if (loginenabled) {
          navigation.navigate('UserLogin');
        }
      } else {
        setLoader(false);
        toast.show(data?.message, {
          type: 'danger',
          duration: 2000,
        });
        // setError(true);
        // setStatus('something went wrong');
      }
    } catch (err) {
      setLoader(false);
      toast.show('Something went wrong', {
        type: 'danger',
        duration: 2000,
      });
      setStatus('something went wrong');
      setError(true);
      console.log('Login error:', err.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={{ ...styles.container }}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={0}
        keyboardShouldPersistTaps="handled"
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
        <View style={styles.contentContainer}>
          <Text allowFontScaling={false} style={styles.employyText}>Welcome</Text>
          <Text allowFontScaling={false} style={styles.subText}>
            Fill in your details below. This helps us {'\n'}register your
            profile securely.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => {
              inputRef2.current?.focus();
              setError(false);
            }}
            style={styles.inputContainer}
          >
            <View>
              <Text allowFontScaling={false} style={styles.uerNameText}>Company Code</Text>
              <TextInput
                allowFontScaling={false}
                ref={inputRef2}
                style={styles.input}
                placeholderTextColor={'#2C436433'}
                value={code}
                placeholder="Enter code"
                onChangeText={text => {
                  setCode(text);
                  setError(false);
                }}
              />
            </View>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{status}</Text>}
          <View style={{ marginTop: SIZE(20) }}>
            <CommonButton
              loader={loader}
              arrow={true}
              backgroundColor={'#153CD8'}
              title={'Get Started'}
              onPress={() => {
                handleLogin();
              }}
              color={'#FFFFFF'}
            />
          </View>
          <Text allowFontScaling={false} style={styles.registerText}>
            New User?{' '}
            <Text
              allowFontScaling={false}
              style={{ color: '#153CD8' }}
              onPress={() => {
                navigation.navigate('Register');
              }}
            >
              Create an account
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
      {/* </TouchableWithoutFeedback> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: SIZE(20),
    // justifyContent: 'center',
  },
  brandIconContainer: {
    width: SIZE(220),
    height: SIZE(46),
    marginBottom: SIZE(60),
    marginTop: SIZE(150),
  },
  brandIcon: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {},
  employyText: {
    fontSize: SIZE(28),
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(28),
    color: '#000000',
  },
  subText: {
    marginTop: SIZE(12),
    marginBottom: SIZE(40),
    fontSize: SIZE(16),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: '#272727',
  },

  uerNameText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
    color: '#515978',
    marginBottom: Platform.OS === 'ios' ? SIZE(5) : 0,
  },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
    alignSelf: 'flex-start',
    marginLeft: SIZE(30),
    // marginLeft: SIZE(-120),
  },
  registerText: {
    fontSize: SIZE(16),
    textAlign: 'center',
    marginTop: SIZE(20),
    color: '#000000',
    lineHeight: SIZE(18),
  },
  inputContainer: {
    justifyContent: 'center',
    height: SIZE(70),
    width: '100%',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    // paddingVertical: SIZE(10),
    paddingHorizontal: SIZE(30),
    overflow: 'hidden',
  },
  input: {
    // flex:1,
    // marginLeft:SIZE(2),
    // height:SIZE(40),
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    // padding: 0,
    // margin: 0,
    color: '#000000',
    // backgroundColor:'red'
  },
});
