import {
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  FlatList,
  ScrollView,
  BackHandler,
} from 'react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { Fonts, SIZE, SIZES } from '../../utils/Styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/svg/back.svg';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import Search from '../../../assets/svg/search.svg';
import CalanderIcon from '../../../assets/svg/calander.svg';
import DatePicker from 'react-native-date-picker';
import { Context } from '../../Redux/Store';
import { BASE_URL } from '../../utils/urls';
import EmpIcon from '../../../assets/svg/empIcon.svg';
import IsCheckIcon from '../../../assets/svg/isCheck.svg';
import CommonButton from '../../CommonButton';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { storage } from '../../utils/Storage';

const TYPE_LEAVES = {
  Present: 'P',
  'Paid Leave': 'PL',
  'Unpaid Leave': 'UL',
  Holiday: 'H',
};

const leaveTypeTabs = [
  {
    type: 'Present',
    color: '#019112',
    borderColor: '#A8ECB2',
    id: 1,
  },
  {
    type: 'Paid Leave',
    color: '#082A9C',
    borderColor: '#DEE9FC',
    id: 2,
  },
  {
    type: 'Unpaid Leave',
    color: '#9A6003',
    borderColor: '#FDF9C9',
    id: 3,
  },
  {
    type: 'Holiday',
    color: '#760000',
    borderColor: '#FBE2E2',
    id: 4,
  },
];

export default function Attendance({ navigation }) {
  const insets = useSafeAreaInsets();

  const { fetchData } = useAxios();

  const inputRef = useRef(null);
  const today = new Date();
  const [isLogOut, setLogOut] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

  const [input, setInput] = useState('');
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(new Date());

  const [selectedTab, setSelectedTab] = useState('');

  const { state, dispatch } = useContext(Context);
  const code = state?.userData?.company_code;
    const toast = useToast();

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
      backHandler.remove(); // Cleanup when the component unmounts
    };
  }, [navigation]);

  const getEmpDetails = async date => {
    try {
      // const response = await fetch(`${BASE_URL}attandance-report-all`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     compony_code: code,
      //     date: formatDateForAPI(date),
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
        url: 'attandance-report-all',
        method: 'POST',
        data: {
          date: formatDateForAPI(startDate),
        },
      });

      if (data?.message === 'success') {
        setFilteredData(
          data?.data.map(v => ({
            ...v,
            currentLeaveType: v?.present,
            isSelected: false,
          })),
        );

        setData(data?.data);
      } else {
      }
    } catch (err) {
      setData([]);
      setFilteredData([]);
      console.log('Authentication error:', err?.message);
    }
  };

  console.log(filteredData, 'filteredData');

  const formatDateForAPI = date => {
    const year = date?.getFullYear();
    const month = String(date?.getMonth() + 1).padStart(2, '0');
    const day = String(date?.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = date => {
    return date?.toLocaleDateString('en-GB');
  };

  const handleBulkLeaveTypeSelection = leaveType => {
    setFilteredData(prev =>
      prev.map(item => {
        item.present = TYPE_LEAVES[leaveType];
        item.isEdited = item.present !== item.currentLeaveType;
        return item;
      }),
    );
  };

  const handleSearch = text => {
    setInput(text);

    if (text.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data?.filter(item => {
        const fullname = item?.fullname?.toLowerCase() || '';
        const employeeCode = item?.employee_id?.toLowerCase() || '';
        const searchText = text?.toLowerCase();

        return (
          fullname?.includes(searchText) || employeeCode?.includes(searchText)
        );
      });
      setFilteredData(filtered);
    }
  };

  const handleSelectAll = () => {
    if (
      filteredData.filter(v => v.isSelected)?.length === filteredData.length
    ) {
      setFilteredData(
        filteredData.map(v => ({
          ...v,
          isSelected: false,
          isEdited: false,
          present: v.currentLeaveType,
        })),
      );
    } else {
      setFilteredData(filteredData.map(v => ({ ...v, isSelected: true })));
    }
  };

  const markAttendance = async () => {
    try {
      // const response = await fetch(`${BASE_URL}edit-attandance`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     compony_code: code,
      //     date: formatDateForAPI(startDate),
      //     // console.log(employeeLeaveTypes, 'employeeCode, leaveType');
      //     editable_details: filteredData
      //       .filter(i => i.isEdited)
      //       .map(i => ({ employee_id: i.employee_id, action: i.present })),
      //   }),
      // });
      // // [{'employee_id':'1','action':'P' | 'PL' | 'UL' | 'H'}]

      // if (!response.ok) {
      //   throw new Error(
      //     'Authentication failed. Please check your credentials.',
      //   );
      // }

      // const data = await response.json();

      const data = await fetchData({
        url: 'edit-attandance',
        method: 'POST',
        data: {
          date: formatDateForAPI(startDate),
          editable_details: filteredData
            .filter(i => i.isEdited)
            .map(i => ({ employee_id: i.employee_id, action: i.present })),
        },
      });

      console.log(data, 'responsejffjfjfj');
      if (data?.message === 'success') {
              toast.show('Successfully marked attendance.', { type: 'success', duration: 2000 });
        getEmpDetails(startDate);

        setEmployeeLeaveTypes({});

        // setFilteredData(data?.data);
        // setData(data?.data);
      } else {
            toast.show('Something went wrong ', { type: 'danger', duration: 2000 });
      }
    } catch (err) {
      // setData([]);
      // setFilteredData([]);
      console.log('Authentication error:', err?.message);
    }
  };

  useEffect(() => {
    getEmpDetails(startDate);
    // markAttendance()
  }, []);

  console.log(filteredData, 'filteredData');

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
                <Text style={styles.titleText}>Attendance </Text>
                <Text style={styles.subTxt}>Mark attendance and leaves.</Text>
              </View>
            </View>
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
          </View>
        </LinearGradient>
        <View style={styles.bottomContainer}>
          <View style={styles.bottomTopContainer}>
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
            <TouchableOpacity
              onPress={() => {
                setShowStartDatePicker(true);
              }}
              style={styles.left}
            >
              <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
              <Text style={styles.dateTxt}>
                {formatDateForDisplay(startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {filteredData.find(v => v.isSelected) && (
            <View style={styles.middContainer}>
              <View style={styles.middleContainer}>
                <Text style={styles.BullkText}>
                  Bulk action for{' '}
                  {filteredData.filter(v => v.isSelected)?.length} employee
                  {filteredData.find(v => v.isSelected) ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={handleSelectAll}>
                  <Text style={styles.selctText}>
                    {filteredData.filter(v => v.isSelected)?.length ===
                    filteredData.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={leaveTypeTabs}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  marginTop: SIZE(20),
                  marginLeft: SIZE(20),
                  paddingRight: SIZE(20),
                }}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      handleBulkLeaveTypeSelection(item.type);
                      setSelectedTab(item?.type);
                    }}
                    style={{
                      ...styles.leaveTypeTab,
                      backgroundColor:
                        item?.type === selectedTab
                          ? item?.color
                          : item?.borderColor,
                      borderColor: item?.borderColor,
                    }}
                  >
                    <Text
                      style={{
                        ...styles.tabText,
                        color:
                          item?.type === selectedTab ? '#FFFFFF' : item?.color,
                      }}
                    >
                      {item?.type}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SIZE(20),
                paddingBottom: SIZE(20),
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
                      <TouchableOpacity
                        style={{ marginRight: SIZE(15) }}
                        onPress={() => {
                          console.log(filteredData);
                          setFilteredData(prev =>
                            prev.map(i => {
                              return i.employee_id === item.employee_id
                                ? {
                                    ...i,
                                    present: i?.isSelected
                                      ? i.currentLeaveType
                                      : i.present,
                                    isEdited: false,
                                    isSelected: !i.isSelected,
                                  }
                                : i;
                            }),
                          );
                          // toggleEmployeeSelection(item?.employee_id);
                        }}
                      >
                        {item?.isSelected ? (
                          <IsCheckIcon width={SIZE(20)} height={SIZE(20)} />
                        ) : (
                          <View style={styles.checkBox} />
                        )}
                      </TouchableOpacity>
                      <EmpIcon width={SIZE(44)} height={SIZE(44)} />
                      <View style={styles.content}>
                        <Text style={styles.empName}>{item?.fullname}</Text>
                        <Text style={styles.empId}>{item?.employee_id}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      {leaveTypeTabs.map((tab, idx) => {
                        // const isSelected = employeeLeaveTypes[item.employee_id] === tab.type
                        const apiLeaveType =
                          item?.present === 'P'
                            ? 'Present'
                            : item?.present === 'PL'
                            ? 'Paid Leave'
                            : item?.present === 'UL'
                            ? 'Unpaid Leave'
                            : item?.present === 'H'
                            ? 'Holiday'
                            : null;

                        const isSelected =
                          item?.present === TYPE_LEAVES[tab?.type];

                        return (
                          <TouchableOpacity
                            disabled={!item?.isSelected}
                            key={tab.id}
                            onPress={() => {
                              // setLeaveTypeTabs(prev => [
                              //   ...prev.map(t =>
                              //     t.type === tab.type
                              //       ? { ...t, isActive: true }
                              //       : { ...t, isActive: false },
                              //   ),
                              // ]);
                              setFilteredData(prev =>
                                prev.map(i => {
                                  return i.employee_id === item.employee_id
                                    ? {
                                        ...i,
                                        present: TYPE_LEAVES[tab?.type],
                                        isEdited:
                                          TYPE_LEAVES[tab?.type] ===
                                          item.currentLeaveType
                                            ? false
                                            : true,
                                      }
                                    : i;
                                }),
                              );
                              // handleIndividualLeaveType(
                              //   item?.employee_id,
                              //   tab?.type,
                              // );
                            }}
                            activeOpacity={0.5}
                            hitSlop={10}
                            style={{
                              ...styles.leaveTypeRound,
                              marginRight:
                                idx === leaveTypeTabs?.length - 1
                                  ? 0
                                  : SIZE(10),
                              backgroundColor: isSelected
                                ? tab?.color
                                : tab?.borderColor,
                            }}
                          >
                            <Text
                              style={{
                                ...styles.leaveTxt,
                                color: isSelected ? '#FFFFFF' : tab?.color,
                              }}
                            >
                              {TYPE_LEAVES[tab?.type]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
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
            {filteredData.filter(item => item.isEdited).length > 0 && (
              <View
                style={{
                  paddingHorizontal: SIZE(20),
                  paddingVertical: SIZE(20),
                }}
              >
                <View style={{ marginBottom: SIZE(30) }}>
                  <CommonButton
                    // arrow={true}
                    backgroundColor={'#153CD8'}
                    title={'Save Attendance'}
                    onPress={() => {
                      // handleLogin();
                      markAttendance();
                    }}
                    color={'#FFFFFF'}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
        <DatePicker
          mode="date"
          modal
          open={showStartDatePicker}
          date={startDate}
          onConfirm={date => {
            setShowStartDatePicker(false);
            setStartDate(date);
            getEmpDetails(date);
          }}
          onCancel={() => {
            setShowStartDatePicker(false);
          }}
          maximumDate={today}
        />
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
  },
  topMidContainer: {
    paddingHorizontal: SIZE(20),
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
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
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: SIZE(20),
    flex: 1,
  },
  bottomTopContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZE(20),
  },
  searchContainer: {
    flex: 1,
    height: SIZE(50),
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZE(16),
    marginRight: SIZE(10),
  },
  input: {
    color: '#000000',
    flex: 1,
    marginLeft: SIZE(10),
    fontSize: SIZE(14),
    padding: 0,
  },
  left: {
    borderWidth: 1,
    borderColor: '#B9BED5',
    height: SIZE(50),
    borderRadius: SIZE(40),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: SIZE(16),
    minWidth: SIZE(120),
  },
  dateTxt: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#484848',
    fontFamily: Fonts.Regular,
    marginLeft: SIZE(15),
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
  content: {
    marginLeft: SIZE(12),
  },
  empName: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    color: '#000000',
    width: SIZE(100),
  },
  empId: {
    color: '#6C6C6C',
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    marginTop: SIZE(5),
  },
  checkBox: {
    width: SIZE(20),
    height: SIZE(20),
    borderWidth: 1,
    borderRadius: SIZE(4),
  },
  BullkText: {
    color: '#000000',
    fontSize: SIZE(16),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Semibold,
  },
  middleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SIZE(20),
  },
  middContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: SIZE(20),
  },
  selctText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
    color: '#0073FF',
  },
  leaveTypeTab: {
    paddingVertical: SIZE(10),
    paddingHorizontal: SIZE(20),
    backgroundColor: '#019112',
    borderRadius: SIZE(100),
    borderWidth: 3,
    borderColor: '#A8ECB2',
    marginRight: SIZE(10),
  },
  tabText: {
    fontSize: SIZE(12),
    lineHeight: SIZE(14),
    fontFamily: Fonts.Regular,
  },
  leaveTypeRound: {
    width: SIZE(30),
    height: SIZE(30),
    borderRadius: SIZE(50),

    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveTxt: {
    fontSize: SIZE(12),
    lineHeight: SIZE(14),
    fontFamily: Fonts.Regular,
  },
});
