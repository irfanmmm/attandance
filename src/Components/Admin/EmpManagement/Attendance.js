import React, {
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  Keyboard,
  BackHandler,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import DatePicker from 'react-native-date-picker';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import Search from '../../../assets/svg/search.svg';
import CalanderIcon from '../../../assets/svg/calander.svg';
import EmpIcon from '../../../assets/svg/empIcon.svg';
import IsCheckIcon from '../../../assets/svg/isCheck.svg';
import CommonButton from '../../CommonButton';
import { Context } from '../../Redux/Store';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { storage } from '../../utils/Storage';
import { useFocusEffect } from '@react-navigation/native';

const TYPE_LEAVES = {
  Present: 'P',
  'Paid Leave': 'PL',
  'Unpaid Leave': 'UL',
  Holiday: 'H',
};

const leaveTypeTabs = [
  { type: 'Present', color: '#019112', borderColor: '#A8ECB2', id: 1 },
  { type: 'Paid Leave', color: '#082A9C', borderColor: '#DEE9FC', id: 2 },
  { type: 'Unpaid Leave', color: '#9A6003', borderColor: '#FDF9C9', id: 3 },
  { type: 'Holiday', color: '#760000', borderColor: '#FBE2E2', id: 4 },
];

export default function Attendance({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const { fetchData, loading } = useAxios();
  const toast = useToast();

  const code = state?.userData?.company_code;
  const inputRef = useRef(null);
  const today = new Date();

  const [isLogOut, setLogOut] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [input, setInput] = useState(''); // This holds search text
  const [data, setData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [saveLoader, setSaveLoader] = useState(false);

  const formatDateForAPI = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateForDisplay = date => date.toLocaleDateString('en-GB');

  const getEmpDetails = useCallback(
    async (search = '', newOffset = 0, date = startDate) => {
      console.log(newOffset, 'newOffsetnewOffsetnewOffset');
      if (newOffset !== 0 && !hasMore) return;

      try {
        const res = await fetchData({
          url: 'attandance-report-all',
          method: 'POST',
          data: {
            starting_date: formatDateForAPI(date),
            ending_date: formatDateForAPI(date),
            limit: 10,
            offset: newOffset,
            search: search,
          },
        });

        if (res?.message === 'success') {
          let newItems = res?.data?.data || res?.data || [];
          if (!Array.isArray(newItems)) newItems = [];

          const formatted = newItems.map(v => ({
            ...v,
            currentLeaveType: v?.present || 'P',
            present: v?.present || 'P',
            isSelected: false,
            isEdited: false,
          }));

          const total = res?.data?.total;

          setHasMore(newOffset + newItems?.length < total);

          if (newOffset === 0) {
            setData(formatted);
          } else {
            setData(prev => [...prev, ...formatted]);
          }
        } else {
          setData([]);
          setHasMore(false);
        }
      } catch (err) {
        console.log('Error:', err);
        toast.show('Failed to load attendance', { type: 'danger' });
        setData([]);
        setHasMore(false);
      }
    },
    [hasMore, fetchData, toast],
  );

  // Save Attendance
  const markAttendance = async () => {
    const edited = data.filter(i => i.isEdited);
    if (edited.length === 0) return;

    setSaveLoader(true);
    try {
      const res = await fetchData({
        url: 'edit-attandance',
        method: 'POST',
        data: {
          date: formatDateForAPI(startDate),
          editable_details: edited.map(i => ({
            employee_code: i.employee_id,
            action: i.present,
            employee_name: i.fullname,
          })),
        },
      });

      if (res?.message === 'success') {
        toast.show('Attendance saved successfully!', {
          type: 'success',
          duration: 2000,
        });
        getEmpDetails(input, 0, startDate); // Keep current search
      } else {
        toast.show('Something went wrong', { type: 'danger', duration: 2000 });
      }
    } catch (err) {
      toast.show('Save failed', { type: 'danger' });
    } finally {
      setSaveLoader(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const next = offset + 10;
      console.log(next, '*****');
      setOffset(next);
      getEmpDetails(input, next, startDate);
    }
  };

  // Fixed: Search now works!
  const handleSearch = text => {
    setInput(text);
    setOffset(0); // Reset offset
    setHasMore(true); // Allow new load
    getEmpDetails(text.trim(), 0, startDate); // Search with current date
  };

  // Date Change
  const handleDateChange = date => {
    setStartDate(date);
    setOffset(0);
    setHasMore(true);
    getEmpDetails(input, 0, date); // Keep current search when changing date
  };

  // Bulk, Select All, Individual — unchanged
  const handleBulkLeaveTypeSelection = leaveType => {
    const action = TYPE_LEAVES[leaveType];
    setData(prev =>
      prev.map(item =>
        item.isSelected
          ? {
              ...item,
              present: action,
              isEdited: action !== item.currentLeaveType,
            }
          : item,
      ),
    );
  };

  const handleSelectAll = () => {
    const allSelected = data.every(i => i.isSelected);
    setData(prev =>
      prev.map(i => ({
        ...i,
        isSelected: !allSelected,
        isEdited: false,
        present: !allSelected ? i.present : i.currentLeaveType,
      })),
    );
  };

  const toggleSelection = id => {
    setData(prev =>
      prev.map(i =>
        i.employee_id === id
          ? {
              ...i,
              isSelected: !i.isSelected,
              present: !i.isSelected ? i.present : i.currentLeaveType,
              isEdited: false,
            }
          : i,
      ),
    );
  };

  const setIndividualLeave = (id, leaveType) => {
    const action = TYPE_LEAVES[leaveType];
    setData(prev =>
      prev.map(i =>
        i.employee_id === id && i.isSelected
          ? { ...i, present: action, isEdited: action !== i.currentLeaveType }
          : i,
      ),
    );
  };

  // Only reload when screen focuses AND date changes (not when typing)
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      getEmpDetails(input, 0, startDate); // Keeps your current search!
    }, [startDate]), // ← Only depend on date, not input
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('EmpManagement');
        return true;
      },
    );
    return () => backHandler.remove();
  }, [navigation]);

  const ShimmerRow = () => (
    <View style={styles.shimmerCard}>
      <View style={styles.tabLeft}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{
            width: SIZE(20),
            height: SIZE(20),
            borderRadius: 4,
            marginRight: SIZE(15),
          }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: SIZE(44), height: SIZE(44), borderRadius: SIZE(22) }}
        />
        <View style={{ marginLeft: SIZE(12) }}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: SIZE(160), height: SIZE(18), borderRadius: 4 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: SIZE(100),
              height: SIZE(16),
              borderRadius: 4,
              marginTop: SIZE(6),
            }}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: SIZE(10) }}>
        {[...Array(4)].map((_, i) => (
          <ShimmerPlaceHolder
            key={i}
            LinearGradient={LinearGradient}
            style={{ width: SIZE(30), height: SIZE(30), borderRadius: 15 }}
          />
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.tabContainer} activeOpacity={1}>
      <View style={styles.tabLeft}>
        <TouchableOpacity
          style={{ marginRight: SIZE(15) }}
          onPress={() => toggleSelection(item.employee_id)}
        >
          {item.isSelected ? (
            <IsCheckIcon width={SIZE(20)} height={SIZE(20)} />
          ) : (
            <View style={styles.checkBox} />
          )}
        </TouchableOpacity>
        <EmpIcon width={SIZE(44)} height={SIZE(44)} />
        <View style={styles.content}>
          <Text style={styles.empName}>{item.fullname}</Text>
          <Text style={styles.empId}>{item.employee_id}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {leaveTypeTabs.map((tab, idx) => {
          const isActive = item.present === TYPE_LEAVES[tab.type];
          return (
            <TouchableOpacity
              key={tab.id}
              disabled={!item.isSelected}
              onPress={() => setIndividualLeave(item.employee_id, tab.type)}
              style={{
                ...styles.leaveTypeRound,
                backgroundColor: isActive ? tab.color : tab.borderColor,
                marginRight: idx === 3 ? 0 : SIZE(10),
              }}
            >
              <Text
                style={{
                  ...styles.leaveTxt,
                  color: isActive ? '#FFF' : tab.color,
                }}
              >
                {TYPE_LEAVES[tab.type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </TouchableOpacity>
  );

  const hasSelection = data.some(i => i.isSelected);
  const hasChanges = data.some(i => i.isEdited);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setLogOut(false);
        Keyboard.dismiss();
      }}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#022E95', '#4B87EE']}
          style={styles.topContainer}
        >
          <View
            style={{
              ...styles.topMidContainer,
              paddingTop: insets.top + SIZE(20),
            }}
          >
            <View style={styles.topLeftContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EmpManagement')}
              >
                <BackIcon width={SIZE(24)} height={SIZE(24)} />
              </TouchableOpacity>
              <View style={{ marginLeft: SIZE(12) }}>
                <Text style={styles.titleText}>Attendance </Text>
                <Text style={styles.subTxt}>Mark attendance and leaves</Text>
              </View>
            </View>
            <View style={styles.logoutButtonWrapper}>
              <TouchableOpacity onPress={() => setLogOut(!isLogOut)}>
                <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
              </TouchableOpacity>
              {isLogOut && (
                <View style={styles.logOutContainer}>
                  <TouchableOpacity
                    onPress={() => {
                      dispatch({
                        type: 'UPDATE_USER_DATA',
                        userData: { is_logged: false },
                      });
                      storage.clearAll();
                    }}
                    style={styles.logContaienr}
                  >
                    <Log width={SIZE(16)} height={SIZE(16)} />
                    <Text
                      style={{
                        color: '#1C54D7',
                        fontSize: SIZE(14),
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
              style={styles.searchContainer}
              onPress={() => inputRef.current?.focus()}
            >
              <Search width={SIZE(24)} height={SIZE(24)} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                placeholder="Search Employee"
                placeholderTextColor="#2C43644D"
                onChangeText={handleSearch}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.left}
              onPress={() => setShowStartDatePicker(true)}
            >
              <CalanderIcon width={SIZE(20)} height={SIZE(20)} />
              <Text style={styles.dateTxt}>
                {formatDateForDisplay(startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {hasSelection && (
            <View style={styles.middContainer}>
              <View style={styles.middleContainer}>
                <Text style={styles.BullkText}>
                  Bulk action for {data.filter(i => i.isSelected).length}{' '}
                  employee{data.filter(i => i.isSelected).length > 1 ? 's' : ''}
                </Text>
                <TouchableOpacity onPress={handleSelectAll}>
                  <Text style={styles.selctText}>
                    {data.every(i => i.isSelected)
                      ? 'Deselect All'
                      : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={leaveTypeTabs}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{
                  marginTop: SIZE(20),
                  marginLeft: SIZE(20),
                  paddingRight: SIZE(20),
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleBulkLeaveTypeSelection(item.type)}
                    style={{
                      ...styles.leaveTypeTab,
                      backgroundColor: item.borderColor,
                      borderColor: item.borderColor,
                      marginRight: SIZE(10),
                    }}
                  >
                    <Text style={{ ...styles.tabText, color: item.color }}>
                      {item.type}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(_,index) => index?.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SIZE(20),
              paddingBottom: SIZE(100),
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && offset > 0 ? (
                <ActivityIndicator style={{ marginVertical: 20 }} />
              ) : null
            }
            ListEmptyComponent={
              loading && offset === 0 ? (
                <>
                  {Array(10)
                    .fill()
                    .map((_, i) => (
                      <ShimmerRow key={i} />
                    ))}
                </>
              ) : data.length === 0 ? (
                <View style={{ alignItems: 'center', marginTop: SIZE(50) }}>
                  <Text style={{ fontSize: SIZE(16), color: '#484848' }}>
                    No records found
                  </Text>
                </View>
              ) : null
            }
          />

          {hasChanges && (
            <View
              style={{
                paddingHorizontal: SIZE(20),
                paddingVertical: SIZE(20),
                paddingBottom: insets.bottom + 20,
              }}
            >
              <CommonButton
                loader={saveLoader}
                backgroundColor={'#153CD8'}
                title={'Save Attendance'}
                onPress={markAttendance}
                color={'#FFFFFF'}
              />
            </View>
          )}
        </View>

        <DatePicker
          modal
          open={showStartDatePicker}
          date={startDate}
          mode="date"
          maximumDate={today}
          onConfirm={date => {
            setShowStartDatePicker(false);
            handleDateChange(date);
          }}
          onCancel={() => setShowStartDatePicker(false)}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  // Your styles — 100% unchanged (same as before)
  container: { flex: 1 },
  topContainer: {},
  topMidContainer: {
    paddingHorizontal: SIZE(20),
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZE(25),
  },
  topLeftContainer: { flexDirection: 'row', alignItems: 'center' },
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
  logoutButtonWrapper: { position: 'relative', zIndex: 50 },
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
    shadowOffset: { width: 0, height: 2 },
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
  tabLeft: { flexDirection: 'row', alignItems: 'center' },
  content: { marginLeft: SIZE(12) },
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
  middContainer: { backgroundColor: '#FFFFFF', paddingVertical: SIZE(20) },
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
  shimmerCard: {
    height: SIZE(80),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.9,
    borderColor: '#E1E1E1',
  },
});
