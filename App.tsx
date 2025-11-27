import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  StatusBar,
  useColorScheme,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Navigation from './src/Components/Navigation';

import allReducers from './src/Components/Redux/Reducer';
import Store, { Context } from './src/Components/Redux/Store';
import { SIZES } from './src/Components/utils/Styles';
import { ToastProvider } from 'react-native-toast-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { useAxios } from './src/Components/utils/useAxios';

// import BootSplash from 'react-native-bootsplash';

const App = () => {
  const [splash, setSplash] = useState(true);
  const { fetchData } = useAxios();
  //       useEffect(() => {
  //     // for splash screen
  //     BootSplash.hide();
  //     // versionCheck();
  //   }, []);

  const isDark = useColorScheme();

  const getversion = async () => {
    try {
      const res = await fetchData({
        url: 'app-version',
      });
      if (res?.message === 'success') {
        if (res?.version?.[Platform.OS]?.force) {
          checkForUpdate(res?.version?.[Platform.OS]?.version);
        }
      }
    } catch (err) {
      console.log('Fetch branch error:', err);
    }
  };

  const checkForUpdate = (latestVersion: string) => {
    // Change this to your latest version
    // const latestVersion = "2.0.0";                    // ← UPDATE THIS
    const currentVersion = DeviceInfo.getVersion(); // e.g., 1.5.3

    if (currentVersion < latestVersion) {
      Alert.alert(
        'Update Required',
        'Please update the app to continue.',
        [
          {
            text: 'Update Now',
            onPress: () => {
              const link =
                Platform.OS === 'android'
                  ? 'https://play.google.com/store/apps/details?id=com.officekitlence'
                  : 'https://apps.apple.com/us/app/facekit/id6753619593';

              Linking.openURL(link);
            },
          },
        ],
        { cancelable: false }, // User cannot skip
      );
    }
  };

  useEffect(() => {
    // Hide splash after 2 seconds
    getversion();
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
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <StatusBar
          translucent
          backgroundColor={'transparent'}
          // barStyle={isDark === 'dark' ? 'light-content' : 'dark-content'}
          barStyle={'light-content'}
        />
        <Store>
          <ToastProvider
            animationDuration={1000}
            placement="bottom"
            successColor="#191C21"
            dangerColor="red"
            duration={1600}
            warningColor="#FFC745"
            offsetBottom={140}
            style={{
              width: SIZES.wp('90%'),
              alignSelf: 'center',
              borderRadius: SIZES.wp('2%'),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            textStyle={{ fontSize: SIZES.wp('3.6%') }}
          >
            <Navigation />
          </ToastProvider>
        </Store>
      </View>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({});
