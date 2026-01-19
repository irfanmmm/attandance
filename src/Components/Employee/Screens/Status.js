import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  BackHandler,
} from 'react-native';
import CheckIcon from '../../../assets/svg/tick.svg';
import { Fonts, SIZE } from '../../utils/Styles';
import InIcon from '../../../assets/svg/in.svg';
import OutIcon from '../../../assets/svg/out.svg';


import { useNavigation } from '@react-navigation/native';
// import { BlurView } from "expo-blur";
import { Image } from 'react-native';

const CheckInScreen = ({ navigation, route }) => {
const username = route?.params?.username ?? '';
const direction = route?.params?.direction ?? '';

console.log(direction,'directiondirectiondirection');



  

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate('NewScan');
    }, 2000);
  }, []);


    // useEffect(() => {
    //   const backAction = () => {
    //     // Navigate to the login page
    //     navigation.navigate('NewScan'); // Replace 'Login' with your login screen name
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

  //  React.useEffect(() => {
  //   navigation.addListener("beforeRemove", (e) => e.preventDefault);
  // });

  return (
    <View
       style={styles.container}
    >
    {/* <ImageBackground
      source={require('../../../assets/backround.jpg')}
      style={styles.container}
    > */}
      {/* <View  style={styles.blurContainer}> */}
      <View style={styles.checkButton}>
        {direction==='out'?(<OutIcon width={SIZE(84)} height={SIZE(84)} />):(<InIcon width={SIZE(84)} height={SIZE(84)} />)}
        
      </View>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hello, {username}</Text>
        <Text style={styles.status}>{direction==='out'?"Check-Out successful":"Check-In successful"}</Text>
        <Text style={styles.wish}>Have a nice day!</Text>
      </View>
      {/* </View> */}
    {/* </ImageBackground> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //  backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    // opacity:0.8
      backgroundColor:'#000000',
    // opacity:0.8,
  },
  blurContainer: {
    //     backgroundColor:'#000000',
    // opacity:0.8,
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    alignItems: 'center',
    marginTop: SIZE(30),
  },
  greeting: {
    fontSize: SIZE(24),
    color: '#ffffff',
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(26),
    marginBottom: SIZE(8),
  },
  status: {
    fontSize: SIZE(16),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Semibold,
    color: '#ffffff',
    marginBottom: SIZE(16),
  },
  wish: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),

    color: '#ffffff',
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default CheckInScreen;
