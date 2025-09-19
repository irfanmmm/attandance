import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';
// import * as Font from 'expo-font';

const { height, width } = Dimensions.get('window');
export const SIZE_HW = {
  width: width,
  height: height,
  hp: hp,
};

// custom size
const SIZE = value => {
  return wp(value / 4.2);
};

//size in percentage
const SIZES = {
  wp: wp,
  hp: hp,
};

const Fonts = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  Semibold: 'Inter-Semibold',
  Bold: 'Inter-Bold',
};

// export const loadFonts = async () => {
//   try {
//     await Font.loadAsync({
//       'Inter-Regular': require('../../assets/fonts/inter_regular.ttf'),
//       'Inter-Medium': require('../../assets/fonts/inter_medium.ttf'),
//       'Inter-Semibold': require('../../assets/fonts/inter_semibold.ttf'),
//       'Inter-Bold': require('../../assets/fonts/inter_bold.ttf'),
//     });
//   } catch (error) {
//     console.warn('Error loading fonts:', error);
//   }
// };

export { SIZE, SIZES, Fonts };
