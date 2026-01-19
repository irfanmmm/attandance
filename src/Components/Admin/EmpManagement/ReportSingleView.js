import React, { useContext, useCallback, useRef, useState,useEffect } from 'react';
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
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';
import { Context } from '../../Redux/Store';
import { Fonts, SIZE } from '../../utils/Styles';
import BackArrow from '../../../assets/svg/blackArrow.svg';
import Profile from '../../../assets/svg/empIcon.svg';
import CalanderIcon from '../../../assets/svg/calander.svg';
import Search from '../../../assets/svg/search.svg';
import { useAxios } from '../../utils/useAxios';
import RNBlobUtil from 'react-native-blob-util';
import { BASE_URL } from '../../utils/urls';
import { useToast } from 'react-native-toast-notifications';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';

export default function ReportSingleView({ route, navigation }) {
  const { empName = 'All Employees', empCode = '' } = route?.params || {};
  const { state } = useContext(Context);
  const { fetchData, loading } = useAxios();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const today = new Date();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [data, setData] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pdfLoader, setPdfLoader] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const inputRef = useRef(null);
  const companyCode = state.userData.company_code;

  const formatDateForDisplay = date => date.toLocaleDateString('en-GB');

  const formatDateForAPI = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch Employees with Pagination + Search
  const getAllEmployees = useCallback(async (search = '', newOffset = 0) => {
    if (newOffset !== 0 && !hasMore) return;

    try {
      const response = await fetchData({
        url: 'all-employees',
        method: 'POST',
        data: { limit: 10, offset: newOffset, search },
      });

      if (response?.message === 'success') {
        const newData = response?.data?.data || [];
        const total = response?.data?.total || 0;

        setHasMore(newOffset + newData?.length < total);

        if (newOffset === 0) {
          setData(newData);
        } else {
          setData(prev => [...prev, ...newData]);
        }
      } else {
        setData([]);
        setHasMore(false);
      }
    } catch (err) {
      console.log('Error fetching employees:', err);
      setData([]);
      setHasMore(false);
    }
  }, [fetchData, hasMore]);

  // Download CSV Report - EXACTLY like your old working version
  const downloadFile = async () => {
    setPdfLoader(true);
    const query = `?starting_at=${formatDateForAPI(startDate)}&ending_at=${formatDateForAPI(endDate)}&compony_code=${companyCode}`;
    const finalUrl = BASE_URL + 'attandance/download-report' + query;
    const fileName = `report_${moment().format('DD-MM-YYYY-HH-mm-ss')}.csv`;
    const path = `${RNBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

    RNBlobUtil.config({
      fileCache: true,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        mime: 'application/vnd.ms-excel',
        description: 'Report downloaded',
        path,
      },
    })
      .fetch('GET', finalUrl)
      .then(res => {
        toast.show('Downloaded successfully', { type: 'success' });
        console.log('File saved to', res.path());
      })
      .catch(err => {
        console.log('Download error:', err);
        toast.show('Download failed', { type: 'danger' });
      })
      .finally(() => setPdfLoader(false));
  };

  // Refresh list when screen comes into focus (after add/edit/delete)
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      getAllEmployees('', 0); // Fresh load on focus
    }, [])
  );

  // Search handler - resets pagination
  const handleSearch = text => {
    setSearchText(text);
    setOffset(0);
    setHasMore(true);
    getAllEmployees(text.trim(), 0);
  };

  // Load more on scroll
  const loadMore = () => {
    if (hasMore && !loading) {
      const newOffset = offset + 10;
      setOffset(newOffset);
      getAllEmployees(searchText.trim(), newOffset);
    }
  };

  // Back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('EmpManagement');
      return true;
    });
    return () => backHandler.remove();
  }, [navigation]);

  const ShimmerRow = () => (
    <View style={styles.shimmerCard}>
      <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerAvatar} />
      <View style={styles.shimmerTextContainer}>
        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerName} />
        <ShimmerPlaceHolder LinearGradient={LinearGradient} style={styles.shimmerCode} />
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        <View style={{ flex: 1, backgroundColor: '#F6F8FF' }}>
          {/* Header */}
          <View style={{ ...styles.headerContainer, paddingTop: insets.top + SIZE(20) }}>
            <View style={styles.leftContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('EmpManagement')}>
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
          </View>

          {/* Date Filter + Download Button */}
          <View style={styles.dateFilterCard}>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>From Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                  <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
                  <Text style={styles.dateText}>{formatDateForDisplay(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>To Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                  <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
                  <Text style={styles.dateText}>{formatDateForDisplay(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={downloadFile} disabled={pdfLoader}>
              {pdfLoader ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyTxt}>Download</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchWrapper}>
              <Search width={SIZE(24)} height={SIZE(24)} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search Employee"
                placeholderTextColor="#2C43644D"
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          {/* Employee List */}
          <FlatList
            data={data}
            keyExtractor={item => item.employee_code?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIZE(20), paddingBottom: SIZE(30), flexGrow: 1 }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && offset > 0 ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#153CD8" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              loading && offset === 0 ? (
                <>
                  {Array(8).fill().map((_, i) => (
                    <ShimmerRow key={i} />
                  ))}
                </>
              ) : data.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchText ? 'No employees found' : 'No employees available'}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tabContainer}
                activeOpacity={0.8}
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.navigate('SingleEmployeeReport', {
                    empCode: item.employee_code,
                    empName: item.fullname,
                  });
                }}
              >
                <View style={styles.tabLeft}>
                  <Profile width={SIZE(44)} height={SIZE(44)} />
                  <View style={styles.content}>
                    <Text style={styles.empName} numberOfLines={1}>{item.fullname}</Text>
                    <Text style={styles.empId}>{item.employee_code}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
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
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

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
  profileContent: { flexDirection: 'row', alignItems: 'center', marginLeft: SIZE(10) },
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
  },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZE(16) },
  dateField: { flex: 1, marginHorizontal: SIZE(8) },
  label: { fontSize: SIZE(14), color: '#000', marginBottom: SIZE(8), fontFamily: Fonts.Regular },
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
  applyTxt: { color: '#fff', fontSize: SIZE(14), fontFamily: Fonts.Regular },

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
  searchInput: { flex: 1, marginLeft: SIZE(10), fontSize: SIZE(14), color: '#000' },

  tabContainer: {
    padding: SIZE(16),
    height: SIZE(80),
    backgroundColor: '#ffffff',
    borderRadius: SIZE(20),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  tabLeft: { flexDirection: 'row', alignItems: 'center' },
  content: { marginLeft: SIZE(12) },
  empName: { fontFamily: Fonts.Regular, fontSize: SIZE(16), color: '#000' },
  empId: { fontSize: SIZE(14), color: '#666', marginTop: SIZE(4) },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: SIZE(80) },
  emptyText: { fontSize: SIZE(16), color: '#666', fontFamily: Fonts.Regular },

  shimmerCard: {
    height: SIZE(80),
    backgroundColor: '#ffffff',
    borderRadius: SIZE(20),
    marginBottom: SIZE(15),
    padding: SIZE(16),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  shimmerAvatar: { width: SIZE(44), height: SIZE(44), borderRadius: SIZE(22) },
  shimmerTextContainer: { marginLeft: SIZE(12), flex: 1 },
  shimmerName: { height: SIZE(18), width: '70%', borderRadius: 4, marginBottom: SIZE(8) },
  shimmerCode: { height: SIZE(16), width: '50%', borderRadius: 4 },
});