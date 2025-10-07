import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  StatusBar,
  useColorScheme,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Navigation from './src/Components/Navigation';


import allReducers from './src/Components/Redux/Reducer';
import Store, { Context } from './src/Components/Redux/Store';


// import BootSplash from 'react-native-bootsplash';


const App = () => {
  const [splash, setSplash] = useState(true);

  //       useEffect(() => {
  //     // for splash screen
  //     BootSplash.hide();
  //     // versionCheck();
  //   }, []);

  const isDark = useColorScheme();

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      setSplash(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (splash) {
    return (
      <ImageBackground
        source={require('./src/assets/SplashScreen.png')}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      ></ImageBackground>
    );
  }

  

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        // barStyle={isDark === 'dark' ? 'light-content' : 'dark-content'}
        barStyle={'light-content'}
      />
      <Store>
        <Navigation />
      </Store>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({});
