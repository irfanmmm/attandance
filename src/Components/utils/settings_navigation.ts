import { Linking, Platform } from 'react-native';

export const openLocationSettings = () => {
  if (Platform.OS === 'android') {
    Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
  } else {
    Linking.openURL('App-Prefs:root=Privacy&path=LOCATION')
  }
};
