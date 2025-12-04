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
  Modal,
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
import DownArrowIcon from '../../../assets/svg/DownArrow1.svg';
import { useToast } from 'react-native-toast-notifications';
import { useAxios } from '../../utils/useAxios';
import { useSettings } from '../../utils/useSettings';
import { storage } from '../../utils/Storage';

export default function AddEmployee({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const { isEdit, isNewScan, selectedData } = route?.params || {};
  const isAdmin = state.userData.is_admin;
  // const settings = state.userData.settings;
  const toast = useToast();
  const { fetchData } = useAxios();
  const code = state?.userData?.company_code;

  const [agency, setAgency] = useState('');
  const [agencyList, setAgencyList] = useState([]);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyDropDown, setAgencyDropDown] = useState(false);
  const [agencyErr, setAgencyErr] = useState(false);
  const [loader, setLoader] = useState(false);

  const filteredAgency = agencyList?.filter(item =>
    item?.agency_name?.toLowerCase().includes(agencySearch.toLowerCase()),
  );

  const handleAgencySelect = agancy => {
    // setAgency(ag);
    setInput(prev => ({ ...prev, agancy }));
    setError(prev => ({ ...prev, agancyErr: false }));
    setAgencyErr(false);
    setAgencyDropDown(false);
    setAgencySearch('');
    Keyboard.dismiss();
  };

  // const handleBranchSelect = bracnh => {
  //   setInput(prev => ({ ...prev, bracnh }));
  //   setError(prev => ({ ...prev, branchErr: false }));
  //   setDropDown(false);
  //   setSearchQuery('');
  //   Keyboard.dismiss();
  // };

  const settings = useSettings();

  // const branchEnabled = settings?.find(
  //   val => val.setting_name === 'Branch Management',
  // )?.value;

  // const isIndividual = settings?.find(
  //   val => val.setting_name === 'Individual Login',
  // )?.value;

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  // Initial empty form
  const initialForm = {
    bracnh: '',
    username: '',
    password: '',
    agancy: '',
  };

  const [input, setInput] = useState(
    isEdit
      ? {
          bracnh: selectedData?.branch || '',
          username: selectedData?.fullname || '',
          password: selectedData?.employee_code || '',
          agancy: selectedData?.agency || '',
        }
      : initialForm,
  );

  const [data, setData] = useState([]);
  const [agancyData, setAganct] = useState([]);
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
    branchErr: false,
    agancyErr: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogOut, setLogOut] = useState(false);
  const [isDropDown, setDropDown] = useState(false);
  const [isGenerateLoader, setGenerateLoader] = useState(false);

  const filteredData = data?.filter(item =>
    item?.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const agencyFlter = agancyData?.filter(item =>
    item?.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleChange = (name, value) => {
    setInput(prev => ({ ...prev, [name]: value }));
    setError(prev => ({ ...prev, [`${name}Err`]: false }));
  };

  const handleBranchSelect = bracnh => {
    setInput(prev => ({ ...prev, bracnh }));
    setError(prev => ({ ...prev, branchErr: false }));
    setDropDown(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const NavigateAdminScan = () => {
    console.log(input, 'ffffff');

    if (
      !input.username.trim() ||
      !input.password.trim()
      //  ||
      // !input.bracnh ||
      // !input.agancy
    ) {
      toast.show('Please fill all fields', { type: 'danger' });
      return;
    }

    navigation.navigate('AdminScan', {
      fullname: input.username,
      employeecode: input.password,
      branch: input.bracnh,
      isNewScan: isNewScan,
      agancy: input.agancy,
    });
  };

  // FIXED: Add Employee + Auto Clear Form
  const AddEmployees = async () => {
    setLoader(true);
    if (
      !input.username.trim() ||
      !input.password.trim()
      // ||
      // !input.bracnh ||
      // !input.agancy
    ) {
      // setError({
      //   usernameErr: !input.username.trim(),
      //   passwordErr: !input.password.trim(),
      //   // branchErr: !input.bracnh,
      //   // agancyErr: !input.agancy,
      // });
      toast.show('Please fill all fields', { type: 'danger' });
      return;
    }

    try {
      const res = await fetchData({
        url: 'auth/add-employee',
        method: 'POST',
        data: {
          email: input?.username.trim(),
          // password: input.password,
          branch: input?.bracnh,
          employeecode: input?.password,
          agency: input?.agancy,
        },
      });

      if (res?.message === 'success') {
        toast.show('Employee added successfully!', {
          type: 'success',
          duration: 2500,
        });
        {
          isNewScan
            ? navigation.navigate('NewScan')
            : navigation.navigate('EmpManagement');
        }

        // Clear form for next employee
        setInput(initialForm);
        setError({
          usernameErr: false,
          passwordErr: false,
          branchErr: false,
          agancyErr: false,
        });

        // Auto focus name field
        setTimeout(() => inputRef1.current?.focus(), 300);
      } else {
        toast.show(res?.message || 'Failed to add employee', {
          type: 'danger',
        });
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger' });
      console.log('Add employee error:', err);
    } finally {
      setLoader(false);
    }
  };

  const getBranch = async () => {
    try {
      const res = await fetchData({
        url: 'get-branch',
        // method: 'POST',
        // data: { compony_code: code },
      });
      if (res?.message === 'success') {
        console.log(res?.details, 'branchdffhf');

        setData(res?.details || []);
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };

  const getAgency = async () => {
    try {
      const res = await fetchData({
        url: 'get-agency',
        // method: 'POST',
        // data: { compony_code: code },
      });
      if (res?.message === 'success') {
        console.log(res?.details, 'res?.detailsres?.detailsres?.details');
        setAganct(res?.details || []);
        // setData(res?.details || []);
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };
  const generateCode = async () => {
    setGenerateLoader(true);
    try {
      const response = await fetchData({
        url: 'auth/generate-employee-code',
        // method: 'POST',
      });

      if (response?.message === 'success') {
        // console.log(response, 'dddfththt');

        setInput(prev => ({
          ...prev,
          password: response?.employee_code || '',
        }));
      }
    } catch (error) {
      toast.show('Failed to generate code', { type: 'danger' });
    } finally {
      setGenerateLoader(false);
    }
  };
  const saveChanges = async () => {
    Keyboard.dismiss();
    setLoader(true);
    try {
      const formData = new FormData();
      formData.append('compony_code', code);
      const editableDetails = JSON.stringify([
        {
          employee_code: input?.password,
          action: 'E',
          full_name: input?.username,
          branch: input?.bracnh,
          agency: input?.agancy,
        },
      ]);
      formData.append('editable_details', editableDetails);

      const data = await fetchData({
        url: 'edit-user',
        method: 'POST',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // const response = await fetch(`${BASE_URL}edit-user`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   body: formData,
      // });

      // if (!response.ok) {
      //   throw new Error('Authentication failed. Please check your credentials.');
      // }

      // const data = await response.json();

      if (data?.message === 'success') {
        toast.show('Successfully saved', { type: 'success' });
        navigation.goBack();
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger' });
      console.error('Authentication error:', err?.message);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    getBranch();
    getAgency();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (isEdit) {
        navigation.navigate('EmployeeManagement');
      } else if (isNewScan) {
        navigation.navigate('NewScan');
      } else {
        navigation.navigate('EmpManagement');
      }
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation, isEdit, isNewScan]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        // extraScrollHeight={Platform.OS === 'ios' ? 100 : -50}
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
                        ? navigation.navigate('EmployeeManagement')
                        : isNewScan
                        ? navigation.navigate('NewScan')
                        : navigation.navigate('EmpManagement');
                      setLogOut(false);
                    }}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>
                  <Text style={styles.titleText}>Add Employee</Text>
                </View>
                <View style={styles.logoutButtonWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={8}
                    onPress={() => setLogOut(!isLogOut)}
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
                            // ← instantly update in-memory state
                            type: 'UPDATE_USER_DATA',
                            userData: {
                              is_logged: false,
                              token: null,
                              refresh_token: null,
                              company_code: '',
                              empName: '',
                              username: '',
                              password: '',
                              is_admin: false,
                              settings: null,
                              latitude: '',
                              longitude: '',
                                  initialRoute:'NewScan'
                            },
                          });
                          storage.clearAll();

                          // dispatch({
                          //   type: 'UPDATE_USER_DATA',
                          //   userData: { ...state.userData, is_logged: false },
                          // });
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

                {settings?.['Branch Management'] && (
                  <>
                    <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                      style={{ zIndex: 10 }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        hitSlop={10}
                        onPress={() => {
                          getBranch();
                          setDropDown(!isDropDown);
                          setSearchQuery('');
                          setError(prev => ({ ...prev, branchErr: false }));
                        }}
                        style={{
                          ...styles.inputContainer,
                          marginBottom: SIZE(20),
                        }}
                      >
                        <ProfileIcon
                          width={SIZE(20)}
                          height={SIZE(20)}
                          style={{ marginRight: SIZE(10) }}
                        />
                        <View
                          style={{ width: '80%', justifyContent: 'center' }}
                        >
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
                            transform: [
                              { rotate: isDropDown ? '180deg' : '0deg' },
                            ],
                          }}
                        >
                          <DownArrowIcon width={SIZE(35)} height={SIZE(35)} />
                        </View>
                      </TouchableOpacity>
                      {error.branchErr && (
                        <Text style={styles.errorText}>
                          *Please select a branch
                        </Text>
                      )}
                    </KeyboardAvoidingView>

                    <Modal
                      visible={isDropDown}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => {
                        setDropDown(false);
                        setSearchQuery('');
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => {
                          getAgency();
                          setDropDown(false);
                          setSearchQuery('');
                          setError(prev => ({ ...prev, agancyErr: false }));
                          Keyboard.dismiss();
                        }}
                      >
                        <View style={styles.modalOverlay}>
                          <KeyboardAvoidingView
                            behavior={
                              Platform.OS === 'ios' ? 'padding' : 'height'
                            }
                            style={styles.dropdownContainer}
                          >
                            <TextInput
                              style={styles.searchInput}
                              placeholder="Search Branch..."
                              placeholderTextColor={'#2C436433'}
                              value={searchQuery}
                              onChangeText={setSearchQuery}
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
                                    onPress={() =>
                                      handleBranchSelect(item?.branch_name)
                                    }
                                  >
                                    <Text style={styles.optionText}>
                                      {console.log(
                                        item?.branch_name,
                                        'item?.branch_nameitem?.branch_nameitem?.branch_name',
                                      )}
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
                  </>
                )}

                {settings?.['Agency Management'] && (
                  <>
                    <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                      style={{ zIndex: 10 }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        hitSlop={10}
                        onPress={() => {
                          setAgencyDropDown(!agencyDropDown);
                          setAgencySearch('');
                          setAgencyErr(false);
                        }}
                        style={styles.inputContainer}
                      >
                        <ProfileIcon
                          width={SIZE(20)}
                          height={SIZE(20)}
                          style={{ marginRight: SIZE(10) }}
                        />

                        <View
                          style={{ width: '80%', justifyContent: 'center' }}
                        >
                          <Text style={styles.uerNameText}>Agency Name</Text>
                          <Text
                            style={{
                              marginTop: SIZE(5),
                              fontSize: SIZE(14),
                              lineHeight: SIZE(16),
                              color: input.agancy ? '#000000' : '#2C436433',
                            }}
                          >
                            {input.agancy || 'Select agency'}
                          </Text>
                        </View>

                        <View
                          style={{
                            transform: [
                              { rotate: agencyDropDown ? '180deg' : '0deg' },
                            ],
                          }}
                        >
                          <DownArrowIcon width={SIZE(35)} height={SIZE(35)} />
                        </View>
                      </TouchableOpacity>

                      {error.agancyErr && (
                        <Text style={styles.errorText}>
                          *Please select an agency
                        </Text>
                      )}
                    </KeyboardAvoidingView>

                    {/* MODAL */}
                    <Modal
                      visible={agencyDropDown}
                      transparent={true}
                      animationType="fade"
                      onRequestClose={() => {
                        setAgencyDropDown(false);
                        setAgencySearch('');
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setAgencyDropDown(false);
                          setAgencySearch('');
                          Keyboard.dismiss();
                        }}
                      >
                        <View style={styles.modalOverlay}>
                          <KeyboardAvoidingView
                            behavior={
                              Platform.OS === 'ios' ? 'padding' : 'height'
                            }
                            style={styles.dropdownContainer}
                          >
                            <TextInput
                              style={styles.searchInput}
                              placeholder="Search Agency..."
                              placeholderTextColor={'#2C436433'}
                              value={agencySearch}
                              onChangeText={setAgencySearch}
                              autoFocus={true}
                            />

                            <ScrollView
                              nestedScrollEnabled={true}
                              style={styles.optionList}
                              showsVerticalScrollIndicator={true}
                              contentContainerStyle={styles.scrollContent}
                            >
                              {agencyFlter.length > 0 ? (
                                agencyFlter.map((item, index) => (
                                  <TouchableOpacity
                                    key={index}
                                    style={styles.optionItem}
                                    onPress={() =>
                                      handleAgencySelect(item?.agent_name)
                                    }
                                  >
                                    <Text style={styles.optionText}>
                                      {item?.agent_name}
                                    </Text>
                                  </TouchableOpacity>
                                ))
                              ) : (
                                <Text style={styles.noResultsText}>
                                  No agencies found
                                </Text>
                              )}
                            </ScrollView>
                          </KeyboardAvoidingView>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  </>
                )}

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
                    <Text style={styles.uerNameText}>
                      Employee Email / Name
                    </Text>
                    <TextInput
                      ref={inputRef1}
                      style={{
                        fontSize: SIZE(14),
                        lineHeight: SIZE(16),
                        color: '#000000',
                      }}
                      inputMode="email"
                      placeholderTextColor={'#2C436433'}
                      value={input.username}
                      placeholder="Enter Email or Name"
                      onChangeText={text => handleChange('username', text)}
                    />
                  </View>
                </TouchableOpacity>
                {error.usernameErr && (
                  <Text style={styles.errorText}>*Please enter name</Text>
                )}
                {console.log(isEdit, 'isEditisEdit')}

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
                  <View style={{ width: '80%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Employee Code</Text>
                    <TextInput
                      editable={!isEdit}
                      ref={inputRef2}
                      style={{
                        fontSize: SIZE(14),
                        lineHeight: SIZE(16),
                        color: '#000000',
                      }}
                      placeholderTextColor={'#2C436433'}
                      value={input.password}
                      placeholder="Enter Code"
                      onChangeText={text => handleChange('password', text)}
                    />
                  </View>
                  {!isEdit && (
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: '#153CD8',
                        borderRadius: SIZE(20),
                        width: SIZE(40),
                        height: SIZE(20),
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                      }}
                      onPress={() => {
                        generateCode();
                      }}
                      activeOpacity={0.8}
                      hitSlop={10}
                    >
                      {isGenerateLoader ? (
                        <ActivityIndicator size={'small'} />
                      ) : (
                        <Text
                          style={{
                            fontSize: SIZE(10),
                            color: '#153CD8',
                            lineHeight: SIZE(12),
                            fontFamily: Fonts.Regular,
                          }}
                        >
                          auto
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {error.passwordErr && (
                  <Text style={styles.errorText}>*Please enter code</Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </KeyboardAwareScrollView>

      <View
        style={[styles.bottomButtonContainer, { paddingBottom: insets.bottom }]}
      >
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
              style={{
                ...styles.buttonCont,
                backgroundColor: '#153CD8',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {loader && <ActivityIndicator size={'small'} color={'#ffffff'} />}
              <Text
                style={{
                  ...styles.buttonTxt,
                  color: '#FFFFFF',
                  marginLeft: SIZE(5),
                }}
              >
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CommonButton
            loader={loader}
            backgroundColor={'#153CD8'}
            title={'Next'}
            onPress={() => {
              //  NavigateAdminScan();

              // setError(newError);

              isAdmin && settings['Individual Login']
                ? AddEmployees()
                : NavigateAdminScan();

              Keyboard.dismiss();
              setLogOut(false);
            }}
            color={'#FFFFFF'}
          />
        )}
      </View>
    </View>
  );
}

// Your original styles — 100% unchanged
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  contentContainer: { width: '100%' },
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
  logoutButtonWrapper: {
    position: 'relative',
    zIndex: 50,
  },

  logOutContainer: {
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
  logContaienr: {
    flexDirection: 'row',
    height: SIZE(40),
    borderColor: '#1C54D7',
    borderWidth: 1,
    borderRadius: SIZE(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZE(15),
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
    backgroundColor:'#ffffff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: SIZE(400),
    backgroundColor: '#FFF',
    borderRadius: SIZE(20),
    padding: SIZE(10),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollContent: { paddingBottom: SIZE(20) },
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
  optionList: { maxHeight: SIZE(350) },
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
