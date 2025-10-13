import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, Text, View } from "react-native";

import AdminStatus from "./Screens/AdminStatus";
import Avatar from "../Assets/icon.png";
import Authentication from "./Screens/Authentication";
import AddEmployee from "./Screens/AddEmployee";
import AdminScan from "./Screens/AdminScan";
import EmpManagement from "./EmpManagement/EmpManagement";
import Report from "./EmpManagement/Report";
import ReportStatus from "./EmpManagement/ReportStatus";
import Attendance from "./EmpManagement/Attendance";
import EmployeeManagement from "./EmpManagement/EmployeeManagement";
import NewScan from "../Employee/Screens/NewScan";
import Status from '../Employee/Screens/Status';
import OnBoarding from "../Employee/OnBoarding";
import ReportSingleView from "./EmpManagement/ReportSingleView";



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
      initialRouteName="EmployeeManagement"
      screenOptions={{ headerShown: true }}
    >
      <Stack.Group>
        <Stack.Screen   options={{headerShown:false}} name="Authentication" component={Authentication} />
 
        <Stack.Screen options={{headerShown:false}} name="AdminStatus" component={AdminStatus} />
        <Stack.Screen options={{headerShown:false}} name="AddEmployee" component={AddEmployee} />
        <Stack.Screen options={{headerShown:false}} name="AdminScan" component={AdminScan} />
        <Stack.Screen options={{headerShown:false}} name="EmpManagement" component={EmpManagement} />
        <Stack.Screen options={{headerShown:false}} name="Report" component={Report} />
        <Stack.Screen options={{headerShown:false}} name="ReportStatus" component={ReportStatus} />
        <Stack.Screen options={{headerShown:false}} name="Attendance" component={Attendance} />
        <Stack.Screen options={{headerShown:false}} name="EmployeeManagement" component={EmployeeManagement} />
         <Stack.Screen  options={{headerShown:false}} name="NewScan" component={NewScan} />
        <Stack.Screen options={{headerShown:false}} name="Status" component={Status} />
        <Stack.Screen options={{headerShown:false}} name="onBoarding" component={OnBoarding} />
        <Stack.Screen options={{headerShown:false}} name="ReportSingleView" component={ReportSingleView} />
      
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AdminStackNavigator;
