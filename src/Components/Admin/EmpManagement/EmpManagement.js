import {
  Alert,
  BackHandler,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Fonts, SIZE } from '../../utils/Styles';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoutIcon from '../../../assets/svg/logOut.svg';
import { Context } from '../../Redux/Store';
import Log from '../../../assets/svg/log.svg';
import Profiles from '../../../assets/svg/profiles.svg';
import Plus from '../../../assets/svg/plus.svg';
import Employee from '../../../assets/svg/Employee.svg';
import Document from '../../../assets/svg/Document.svg';
import { storage } from '../../utils/Storage';

const Navigations = {
  Attendance: 'Attendance',
  'Attendance Report': 'ReportSingleView',
  'Employee Management': 'EmployeeManagement',
  'Add Branches': 'AddBranch',
  'Add Agency': 'AddAgency',
};
export default function EmpManagement({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const [isLogOut, setLogOut] = useState(false);
  const settings = state.userData.settings;
  const isAdmin = state.userData.is_admin;

  const { isAuthentication = false } = route?.params || {};

  const isAgency = settings?.find(
    val => val.setting_name === 'Agency Management',
  )?.value;
  const isBranch = settings?.find(
    val => val.setting_name === 'Branch Management',
  )?.value;

  const handleNavigate = item => {
    navigation.navigate(Navigations[item.title]);
  };
  useEffect(() => {
    const backAction = () => {
      if (isAdmin) {
        // Admin → directly navigate to NewScan
        navigation.navigate('NewScan');
      } else {
        // Non-admin → show confirm alert
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
      }

      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation, isAdmin]);

  // useEffect(() => {
  //   const backAction = () => {
  //     isAdmin ? navigation.navigate('NewScan'):navigation.navigate('Authentication')
  //     // : navigation.navigate('Authentication')
  //     // Navigate to the login page
  //     // navigation.navigate('Authentication'); // Replace 'Login' with your login screen name
  //     return true; // Prevent default back action (e.g., exiting the app)
  //   };
  //   const backHandler = BackHandler.addEventListener(
  //     'hardwareBackPress',
  //     backAction,
  //   );
  //   return () => {
  //     backHandler.remove();
  //   };
  // }, [navigation]);

  const data = [
    {
      title: 'Attendance',
      subTxt: 'Mark attendance and leaves',
      icon: <Profiles width={SIZE(20)} height={SIZE(20)} />,
    },
    {
      title: 'Attendance Report',
      subTxt: 'View or download reports',
      icon: <Document width={SIZE(20)} height={SIZE(20)} />,
    },
    {
      title: 'Employee Management',
      subTxt: 'Manage employee details',
      icon: <Employee width={SIZE(20)} height={SIZE(20)} />,
    },
    ...(isBranch === true || isBranch === 'true'
      ? [
          {
            title: 'Add Branches',
            subTxt: 'Create and manage company branches',
            icon: <Employee width={SIZE(20)} height={SIZE(20)} />,
          },
        ]
      : []),
    ...(isAgency === true || isAgency === 'true'
      ? [
          {
            title: 'Add Agency',
            subTxt: 'Create Agency',
            icon: <Employee width={SIZE(20)} height={SIZE(20)} />,
          },
        ]
      : []),
  ];

  return (
    <View style={[styles.container]}>
      <TouchableOpacity
        activeOpacity={0.8}
        hitSlop={10}
        onPress={() => {
          navigation.navigate('AddEmployee');
          setLogOut(false);
        }}
        style={[styles.AddEmpContainer, { bottom: insets.bottom + 30 }]}
      >
        <Plus width={SIZE(24)} height={SIZE(24)} />
      </TouchableOpacity>
      <TouchableWithoutFeedback onPress={() => setLogOut(false)}>
        <LinearGradient
          colors={['#022E95', '#4B87EE']}
          style={{ ...styles.topContainer }}
        >
          <View
            style={{
              paddingTop: insets.top + SIZE(20),
              paddingHorizontal: SIZE(20),
            }}
          >
            <View style={styles.logoutButtonWrapper}>
              <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={8}
                  onPress={() => {
                    setLogOut(!isLogOut);
                  }}
                  style={styles.logOutContainer}
                >
                  <LogoutIcon width={SIZE(40)} height={SIZE(40)} />
                </TouchableOpacity>
              </View>
              {isLogOut && (
                <View style={styles.logOutContainers}>
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
                              initialRoute:'NewScan'
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
            <View style={styles.headerContent}>
              <Text style={styles.headerText}>
                {'Manage Your \nWork Force With Ease'}
              </Text>
              <Text style={styles.headerSubText}>
                {
                  'Easily track attendance, review reports,\nand update employee details.'
                }
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableWithoutFeedback>
      <View style={styles.bottomContainer}>
        <FlatList
          data={data}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={8}
              style={styles.tabContainer}
              onPress={() => {
                handleNavigate(item);
                setLogOut(false);
              }}
            >
              <View style={styles.iconContainer}>{item.icon}</View>
              <View style={{ marginLeft: SIZE(10) }}>
                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.SubText}>{item.subTxt}</Text>
              </View>
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
  },
  subContainer: {
    flexGrow: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: 'transparent',
  },
  topContainer: {
    // flex: 0.4,
    // height: SIZE(350),
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: SIZE(20),
    paddingVertical: SIZE(20),
    flex: 1,
    backgroundColor: '#F6F8FF',
    borderTopLeftRadius: SIZE(40),
    borderTopRightRadius: SIZE(40),
    position: 'absolute',
    top: SIZE(320),
    left: 0,
    right: 0,
    bottom: 0,
  },
  logOutContainer: {
    // alignItems: 'flex-end',
  },
  logoutButtonWrapper: {
    position: 'relative',
    zIndex: 50,
  },
  logOutContainers: {
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
  headerContent: {
    paddingTop: SIZE(20),
  },
  headerText: {
    fontSize: SIZE(28),
    lineHeight: SIZE(40),
    color: '#ffffff',
    fontFamily: Fonts.Semibold,
  },
  headerSubText: {
    marginTop: SIZE(20),
    fontSize: SIZE(16),
    lineHeight: SIZE(22),
    color: '#ffffff',
    fontFamily: Fonts.Regular,
  },
  tabContainer: {
    padding: SIZE(16),
    height: SIZE(80),
    backgroundColor: '#ffffff',
    borderRadius: SIZE(20),
    marginBottom: SIZE(15),
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: SIZE(44),
    height: SIZE(44),
    borderRadius: SIZE(10),
    backgroundColor: '#133EED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: SIZE(18),
    lineHeight: SIZE(22),
    color: '#000000',
    fontFamily: Fonts.Medium,
  },
  SubText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    color: '#494949',
    fontFamily: Fonts.Regular,
    marginTop: SIZE(6),
  },
  AddEmpContainer: {
    position: 'absolute',
    zIndex: 20,
    width: SIZE(60),
    height: SIZE(60),
    backgroundColor: '#133EED',

    right: 30,
    borderRadius: SIZE(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
