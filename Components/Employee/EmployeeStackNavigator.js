import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Image, Text, View } from "react-native";
import Scan from "./Screens/Scan";
import Status from "./Screens/Status";
import Avatar from "../Assets/icon.png";
import onBoarding from "./OnBoarding";
function LogoTitle() {
  return (
    <View
      style={{
        minHeight: 60,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "800", paddingLeft: 20 }}>
        AttendEase
      </Text>
    </View>
  );
}

const EmployeeStackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      initialRouteName="Scan"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Group>
        <Stack.Screen name="Scan" component={Scan} />
        <Stack.Screen name="Status" component={Status} />
        <Stack.Screen name="onBoarding" component={onBoarding} />
        
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default EmployeeStackNavigator;
