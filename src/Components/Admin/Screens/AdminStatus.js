import React, { useContext, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, BackHandler } from "react-native";
import CheckIcon from "../../../assets/svg/tick.svg";
import { Fonts, SIZE } from "../../utils/Styles";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
// import { BlurView } from "expo-blur";
import { Image } from "react-native";
import { Context } from "../../Redux/Store";


const CheckInScreen = ({navigation,route}) => {
    const { state } = useContext(Context);
  const { isEdit,isNewScan } = route?.params || {};

  


   const empName = state.userData.username

    useEffect(()=>{
      setTimeout(() => {
        
        navigation.navigate(isEdit?'EmployeeManagement':'AddEmployee')
        
      }, 2000);
  
    },[])

        // useEffect(() => {
        //   const backAction = () => {
        //     // Navigate to the login page
        //     navigation.navigate('AddEmployee'); // Replace 'Login' with your login screen name
        //     return true; // Prevent default back action (e.g., exiting the app)
        //   };
        //   const backHandler = BackHandler.addEventListener(
        //     'hardwareBackPress',
        //     backAction
        //   );
        //   return () => {
        //     backHandler.remove(); // Cleanup when the component unmounts
        //   };
        // }, [navigation]);

  // const navigation = useNavigation();
  // React.useEffect(() => {
  //   navigation.addListener("beforeRemove", (e) => e.preventDefault);
  // });

  return (
    // <ImageBackground source={require('../../../assets/backround.jpg')} style={styles.container}>
    <View style={styles.container}>
      <View style={styles.blurContainer}>
        <View style={styles.checkButton}>
          <CheckIcon width={SIZE(84)} height={SIZE(84)} />
        </View>
        <View style={styles.content}>
          <Text style={styles.greeting}>Employee Added Successfully!</Text>
          <Text style={styles.status}><Text style={{fontFamily:Fonts.Bold}}>{empName}</Text> has been added to your organization. </Text>
          
        </View>
      </View>
      </View>
    // </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  //  backgroundColor: '#1a1a1a',
    justifyContent: "center",
    alignItems: "center",
    // opacity:0.8
    backgroundColor:'#000000',
    // opacity:0.6,
  },
  blurContainer: {
    //     backgroundColor:'#000000',
    // opacity:0.9,
    // ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    alignItems: "center",
    marginTop: SIZE(30),
  },
  greeting: {
    fontSize: SIZE(24),
    color: "#ffffff",
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(32),
    marginBottom: SIZE(8),
    width:SIZE(200),
    textAlign:'center'
  },
  status: {
    width:SIZE(250),
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Medium,
    color: "#ffffff",
    marginBottom: SIZE(16),
    textAlign:'center'
  },

  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default CheckInScreen;
