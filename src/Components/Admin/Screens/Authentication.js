import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  BackHandler,
  Modal,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import React, { useState, useRef, useContext, useEffect } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileIcon from '../../../assets/svg/profile.svg';
import LockIcon from '../../../assets/svg/lock.svg';
import CommonButton from '../../CommonButton';

import { useRoute, useNavigation } from '@react-navigation/native';
import { BASE_URL } from '../../utils/urls';
import { Context } from '../../Redux/Store';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { storage } from '../../utils/Storage';
import { useLogout } from '../../utils/useLogout';
import * as Keychain from 'react-native-keychain';
import FaceId from '../../../assets/svg/FaceID.svg';

export default function Authentication({ route }) {
  const { isNewScan } = route.params || {};
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { fetchData } = useAxios();
  const handleLogout = useLogout();

  const { state, dispatch } = useContext(Context); // Add camera ready state
  const code = state.userData.company_code;

  const navigation = useNavigation();

  // console.log(isLogged);

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const [loader, setLoader] = useState(false);

  const [err, setErr] = useState(false);
  const [input, setInput] = useState({ username: '', password: '' });
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
  });
  const [isLogOut, setLogOut] = useState(false);

  const handleChange = (name, value) => {
    setErr(false);

    setInput(prev => ({ ...prev, [name]: value }));
    if (name == 'username') {
      setError(prev => ({ ...prev, usernameErr: false }));
    } else {
      setError(prev => ({ ...prev, passwordErr: false }));
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: 'service_key',
        authenticationPrompt: {
          title: 'Login with Biometrics',
        },
      });

      if (credentials) {
        // handleNavigate()
        // setInput({
        //   username: credentials.username,
        //   password: credentials.password,
        // });
        handleNavigate(credentials.username, credentials.password);

        // toast.show('Logged in with Face ID!', { type: 'success' });
      }
    } catch (error) {
      console.log('User cancelled or no saved login');
      // Do nothing - user will type manually
    }
  };

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const handleNavigate = async (username = null, password = null) => {
    const cleanUsername = username ?? input.username.trim();
    const cleanPassword = password ?? input.password.trim();
    const newError = {
      usernameErr: !cleanUsername,
      passwordErr: !cleanPassword,
    };
    setError(newError);
    setErr(false);

    if (newError.usernameErr || newError.passwordErr) {
      return;
    }
    //  navigation.navigate("AddEmployee");
    setLoader(true);
    try {
      // const response = await fetch(`${BASE_URL}verify-admin`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     username: input.username,
      //     password: input.password,
      //     compony_code: code,
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error(
      //     'Authentication failed. Please check your credentials.',
      //   );
      // }

      // const data = await response.json();

      const data = await fetchData({
        url: 'auth/verify-admin',
        method: 'POST',
        data: {
          username: cleanUsername,
          password: cleanPassword,
          //     compony_code: code,
        },
      });
      console.log(data);
      if (data?.message === 'success') {
        try {
          await Keychain.setGenericPassword(input.username, input.password, {
            service: 'service_key',
            // Optional: Add access control for better security
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            authenticationPrompt: {
              title: 'Enable Face ID / Touch ID',
            },
          });
          console.log('Credentials saved securely');
        } catch (error) {
          console.warn('Failed to save credentials:', error);
        }
        if (isNewScan) {
          navigation.navigate('AddEmployee', {
            isNewScan: isNewScan,
          });
        } else {
          navigation.navigate('EmpManagement', {
            isAuthentication: true,
          });
        }

        dispatch({
          type: 'UPDATE_USER_DATA',
          userData: {
            ...state.userData,
            initialRoute: 'EmpManagement',
          },
        });
      } else {
        toast.show('Something went wrong', { type: 'danger', duration: 2000 });
        setErr(true);
      }

      // const data = await response.json();
    } catch (err) {
      toast.show(data?.message || 'Something went wrong', {
        type: 'danger',
        duration: 2000,
      });
      // setError({ usernameErr: true, passwordErr: true });
      console.log('Authentication error:', err.message);
      setErr(true);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      // Navigate to the login page
      navigation.navigate('NewScan'); // Replace 'Login' with your login screen name
      return true; // Prevent default back action (e.g., exiting the app)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => {
      backHandler.remove(); // Cleanup when the component unmounts
    };
  }, [navigation]);

  return (
    <View
      // source={require('../../../assets/adminBackround.png')}
      style={styles.container}
    >
      <KeyboardAwareScrollView
        // extraScrollHeight={SIZE(50)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // enableAutomaticScroll={true}
        enableOnAndroid={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setLogOut(false), Keyboard.dismiss();
          }}
        >
          <LinearGradient
            colors={['#022E95', '#4B87EE']}
            style={{ ...styles.contain }}
          >
            <View style={{ position: 'absolute', right: 0, top: 0 }}>
              <Image
                width={'100%'}
                height={'100%'}
                source={require('../../../assets/window.png')}
              />
            </View>
            <View style={{ paddingTop: insets.top + SIZE(20) }}>
              <View style={styles.haederContainer}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('NewScan');
                    setLogOut(false);
                  }}
                >
                  <BackIcon
                    style={{ marginTop: SIZE(25) }}
                    width={SIZE(32)}
                    height={SIZE(32)}
                  />
                </TouchableOpacity>

                {/* <Text style={{color:'#ffffff',fontSize:16,lineHeight:20}}>Log Out</Text>
                 */}
                <View style={styles.logoutButtonWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={8}
                    onPress={() => {
                      setLogOut(!isLogOut);
                    }}
                  >
                    <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
                  </TouchableOpacity>
                </View>

                {isLogOut && (
                  <View style={styles.logOutContainer}>
                    <TouchableOpacity
                      hitSlop={8}
                      activeOpacity={0.8}
                      onPress={handleLogout}
                      style={styles.logContaienr}
                    >
                      <Log width={SIZE(16)} height={SIZE(16)} />
                      <Text
                        style={{
                          color: '#1C54D7',
                          fontSize: SIZE(14),
                          fontFamily: Fonts.Medium,
                          marginLeft: SIZE(8),
                        }}
                      >
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.titleText}>
                  Access Admin{'\n'}Control Panel
                </Text>
                <Text style={styles.subTitleText}>
                  Enter your credentials to access the{'\n'}Admin panel.
                </Text>
              </View>
            </View>
            <View
              style={{
                ...styles.bottomContainer,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                hitSlop={10}
                onPress={() => {
                  inputRef1.current?.focus();
                  setError(prev => ({ ...prev, usernameErr: false }));
                }}
                style={styles.inputContainer}
              >
                <ProfileIcon
                  width={SIZE(20)}
                  height={SIZE(20)}
                  style={{ marginRight: SIZE(10) }}
                />

                <View style={{ width: '90%', justifyContent: 'center' }}>
                  <Text style={styles.uerNameText}>UserName</Text>
                  <TextInput
                    ref={inputRef1}
                    style={styles.input}
                    placeholderTextColor={'#2C436433'}
                    value={input.username}
                    placeholder="Enter Name"
                    onChangeText={text => {
                      handleChange('username', text);
                      setError(prev => ({ ...prev, usernameErr: false }));
                    }}
                  />
                </View>
              </TouchableOpacity>

              {error.usernameErr && (
                <Text style={styles.errorText}>*Please username</Text>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                hitSlop={10}
                onPress={() => {
                  inputRef2.current?.focus();
                  setError(prev => ({ ...prev, passwordErr: false }));
                }}
                style={{ ...styles.inputContainer, marginTop: SIZE(16) }}
              >
                <LockIcon
                  width={SIZE(20)}
                  height={SIZE(20)}
                  style={{ marginRight: SIZE(10) }}
                />

                <View
                  style={{
                    width: '90%',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Text style={styles.uerNameText}>Password</Text>
                  <TextInput
                    ref={inputRef2}
                    style={styles.input}
                    placeholderTextColor={'#2C436433'}
                    value={input.password}
                    // secureTextEntry
                    placeholder="Enter Password"
                    onChangeText={text => {
                      handleChange('password', text);
                      setError(prev => ({ ...prev, passwordErr: false }));
                    }}
                  />
                </View>
              </TouchableOpacity>
              {error.passwordErr && (
                <Text style={styles.errorText}>*Please enter password.</Text>
              )}
              {err && (
                <Text style={styles.errorText}>something went wrong</Text>
              )}
              <TouchableOpacity
                onPress={loadSavedCredentials}
                style={{ alignSelf: 'center', marginTop: SIZE(30) }}
                activeOpacity={0.8}
                hitSlop={10}
              >
                <FaceId width={SIZE(64)} height={SIZE(64)} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      <View
        style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom }]}
      >
        <CommonButton
          disabled={loader}
          loader={loader}
          backgroundColor={'#153CD8'}
          title={'Sign in'}
          onPress={() => {
            handleNavigate();
            setLogOut(false);
          }}
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
  },
  contain: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  haederContainer: {
    paddingHorizontal: SIZE(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  contentContainer: {
    marginTop: SIZE(20),
    paddingHorizontal: SIZE(20),
    marginBottom: SIZE(30),
  },
  titleText: {
    fontSize: SIZE(34),
    lineHeight: SIZE(42),
    color: '#FFFFFF',
    fontFamily: Fonts.Semibold,
  },
  subTitleText: {
    marginTop: SIZE(10),
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Medium,
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(20),
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: SIZE(40),
    borderTopRightRadius: SIZE(40),
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
    fontSize: SIZE(12),
    lineHeight: SIZE(20),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
    alignSelf: 'flex-start',
    marginLeft: SIZE(30),
  },
  bottomButtonContainer: {
    paddingHorizontal: SIZE(20),

    position: 'absolute',
    zIndex: 200,
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: SIZE(30),
  },
  logoutButtonWrapper: {
    position: 'relative',
    zIndex: 9999,
  },
  logOutContainer: {
    width: SIZE(200),
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: SIZE(50),
    right: 10,
    borderRadius: SIZE(20),
    padding: SIZE(15),
    elevation: 8,
    shadowColor: '#000000',
    zIndex: 9999,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  logContaienr: {
    flexDirection: 'row',
    height: SIZE(40),
    borderColor: '#1C54D7',
    borderWidth: 1,
    borderRadius: SIZE(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZE(15),

    // justifyContent:'space-between'
  },
  inputContainer: {
    height: SIZE(70),
    width: '100%',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    flexDirection: 'row',
    alignItems: 'center', // 👈 centers text vertically
    paddingHorizontal: SIZE(20),

    overflow: 'hidden',

    // remove vertical padding, let alignItems center handle it
  },

  input: {
    // flex: 1,
    fontSize: SIZE(14),
    color: '#000000',
    lineHeight: SIZE(16),
    // backgroundColor:'red'
  },
});
