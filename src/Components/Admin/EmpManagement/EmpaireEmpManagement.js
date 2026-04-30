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
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
  Alert,
  RefreshControl,
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
import DownArrowIcon from '../../../assets/svg/DownArrow1.svg';
import EditIcon from '../../../assets/svg/edit.svg';
import AddIcon from '../../../assets/svg/plus.svg';
import { useFocusEffect } from '@react-navigation/native';
import { useAxios } from '../../utils/useAxios';
import { useToast } from 'react-native-toast-notifications';
import { useLogout } from '../../utils/useLogout';

// Shimmer
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import { debounce } from '../../utils/debounse';
import { Context } from '../../Redux/Store';
import { useSettings } from '../../utils/useSettings';

export default function EmpaireEmpManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const { fetchData, loading } = useAxios();
  const toast = useToast();
  const handleLogout = useLogout();

  const inputRef = useRef(null);

  const [isLogOut, setLogOut] = useState(false);
  const [input, setInput] = useState('');
  const [empData, setEmpData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const isLoadingRef = useRef(false);

  // Branch Filter States
  const [branchId, setBranchId] = useState('');
  const [branchName, setBranchName] = useState('All Branches');
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);
  const [branchData, setBranchData] = useState([]);
  const [branchOffset, setBranchOffset] = useState(1);
  const [branchHasMore, setBranchHasMore] = useState(true);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchLoading, setBranchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    setBranchId('');
    setBranchName('All Branches');

    setEmpData([]); // Clear data to show shimmer loaders
    await getEmpDetails(debouncedSearch, 0, branchId);
    setRefreshing(false);
  };

  const settings = useSettings();

  // Fetch Employees with Search + Pagination
  const getEmpDetails = useCallback(
    async (search = '', newOffset = 0, currentBranchId = branchId) => {
      isLoadingRef.current = true;
      try {
        const res = await fetchData({
          url: 'all-employees',
          method: 'POST',
          data: {
            limit: 10,
            offset: newOffset,
            search,
            branch: currentBranchId,
          },
        });

        if (res?.message === 'success') {
          // Based on user log, data might be at res.data or res.data.data
          const newData = res?.data?.data || res?.data || [];
          const total = res?.data?.total;

          // If total is provided, use it. Otherwise, assume more if we got a full page.
          if (total !== undefined) {
            setHasMore(newOffset + newData.length < total);
          } else {
            setHasMore(newData.length === 10);
          }

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
      } finally {
        isLoadingRef.current = false;
      }
    },
    [fetchData, branchId],
  );

  const getBranch = async (isNewSearch = false) => {
    if (branchLoading) return;

    let currentOffset = isNewSearch ? 1 : branchOffset;

    setBranchLoading(true);
    try {
      const res = await fetchData({
        url: 'get-branch',
        method: 'POST',
        data: {
          offset: currentOffset,
          limit: 10,
          search: branchSearch.trim(),
        },
      });

      if (res?.message === 'success') {
        const newBranches = res?.details?.data || [];
        const currentPage = res?.details?.pagination?.currentPage || 1;
        const totalPages = res?.details?.pagination?.totalPages || 1;

        if (isNewSearch) {
          setBranchData(newBranches);
          setBranchOffset(2);
        } else {
          setBranchData(prev => [...prev, ...newBranches]);
          setBranchOffset(currentOffset + 1);
        }

        setBranchHasMore(currentPage < totalPages);
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Confirm',
        'Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes',
            onPress: () => {
              dispatch({
                type: 'UPDATE_USER_DATA',
                userData: {
                  ...state.userData,
                  initialRoute: 'NewScan',
                },
              });
              navigation.navigate('NewScan');
            },
          },
        ],
        { cancelable: true },
      );

      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(input), 400);
    return () => clearTimeout(timer);
  }, [input]);

  // Reset and reload on screen focus OR search change
  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      setHasMore(true);
      getEmpDetails(debouncedSearch, 0, branchId);
    }, [debouncedSearch, branchId]),
  );

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
    </View>
  );

  // Render Item
  const renderItem = ({ item }) => {
    const fullName = `${item?.First_Name || ''} ${
      item?.Last_Name || ''
    }`.trim();
    const empCode = item?.Emp_Code?.trim() || '';

    return (
      <View style={styles.tabContainer}>
        <View style={[styles.tabLeft, { flex: 1 }]}>
          <EmpIcon width={SIZE(44)} height={SIZE(44)} />
          <View style={[styles.content, { flex: 1 }]}>
            <Text style={styles.empName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.empId}>{empCode}</Text>
          </View>
        </View>

        <View
          style={{ flexDirection: 'row', gap: SIZE(15), alignItems: 'center' }}
        >
          {item?.exist ? (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() =>
                navigation.navigate('AdminScan', {
                  // isEdit: true,
                  fullname: fullName,
                  employeecode: empCode,
                  branch: item?.branch,
                  agancy: item?.agancy || item?.agency,
                  gender: item?.Gender,
                  selectedData: item,
                  fromEmpaire: true,
                })
              }
            >
              <EditIcon width={SIZE(22)} height={SIZE(22)} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => {
                navigation.navigate('AdminScan', {
                  fullname: fullName,
                  employeecode: empCode,
                  branch: item?.branch,
                  agancy: item?.agancy || item?.agency,
                  gender: item?.Gender,
                  // isEdit: true,
                  selectedData: item,
                  fromEmpaire: true,
                });
              }}
            >
              <View
                style={{
                  width: SIZE(20),
                  height: SIZE(20),
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#022E95',
                  borderRadius: SIZE(22),
                }}
              >
                <AddIcon width={SIZE(22)} height={SIZE(22)} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={styles.container}

      // onPress={() => {
      //   setLogOut(false);
      //   Keyboard.dismiss();
      // }}
    >
      <>
        {settings['Enable Create User'] && (
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            onPress={() => {
              navigation.navigate('AddEmployee');
              setLogOut(false);
            }}
            style={[styles.AddEmpContainer, { bottom: insets.bottom + 30 }]}
          >
            <AddIcon width={SIZE(24)} height={SIZE(24)} />
          </TouchableOpacity>
        )}

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
                  Alert.alert(
                    'Confirm',
                    'Are you sure you want to go back?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Yes',
                        onPress: () => {
                          dispatch({
                            type: 'UPDATE_USER_DATA',
                            userData: {
                              ...state.userData,
                              initialRoute: 'NewScan',
                            },
                          });
                          navigation.navigate('NewScan');
                        },
                      },
                    ],
                    { cancelable: true },
                  );
                  // navigation.goBack();
                }}
              >
                <BackIcon width={SIZE(24)} height={SIZE(24)} />
              </TouchableOpacity>
              <View style={{ marginLeft: SIZE(12) }}>
                <Text style={styles.titleText}>Employee List</Text>
                <Text style={styles.subTxt}>Select employee to scan</Text>
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
          {/* Search & Filter */}
          <View style={styles.searchAndFilterWrapper}>
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
                }}
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                setIsBranchModalVisible(true);
                getBranch(true);
              }}
            >
              <Text style={styles.filterText} numberOfLines={1}>
                {branchName}
              </Text>
              <DownArrowIcon width={SIZE(20)} height={SIZE(20)} />
            </TouchableOpacity>
          </View>

          {/* Employee List */}

          {/* <FlatList
          data={Array(200).fill("")}
          renderItem={({ item }) => {
            return (
              <View style={{ height: 100, backgroundColor: 'red' }}>
                <Text>{JSON.stringify(item)}</Text>
              </View>
            )
          }}
        /> */}
          <FlatList
            data={empData}
            renderItem={renderItem}
            keyExtractor={item =>
              item?.employee_code?.toString() || Math.random().toString()
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: SIZE(40),
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#022E95']}
              />
            }
            onEndReached={() => {
              if (hasMore && !isLoadingRef.current) {
                const newOffset = offset + 10;
                setOffset(newOffset);
                getEmpDetails(debouncedSearch, newOffset, branchId);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading && offset > 0 ? (
                <View style={{ paddingBottom: SIZE(20) }}>
                  <ActivityIndicator size="large" color="#022E95" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              loading && offset === 0 ? (
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
          {/* Branch Modal */}
          <Modal
            visible={isBranchModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setIsBranchModalVisible(false);
              setBranchSearch('');
            }}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setIsBranchModalVisible(false);
                setBranchSearch('');
              }}
            >
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.dropdownContainer}
                  >
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search Branch..."
                      placeholderTextColor={'#2C436433'}
                      value={branchSearch}
                      onChangeText={text => {
                        setBranchSearch(text);
                        setBranchOffset(1);
                        getBranch(true);
                      }}
                      autoFocus={true}
                    />
                    <FlatList
                      data={branchData}
                      keyExtractor={(item, index) =>
                        item._id?.toString() || index.toString()
                      }
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => {
                            setBranchId(item._id);
                            setBranchName(item.branch_name);
                            setIsBranchModalVisible(false);
                            setBranchSearch('');
                            // The branchId state update will trigger useFocusEffect automatically
                          }}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              branchId === item._id && {
                                color: '#022E95',
                                fontFamily: Fonts.Medium,
                              },
                            ]}
                          >
                            {item.branch_name}
                          </Text>
                        </TouchableOpacity>
                      )}
                      ListHeaderComponent={
                        !branchSearch ? (
                          <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                              setBranchId('');
                              setBranchName('All Branches');
                              setIsBranchModalVisible(false);
                              setBranchSearch('');
                            }}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                branchId === '' && {
                                  color: '#022E95',
                                  fontFamily: Fonts.Medium,
                                },
                              ]}
                            >
                              All Branches
                            </Text>
                          </TouchableOpacity>
                        ) : null
                      }
                      ListEmptyComponent={
                        branchLoading ? (
                          <ActivityIndicator
                            size="small"
                            color="#1C54D7"
                            style={{ marginVertical: 40 }}
                          />
                        ) : (
                          <Text style={styles.noResultsText}>
                            No branches found
                          </Text>
                        )
                      }
                      ListFooterComponent={
                        branchLoading && branchData.length > 0 ? (
                          <ActivityIndicator
                            size="small"
                            color="#1C54D7"
                            style={{ marginVertical: 20 }}
                          />
                        ) : null
                      }
                      onEndReached={() => {
                        if (branchHasMore && !branchLoading) {
                          getBranch(false);
                        }
                      }}
                      onEndReachedThreshold={0.1}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      contentContainerStyle={styles.scrollContent}
                    />
                  </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  AddEmpContainer: {
    position: 'absolute',
    zIndex: 20,
    width: SIZE(60),
    height: SIZE(60),
    backgroundColor: '#133EED',
    right: 55,
    borderRadius: SIZE(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    flex: 1,
    paddingHorizontal: SIZE(20),
    paddingTop: SIZE(20),
  },
  // searchContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#fff',
  //   borderWidth: 1,
  //   borderColor: '#DDD',
  //   borderRadius: SIZE(30),
  //   paddingHorizontal: SIZE(16),
  //   height: SIZE(50),
  //   marginBottom: SIZE(20),
  // },
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
  searchAndFilterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZE(10),
    marginBottom: SIZE(20),
  },
  searchContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(16),
    height: SIZE(50),
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: SIZE(30),
    paddingHorizontal: SIZE(12),
    height: SIZE(50),
  },
  filterText: {
    flex: 1,
    fontFamily: Fonts.Regular,
    fontSize: SIZE(14),
    color: '#000',
    marginRight: SIZE(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: '90%',
    maxHeight: SIZE(300),
    minHeight: SIZE(200),
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
    padding: SIZE(16),
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
