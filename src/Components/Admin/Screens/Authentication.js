import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useRef } from "react";
import { Fonts, SIZE } from "../../utils/Styles";
import BackIcon from "../../../assets/svg/back.svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileIcon from "../../../assets/svg/profile.svg";
import LockIcon from "../../../assets/svg/lock.svg";
import CommonButton from "../../CommonButton";
import { useSelector } from "react-redux";
import { useRoute ,useNavigation} from "@react-navigation/native";

export default function Authentication() {
  const insets = useSafeAreaInsets();
  const API_URL = useSelector((state) => state.appApiUrl);
    const isLogged = useSelector((state) => state.logIn);

   const navigation=useNavigation()

    // console.log(isLogged);
    
  

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  const [input, setInput] = useState({ username: "", password: "" });
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
  });

  const handleChange = (name, value) => {
    console.log("hfhhhf");

    setInput((prev) => ({ ...prev, [name]: value }));
    if (name == "username") {
      console.log("fjfjfj");

      setError((prev) => ({ ...prev, usernameErr: false }));
    } else {
      setError((prev) => ({ ...prev, passwordErr: false }));
    }
  };
  const handleNavigate = async () => {
    const newError = {
      usernameErr: !input.username.trim(),
      passwordErr: !input.password.trim(),
    };
    setError(newError);

    if (newError.usernameErr || newError.passwordErr) {
      return;
    }
    //  navigation.navigate("AddEmployee");

    try {
      const response = await fetch(`${API_URL}verify-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: input.username,
          password: input.password,
          compony_code:isLogged
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Authentication failed. Please check your credentials."
        );
      }

      const data = await response.json();
      if(data.message==='success'){
  navigation.navigate ("AddEmployee");
      }else{
           
      }
       
      // const data = await response.json();
    
    } catch (err) {
      setError({ usernameErr: true, passwordErr: true });
      console.error("Authentication error:", err.message);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/adminBackround.png")}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View style={{ ...styles.contain, paddingTop: insets.top + SIZE(20) }}>
          <TouchableOpacity
          onPress={()=>{
            navigation.navigate('Scan')
          }}
           style={styles.haederContainer}>
            <BackIcon
            
              style={{ marginTop: SIZE(25) }}
              width={SIZE(32)}
              height={SIZE(32)}
            />
          </TouchableOpacity>
          <View style={styles.contentContainer}>
            <Text style={styles.titleText}>
              Access Admin{"\n"}Control Panel
            </Text>
            <Text style={styles.subTitleText}>
              Enter your credentials to access the{"\n"}Admin panel.
            </Text>
          </View>
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={10}
              onPress={() => {
                inputRef1.current?.focus();
                setError((prev) => ({ ...prev, usernameErr: false }));
              }}
              style={styles.inputContainer}
            >
              <ProfileIcon
                width={SIZE(20)}
                height={SIZE(20)}
                style={{ marginTop: SIZE(10), marginRight: SIZE(10) }}
              />

              <View>
                <Text style={styles.uerNameText}>UserName</Text>
                <TextInput
                  ref={inputRef1}
                  style={{ fontSize: SIZE(14), lineHeight: SIZE(16) }}
                  placeholderTextColor={"#2C436433"}
                  value={input.username}
                  placeholder="Enter name"
                  onChangeText={(text) => {
                    handleChange("username", text);
                    setError((prev) => ({ ...prev, usernameErr: false }));
                  }}
                />
              </View>
            </TouchableOpacity>
            {error.usernameErr && (
              <Text style={styles.errorText}>*Please username</Text>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={10}
              onPress={() => {
                inputRef2.current?.focus();
                setError((prev) => ({ ...prev, passwordErr: false }));
              }}
              style={{ ...styles.inputContainer, marginTop: SIZE(16) }}
            >
              <LockIcon
                width={SIZE(20)}
                height={SIZE(20)}
                style={{ marginTop: SIZE(10), marginRight: SIZE(10) }}
              />

              <View>
                <Text style={styles.uerNameText}>Password</Text>
                <TextInput
                  ref={inputRef2}
                  style={{ fontSize: SIZE(14), lineHeight: SIZE(16) }}
                  placeholderTextColor={"#2C436433"}
                  value={input.password}
                  secureTextEntry
                  placeholder="Enter password"
                  onChangeText={(text) => {
                    handleChange("password", text);
                    setError((prev) => ({ ...prev, passwordErr: false }));
                  }}
                />
              </View>
            </TouchableOpacity>
            {error.passwordErr && (
              <Text style={styles.errorText}>*Please enter password.</Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={"#153CD8"}
          title={"Sign in"}
          onPress={() => {
            handleNavigate();
          }}
          color={"#FFFFFF"}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  contain: {
    flex: 1,
  },
  haederContainer: {
    paddingHorizontal: SIZE(30),
  },
  contentContainer: {
    marginTop: SIZE(20),
    paddingHorizontal: SIZE(30),
    marginBottom: SIZE(30),
  },
  titleText: {
    fontSize: SIZE(34),
    lineHeight: SIZE(42),
    color: "#FFFFFF",
    fontFamily: Fonts.Semibold,
  },
  subTitleText: {
    marginTop: SIZE(10),
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Medium,
    color: "#FFFFFF",
  },
  bottomContainer: {
    paddingTop: SIZE(30),
    alignItems: "center",

    paddingHorizontal: SIZE(30),

    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: SIZE(50),
    borderTopRightRadius: SIZE(50),
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
  uerNameText: {
    fontSize: SIZE(12),
    lineHeight: SIZE(16),
    fontFamily: Fonts.Regular,
    color: "#515978",
  },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(12),
    lineHeight: SIZE(20),
    color: "#DF0202",
    fontFamily: Fonts.Regular,
    alignSelf: "flex-start",
    marginLeft: SIZE(30),
  },
  bottomButtonContainer: {
    paddingHorizontal: SIZE(30),

    position: "absolute",
    zIndex: 200,
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: SIZE(30),
  },
});
