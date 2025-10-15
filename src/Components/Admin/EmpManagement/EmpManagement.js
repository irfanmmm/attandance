import {
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

const Navigations = {
  Attendance: 'Attendance',
  'Attendance Report': 'Report',
  'Employee Management': 'EmployeeManagement',
  'Add Branches':'AddBranch'
};
export default function EmpManagement({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(Context);
  const [isLogOut, setLogOut] = useState(false);

  const handleNavigate = item => {
    navigation.navigate(Navigations[item.title]);
  };

  useEffect(() => {
    const backAction = () => {
      // Navigate to the login page
      navigation.navigate('Authentication'); // Replace 'Login' with your login screen name
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
       {
      title: 'Add Branches',
      subTxt: 'Create and manage company branches.',
      icon: <Employee width={SIZE(20)} height={SIZE(20)} />,
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        hitSlop={10}
        onPress={() => {
          navigation.navigate('AddEmployee');
          setLogOut(false);
        }}
        style={styles.AddEmpContainer}
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
            <View style={styles.headerContent}>
              <Text style={styles.headerText}>
                {'Manage Your \nWork force with Ease'}
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
  logOutContainers: {
    width: SIZE(200),
    height: SIZE(90),
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 130,
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
    lineHeight: SIZE(20),
    color: '#000000',
    fontFamily: Fonts.Medium,
  },
  SubText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
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
    bottom: 30,
    right: 30,
    borderRadius: SIZE(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
