import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Text, View } from 'react-native';
import Status from './Screens/Status';
import Avatar from '../Assets/icon.png';
import onBoarding from './OnBoarding';
import NewScan from './Screens/NewScan';


const EmployeeStackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      initialRouteName="NewScan"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Group>
        <Stack.Screen name="NewScan" component={NewScan} />
        <Stack.Screen name="Status" component={Status} />
        <Stack.Screen name="onBoarding" component={onBoarding} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default EmployeeStackNavigator;
