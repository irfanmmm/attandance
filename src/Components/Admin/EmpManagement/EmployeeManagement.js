import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity,
  Keyboard,
  TextInput,
  ScrollView,
  Modal,
  BackHandler,
} from 'react-native';
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import { Context } from '../../Redux/Store';
import Log from '../../../assets/svg/log.svg';
import Search from '../../../assets/svg/search.svg';
import IsCheckIcon from '../../../assets/svg/isCheck.svg';
import EmpIcon from '../../../assets/svg/empIcon.svg';
import EditIcon from '../../../assets/svg/edit.svg';
import DeleteIcon from '../../../assets/svg/delete.svg';
import { BASE_URL } from '../../utils/urls';
import { useFocusEffect } from '@react-navigation/native';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { storage } from '../../utils/Storage';

export default function EmployeeManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const code = state?.userData?.company_code;
  const { fetchData } = useAxios();
    const toast = useToast();
  

  console.log(code, 'ddd');

  const inputRef = useRef(null);

  const [isLogOut, setLogOut] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [input, setInput] = useState('');
  const [isModal, setModal] = useState(false);
  const [selectedData, setSelectedData] = useState([]);

  const handleSearch = text => {
    setInput(text);

    if (text.trim() === '') {
      // Show all data when search is empty
      setFilteredData(data);
    } else {
      // Filter data based on search query
      const filtered = data.filter(item => {
        const fullname = item?.fullname?.toLowerCase() || '';
        const employeeCode = item?.employee_code?.toLowerCase() || '';
        const branch = item?.branch?.toLowerCase() || '';
        const searchText = text.toLowerCase();

        return (
          fullname.includes(searchText) ||
          employeeCode.includes(searchText) ||
          branch.includes(searchText)
        );
      });
      setFilteredData(filtered);
    }
  };

  const getEmpDetails = async date => {
    try {
      // const response = await fetch(`${BASE_URL}all-employees`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     compony_code: code,
      //     // date: formatDateForAPI(date),
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error(
      //     'Authentication failed. Please check your credentials.',
      //   );
      // }

      // const data = await response.json();
      // console.log(data.data, 'response');

      const data = await fetchData({
        url: 'all-employees',
        // method: 'POST',
        // data: {
        //   date: formatDateForAPI(startDate),
        // },
      });
      console.log(data, 'datadatadatadata');

      if (data?.message === 'success') {
        setFilteredData(data?.data);
        console.log(data?.data, 'data?.datadata?.datadata?.datadata?.data');

        // setData(data?.data);
      } else {
      }
    } catch (err) {
      // setData([]);
      setFilteredData([]);
      console.log('Authentication error:', err?.message);
    }
  };



  const deleteEmployee = async () => {


    try {
      const formData = new FormData();
      formData.append('compony_code', code);
      const editableDetails = JSON.stringify([
        {
          employee_id: selectedData?.employee_code,
          action: 'D',
          full_name: selectedData?.fullname,
          branch: selectedData?.branch,
        },
      ]);

      formData.append('editable_details', editableDetails);
      console.log(formData);

      const data = await fetchData({
        url: 'edit-user',
        method: 'POST',
        data: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
      });

      // const response = await fetch(`${BASE_URL}edit-user`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   body: formData,
      // });

      // if (!response.ok) {
      //   throw new Error(
      //     'Authentication failed. Please check your credentials.',,
      //   );
      // }
      // const data = await response.json();
      console.log(data, 'deleteem----------------------ol');

      if (data?.message === 'success') {    
        toast.show('Successfully Deleted', {
          type: 'danger',
          duration: 2500,
        });

        // setData(data?.data);
        getEmpDetails();
      } else {
        toast.show(data?.message||'Somethin went wrong', {
         type: 'danger',
          duration: 2000,
        });
        
      }
    } catch (err) {
          toast.show('Somethin went wrong', {
         type: 'danger',
          duration: 2000,
        });
      // setData([]);
      console.log('dhdhdh', err);

      console.log('Authentication error:', err?.message);
    }
  };

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

  useFocusEffect(
    useCallback(() => {
      getEmpDetails();
    }, []),
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setLogOut(false);
        Keyboard.dismiss();
      }}
    >
      <View style={styles.container}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 0 }}
          colors={['#022E95', '#4B87EE']}
          style={{ ...styles.topContainer }}
        >
          <View
            style={{
              ...styles.topMidContainer,
              paddingTop: insets.top + SIZE(20),
            }}
          >
            <View style={styles.topLeftContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                hitSlop={8}
                onPress={() => {
                  navigation.navigate('EmpManagement');
                }}
              >
                <BackIcon width={SIZE(24)} height={SIZE(24)} />
              </TouchableOpacity>
              <View style={{ marginLeft: SIZE(12) }}>
                <Text style={styles.titleText}>Employee Management</Text>
                <Text style={styles.subTxt}>Manage employee details.</Text>
              </View>
            </View>
            <View>
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
                                                    },
                                                  });
                                                  storage.clearAll();
                        // dispatch({
                        //   type: 'UPDATE_USER_DATA',
                        //   userData: {
                        //     ...state.userData,
                        //     is_logged: false,
                        //   },
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
        </LinearGradient>
        <View style={styles.contentContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={8}
            onPress={() => {
              inputRef.current?.focus();
              setLogOut(false);
            }}
            style={styles.searchContainer}
          >
            <Search width={SIZE(24)} height={SIZE(24)} />
            <TextInput
              onPress={() => setLogOut(false)}
              style={styles.input}
              ref={inputRef}
              value={input}
              placeholder="Search Employee"
              placeholderTextColor={'#2C43644D'}
              onChangeText={handleSearch}
            />
          </TouchableOpacity>
          {/* <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}> */}
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: '#FFFFFF',
            }}
          >
            {filteredData?.length > 0 ? (
              filteredData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tabContainer}
                  activeOpacity={1}
                  hitSlop={5}
                  onPress={() => {
                    Keyboard.dismiss();
                    setLogOut(false);
                  }}
                >
                  <View style={styles.tabLeft}>
                    <EmpIcon width={SIZE(44)} height={SIZE(44)} />
                    <View style={styles.content}>
                      <Text style={styles.empName}>{item?.fullname}</Text>
                      <Text style={styles.empId}>{item?.employee_code}</Text>
                    </View>
                  </View>
                  <View style={styles.tabRight}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('AddEmployee', {
                          isEdit: true,
                          selectedData: item,
                        });
                      }}
                      activeOpacity={0.8}
                      hitSlop={8}
                    >
                      <EditIcon width={SIZE(22)} height={SIZE(22)} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setModal(true);
                        setSelectedData(item);
                      }}
                      activeOpacity={0.8}
                      hitSlop={8}
                    >
                      <DeleteIcon width={SIZE(22)} height={SIZE(22)} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', marginTop: SIZE(50) }}>
                <Text style={{ fontSize: SIZE(16), color: '#484848' }}>
                  No records found
                </Text>
              </View>
            )}
          </ScrollView>
          {/* </View> */}
        </View>

        {/* Modal - Moved outside ScrollView */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isModal}
          onRequestClose={() => {
            setModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.title}>Delete Employee</Text>
                <Text style={styles.subText}>
                  Are you sure you want to delete 'John Deo - EMP001'?
                </Text>
              </View>
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.modalControll}
                  activeOpacity={0.8}
                  onPress={() => setModal(false)}
                >
                  <Text style={{ ...styles.dltText, color: '#000000' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    ...styles.modalControll,
                    backgroundColor: '#FFF0F0',
                    borderColor: '#FFF0F0',
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Add your delete logic here
                    console.log('Employee deleted');
                    deleteEmployee();
                    setModal(false);
                  }}
                >
                  <Text style={styles.dltText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topContainer: {
    // height: SIZE(150),
    // paddingHorizontal: SIZE(20),
    // alignItems: 'center',
  },
  topMidContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: SIZE(20),
    marginBottom: SIZE(25),
  },
  topLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleText: {
    fontSize: SIZE(22),
    lineHeight: SIZE(24),
    fontFamily: Fonts.Medium,
    color: '#FFFFFF',
  },
  subTxt: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    fontFamily: Fonts.Regular,
    color: '#FFFFFF',
    marginTop: SIZE(6),
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
  contentContainer: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    paddingVertical: SIZE(20),
    paddingHorizontal: SIZE(20),
  },
  searchContainer: {
    height: SIZE(50),
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZE(16),
    marginBottom: SIZE(20),
    backgroundColor: '#FFFFFF',
  },
  input: {
    color: '#000000',
    flex: 1,
    marginLeft: SIZE(10),
    fontSize: SIZE(14),
    padding: 0,
  },
  tabContainer: {
    height: SIZE(80),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.9,
    borderColor: '#E1E1E1',
  },
  tabLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    width: SIZE(20),
    height: SIZE(20),
    borderWidth: 1,
    borderRadius: SIZE(4),
  },
  content: {
    marginLeft: SIZE(12),
  },
  empName: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    color: '#000000',
    width: SIZE(200),
  },
  empId: {
    color: '#6C6C6C',
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    marginTop: SIZE(5),
  },
  tabRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZE(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SIZE(350),
    backgroundColor: '#FFFFFF',
    borderRadius: SIZE(30),
    padding: SIZE(30),
    paddingBottom: SIZE(20),
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContent: {
    marginBottom: SIZE(24),
  },
  title: {
    fontSize: SIZE(18),
    lineHeight: SIZE(24),
    fontFamily: Fonts.Semibold,
    color: '#000000',
    marginBottom: SIZE(12),
    textAlign: 'center',
  },
  subText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: '#000000',
    textAlign: 'center',
  },
  buttonWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZE(15),
  },
  modalControll: {
    flex: 1,
    height: SIZE(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#787878',
    backgroundColor: '#FFFFFF',
    borderRadius: SIZE(30),
  },
  dltText: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    color: '#990404',
  },
});
