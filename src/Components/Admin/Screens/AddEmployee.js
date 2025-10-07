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
  KeyboardAvoidingView,
} from 'react-native';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileIcon from '../../../assets/svg/profile.svg';
import LockIcon from '../../../assets/svg/lock.svg';
import CommonButton from '../../CommonButton';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import { Context } from '../../Redux/Store';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function AddEmployee({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  const [input, setInput] = useState({ username: '', password: '' });
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
  });
  const [isLogOut, setLogOut] = useState(false);

  const handleChange = (name, value) => {
    setInput(prev => ({ ...prev, [name]: value }));
  };

  // useEffect(() => {
  //   const backAction = () => {
  //     // Navigate to the login page

  //     navigation.navigate('EmpManagement'); // Replace 'Login' with your login screen name
  //     return true; // Prevent default back action (e.g., exiting the app)
  //   };
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );
  //   return () => {
  //     backHandler.remove(); // Cleanup when the component unmounts
  //   };
  // }, [navigation]);

  // const handleNavigate = async () => {
  //     const newError = { usernameErr: !input.username.trim(), passwordErr: !input.password.trim() };
  //     setError(newError);

  //     if (newError.usernameErr || newError.passwordErr) {
  //       return;
  //     }
  //     //  navigation.navigate("AdminScan");

  //     try {
  //       const response = await fetch(`${API_URL}add-employee`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           fullname: input.username,
  //           employeecode: input.password,
  //         }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to add employee. Please check the details.');
  //       }

  //       const data = await response.json();
  //       console.log(data);

  //       navigation.navigate("AdminScan");
  //     } catch (err) {
  //       setError({ usernameErr: true, passwordErr: true });
  //       console.error('Add employee error:', err.message);
  //     }
  //   };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        extraScrollHeight={0}
      >
        <TouchableWithoutFeedback onPress={() => {setLogOut(false)}}>
          <ImageBackground
            source={require('../../../assets/employyeBackround.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            <View
              style={{ ...styles.contain, paddingTop: insets.top + SIZE(20) }}
            >
              <View style={styles.haederContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={5}
                    onPress={() => {
                      navigation.navigate('EmpManagement');
                      setLogOut(false)
                    }}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>

                  <Text style={styles.titleText}>Add Employee</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={8}
                  onPress={() => {
                    setLogOut(!isLogOut);
                  }}
                >
                  <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
                </TouchableOpacity>
                {isLogOut && (
                  <View style={styles.logOutContainer}>
                    <TouchableOpacity
                      hitSlop={8}
                      activeOpacity={0.8}
                      onPress={() => {
                        dispatch({
                          type: 'UPDATE_USER_DATA',
                          userData: {
                            ...state.userData,
                            is_logged: false,
                          },
                        });
                      }}
                      style={styles.logContaienr}
                    >
                      <Log width={SIZE(16)} height={SIZE(16)} />
                      <Text
                        style={{
                          color: '#1C54D7',
                          fontSize: SIZE(14),
                          marginLeft: SIZE(5),
                        }}
                      >
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            <TouchableWithoutFeedback
            onPress={()=>{setLogOut(false),Keyboard.dismiss()}}
            >
            <View
              style={{
                ...styles.bottomContainer,
              }}
            >
              <View style={styles.contentContainer}>
                <Text style={styles.employyText}>Employee Info</Text>
                <Text style={styles.subText}>
                  Fill in your details below. This helps us {'\n'}register your
                  profile securely.
                </Text>
              </View>

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
                  <Text style={styles.uerNameText}>Employee Name</Text>
                  <TextInput
                    ref={inputRef1}
                    style={{
                      // flex:1,
                      fontSize: SIZE(14),
                      lineHeight: SIZE(16),
                      color: '#000000',
                    }}
                    placeholderTextColor={'#2C436433'}
                    value={input.username}
                    placeholder="Enter name"
                    onChangeText={text => {
                      handleChange('username', text);
                    }}
                  />
                </View>
              </TouchableOpacity>
              {error.usernameErr && (
                <Text style={styles.errorText}>*Please enter name</Text>
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

                <View style={{ width: '90%', justifyContent: 'center' }}>
                  <Text style={styles.uerNameText}>Employee Code</Text>
                  <TextInput
                    ref={inputRef2}
                    style={{
                      fontSize: SIZE(14),
                      lineHeight: SIZE(16),
                      // flex: 1,
                      color: '#000000',
                    }}
                    placeholderTextColor={'#2C436433'}
                    value={input.password}
                    placeholder="Enter code"
                    onChangeText={text => {
                      handleChange('password', text);
                    }}
                  />
                </View>
              </TouchableOpacity>
              {error.passwordErr && (
                <Text style={styles.errorText}>*Please enter code</Text>
              )}
            </View>
            </TouchableWithoutFeedback>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={'#153CD8'}
          title={'Next'}
          onPress={() => {
            const newError = {
              usernameErr: !input.username.trim(),
              passwordErr: !input.password.trim(),
            };
            if (newError.usernameErr || newError.passwordErr) {
              return;
            }
            navigation.navigate('AdminScan', {
              fullname: input.username,
              employeecode: input.password,
            });
            Keyboard.dismiss();
           setLogOut(false)
            dispatch({
              type: 'UPDATE_USER_DATA',
              userData: {
                ...state.userData,
                empName: input.username,
              },
            });
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
  contain: {},
  haederContainer: {
    paddingHorizontal: SIZE(20),
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZE(16),
    marginBottom: SIZE(38),
    justifyContent: 'space-between',

  },

  titleText: {
    fontSize: SIZE(34),
    lineHeight: SIZE(42),
    color: '#FFFFFF',
    fontFamily: Fonts.Semibold,
    marginLeft: SIZE(12),
  },

  bottomContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(20),
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: SIZE(40),
    borderTopRightRadius: SIZE(40),
  },
  contentContainer: {
    width: '100%',
  },

  employyText: {
    fontSize: SIZE(22),
    fontFamily: Fonts.Medium,
    lineHeight: SIZE(24),
    color: '#000000',
  },
  subText: {
    marginTop: SIZE(12),
    marginBottom: SIZE(32),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: '#000000',
  },
  inputContainer: {
    height: SIZE(70),
    width: '100%',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    flexDirection: 'row',
    paddingHorizontal: SIZE(20),
    // paddingVertical: SIZE(10),
    alignItems: 'center',
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
    // marginLeft: SIZE(-120),
  },
  bottomButtonContainer: {
    paddingHorizontal: SIZE(20),

    position: 'absolute',
    zIndex: 100,
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: SIZE(30),
  },
  logOutContainer: {
    width: SIZE(200),
    height: SIZE(90),
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 45,
    right: 20,
    borderRadius: SIZE(20),
    padding: SIZE(20),
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logContaienr: {
    flexDirection: 'row',
    height: SIZE(40),
    borderColor: '#1C54D7',
    borderWidth: 1,
    borderRadius: SIZE(20),
    justifyContent: 'center',
    alignItems: 'center',

    // justifyContent:'space-between'
  },
});
