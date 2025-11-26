// ResetPassword.js
import React, { useRef, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';
import Icon from 'react-native-vector-icons/Ionicons';

import { Fonts, SIZE } from '../../utils/Styles';
import CommonButton from '../../CommonButton';
import { useAxios } from '../../utils/useAxios';
import { Context } from '../../Redux/Store';
import { decription } from '../../utils/decription';

export default function ResetPassword({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { fetchData } = useAxios();
  const { state, dispatch } = useContext(Context);

  // Get employee code from route (passed from login/forgot flow)
  const employeeCodeFromRoute = route?.params?.employeecode || '';

  const codeRef = useRef(null);
  const newPassRef = useRef(null);
  const confirmPassRef = useRef(null);

  const [employeeCode, setEmployeeCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState('');
  const [loader, setLoader] = useState(false);

  const handleReset = async () => {
    setError(false);
    setStatus('');

    if (!employeeCode.trim()) {
      setError(true);
      setStatus('*Please enter employee code');
      return;
    }
    if (!newPassword.trim()) {
      setError(true);
      setStatus('*Please enter new password');
      return;
    }
    if (newPassword.length < 3) {
      setError(true);
      setStatus('*Password must be at least 3 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(true);
      setStatus('*Passwords do not match');
      return;
    }

    setLoader(true);

    try {
      const data = await fetchData({
        url: 'auth/create-password',
        method: 'POST',
        data: {
          employeecode: employeeCode.trim(),
          password: newPassword,
        },
      });

      if (data?.message === 'success') {
        // const decript = decription(data?.token);

        // dispatch({
        //   type: 'UPDATE_USER_DATA',
        //   userData: {
        //     ...state.userData,
        //     is_logged: true,
        //     username: employeeCode.trim(),
        //     token: data?.token,
        //     user_info: decript,
        //   },
        // });

        toast.show('Password created successfully!', {
          type: 'success',
          duration: 3000,
        });
        navigation.navigate('UserLogin')

        // Go to Home or Dashboard
        // navigation.reset({
        //   index: 0,
        //   routes: [{ name: 'Home' }], // Change to your main screen
        // });
      } else {
        toast.show(data?.message || 'Failed to set password', { type: 'danger' });
        setError(true);
        setStatus(data?.message || 'Invalid employee code');
      }
    } catch (err) {
      toast.show('Network error. Try again.', { type: 'danger' });
      setError(true);
      setStatus('Something went wrong');
      console.log('Reset error:', err);
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
        {/* Brand Logo */}
        <View style={styles.brandIconContainer}>
          <Image
            source={require('../../../assets/brand.png')}
            style={styles.brandIcon}
            resizeMode="cover"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.welcomeText}>Reset Password</Text>
          <Text style={styles.subText}>
            Enter your employee code and new password below.
          </Text>

          {/* Employee Code Field */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => codeRef.current?.focus()}
            style={styles.inputContainer}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.labelText}>Employee Code</Text>
              <TextInput
                ref={codeRef}
                style={styles.input}
                placeholder="Enter employee code"
                placeholderTextColor={'#2C436433'}
                value={employeeCode}
                onChangeText={setEmployeeCode}
                autoCapitalize="characters"
                returnKeyType="next"
                onSubmitEditing={() => newPassRef.current?.focus()}
              />
            </View>
          </TouchableOpacity>

          {/* New Password */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => newPassRef.current?.focus()}
            style={[styles.inputContainer, { marginTop: SIZE(16) }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.labelText}>New Password</Text>
              <TextInput
                ref={newPassRef}
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={'#2C436433'}
                secureTextEntry={!showNewPass}
                value={newPassword}
                onChangeText={setNewPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPassRef.current?.focus()}
              />
            </View>
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
              <Icon name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={24} color="#888" />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Confirm Password */}
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => confirmPassRef.current?.focus()}
            style={[styles.inputContainer, { marginTop: SIZE(16) }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.labelText}>Confirm Password</Text>
              <TextInput
                ref={confirmPassRef}
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor={'#2C436433'}
                secureTextEntry={!showConfirmPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>
            <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
              <Icon name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={24} color="#888" />
            </TouchableOpacity>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{status}</Text>}

          <View style={{ marginTop: SIZE(20) }}>
            <CommonButton
              loader={loader}
              arrow={true}
              backgroundColor={'#153CD8'}
              title={'Set Password'}
              onPress={handleReset}
              color={'#FFFFFF'}
            />
          </View>

          <Text style={styles.registerText}>
            Remember password?{' '}
            <Text style={{ color: '#153CD8' }} onPress={() => navigation.navigate('UserLogin')}>
              Back to Login
            </Text>
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: SIZE(20),
  },
  brandIconContainer: {
    width: SIZE(220),
    height: SIZE(46),
    marginTop: SIZE(150),
    marginBottom: SIZE(60),
    alignSelf: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
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
    fontFamily: Fonts.Regular,
  },
});