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
  Platform,
} from 'react-native';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileIcon from '../../../assets/svg/profile.svg';
import CommonButton from '../../CommonButton';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import { Context } from '../../Redux/Store';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { API_URL } from '../../utils/urls';
import { useToast } from 'react-native-toast-notifications';
import { useAxios } from '../../utils/useAxios';

export default function AddAgency({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const toast = useToast();

  const code = state?.userData?.company_code;
  const inputRef1 = useRef(null);

  const [agencyName, setAgencyName] = useState('');
  const [error, setError] = useState(false);
  const [isLogOut, setLogOut] = useState(false);
  const [loader, setLoader] = useState(false);

  const { fetchData } = useAxios();

  const handleSubmit = async () => {
    if (!agencyName.trim()) {
      setError(true);
      return;
    }

    setLoader(true);
    try {
      const response = await fetchData({
        url: 'set-agency',
        method: 'POST',
        data: { agency: agencyName },
      });

      if (response?.message === 'success') {
        toast.show('Agency added successfully', { type: 'success' });
        navigation.navigate('EmpManagement');
      } else {
        toast.show(response?.message || 'Failed to add agency', { type: 'danger' });
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger' });
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('EmpManagement');
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        contentContainerStyle={{ flexGrow: 1 }}
        extraScrollHeight={Platform.OS === 'ios' ? 100 : 50}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setLogOut(false);
            Keyboard.dismiss();
          }}
        >
          <ImageBackground
            source={require('../../../assets/employyeBackround.png')}
            style={{ flex: 1 }}
            resizeMode="cover"
          >
            {/* Header */}
            <View style={{ ...styles.contain, paddingTop: insets.top + SIZE(20) }}>
              <View style={styles.haederContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('EmpManagement')}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>
                  <Text style={styles.titleText}>Add Agency</Text>
                </View>

                <View style={styles.logoutButtonWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setLogOut(!isLogOut)}
                  >
                    <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
                  </TouchableOpacity>

                  {isLogOut && (
                    <View style={styles.logOutDropdown}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          dispatch({
                            type: 'UPDATE_USER_DATA',
                            userData: { ...state.userData, is_logged: false },
                          });
                          setLogOut(false);
                        }}
                        style={styles.logoutOption}
                      >
                        <Log width={SIZE(16)} height={SIZE(16)} />
                        <Text style={styles.logoutText}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.bottomContainer}>
              <View style={styles.contentContainer}>
                <Text style={styles.employyText}>Agency Info</Text>
                <Text style={styles.subText}>Enter agency name below.</Text>
              </View>

              {/* Agency Name */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  inputRef1.current?.focus();
                  setError(false);
                }}
                style={styles.inputContainer}
              >
                <ProfileIcon width={SIZE(20)} height={SIZE(20)} />
                <View style={{ width: '90%', justifyContent: 'center' }}>
                  <Text style={styles.uerNameText}>Agency Name</Text>
                  <TextInput
                    ref={inputRef1}
                    style={{ fontSize: SIZE(14), color: '#000000' }}
                    placeholder="Enter agency name"
                    placeholderTextColor={'#2C436433'}
                    value={agencyName}
                    onChangeText={(text) => {
                      setAgencyName(text);
                      setError(false);
                    }}
                  />
                </View>
              </TouchableOpacity>

              {error && <Text style={styles.errorText}>*Please enter agency name</Text>}

              {/* Spacer to prevent bottom button overlap */}
              <View style={styles.spacer} />
            </View>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      {/* Submit Button */}
      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={'#153CD8'}
          loader={loader}
          title={'Submit'}
          onPress={handleSubmit}
          color={'#FFFFFF'}
        />
      </View>
    </View>
  );
}

// Styles
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
    zIndex: 10,
  },
  titleText: {
    fontSize: SIZE(34),
    color: '#FFFFFF',
    fontFamily: Fonts.Semibold,
    marginLeft: SIZE(12),
  },
  logoutButtonWrapper: {
    position: 'relative',
    zIndex: 50,
  },
  logOutDropdown: {
    width: SIZE(200),
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: SIZE(50),
    right: 0,
    borderRadius: SIZE(20),
    padding: SIZE(15),
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  logoutOption: {
    flexDirection: 'row',
    height: SIZE(40),
    borderColor: '#1C54D7',
    borderWidth: 1,
    borderRadius: SIZE(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZE(15),
  },
  logoutText: {
    color: '#1C54D7',
    fontSize: SIZE(14),
    fontFamily: Fonts.Medium,
    marginLeft: SIZE(8),
  },
  bottomContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(20),
    paddingBottom: SIZE(120),
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
    color: '#000000',
  },
  subText: {
    marginTop: SIZE(12),
    marginBottom: SIZE(32),
    fontSize: SIZE(14),
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
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: SIZE(12),
  },
  uerNameText: {
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    color: '#515978',
  },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(12),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
    alignSelf: 'flex-start',
    marginLeft: SIZE(30),
  },
  spacer: {
    height: SIZE(20),
  },
  bottomButtonContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(20),
    // paddingBottom: insets.bottom + SIZE(20),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});