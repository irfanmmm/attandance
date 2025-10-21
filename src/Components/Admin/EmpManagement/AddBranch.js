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
  Alert,
  Linking,
  Image,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
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
import { API_URL, BASE_URL } from '../../utils/urls';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useToast } from 'react-native-toast-notifications';
import { useFocusEffect } from '@react-navigation/native';

export default function AddBranch({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);

  const code = state?.userData?.company_code;

  const inputRef1 = useRef(null);
  const [permission, setPermission] = useState(null);
  const [locationLoad, setLocationLoad] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isHighAccuracy, setIsHighAccuracy] = useState(true);

  const toast = useToast();

  const [input, setInput] = useState({
    branch: '',
    latitude: '',
    longitude: '',
    radius: '',
  });
  const [error, setError] = useState({
    // usernameErr: false,
    // passwordErr: false,
    bracnhErr: false,
    latitudeErr: false,
    longitudeErr: false,
    locationErr: false,
    radiusErr: false,
  });
  const [isLogOut, setLogOut] = useState(false);
  const [hasAskedPermission, setHasAskedPermission] = useState(false);
  const [loader, setLoader] = useState(false);

  const handleChange = (name, value) => {
    setInput(prev => ({ ...prev, [name]: value }));
  };

  const getPermission = async () => {
    try {
      const locationPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const status = await check(locationPermission);

      if (status === RESULTS.GRANTED) {
        setPermission('authorized');
      } else if (status === RESULTS.DENIED) {
        setHasAskedPermission(true);

        const result = await request(locationPermission);
        console.log(result, 'resff');

        setPermission(result === RESULTS.GRANTED ? 'authorized' : result);

        if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
          setHasAskedPermission(true);
          Alert.alert(
            'Location Permission Required',
            'Please enable location access in settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ],
          );
        }
      } else if (status === RESULTS.BLOCKED) {
        setPermission('blocked');
        Alert.alert(
          'Location Permission Blocked',
          'Location access is blocked. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (err) {
      console.log('Permission check error:', err);
      setPermission('error');
    }
  };

  const handleLocationFetch = () => {
    // If store already has location data, use it
    if (state?.userData?.latitude && state?.userData?.longitude) {
      console.log('Using stored location from state');
      setInput(prev => ({
        ...prev,
        latitude: state?.userData?.latitude,
        longitude: state?.userData?.longitude,
      }));
      setCurrentLocation(prev => ({
        ...prev,
        latitude: state?.userData?.latitude,
        longitude: state?.userData?.longitude,
      }));
      return;
    } else {
      getCurrentLocation();
    }

    // Otherwise, fetch current location
  };

   useFocusEffect(
      React.useCallback(() => {
        setIsHighAccuracy(true);
        return () => {
      
        };
      }, []),
    );

  const getCurrentLocation = () => {
    setLocationLoad(true);
    setError(prev => ({ ...prev, locationErr: false }));
    console.log('Fetching fresh current location');

    Geolocation.getCurrentPosition(
      position => {
        setLocationLoad(false);
        const { latitude, longitude } = position.coords;
        setCurrentLocation(prev => ({ ...prev, latitude, longitude }));
        setInput(prev => ({ ...prev, latitude, longitude }));
        console.log({ latitude, longitude }, 'Fresh location fetched');
      },
      error => {
        console.log('timouted', error.code);
        if (error.code === 3) {
          setIsHighAccuracy(false);
        }
        reject(error.message);
      },
      {
        enableHighAccuracy: isHighAccuracy,
        timeout: 2000,
        maximumAge: 0,
        interval: 0,
        distanceFilter: 0,
      },
    );
  };

  const openMaps = () => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      const { latitude, longitude } = currentLocation;
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Location not available');
    }
  };

  // const saveChanges = async () => {
  //     try {
  //       const formData = new FormData();
  //       formData.append('compony_code', code);
  //       const editableDetails = JSON.stringify([
  //         {
  //           employee_id: input?.password,
  //           action: 'E',
  //           full_name: input?.username,
  //         },
  //       ]);
  //       formData.append('editable_details', editableDetails);

  //       const response = await fetch(`${BASE_URL}edit-user`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'multipart/form-data',
  //         },
  //         body: formData,
  //       });

  //       if (!response.ok) {
  //         throw new Error(
  //           'Authentication failed. Please check your credentials.',
  //         );
  //       }

  //       const data = await response.json();
  //       console.log(data.data, 'deleteemol');

  //       if (data?.message === 'success') {
  //         // setData(data?.data);
  //         navigation.goBack()

  //       } else {
  //       }
  //     } catch (err) {
  //       // setData([]);

  //       console.log('Authentication error:', err?.message);
  //     }
  //   };

  useEffect(() => {
    const backAction = () => {
      // Navigate to the login page

      navigation.navigate('EmpManagement'); // Replace 'Login' with your login screen name

      return true; // Prevent default back action (e.g., exiting the app)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  useEffect(() => {
    if (!hasAskedPermission) {
      getPermission();
    }
  }, [hasAskedPermission]);

  const handleNavigate = async () => {
    //  navigation.navigate("AdminScan");
    setLoader(true);

    try {
      const response = await fetch(`${API_URL}add-branch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compony_code: code,
          branch_name: input.branch,
          latitude: input.latitude,
          longitude: input.longitude,
          radius: Number(input.radius),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add employee. Please check the details.');
      }
      const data = await response.json();
      if (data?.message === 'success') {
        toast.show(data?.message, {
          type: 'Success',
          duration: 2000,
        });
        navigation.navigate('EmpManagement');
      } else {
        toast.show(data?.message || 'Something went wrong', {
          type: 'danger',
          duration: 2000,
        });
      }

      //
      // console.log(data);

      //
    } catch (err) {
      toast.show('Something went wrong', {
        type: 'danger',
        duration: 2000,
      });

      console.error('Add employee error:', err.message);
    } finally {
      setLoader(false);
    }
  };

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
        <TouchableWithoutFeedback
          onPress={() => {
            setLogOut(false);
          }}
        >
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

                      setLogOut(false);
                    }}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>

                  <Text style={styles.titleText}>Add Branch</Text>
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
              onPress={() => {
                setLogOut(false), Keyboard.dismiss();
              }}
            >
              <View
                style={{
                  ...styles.bottomContainer,
                }}
              >
                <View style={styles.contentContainer}>
                  <Text style={styles.employyText}>Branch Info</Text>
                  <Text style={styles.subText}>
                    Fill in your details below. This helps us {'\n'}register
                    securely.
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  onPress={() => {
                    inputRef1.current?.focus();
                    setError(prev => ({ ...prev, radiusErr: false }));
                  }}
                  style={styles.inputContainer}
                >
                  <ProfileIcon
                    width={SIZE(20)}
                    height={SIZE(20)}
                    style={{ marginRight: SIZE(10) }}
                  />

                  <View style={{ width: '90%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Branch Name</Text>
                    <TextInput
                      ref={inputRef1}
                      style={{
                        // flex:1,
                        fontSize: SIZE(14),
                        lineHeight: SIZE(16),
                        color: '#000000',
                      }}
                      placeholderTextColor={'#2C436433'}
                      value={input.branch}
                      placeholder="Enter name"
                      onChangeText={text => {
                        handleChange('branch', text);
                        setError(prev => ({ ...prev, radiusErr: false }));
                      }}
                    />
                  </View>
                </TouchableOpacity>
                {error.radiusErr && (
                  <Text style={styles.errorText}>*Please enter branch</Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  onPress={() => {
                    inputRef1.current?.focus();
                    setError(prev => ({ ...prev, bracnhErr: false }));
                  }}
                  style={{ ...styles.inputContainer, marginTop: SIZE(16) }}
                >
                  <ProfileIcon
                    width={SIZE(20)}
                    height={SIZE(20)}
                    style={{ marginRight: SIZE(10) }}
                  />

                  <View style={{ width: '90%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Radius</Text>
                    <TextInput
                      keyboardType="numeric"
                      ref={inputRef1}
                      style={{
                        // flex:1,
                        fontSize: SIZE(14),
                        lineHeight: SIZE(16),
                        color: '#000000',
                      }}
                      placeholderTextColor={'#2C436433'}
                      value={input.radius}
                      placeholder="Enter radius"
                      onChangeText={text => {
                        handleChange('radius', text);
                        setError(prev => ({ ...prev, bracnhErr: false }));
                      }}
                    />
                  </View>
                </TouchableOpacity>
                {error.bracnhErr && (
                  <Text style={styles.errorText}>*Please enter radius</Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  //   onPress={() => {
                  //     inputRef2.current?.focus();
                  //     setError(prev => ({ ...prev, latitudeErr: false }));
                  //   }}
                  style={{ ...styles.inputContainer, marginTop: SIZE(16) }}
                >
                  <LockIcon
                    width={SIZE(20)}
                    height={SIZE(20)}
                    style={{ marginRight: SIZE(10) }}
                  />

                  <View style={{ width: '90%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Location</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flexDirection: 'row', flex: 1 }}>
                        <TextInput
                          editable={true}
                          keyboardType="numeric"
                          style={{
                            fontSize: SIZE(14),
                            lineHeight: SIZE(16),
                            flex: 1,
                            color: '#000000',
                            borderBottomWidth: 1,
                            borderBottomColor: error?.latitudeErr
                              ? '#FF0000'
                              : '#E0E0E0',
                            paddingVertical: SIZE(4),
                          }}
                          placeholderTextColor={'#2C436433'}
                          value={String(input?.latitude || '')}
                          placeholder="Latitude"
                          onChangeText={text => {
                            // Allow only numbers, decimal point, and minus sign
                            const sanitized = text.replace(/[^0-9.-]/g, '');
                            handleChange('latitude', sanitized);
                            setError(prev => ({ ...prev, latitudeErr: false }));
                          }}
                        />

                        <Text
                          style={{
                            fontSize: SIZE(14),
                            marginHorizontal: SIZE(4),
                            alignSelf: 'center',
                            color: '#666',
                          }}
                        >
                          ,
                        </Text>

                        <TextInput
                          editable={true}
                          keyboardType="numeric"
                          style={{
                            fontSize: SIZE(14),
                            lineHeight: SIZE(16),
                            flex: 1,
                            color: '#000000',
                            borderBottomWidth: 1,
                            borderBottomColor: error?.longitudeErr
                              ? '#FF0000'
                              : '#E0E0E0',
                            paddingVertical: SIZE(4),
                          }}
                          placeholderTextColor={'#2C436433'}
                          value={String(input?.longitude || '')}
                          placeholder="Longitude"
                          onChangeText={text => {
                            // Allow only numbers, decimal point, and minus sign
                            const sanitized = text.replace(/[^0-9.-]/g, '');
                            handleChange('longitude', sanitized);
                            setError(prev => ({
                              ...prev,
                              longitudeErr: false,
                            }));
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          if (
                            !permission ||
                            permission === 'denied' ||
                            permission === 'blocked'
                          ) {
                            getPermission();
                          } else {
                            handleLocationFetch();
                          }
                        }}
                        activeOpacity={0.8}
                        hitSlop={8}
                        style={{ marginLeft: SIZE(8) }}
                      >
                        {locationLoad ? (
                          <ActivityIndicator size={'small'} color={'#153CD8'} />
                        ) : (
                          <Text style={styles.location}>📍</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
                {error.locationErr && (
                  <Text style={styles.errorText}>
                    *Unable to get location, Please try again later
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={'#153CD8'}
          loader={loader}
          title={'Submit'}
          onPress={() => {
            const newError = {
              bracnhErr: !input.branch.trim(),
              latitudeErr: !String(input.latitude).trim(), // Convert to string
              longitudeErr: !String(input.longitude).trim(), // Convert to string
              radiusErr: !String(input.radius).trim(), // Convert to string
            };

            if (
              newError.bracnhErr ||
              newError.latitudeErr ||
              newError.longitudeErr ||
              newError.radiusErr
            ) {
              setError({
                bracnhErr: newError.bracnhErr,
                locationErr: newError.latitudeErr || newError.longitudeErr,
                radiusErr: newError.radiusErr,
              });
            } else {
              handleNavigate();
            }

            Keyboard.dismiss();
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
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonCont: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#153CD8',
    borderWidth: 1,
    width: SIZE(170),
    height: SIZE(44),
    borderRadius: SIZE(30),
  },
  buttonTxt: {
    color: '#153CD8',
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
  },
  locationButton: {
    marginTop: SIZE(20),
    borderRadius: SIZE(30),
    paddingVertical: SIZE(15),
    width: '50%',
    height: SIZE(50),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#153CD8',
  },
  location: {
    width: SIZE(24),
    height: SIZE(24),
  },
  locationText: {
    fontSize: SIZE(16),
    lineHeight: SIZE(20),
    color: '#ffffff',
    marginRight: SIZE(10),
  },
});
