import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useContext, useRef, useState } from "react";
import { Fonts, SIZE } from "./utils/Styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CommonButton from "./CommonButton";
import { useDispatch, useSelector } from "react-redux";


export default function Login({ navigation }) {
  const insets = useSafeAreaInsets();
  const inputRef2 = useRef(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const API_URL = useSelector((state) => state.appApiUrl);
  const [status, setStatus] = useState("*Please enter code");
  const dispatch=useDispatch()


  const handleLogin = async () => {
    console.log('hii');
    
    setError(false);
    if (!code.trim()) {
      setError(true);
      return;
    }
    //  dispatch({ type: "loginSuccess", data: true });

  

    // navigation.navigate("EmployeeStackNavigator");
    try {
      console.log('h');
      
      if (!code.trim()) {
        setError(true);
        return;
      }
      console.log('hoi');
      
      const response = await fetch(`${API_URL}verify-compony-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code
        }),
      })
      console.log('haaai');
      
      const data = await response.json();
      console.log(data,'messa');
      dispatch({ type: "loginSuccess", data: code });

      navigation.navigate("EmployeeStackNavigator");
    } catch (err) {
      console.log('hfhfhhfhffh');
      
      setError(true);
      console.error("Login error:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View style={{ paddingTop: insets.top }}>
          <View style={styles.brandIconContainer}>
            <Image
              source={require("../assets/brand.png")}
              style={styles.brandIcon}
              resizeMode="cover"
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.employyText}>Welcome</Text>
            <Text style={styles.subText}>
              Fill in your details below. This helps us {"\n"}register your
              profile securely.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={10}
              onPress={() => {
                inputRef2.current?.focus();
                setError(false);
              }}
              style={styles.inputContainer}
            >
              <View>
                <Text style={styles.uerNameText}>Company Code</Text>
                <TextInput
                  ref={inputRef2}
                  style={{ fontSize: SIZE(14), lineHeight: SIZE(16) }}
                  placeholderTextColor={"#2C436433"}
                  value={code}
                  placeholder="Enter code"
                  onChangeText={(text) => {
                    setCode(text);
                  }}
                />
              </View>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{status}</Text>}
            <View style={{ marginTop: SIZE(20) }}>
              <CommonButton
                arrow={true}
                backgroundColor={"#153CD8"}
                title={"Sign in"}
                onPress={() => {
                  handleLogin();
                }}
                color={"#FFFFFF"}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: SIZE(25),
    paddingTop: SIZE(140),
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  brandIconContainer: {
    width: SIZE(220),
    height: SIZE(46),
    marginBottom: SIZE(60),
  },
  brandIcon: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {},
  employyText: {
    fontSize: SIZE(26),
    fontFamily: Fonts.Semibold,
    lineHeight: SIZE(28),
    color: "#000000",
  },
  subText: {
    marginTop: SIZE(12),
    marginBottom: SIZE(40),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: "#272727",
  },
  inputContainer: {
    height: SIZE(64),
    width: "100%",
    borderWidth: 1,
    borderColor: "#B9BED5",
    borderRadius: SIZE(40),
    flexDirection: "row",
    paddingVertical: SIZE(10),
    paddingHorizontal: SIZE(30),
  },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(12),
    lineHeight: SIZE(20),
    color: "#DF0202",
    fontFamily: Fonts.Regular,
    alignSelf: "flex-start",
    marginLeft: SIZE(30),
    // marginLeft: SIZE(-120),
  },
});
