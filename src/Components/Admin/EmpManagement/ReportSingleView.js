import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
  TextInput,
  Keyboard,
  BackHandler,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import { Context } from '../../Redux/Store';
import { Fonts, SIZE } from '../../utils/Styles';
import BackArrow from '../../../assets/svg/blackArrow.svg';
import DownloadIcon from '../../../assets/svg/downArrow.svg';
import Profile from '../../../assets/svg/empIcon.svg';
import CalanderIcon from '../../../assets/svg/calander.svg';
import Search from '../../../assets/svg/search.svg';
import LeftArrow from '../../../assets/svg/leftArrow.svg';
import { useAxios } from '../../utils/useAxios';
import RNBlobUtil from 'react-native-blob-util';
import { BASE_URL } from '../../utils/urls';

export default function ReportSingleView({ route, navigation }) {
  const { empName = 'All Employees', empCode = '' } = route?.params || {};
  const { state } = useContext(Context);
  const { fetchData } = useAxios();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const inputRef = useRef(null);
  const [pdfLoader, setPdfLoader] = useState(false);

  const companyCode = state.userData.company_code;

  // Back button
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('Report');
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Format date for display
  const formatDateForDisplay = date => date.toLocaleDateString('en-GB');

  // Fetch ALL employees (exactly like Report page)
  const getAllEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetchData({
        url: 'all-employees',
      });

      if (response?.message === 'success') {
        setData(response.data || []);
        setFilteredData(response.data || []);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (err) {
      console.log('Error:', err);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

const downloadFile = async (fileUrl) => {
  const fileExt = fileUrl.split('.').pop();
  
  const query = `?starting_at=${formatDateForAPI(startDate)}&ending_at=${formatDateForAPI(endDate)}&compony_code=${companyCode}`;
  const finalUrl = fileUrl + query;

  const path = `${RNBlobUtil.fs.dirs.DownloadDir}/report.${fileExt}`;

  RNBlobUtil.config({
    fileCache: true,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      mime:
        fileExt === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.ms-excel',
      description: 'File downloaded',
      path: path,
    },
  })
    .fetch('GET', finalUrl)
    .then(res => {
      console.log('Downloaded file pdddddddddath:', path);
    })
    .catch(err => {
      console.log('Download Error:', err);
    })
    .finally(() => {
      setPdfLoader(false);
    });
};

     useEffect(() => {
        const backAction = () => {
          // Navigate to the login page
          navigation.goBack()
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



  const handleDownload = async () => {
    setPdfLoader(true);

    // try {
    //   const response = await {
    //     url: 'attendance/download-report',
    //     method: 'POST',
    //     data: {
    //       starting_at: formatDateForAPI(startDate),
    //       ending_at: formatDateForAPI(endDate),
    //       company_code: companyCode,
    //     },
    //   };

    //   if (response.message === 'success') {
    //   } else {
    //   }
    // } catch (error) {
    // } finally {
    //   setPdfLoader(false);
    // }
    downloadFile(BASE_URL + 'attandance/download-report');
  };

  // Load data on mount
  useEffect(() => {
    getAllEmployees();
  }, []);

  // Apply date filter (filters employees whose join date is in range)
  const applyDateFilter = () => {
    if (!isFilterApplied) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = data.filter(item => {
      if (!item.join_date) return true; // if no join date, show anyway
      const joinDate = new Date(item.join_date);
      return joinDate >= start && joinDate <= end;
    });

    setFilteredData(filtered);
    setIsFilterApplied(false);
  };

  // Search handler
  const handleSearch = text => {
    setSearchText(text);
    if (text.trim() === '') {
      applyDateFilter(); // reset to date filter only
      return;
    }

    const filtered = data.filter(item => {
      const name = item.fullname?.toLowerCase() || '';
      const code = item.employee_code?.toLowerCase() || '';
      return (
        name.includes(text.toLowerCase()) || code.includes(text.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="dark-content"
        />

        <View style={{ flex: 1, backgroundColor: '#F6F8FF' }}>
          {/* Header */}
          <View
            style={{
              ...styles.headerContainer,
              paddingTop: insets.top + SIZE(20),
            }}
          >
            <View style={styles.leftContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <BackArrow width={SIZE(24)} height={SIZE(24)} />
              </TouchableOpacity>
              <View style={styles.profileContent}>
                <Profile width={SIZE(44)} height={SIZE(44)} />
                <View style={styles.proTextCont}>
                  <Text style={styles.nameTxt}>{empName}</Text>
                  <Text style={styles.empId}>{empCode || 'All Staff'}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={10}
              onPress={() => {
                handleDownload();
              }}
            >
              {pdfLoader ? (
                <ActivityIndicator size={'small'} />
              ) : (
                <DownloadIcon width={SIZE(24)} height={SIZE(24)} />
              )}
            </TouchableOpacity>
          </View>

          {/* Date Filter */}
          {/* <View style={styles.dateFilterCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
                <Text style={styles.dateText}>
                  {formatDateForDisplay(startDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
                <Text style={styles.dateText}>
                  {formatDateForDisplay(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.applyBtn,
              !isFilterApplied && styles.applyBtnDisabled,
            ]}
            disabled={!isFilterApplied}
            onPress={() => {
              applyDateFilter();
            }}
          >
            <Text
              style={[
                styles.applyTxt,
                !isFilterApplied && styles.applyTxtDisabled,
              ]}
            >
              Apply Filter
            </Text>
          </TouchableOpacity>
        </View> */}

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <TouchableOpacity
              style={styles.searchWrapper}
              onPress={() => inputRef.current?.focus()}
            >
              <Search width={SIZE(24)} height={SIZE(24)} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search Employee"
                placeholderTextColor="#2C43644D"
                value={searchText}
                onChangeText={handleSearch}
              />
            </TouchableOpacity>
          </View>

          {/* Employee List - EXACT SAME AS REPORT PAGE */}
          <View style={styles.listContainer}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={filteredData}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: SIZE(20), flexGrow: 1 }}
              ListEmptyComponent={() => (
                <>
                  {loading ? (
                    <View style={styles.emptyContainer}>
                      {[...Array(5)].map((_, index) => (
                        <View key={index} style={styles.shimmerItem}>
                          <View style={styles.shimmerIcon} />
                          <View style={styles.shimmerContent}>
                            <View style={styles.shimmerLineLong} />
                            <View style={styles.shimmerLineShort} />
                          </View>
                          <View style={styles.shimmerArrow} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {searchText.trim() !== ''
                          ? 'No employees found'
                          : 'No employees available'}
                      </Text>
                    </View>
                  )}
                </>
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={8}
                  style={styles.tabContainer}
                  onPress={() => {
                    Keyboard.dismiss();
                    navigation.navigate('ReportSingleView', {
                      empCode: item?.employee_code,
                      empName: item?.fullname,
                    });
                  }}
                >
                  <View style={styles.tabLeft}>
                    <Profile width={SIZE(44)} height={SIZE(44)} />
                    <View style={styles.content}>
                      <Text style={styles.empName}>{item?.fullname}</Text>
                      <Text style={styles.empId}>{item?.employee_code}</Text>
                    </View>
                  </View>
                  {/* <LeftArrow width={SIZE(36)} height={SIZE(36)} /> */}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

        {/* Date Pickers */}
        <DatePicker
          modal
          open={showStartPicker}
          date={startDate}
          mode="date"
          maximumDate={endDate}
          onConfirm={date => {
            setShowStartPicker(false);
            setStartDate(date);
            setIsFilterApplied(true);
          }}
          onCancel={() => setShowStartPicker(false)}
        />

        <DatePicker
          modal
          open={showEndPicker}
          date={endDate}
          mode="date"
          minimumDate={startDate}
          maximumDate={new Date()}
          onConfirm={date => {
            setShowEndPicker(false);
            setEndDate(date);
            setIsFilterApplied(true);
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

// All styles (exactly matching your Report page + date filter)
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZE(20),
    marginBottom: SIZE(20),
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center' },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SIZE(10),
  },
  proTextCont: { marginLeft: SIZE(10) },
  nameTxt: { fontFamily: Fonts.Medium, fontSize: SIZE(16), color: '#000' },
  empId: { color: '#6C6C6C', fontSize: SIZE(14), marginTop: SIZE(4) },

  dateFilterCard: {
    marginHorizontal: SIZE(20),
    backgroundColor: '#fff',
    borderRadius: SIZE(24),
    padding: SIZE(16),
    marginBottom: SIZE(20),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZE(16),
  },
  dateField: { flex: 1, marginHorizontal: SIZE(8) },
  label: {
    fontSize: SIZE(14),
    color: '#000',
    marginBottom: SIZE(8),
    fontFamily: Fonts.Regular,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    padding: SIZE(14),
    height: SIZE(50),
  },
  dateText: { marginLeft: SIZE(12), fontSize: SIZE(14), color: '#484848' },

  applyBtn: {
    backgroundColor: '#153CD8',
    height: SIZE(50),
    borderRadius: SIZE(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#B9BED5',
  },
  applyTxt: { color: '#fff', fontSize: SIZE(14), fontFamily: Fonts.Regular },
  applyTxtDisabled: { color: '#000' },

  searchSection: { paddingHorizontal: SIZE(20), marginBottom: SIZE(16) },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    paddingHorizontal: SIZE(16),
    height: SIZE(50),
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZE(10),
    fontSize: SIZE(14),
    color: '#000',
  },

  listContainer: { flex: 1, paddingHorizontal: SIZE(20) },

  tabContainer: {
    padding: SIZE(16),
    height: SIZE(80),
    backgroundColor: '#ffffff',
    borderRadius: SIZE(20),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  tabLeft: { flexDirection: 'row', alignItems: 'center' },
  content: { marginLeft: SIZE(12) },
  empName: { fontFamily: Fonts.Regular, fontSize: SIZE(16), color: '#000000' },
  empId: { color: '#6C6C6C', fontSize: SIZE(14), marginTop: SIZE(5) },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SIZE(100),
  },
  emptyText: {
    fontSize: SIZE(16),
    color: '#6C6C6C',
    fontFamily: Fonts.Regular,
  },

  // Shimmer
  shimmerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZE(16),
    marginBottom: SIZE(15),
    backgroundColor: '#f8f8f8',
    borderRadius: SIZE(20),
  },
  shimmerIcon: {
    width: SIZE(44),
    height: SIZE(44),
    borderRadius: SIZE(22),
    backgroundColor: '#e0e0e0',
  },
  shimmerContent: { flex: 1, marginLeft: SIZE(12) },
  shimmerLineLong: {
    height: SIZE(16),
    width: '65%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: SIZE(8),
  },
  shimmerLineShort: {
    height: SIZE(14),
    width: '45%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  shimmerArrow: {
    width: SIZE(36),
    height: SIZE(36),
    backgroundColor: '#e0e0e0',
    borderRadius: SIZE(18),
  },
});
