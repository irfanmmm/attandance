import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EmployeeStackNavigator from './Employee/EmployeeStackNavigator';
import AdminStackNavigator from './Admin/AdminStackNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './Login';
import { useSelector } from 'react-redux';
import Register from './Register';
import VerifyEmail from './VerifyEmail';
import { useContext } from 'react';
import Store, { Context } from "./Redux/Store"

 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function BottomTabNavigator() {
  

   const { state } = useContext(Context);

   const isLogged = state.userData.is_logged

  return (
    <NavigationContainer>
      <>
        {!isLogged == '' ? (
          <Stack.Navigator
            screenOptions={{
              // unmountOnBlur: true,
              tabBarActiveTintColor: 'black',
              headerShown: false,
              tabBarStyle: {
                height: 70,
                paddingBottom: 10,
                paddingTop: 10,
              },
            }}
          >
            {/* <Stack.Screen
              name="EmployeeStackNavigator"
              component={EmployeeStackNavigator}
            /> */}
            <Stack.Screen
              name="AdminStackNavigator"
              component={AdminStackNavigator}
            />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator
            screenOptions={{
              unmountOnBlur: true,
              tabBarActiveTintColor: 'black',
              headerShown: false,
              tabBarStyle: {
                height: 70,
                paddingBottom: 10,
                paddingTop: 10,
              },
            }}
          >
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
          </Stack.Navigator>
        )}
      </>
      {/* <StatusBar style="auto" /> */}
    </NavigationContainer>
  );
}
