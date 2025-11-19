import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  BackHandler,
} from 'react-native';
import React, { useRef, useState, useContext, useEffect } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import BackIcon from '../../../assets/svg/back.svg';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import Log from '../../../assets/svg/log.svg';
import Search from '../../../assets/svg/search.svg';
import EmpIcon from '../../../assets/svg/empIcon.svg';
import LeftArrow from '../../../assets/svg/leftArrow.svg';
import { Context } from '../../Redux/Store';
import { BASE_URL } from '../../utils/urls';

export default function Report({ navigation }) {
  const { state, dispatch } = useContext(Context);
  const [isLogOut, setLogOut] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading ,setLoading]=useState(true)

  const code = state.userData.company_code;



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



  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSearch = text => {
    setInput(text);

    if (text.trim() === '') {
      // Show all data when search is empty
      setFilteredData(data);
    } else {
      // Filter data based on search query
      const filtered = data.filter(item => {
        const fullname = item.fullname?.toLowerCase() || '';
        const employeeCode = item.employee_code?.toLowerCase() || '';
        const searchText = text.toLowerCase();

        return (
          fullname.includes(searchText) || employeeCode.includes(searchText)
        );
      });
      setFilteredData(filtered);
    }
  };

  const getEmployee = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${BASE_URL}all-employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compony_code: code,
        }),
      });

      if (!response.ok) {
        throw new Error(
          'Authentication failed. Please check your credentials.',
        );
      }

      const data = await response.json();
      if (data?.message === 'success') {
        setFilteredData(data?.data);
        setData(data?.data);
      } else {
      }
    } catch (err) {
      setData([]);
      setFilteredData([]);
      console.log('Authentication error:', err.message);
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    getEmployee();
  }, []);

  return (
    <View style={styles.container}>
      {/* Wrap header in TouchableWithoutFeedback to dismiss keyboard */}
          {isLogOut && (
                  <View style={styles.logOutContainers}>
                    <TouchableOpacity
                      hitSlop={8}
                      activeOpacity={0.8}
                      onPress={() => {
                        dispatch({
                          type: 'UPDATE_USER_DATA',
                          userData: {
                            ...state.userData,
                            is_logged: false,
                          },
                        });
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

      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setLogOut(false);
        }}
      >
        <View>
          <LinearGradient
            colors={['#022E95', '#4B87EE']}
            style={styles.topContainer}
          >
            <TouchableWithoutFeedback
              onPress={() => {
                setLogOut(false);
              }}
            >
              <View
                style={{
                  ...styles.headerContainer,
                  paddingTop: insets.top + SIZE(40),
                }}
              >
                <View style={styles.subHead}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    hitSlop={8}
                    onPress={() => {
                             navigation.navigate('EmpManagement'); // Replace 'Login' with your login screen name

                      setLogOut(false);
                    }}
                  >
                    <BackIcon width={SIZE(32)} height={SIZE(32)} />
                  </TouchableOpacity>
                  <View style={styles.headerContent}>
                    <Text style={styles.titleTxt}>Attendance Report</Text>
                    <Text style={styles.titleSubTxt}>
                      View or download reports
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={8}
                  onPress={() => {
                    setLogOut(!isLogOut);
                  }}
                >
                  <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
                </TouchableOpacity>
            
              </View>
            </TouchableWithoutFeedback>
          </LinearGradient>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.bottomContainer}>
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

        <FlatList
          showsVerticalScrollIndicator={false}
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: SIZE(20),
            flexGrow: 1,
          }}
        ListEmptyComponent={() => (
    <>
      {loading ? (
        // Shimmer loader for loading state
        <View style={styles.emptyContainer}>
          {[...Array(5)].map((_, index) => ( // Adjust number of shimmer items as needed (e.g., 5 placeholders)
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
        // Original empty component for no data
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {input.trim() !== ''
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
                setLogOut(false);

                navigation.navigate('ReportSingleView', {
                  empCode: item?.employee_code,
                  empName: item?.fullname,
                });
              }}
            >
              <View style={styles.tabLeft}>
                <EmpIcon width={SIZE(44)} height={SIZE(44)} />
                <View style={styles.content}>
                  <Text style={styles.empName}>{item?.fullname}</Text>
                  <Text style={styles.empId}>{item?.employee_code}</Text>
                </View>
              </View>
              <LeftArrow width={SIZE(36)} height={SIZE(36)} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FF',
  },
  topContainer: {
    // Let it size to content
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZE(20),
    paddingBottom: SIZE(30),

  },
  subHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTxt: {
    fontSize: SIZE(24),
    lineHeight: SIZE(26),
    color: '#ffffff',
    fontFamily: Fonts.Medium,
  },
  titleSubTxt: {
    fontSize: SIZE(16),
    lineHeight: SIZE(20),
    color: '#ffffff',
    fontFamily: Fonts.Regular,
  },
  headerContent: {
    marginLeft: SIZE(10),
  },
  logOutContainers: {
    width: SIZE(200),
    height: SIZE(90),
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 150,
    right: 20,
    borderRadius: SIZE(20),
    padding: SIZE(20),
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  bottomContainer: {
    flex: 1,
    backgroundColor: '#F6F8FF',
    paddingHorizontal: SIZE(20),
    paddingTop: SIZE(20),
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
    padding: SIZE(16),
    height: SIZE(80),
    backgroundColor: '#ffffff',
    borderRadius: SIZE(20),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  empName: {
    fontFamily: Fonts.Regular,
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
  content: {
    marginLeft: SIZE(12),
  },
  tabLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
 shimmerItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: SIZE(10),
  marginVertical: SIZE(5),
  backgroundColor: '#f0f0f0', // Base color
  borderRadius: 8,
},
shimmerIcon: {
  width: SIZE(44),
  height: SIZE(44),
  borderRadius: SIZE(22),
  backgroundColor: '#e0e0e0',
},
shimmerContent: {
  marginLeft: SIZE(10),
  flex: 1,
},
shimmerLineLong: {
  height: SIZE(16),
  width: '70%',
  backgroundColor: '#e0e0e0',
  borderRadius: 4,
  marginBottom: SIZE(8),
},
shimmerLineShort: {
  height: SIZE(14),
  width: '50%',
  backgroundColor: '#e0e0e0',
  borderRadius: 4,
},
shimmerArrow: {
  width: SIZE(36),
  height: SIZE(36),
  backgroundColor: '#e0e0e0',
  borderRadius: SIZE(18),
},
  emptyContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    color: '#6C6C6C',
    fontFamily: Fonts.Regular,
  },
});
