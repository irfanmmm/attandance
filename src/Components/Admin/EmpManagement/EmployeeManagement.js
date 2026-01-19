import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity,
  Keyboard,
  TextInput,
  FlatList,
  Modal,
  BackHandler,
  ActivityIndicator,
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
import Log from '../../../assets/svg/log.svg';
import Search from '../../../assets/svg/search.svg';
import EmpIcon from '../../../assets/svg/empIcon.svg';
import EditIcon from '../../../assets/svg/edit.svg';
import DeleteIcon from '../../../assets/svg/delete.svg';
import { BASE_URL } from '../../utils/urls';
import { useFocusEffect } from '@react-navigation/native';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { storage } from '../../utils/Storage';
import { useLogout } from '../../utils/useLogout';

// Shimmer
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { debounce } from '../../utils/debounse';
import { Context } from '../../Redux/Store';

export default function EmployeeManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state } = useContext(Context);
  const code = state?.userData?.company_code;
  const { fetchData, loading } = useAxios();
  const toast = useToast();
  const handleLogout = useLogout();

  const inputRef = useRef(null);

  const [isLogOut, setLogOut] = useState(false);
  const [input, setInput] = useState('');
  const [isModal, setModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [empData, setEmpData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch Employees with Search + Pagination
  const getEmpDetails = useCallback(
    debounce(async (search = '', newOffset = offset) => {
      if (!hasMore && newOffset !== 0) return;

      try {
        const res = await fetchData({
          url: 'all-employees',
          method: 'POST',
          data: { limit: 10, offset: newOffset, search },
        });

        if (res?.message === 'success') {
          const newData = res?.data?.data || [];
          const total = res?.data?.total || 0;
          setHasMore(newOffset + newData.length < total);

          if (newOffset === 0) {
            setEmpData(newData);
          } else {
            setEmpData(prev => [...prev, ...newData]);
          }
        } else {
          setEmpData([]);
          setHasMore(false);
        }
      } catch (err) {
        console.log('Fetch error:', err);
        setEmpData([]);
        setHasMore(false);
        toast.show('Failed to load employees', { type: 'danger' });
      }
    }, 400),
    [hasMore, fetchData],
  );

  // Delete Employee
  const deleteEmployee = async () => {
    try {
      const data = await fetchData({
        url: 'edit-user',
        method: 'POST',
        data: {
          editable_details: {
            employee_code: selectedData?.employee_code,
            action: 'D',
            // full_name: selectedData?.fullname,
            // branch: selectedData?.branch,
          },
        },
      });

      if (data?.message === 'success') {
      toast.show(data?.message, { type: 'success' });
      // Refresh current page
      setOffset(0);
      setHasMore(true);
      getEmpDetails(input, 0);
      } else {
        toast.show(data?.message || 'Delete failed', { type: 'danger' });
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger' });
      console.log('delete error:', err);
    }
  };

  // Back Button Handler
  useEffect(() => {
    const backAction = () => {
      navigation.navigate('EmpManagement');
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [navigation]);

  // Reset and reload on screen focus OR search change
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      getEmpDetails(input, 0);
    }, [input]),
  );

  // Initial load
  useEffect(() => {
    getEmpDetails('', 0);
  }, []);

  // Shimmer Row
  const ShimmerRow = () => (
    <View style={styles.tabContainer}>
      <View style={styles.tabLeft}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: SIZE(44), height: SIZE(44), borderRadius: SIZE(22) }}
        />
        <View style={{ marginLeft: SIZE(12) }}>
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{ width: SIZE(180), height: SIZE(18), borderRadius: 4 }}
          />
          <ShimmerPlaceHolder
            LinearGradient={LinearGradient}
            style={{
              width: SIZE(120),
              height: SIZE(16),
              borderRadius: 4,
              marginTop: SIZE(8),
            }}
          />
        </View>
      </View>
      <View style={styles.tabRight}>
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: SIZE(22), height: SIZE(22), borderRadius: 4 }}
        />
        <ShimmerPlaceHolder
          LinearGradient={LinearGradient}
          style={{ width: SIZE(22), height: SIZE(22), borderRadius: 4 }}
        />
      </View>
    </View>
  );

  // Render Item
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tabContainer}
      activeOpacity={1}
      onPress={() => Keyboard.dismiss()}
    >
      <View style={styles.tabLeft}>
        <EmpIcon width={SIZE(44)} height={SIZE(44)} />
        <View style={styles.content}>
          <Text style={styles.empName} numberOfLines={1}>
            {item?.fullname}
          </Text>
          <Text style={styles.empId}>{item?.employee_code}</Text>
        </View>
      </View>
      <View style={styles.tabRight}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddEmployee', {
              isEdit: true,
              selectedData: item,
            })
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <EditIcon width={SIZE(22)} height={SIZE(22)} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSelectedData(item);
            setModal(true);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <DeleteIcon width={SIZE(22)} height={SIZE(22)} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setLogOut(false);
        Keyboard.dismiss();
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 2, y: 0 }}
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
                <Text style={styles.subTxt}>Manage employee details</Text>
              </View>
            </View>

            <View style={styles.logoutButtonWrapper}>
              <TouchableOpacity onPress={() => setLogOut(!isLogOut)}>
                <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
              </TouchableOpacity>

              {isLogOut && (
                <View style={styles.logOutContainer}>
                  <TouchableOpacity
                    onPress={handleLogout}
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
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Search width={SIZE(24)} height={SIZE(24)} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search Employee"
              placeholderTextColor="#2C43644D"
              value={input}
              onChangeText={text => {
                setInput(text);
                // getEmpDetails will be called via useFocusEffect dependency
              }}
            />
          </View>

          {/* Employee List */}
          <FlatList
            data={empData}
            renderItem={renderItem}
            keyExtractor={item =>
              item?.employee_code?.toString() || Math.random().toString()
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: SIZE(30),
              flexGrow: 1,
            }}
            onEndReached={() => {
              console.log(
                hasMore && !loading,
                'hasMore && !loadinghasMore && !loading',
              );
              if (hasMore && !loading) {
                const newOffset = offset + 10;
                setOffset(newOffset);
                getEmpDetails(input, newOffset);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loading && offset > 0 ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#022E95" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              loading && offset === 0 ? (
                // Initial loading shimmer
                <>
                  {Array(8)
                    .fill()
                    .map((_, i) => (
                      <ShimmerRow key={i} />
                    ))}
                </>
              ) : empData.length === 0 && !loading ? (
                <View style={{ alignItems: 'center', marginTop: SIZE(80) }}>
                  <Text style={{ fontSize: SIZE(16), color: '#666' }}>
                    No employees found
                  </Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Delete Modal */}
        <Modal
          transparent
          visible={isModal}
          animationType="fade"
          onRequestClose={() => setModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Delete Employee</Text>
              <Text style={styles.subText}>
                Are you sure you want to delete
                <Text style={{ fontFamily: Fonts.Semibold }}>
                  {' '}
                  {selectedData?.fullname} ({selectedData?.employee_code})
                </Text>
                ?
              </Text>

              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.modalControll}
                  onPress={() => setModal(false)}
                >
                  <Text style={{ color: '#000' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalControll,
                    { backgroundColor: '#FFEEEE', borderColor: '#FFBBBB' },
                  ]}
                  onPress={() => {
                    deleteEmployee();
                    setModal(false);
                  }}
                >
                  <Text style={{ color: '#D00' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topContainer: { paddingBottom: SIZE(20) },
  topMidContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZE(20),
  },
  topLeftContainer: { flexDirection: 'row', alignItems: 'center' },
  titleText: { fontFamily: Fonts.Medium, fontSize: SIZE(22), color: '#fff' },
  subTxt: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(14),
    color: '#fff',
    marginTop: SIZE(4),
  },
  logoutButtonWrapper: {     position: 'relative',
    zIndex: 50, },
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
    // justifyContent:'space-between'
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SIZE(20),
    paddingTop: SIZE(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(16),
    height: SIZE(50),
    marginBottom: SIZE(20),
  },
  input: { flex: 1, marginLeft: SIZE(10), fontSize: SIZE(15), color: '#000' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZE(12),
    borderBottomWidth: 0.8,
    borderColor: '#EEE',
  },
  tabLeft: { flexDirection: 'row', alignItems: 'center' },
  content: { marginLeft: SIZE(12) },
  empName: { fontFamily: Fonts.Regular, fontSize: SIZE(16), color: '#000' },
  empId: { fontSize: SIZE(14), color: '#666', marginTop: SIZE(4) },
  tabRight: { flexDirection: 'row', gap: SIZE(20) },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: SIZE(20),
    padding: SIZE(25),
  },
  title: {
    fontSize: SIZE(18),
    fontFamily: Fonts.Semibold,
    textAlign: 'center',
    marginBottom: SIZE(10),
  },
  subText: {
    fontSize: SIZE(14),
    textAlign: 'center',
    color: '#444',
    marginBottom: SIZE(30),
  },
  buttonWrapper: { flexDirection: 'row', justifyContent: 'space-around' },
  modalControll: {
    flex: 1,
    height: SIZE(46),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZE(25),
    borderWidth: 1,
    borderColor: '#CCC',
    marginHorizontal: SIZE(8),
  },
});
