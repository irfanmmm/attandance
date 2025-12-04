import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const checkForUpdate = (latestVersion: string) => {
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
