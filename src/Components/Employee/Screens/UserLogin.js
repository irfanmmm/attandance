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
  Platform,
} from 'react-native';
import React, { useContext, useRef, useState } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_URL } from './utils/urls';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useToast } from 'react-native-toast-notifications';
import CommonButton from '../../CommonButton';
import { Context } from '../../Redux/Store';

export default function UserLogin({ navigation }) {
  const insets = useSafeAreaInsets();

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [status, setStatus] = useState('*Please enter credentials');

  const toast = useToast();
  const [loader, setLoader] = useState(false);
  const { state, dispatch } = useContext(Context);

  const handleLogin = async () => {
    setLoader(true);
    setError(false);

    if (!username.trim() || !password.trim()) {
      setError(true);
      setLoader(false);
      return;
    }

    try {
    //   const response = await fetch(`${API_URL}user-login`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       username: username.trim(),
    //       password,
    //       company_code: state.userData.company_code, // from previous screen
    //     }),
    //   });

    //   const data = await response.json();

      if (username
        // data?.message === 'success'

      ) {
        // ---- UPDATE REDUX (adjust payload as needed) ----
        dispatch({
          type: 'UPDATE_USER_DATA',
          userData: {
            ...state.userData,
            is_logged: true,
            username,
            password
        
            // any extra user info you receive
          },
        });
        // optional navigation after success
        // navigation.replace('Home');
      } else {
        setLoader(false);
        toast.show(data?.message ?? 'Login failed', {
          type: 'danger',
          duration: 2000,
        });
        setError(true);
        setStatus(data?.message ?? 'Invalid credentials');
      }
    } catch (err) {
      setLoader(false);
      toast.show('Something went wrong', { type: 'danger', duration: 2000 });
      setError(true);
      setStatus('Network error');
      console.log('Login error:', err);
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === 'android' ? SIZE(-100) : SIZE(100)}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Brand */}
        <View style={styles.brandIconContainer}>
          <Image
            source={require('../../../assets/brand.png')}
            style={styles.brandIcon}
            resizeMode="cover"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>

          <Text style={styles.subText}>
            Enter your credentials below to continue.
          </Text>

          {/* Username */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => usernameRef.current?.focus()}
            style={styles.inputContainer}
          >
            <View>
              <Text style={styles.labelText}>Username</Text>
              <TextInput
                ref={usernameRef}
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor={'#2C436433'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </TouchableOpacity>

          {/* Password */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => passwordRef.current?.focus()}
            style={[styles.inputContainer, { marginTop: SIZE(16) }]}
          >
            <View>
              <Text style={styles.labelText}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={'#2C436433'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{status}</Text>}

          <View style={{ marginTop: SIZE(20) }}>
            <CommonButton
              loader={loader}
              arrow={true}
              backgroundColor={'#153CD8'}
              title={'Log In'}
              onPress={handleLogin}
              color={'#FFFFFF'}
            />
          </View>

   
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

/* -------------------------------------------------------------
   STYLES – almost identical to your CompanyLogin, only tiny tweaks
   ------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: SIZE(20),
  },
  brandIconContainer: {
    width: SIZE(220),
    height: SIZE(46),
    marginBottom: SIZE(60),
    marginTop: SIZE(150),
  },
  brandIcon: { width: '100%', height: '100%' },

  contentContainer: {},

  welcomeText: {
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

  labelText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
    color: '#515978',
    marginBottom: Platform.OS === 'ios' ? SIZE(5) : 0,
  },
  inputContainer: {
    justifyContent: 'center',
    height: SIZE(70),
    width: '100%',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    paddingHorizontal: SIZE(30),
    overflow: 'hidden',
  },
  input: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#000000',
  },

  errorText: {
    marginTop: SIZE(6),
    marginLeft: SIZE(30),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
  },

  registerText: {
    marginTop: SIZE(20),
    fontSize: SIZE(16),
    textAlign: 'center',
    color: '#000000',
    lineHeight: SIZE(18),
  },
});