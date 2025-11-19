import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import AdminStackNavigator from './Admin/AdminStackNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import { useSelector } from 'react-redux';
import Register from './Register';
import VerifyEmail from './VerifyEmail';
import { useContext } from 'react';
import Store, { Context } from './Redux/Store';
import UserLogin from './Employee/Screens/UserLogin';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function BottomTabNavigator() {
  const { state } = useContext(Context);

  const isLogged = state.userData.is_logged;

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
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
          </Stack.Navigator>
        )}
      </>
      {/* <StatusBar style="auto" /> */}
    </NavigationContainer>
  );
}
