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
  ScrollView,
  Modal, // Added Modal
  Platform,
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
import DownArrowIcon from '../../../assets/svg/DownArrow1.svg';

export default function AddEmployee({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const { isEdit } = route?.params || {};
  const { isNewScan } = route?.params || {};
  const { selectedData } = route?.params || {};



  const code = state?.userData?.company_code;

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  const [input, setInput] = useState({
    bracnh: isEdit ? selectedData?.branch : '',
    username: isEdit ? selectedData?.fullname : '',
    password: isEdit ? selectedData?.employee_code : '',
  });

  const [data, setData] = useState([]);
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
    branchErr: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogOut, setLogOut] = useState(false);
  const [isDropDown, setDropDown] = useState(false);

  const handleChange = (name, value) => {
    setInput(prev => ({ ...prev, [name]: value }));
  };

 
  

  const filteredData = data?.filter(item =>
    item?.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleBranchSelect = bracnh => {
    setInput(prev => ({ ...prev, bracnh }));
    setError(prev => ({ ...prev, branchErr: false }));
    setDropDown(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const getBranch = async () => {
    try {
      const response = await fetch(`${API_URL}get-branch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compony_code: code,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches.');
      }
      const datas = await response.json();
      if (datas?.message === 'success') {
        setData(datas?.details);
      } else {
        console.error('Failed to fetch branches:', datas?.message);
      }
    } catch (err) {
      console.error('Fetch branches error:', err.message);
    }
  };



  const saveChanges = async () => {
    try {
      const formData = new FormData();
      formData.append('compony_code', code);
      const editableDetails = JSON.stringify([
        {
          employee_id: input?.password,
          action: 'E',
          full_name: input?.username,
          branch: input?.bracnh,
        },
      ]);
      formData.append('editable_details', editableDetails);

      const response = await fetch(`${BASE_URL}edit-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Authentication failed. Please check your credentials.');
      }

      const data = await response.json();
      if (data?.message === 'success') {
        navigation.goBack();
      }
    } catch (err) {
      console.error('Authentication error:', err?.message);
    }
  };

  useEffect(() => {
    getBranch();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isEdit) {
        navigation.navigate('EmployeeManagement');
      } else  if(isNewScan) {
        navigation.navigate('NewScan');
     
      }else{
        navigation.navigate('EmpManagement');
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
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
            <View
              style={{ ...styles.contain, paddingTop: insets.top + SIZE(20) }}
            >
              <View style={styles.haederContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={5}
                    onPress={() => {
                      isEdit
                        ? navigation.navigate('EmployeeManagement'):isNewScan? navigation.navigate('NewScan')
                        : navigation.navigate('EmpManagement');
                      setLogOut(false);
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
              onPress={() => {
                setLogOut(false);
                Keyboard.dismiss();
              }}
            >
              <View style={styles.bottomContainer}>
                <View style={styles.contentContainer}>
                  <Text style={styles.employyText}>Employee Info</Text>
                  <Text style={styles.subText}>
                    Fill in your details below. This helps us {'\n'}register
                    your profile securely.
                  </Text>
                </View>

                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{ zIndex: 10 }}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={10}
                    onPress={() => {
                      setDropDown(!isDropDown);
                      setSearchQuery('');
                      setError(prev => ({ ...prev, branchErr: false }));
                    }}
                    style={styles.inputContainer}
                  >
                    <ProfileIcon
                      width={SIZE(20)}
                      height={SIZE(20)}
                      style={{ marginRight: SIZE(10) }}
                    />
                    <View style={{ width: '80%', justifyContent: 'center' }}>
                      <Text style={styles.uerNameText}>Branch Name</Text>
                      <Text
                        style={{
                          marginTop: SIZE(5),
                          fontSize: SIZE(14),
                          lineHeight: SIZE(16),
                          color: input.bracnh ? '#000000' : '#2C436433',
                        }}
                      >
                        {input.bracnh || 'Select branch'}
                      </Text>
                    </View>
                    <View
                      style={{
                        transform: [{ rotate: isDropDown ? '180deg' : '0deg' }],
                      }}
                    >
                      <DownArrowIcon width={SIZE(35)} height={SIZE(35)} />
                    </View>
                  </TouchableOpacity>
                  {error.branchErr && (
                    <Text style={styles.errorText}>*Please select a branch</Text>
                  )}
                </KeyboardAvoidingView>

                {/* Dropdown as Modal */}
                <Modal
                  visible={isDropDown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => {
                    setDropDown(false);
                    setSearchQuery('');
                    Keyboard.dismiss();
                  }}
                >
                  <TouchableWithoutFeedback
                    onPress={() => {
                      setDropDown(false);
                      setSearchQuery('');
                      Keyboard.dismiss();
                    }}
                  >
                    <View style={styles.modalOverlay}>
                      <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.dropdownContainer}
                      >
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search branch..."
                          placeholderTextColor={'#2C436433'}
                          value={searchQuery}
                          onChangeText={text => setSearchQuery(text)}
                          autoFocus={true}
                        />
                        <ScrollView
                          nestedScrollEnabled={true}
                          style={styles.optionList}
                          showsVerticalScrollIndicator={true}
                          contentContainerStyle={styles.scrollContent}
                        >
                          {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                              <TouchableOpacity
                                key={index}
                                style={styles.optionItem}
                                onPress={() => handleBranchSelect(item?.branch_name)}
                              >
                                <Text style={styles.optionText}>
                                  {item?.branch_name}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noResultsText}>
                              No branches found
                            </Text>
                          )}
                        </ScrollView>
                      </KeyboardAvoidingView>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  onPress={() => {
                    inputRef1.current?.focus();
                    setError(prev => ({ ...prev, usernameErr: false }));
                  }}
                  style={{ ...styles.inputContainer, marginTop: SIZE(16) }}
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
                        fontSize: SIZE(14),
                        lineHeight: SIZE(16),
                        color: '#000000',
                      }}
                      placeholderTextColor={'#2C436433'}
                      value={input.username}
                      placeholder="Enter name"
                      onChangeText={text => {
                        handleChange('username', text);
                        setError(prev => ({ ...prev, usernameErr: false }));
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
                        color: '#000000',
                      }}
                      placeholderTextColor={'#2C436433'}
                      value={input.password}
                      placeholder="Enter code"
                      onChangeText={text => {
                        handleChange('password', text);
                        setError(prev => ({ ...prev, passwordErr: false }));
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
        {isEdit ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={10}
              onPress={() => {
                navigation.navigate('AdminScan', {
                  fullname: input.username,
                  employeecode: input.password,
                  branch: input.bracnh,
                  isEdit,
                  selectedData: selectedData,
                
                });
              }}
              style={styles.buttonCont}
            >
              <Text style={styles.buttonTxt}>Retake Face</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={saveChanges}
              activeOpacity={0.8}
              hitSlop={10}
              style={{ ...styles.buttonCont, backgroundColor: '#153CD8' }}
            >
              <Text style={{ ...styles.buttonTxt, color: '#FFFFFF' }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CommonButton
            backgroundColor={'#153CD8'}
            title={'Next'}
            onPress={() => {
              const newError = {
                usernameErr: !input.username.trim(),
                passwordErr: !input.password.trim(),
                branchErr: !input.bracnh.trim(),
              };

              if (
                newError.usernameErr ||
                newError.passwordErr ||
                newError.branchErr
              ) {
                setError({
                  branchErr: newError.branchErr,
                  usernameErr: newError.usernameErr,
                  passwordErr: newError.passwordErr,
                });
              } else {
                navigation.navigate('AdminScan', {
                  fullname: input.username,
                  employeecode: input.password,
                  branch: input.bracnh,
                    isNewScan:isNewScan
                });
              }

              Keyboard.dismiss();
              setLogOut(false);
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
        )}
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
    alignItems: 'center',
    overflow: 'hidden',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: SIZE(400), // Increased for better visibility
    backgroundColor: '#FFF',
    borderRadius: SIZE(20),
    padding: SIZE(10),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollContent: {
    paddingBottom: SIZE(20), // Ensure content isn't cut off
  },
  optionItem: {
    padding: SIZE(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E5',
  },
  optionText: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(16),
    lineHeight: SIZE(20),
    color: '#000000',
  },
  optionList: {
    maxHeight: SIZE(350), // Increased to accommodate more items
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: SIZE(10),
    fontSize: SIZE(14),
    color: '#000',
  },
  noResultsText: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(14),
    color: '#000000',
    textAlign: 'center',
    padding: SIZE(10),
  },
});