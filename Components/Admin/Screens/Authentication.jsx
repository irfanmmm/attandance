import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  Text,
  Image,
  View,
  TouchableOpacity,
} from "react-native";

const Authentication = () => {
  const navigation = useNavigation();
  const inputRef = useRef([]);
  const [digit, setDigit] = useState({
    0: "",
    1: "",
    2: "",
    3: "",
  });

  useEffect(() => {
    if (digit[3] !== "")
      navigation.reset({
        index: 0,
        routes: [{ name: "Admin" }],
      });
  }, [digit]);

  // ✅ Function to find the first empty input
  const getNextEmptyIndex = (obj) => {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      if (obj[i] === "") return i;
    }
    return null;
  };

  // ✅ Handle number press
  const handleNumberPress = (num) => {
    const nextIndex = getNextEmptyIndex(digit);
    if (nextIndex === null) return; // All filled
    setDigit((prev) => {
      const updated = { ...prev, [nextIndex]: num };
      return updated;
    });

    // Move focus to next input
    if (nextIndex < 3) {
      inputRef.current[nextIndex + 1]?.focus();
    }
  };

  // ✅ Handle delete press
  const handleDelete = () => {
    setDigit((prev) => {
      const filledKeys = Object.keys(prev).filter((k) => prev[k] !== "");
      if (filledKeys.length === 0) return prev;

      const lastIndex = Math.max(...filledKeys.map(Number));
      const updated = { ...prev, [lastIndex]: "" };

      inputRef.current[lastIndex]?.focus();
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      {/* OTP Inputs */}
      <View style={styles.otpRow}>
        {Object.keys(digit).map((_, index) => (
          <TextInput
            key={index}
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
            textContentType="oneTimeCode"
            style={styles.otpInput}
            maxLength={1}
            showSoftInputOnFocus={false} // ✅ Disable keyboard
            ref={(elem) => (inputRef.current[index] = elem)}
            value={String(digit[index])}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {Array.from({ length: 10 }, (_, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.5}
            style={styles.keypadButton}
            onPress={() => handleNumberPress(index + 1 === 10 ? 0 : index + 1)}
          >
            <Text style={styles.keypadText}>
              {index + 1 === 10 ? 0 : index + 1}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Image
            source={require("../../../assets/delete.png")}
            style={{ width: "60%", height: "60%" }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 40,
    justifyContent: "center",
  },
  otpRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  otpInput: {
    height: 60,
    width: 60,
    backgroundColor: "#FFF",
    fontSize: 30,
    textAlign: "center",
    borderRadius: 5,
    borderColor: "black",
    borderWidth: 2,
  },
  keypadContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 50,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  keypadButton: {
    padding: 5,
    margin: 5,
    width: 90,
    height: 90,
    borderColor: "black",
    borderWidth: 1,
    justifyContent: "center",
    backgroundColor: "white",
    elevation: 2,
    alignItems: "center",
    borderRadius: 100,
  },
  keypadText: {
    fontSize: 40,
  },
  deleteButton: {
    padding: 5,
    margin: 5,
    width: 90,
    height: 90,
    borderColor: "black",
    borderWidth: 1,
    justifyContent: "center",
    backgroundColor: "white",
    elevation: 2,
    alignItems: "center",
    borderRadius: 100,
    position: "absolute",
    bottom: 0,
    right: 0,
  },
});

export default Authentication;
