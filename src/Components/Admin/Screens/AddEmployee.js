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

export default function AddEmployee({ navigation }) {
  const insets = useSafeAreaInsets();
  const API_URL = useSelector((state) => state.appApiUrl);

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);

  const [input, setInput] = useState({ username: "", password: "" });
  const [error, setError] = useState({
    usernameErr: false,
    passwordErr: false,
  });

  const handleChange = (name, value) => {
    setInput((prev) => ({ ...prev, [name]: value }));
  };
  // const handleNavigate = async () => {
  //     const newError = { usernameErr: !input.username.trim(), passwordErr: !input.password.trim() };
  //     setError(newError);

  //     if (newError.usernameErr || newError.passwordErr) {
  //       return;
  //     }
  //     //  navigation.navigate("AdminScan");

  //     try {
  //       const response = await fetch(`${API_URL}add-employee`, {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           fullname: input.username,
  //           employeecode: input.password,
  //         }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to add employee. Please check the details.');
  //       }

  //       const data = await response.json();
  //       console.log(data);

  //       navigation.navigate("AdminScan");
  //     } catch (err) {
  //       setError({ usernameErr: true, passwordErr: true });
  //       console.error('Add employee error:', err.message);
  //     }
  //   };

  return (
    <ImageBackground
      source={require("../../../assets/employyeBackround.png")}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View style={{ ...styles.contain, paddingTop: insets.top + SIZE(20) }}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.haederContainer}
          >
            <BackIcon width={SIZE(32)} height={SIZE(32)} />
            <Text style={styles.titleText}>Add Employee</Text>
          </TouchableOpacity>

          <View style={styles.bottomContainer}>
            <View style={styles.contentContainer}>
              <Text style={styles.employyText}>Employee Info</Text>
              <Text style={styles.subText}>
                Fill in your details below. This helps us {"\n"}register your
                profile securely.
              </Text>
            </View>

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
                <Text style={styles.uerNameText}>Employee Name</Text>
                <TextInput
                  ref={inputRef1}
                  style={{ fontSize: SIZE(14), lineHeight: SIZE(16) }}
                  placeholderTextColor={"#2C436433"}
                  value={input.username}
                  placeholder="Enter name"
                  onChangeText={(text) => {
                    handleChange("username", text);
                  }}
                />
              </View>
            </TouchableOpacity>
            {error.usernameErr && (
              <Text style={styles.errorText}>*Please enter name</Text>
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
                <Text style={styles.uerNameText}>Employee Code</Text>
                <TextInput
                  ref={inputRef2}
                  style={{ fontSize: SIZE(14), lineHeight: SIZE(16) }}
                  placeholderTextColor={"#2C436433"}
                  value={input.password}
                  placeholder="Enter code"
                  onChangeText={(text) => {
                    handleChange("password", text);
                  }}
                />
              </View>
            </TouchableOpacity>
            {error.passwordErr && (
              <Text style={styles.errorText}>*Please enter code</Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={"#153CD8"}
          title={"Sign in"}
          onPress={() => {
            const newError = {
              usernameErr: !input.username.trim(),
              passwordErr: !input.password.trim(),
            };
            if (newError.usernameErr || newError.passwordErr) {
              return;
            }
            navigation.navigate("AdminScan", {
              fullname: input.username,
              employeecode: input.password,
            });
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZE(16),
    marginBottom: SIZE(45),
  },

  titleText: {
    fontSize: SIZE(34),
    lineHeight: SIZE(42),
    color: "#FFFFFF",
    fontFamily: Fonts.Semibold,
    marginLeft: SIZE(12),
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
  contentContainer: {
    width: "100%",
  },
  employyText: {
    fontSize: SIZE(22),
    fontFamily: Fonts.Medium,
    lineHeight: SIZE(24),
    color: "#000000",
  },
  subText: {
    marginTop: SIZE(12),
    marginBottom: SIZE(32),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: "#000000",
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
    // marginLeft: SIZE(-120),
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
