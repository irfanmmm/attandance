import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AdminStackNavigator from './Admin/AdminStackNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import { useSelector } from 'react-redux';
import { useContext } from 'react';
import Store, { Context } from './Redux/Store';
import UserLogin from './Employee/Screens/UserLogin';
import ResetPassword from './Employee/Screens/ResetPassword';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAxios } from './utils/useAxios';
import DeviceInfo from 'react-native-device-info';
import { Alert, Linking, Platform } from 'react-native';
import { checkForUpdate } from './utils/validate_version';
import { useIdileState } from './utils/useIdileState';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function BottomTabNavigator() {
  const { state } = useContext(Context);

  const isLogged = state.userData.is_logged;

useIdileState()

  return (
    <NavigationContainer>
      <>
        {isLogged ? (
          // Logged in → Show Main App
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="AdminStackNavigator"
              component={AdminStackNavigator}
            />
          </Stack.Navigator>
        ) : (
          // Not logged in → Show Auth Flow
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen
              options={{ headerShown: false }}
              name="UserLogin"
              component={UserLogin}
            />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </Stack.Navigator>
        )}
      </>
      {/* <StatusBar style="auto" /> */}
    </NavigationContainer>
  );
}
