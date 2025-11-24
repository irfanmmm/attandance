import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
  Platform,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Context } from '../../Redux/Store';
import { BASE_URL } from '../../utils/urls';
import { Fonts, SIZE } from '../../utils/Styles';
import BackArrow from '../../../assets/svg/blackArrow.svg';
import DownloadIcon from '../../../assets/svg/downArrow.svg';
import Profile from '../../../assets/svg/empIcon.svg';
import CalanderIcon from '../../../assets/svg/calander.svg';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import DatePicker from 'react-native-date-picker';
import { useAxios } from '../../utils/useAxios';

export default function SingleEmployeeReport({ route, navigation }) {
  const { empCode, empName,isNewScan } = route?.params || {};

  //   const empCode = '0002';
  const { state } = useContext(Context);
  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [data, setData] = useState([]);
  const insets = useSafeAreaInsets();
  const [isFilter, setFilter] = useState(false);
  const code = state.userData.company_code;

  const {fetchData}=useAxios()

  // Format date for API (YYYY-MM-DD)
  //   const formatDateForAPI = date => {
  //     return date.toISOString().split('T')[0]; // e.g., '2025-10-01'
  //   };




     useEffect(() => {
        const backAction = () => {
          // Navigate to the login page
          isNewScan?navigation.navigate('NewScan'):navigation.navigate('ReportSingleView')
        //   navigation.navigate('Report'); // Replace 'Login' with your login screen name
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



  const formatDateForAPI = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = date => {
    return date.toLocaleDateString('en-GB');
  };

  const getReport = async (startDate, endDate) => {
    try {

        
    //   const response = await fetch(`${BASE_URL}attandance-report`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       compony_code: code,
    //       employee_code: empCode,
    //       starting_date: formatDateForAPI(startDate),
    //       ending_date: formatDateForAPI(endDate),
    //     }),
    //   });

            const res = await fetchData({
        url: 'attandance-report',
        method: 'POST',
        data: {
        compony_code: code,
        employee_code: empCode,
        starting_date: formatDateForAPI(startDate),
        ending_date: formatDateForAPI(endDate),
        },
      });

      if (!response.ok) {
        throw new Error(
          'Authentication failed. Please check your credentials.',
        );
      }

      const responseData = await response.json();
      if (responseData?.message === 'success') {
        console.log(responseData?.data, 'responseData?.data');

        setData(responseData?.data || []);
      } else {
        setData([]);
      }
    } catch (err) {
      console.log('Authentication error:', err.message);
      // Optionally show an alert to the user
      // Alert.alert('Error', 'Failed to fetch report. Please try again.');
    }
  };

  useEffect(() => {
    getReport(startDate, endDate);
  }, []);

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      setShowStartDatePicker(false);
    }

    console.log(event, 'eventevent');
    console.log(selectedDate, 'selectedDate');

    if (selectedDate) {
      setFilter(true);
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      setShowEndDatePicker(false);
    }

    console.log(event, 'eventevent');

    if (selectedDate) {
      console.log('fhfhfhfhfh');

      setFilter(true);
      setEndDate(selectedDate);
    }
  };

  // Create new functions for opening pickers:

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <View style={{ flex: 1, backgroundColor: '#F6F8FF' }}>
        <View
          style={{
            ...styles.headerContainer,
            paddingTop: insets.top + SIZE(20),
          }}
        >
          <View style={styles.leftContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={8}
              onPress={() =>    {
                     isNewScan?navigation.navigate('NewScan'):navigation.navigate('ReportSingleView')
              }}
            >
              <BackArrow width={SIZE(24)} height={SIZE(24)} />
            </TouchableOpacity>
            <View style={styles.profileContent}>
              <Profile width={SIZE(44)} height={SIZE(44)} />
              <View style={styles.proTextCont}>
                <Text style={styles.nameTxt}>{empName}</Text>
                <Text style={styles.empId}>{empCode}</Text>
              </View>
            </View>
          </View>
          {/* <DownloadIcon width={SIZE(24)} height={SIZE(24)} /> */}
        </View>

        <View style={styles.topContainer}>
          <View style={styles.dateContainer}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: SIZE(16),
              }}
            >
              <View>
                <Text style={styles.fromText}>From date</Text>
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

              <View>
                <Text style={styles.fromText}>To date</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEndDatePicker(true);
                  }}
                  style={styles.left}
                >
                  <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
                  <Text style={styles.dateTxt}>
                    {formatDateForDisplay(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={8}
              disabled={!isFilter}
              style={{
                ...styles.filterButton,
                backgroundColor: isFilter ? '#153CD8' : '#ffffff',
                borderWidth: isFilter ? 0 : 1,
              }}
              onPress={async () => {
                if (isFilter) {
                  await getReport(startDate, endDate);
                  setFilter(false);
                }
              }}
            >
              <Text
                style={{
                  ...styles.filterTxt,
                  color: isFilter ? '#FFFFFF' : '#000000',
                }}
              >
                Apply Filter
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleTxt}>Date</Text>
            <View style={{ width: SIZE(100) }}>
              <Text style={styles.titleTxt}>Status</Text>
            </View>
          </View>
          <FlatList
            showsVerticalScrollIndicator={false}
            data={data}
            keyExtractor={(item, index) => index.toString()}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.reportContainer}>
                <Text style={styles.dateTxts}>
                  {new Date(item.date).toLocaleDateString('en-GB')}
                </Text>
                <View style={{ width: SIZE(100) }}>
                  <Text
                    style={{
                      ...styles.attText,
                      color:
                        item?.present === 'P'
                          ? '#009113'
                          : item?.present === 'L'
                          ? '#BA7403'
                          : item?.present === 'H'
                          ? '#D00000'
                          : item?.present === 'PL'
                          ? '#0E61D4'
                          : '#000000',
                    }}
                  >
                    {item?.present === 'P'
                      ? 'Present'
                      : item?.present === 'L'
                      ? 'Unpaid Leave'
                      : item?.present === 'H'
                      ? 'Holiday'
                      : item?.present === 'PL'
                      ? 'Paid Leave'
                      : 'Unknown'}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      </View>
      {/* {showStartDatePicker && ( */}
      {/* // <RNDateTimePicker
        //   style={{alignSelf:'center'}}
        //   accentColor='black'
        //   themeVariant="light"
        //   locale="es-ES"
        //   value={startDate}
        //   mode="date"
        //   display={'default'}
        //   onChange={onStartDateChange}
        //   maximumDate={endDate}
          
          
        /> */}
      {console.log(
        startDate,
        'const { fullname, employeecode } = route.params || {}; ',
      )}

      <DatePicker
        mode="date"
        modal
        open={showStartDatePicker}
        date={startDate}
        onConfirm={date => {
          setShowStartDatePicker(false);
          setStartDate(date);
          setFilter(true);
        }}
        onCancel={() => {
          setShowStartDatePicker(false);
        }}
        maximumDate={endDate}
      />
      {/* )} */}
      {/* {showEndDatePicker && (
        <RNDateTimePicker
          value={endDate}
          themeVariant="light"
          locale="es-ES"
          mode="date"
          display={'spinner'}
          onChange={onEndDateChange}
          minimumDate={startDate}
          maximumDate={new Date()}
        /> */}
      <DatePicker
        mode="date"
        modal
        open={showEndDatePicker}
        date={endDate}
        onConfirm={date => {
          setShowEndDatePicker(false);
          setEndDate(date);
          setFilter(true);
        }}
        onCancel={() => {
          setShowEndDatePicker(false);
        }}
        minimumDate={startDate}
        maximumDate={new Date()}
      />
      {/* )} */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: SIZE(20),
    alignItems: 'center',
    marginBottom: SIZE(24),
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZE(10),
  },
  proTextCont: {
    marginLeft: SIZE(10),
  },
  nameTxt: {
    fontFamily: Fonts.Medium,
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    color: '#000000',
  },
  empId: {
    color: '#6C6C6C',
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    marginTop: SIZE(5),
  },
  dateContainer: {
    height: SIZE(180),
    borderRadius: SIZE(24),
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: SIZE(16),
  },
  topContainer: {
    paddingHorizontal: SIZE(20),
    alignItems: 'center',
    marginBottom: SIZE(24),
  },
  leftcontainer: {},
  left: {
    borderWidth: 1,
    borderColor: '#B9BED5',
    height: SIZE(50),
    borderRadius: SIZE(40),
    // width:'45%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    padding: SIZE(16),
  },
  fromText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    fontFamily: Fonts.Regular,
    color: '#000000',
    marginBottom: SIZE(8),
  },
  dateTxt: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#484848',
    fontFamily: Fonts.Regular,
    marginLeft: SIZE(15),
  },
  filterButton: {
    height: SIZE(50),
    borderRadius: SIZE(30),
    padding: SIZE(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#153CD8',

    borderColor: '#B9BED5',
  },
  filterTxt: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    fontFamily: Fonts.Regular,
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(16),
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    color: '#6C6C6C',
    fontFamily: Fonts.Regular,
  },
  reportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    height: SIZE(45),
    borderBottomWidth: 0.8,
    borderBottomColor: '#E0E0E0',
    // backgroundColor:'red',
    // marginBottom:SIZE(10),
    alignItems: 'center',
  },
  dateTxts: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#525252',
    fontFamily: Fonts.Regular,
  },
  attText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#000000',
    fontFamily: Fonts.Regular,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZE(10),
  },
  titleTxt: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#8F8F8F',
    fontFamily: Fonts.Regular,
  },
});

