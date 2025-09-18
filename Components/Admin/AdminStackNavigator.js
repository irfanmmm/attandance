import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, Text, View } from "react-native";
import Admin from "./Screens/Admin";
import AdminStatus from "./Screens/AdminStatus";
import Avatar from "../Assets/icon.png";
import Authentication from "./Screens/Authentication";
import AddEmployee from "./Screens/AddEmployee";
import AdminScan from "./Screens/AdminScan";

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
      <Image style={{ width: 40, height: 40 }} source={Avatar} />
      <Text style={{ fontSize: 22, fontWeight: "800", paddingLeft: 20 }}>
        AttendEase (Admin)
      </Text>
    </View>
  );
}

const AdminStackNavigator = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator
      initialRouteName="Authentication"
      screenOptions={{ headerShown: true }}
    >
      <Stack.Group>
        <Stack.Screen   options={{headerShown:false}} name="Authentication" component={Authentication} />
        <Stack.Screen
          name="Admin"
          component={Admin}
          
          options={{ headerTitle: (props) => <LogoTitle {...props} />,  }}
          
        />
        <Stack.Screen options={{headerShown:false}} name="AdminStatus" component={AdminStatus} />
        <Stack.Screen options={{headerShown:false}} name="AddEmployee" component={AddEmployee} />
        <Stack.Screen options={{headerShown:false}} name="AdminScan" component={AdminScan} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
