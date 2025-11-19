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
  ScrollView,
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
import DownArrowIcon from '../../../assets/svg/DownArrow1.svg';
import { useToast } from 'react-native-toast-notifications';

export default function AddAgency({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const toast = useToast();

  const code = state?.userData?.company_code;
  const inputRef1 = useRef(null);

  const [input, setInput] = useState({
    branch: '',
    agencyName: '',
  });
  const [data, setData] = useState([]); // branches
  const [error, setError] = useState({
    branchErr: false,
    agencyErr: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogOut, setLogOut] = useState(false);
  const [isDropDown, setDropDown] = useState(false);
  const [loader, setLoader] = useState(false);

  const handleChange = (name, value) => {
    setInput(prev => ({ ...prev, [name]: value }));
    setError(prev => ({ ...prev, [name === 'agencyName' ? 'agencyErr' : 'branchErr']: false }));
  };

  const filteredData = data?.filter(item =>
    item?.branch_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBranchSelect = (branch) => {
    setInput(prev => ({ ...prev, branch }));
    setError(prev => ({ ...prev, branchErr: false }));
    setDropDown(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  // Fetch branches
  const getBranch = async () => {
    try {
      const response = await fetch(`${API_URL}get-branch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compony_code: code }),
      });

      const res = await response.json();
      if (res?.message === 'success') {
        setData(res?.details || []);
      } else {
        toast.show('Failed to load branches', { type: 'danger' });
      }
    } catch (err) {
      toast.show('Network error', { type: 'danger' });
      console.log('getBranch error:', err);
    }
  };

  // Submit Agency
  const handleSubmit = async () => {
    const newError = {
      branchErr: !input.branch.trim(),
      agencyErr: !input.agencyName.trim(),
    };

    if (newError.branchErr || newError.agencyErr) {
      setError(newError);
      return;
    }

    setLoader(true);
    try {
      const response = await fetch(`${API_URL}add-agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compony_code: code,
          branch_name: input.branch,
          agency_name: input.agencyName,
        }),
      });

      const data = await response.json();
      if (data?.message === 'success') {
        toast.show('Agency added successfully', { type: 'success' });
        navigation.navigate('EmpManagement'); // or your desired screen
      } else {
        toast.show(data?.message || 'Failed to add agency', { type: 'danger' });
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger' });
      console.log('add-agency error:', err);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    getBranch();
  }, []);

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
        bounces={false}
        extraScrollHeight={Platform.OS === 'ios' ? 100 : 50}
      >
        <TouchableWithoutFeedback onPress={() => { setLogOut(false); Keyboard.dismiss(); }}>
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
                    hitSlop={5}
                    onPress={() => navigation.navigate('EmpManagement')}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>
                  <Text style={styles.titleText}>Add Agency</Text>
                </View>

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
                      activeOpacity={0.8}
                      onPress={() => {
                        dispatch({
                          type: 'UPDATE_USER_DATA',
                          userData: { ...state.userData, is_logged: false },
                        });
                      }}
                      style={styles.logContaienr}
                    >
                      <Log width={SIZE(16)} height={SIZE(16)} />
                      <Text style={{ color: '#1C54D7', fontSize: SIZE(14), marginLeft: SIZE(5) }}>
                        Logout
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Form */}
            <TouchableWithoutFeedback onPress={() => { setLogOut(false); Keyboard.dismiss(); }}>
              <View style={styles.bottomContainer}>
                <View style={styles.contentContainer}>
                  <Text style={styles.employyText}>Agency Info</Text>
                  <Text style={styles.subText}>
                    Select branch and enter agency name below.
                  </Text>
                </View>

                {/* Branch Dropdown */}
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
                  <ProfileIcon width={SIZE(20)} height={SIZE(20)} style={{ marginRight: SIZE(10) }} />
                  <View style={{ width: '80%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Select Branch</Text>
                    <Text style={{
                      marginTop: SIZE(5),
                      fontSize: SIZE(14),
                      lineHeight: SIZE(16),
                      color: input.branch ? '#000000' : '#2C436433',
                    }}>
                      {input.branch || 'Choose branch'}
                    </Text>
                  </View>
                  <View style={{ transform: [{ rotate: isDropDown ? '180deg' : '0deg' }] }}>
                    <DownArrowIcon width={SIZE(35)} height={SIZE(35)} />
                  </View>
                </TouchableOpacity>
                {error.branchErr && <Text style={styles.errorText}>*Please select a branch</Text>}

                {/* Agency Name Input */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={10}
                  onPress={() => {
                    inputRef1.current?.focus();
                    setError(prev => ({ ...prev, agencyErr: false }));
                  }}
                  style={[styles.inputContainer, { marginTop: SIZE(16) }]}
                >
                  <ProfileIcon width={SIZE(20)} height={SIZE(20)} style={{ marginRight: SIZE(10) }} />
                  <View style={{ width: '90%', justifyContent: 'center' }}>
                    <Text style={styles.uerNameText}>Agency Name</Text>
                    <TextInput
                      ref={inputRef1}
                      style={{ fontSize: SIZE(14), lineHeight: SIZE(16), color: '#000000' }}
                      placeholder="Enter agency name"
                      placeholderTextColor={'#2C436433'}
                      value={input.agencyName}
                      onChangeText={text => handleChange('agencyName', text)}
                    />
                  </View>
                </TouchableOpacity>
                {error.agencyErr && <Text style={styles.errorText}>*Please enter agency name</Text>}

                {/* Dropdown Modal */}
                <Modal visible={isDropDown} transparent animationType="fade">
                  <TouchableWithoutFeedback onPress={() => { setDropDown(false); setSearchQuery(''); }}>
                    <View style={styles.modalOverlay}>
                      <View style={styles.dropdownContainer}>
                        <TextInput
                          style={styles.searchInput}
                          placeholder="Search branch..."
                          placeholderTextColor={'#2C436433'}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoFocus
                        />
                        <ScrollView style={styles.optionList} contentContainerStyle={styles.scrollContent}>
                          {filteredData.length > 0 ? (
                            filteredData.map((item, i) => (
                              <TouchableOpacity
                                key={i}
                                style={styles.optionItem}
                                onPress={() => handleBranchSelect(item.branch_name)}
                              >
                                <Text style={styles.optionText}>{item.branch_name}</Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <Text style={styles.noResultsText}>No branches found</Text>
                          )}
                        </ScrollView>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            </TouchableWithoutFeedback>
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

// Styles (same as AddBranch / AddEmployee)
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
    shadowOffset: { width: 0, height: 2 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  searchInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    padding: SIZE(10),
    fontSize: SIZE(14),
    color: '#000',
  },
  optionList: { maxHeight: SIZE(350) },
  scrollContent: { paddingBottom: SIZE(20) },
  optionItem: { padding: SIZE(10), borderBottomWidth: 1, borderBottomColor: '#E1E1E5' },
  optionText: { fontFamily: Fonts.Regular, fontSize: SIZE(16), color: '#000' },
  noResultsText: { textAlign: 'center', padding: SIZE(10), color: '#666' },
});