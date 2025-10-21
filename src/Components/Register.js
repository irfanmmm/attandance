import {
  Image,
  KeyboardAvoidingView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Keyboard,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Fonts, SIZE } from './utils/Styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommonButton from './CommonButton';
import { BASE_URL } from './utils/urls';
import { useToast } from 'react-native-toast-notifications';

export default function Register({ navigation }) {
  const insets = useSafeAreaInsets();

  const toast = useToast();

  // Create refs object
  const inputRefs = useRef({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    noOfEmployees: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Error state
  const [errors, setErrors] = useState({});
  const [loader,setLoader]=useState(false)

  // Input configuration array
  const inputFields = [
    {
      key: 'name',
      label: 'Name',
      placeholder: 'Your name',
      keyboardType: 'default',
      returnKeyType: 'next',
      secureTextEntry: false,
      nextField: 'companyName',
    },
    {
      key: 'companyName',
      label: 'Company Name',
      placeholder: 'Your Organisation',
      keyboardType: 'default',
      returnKeyType: 'next',
      secureTextEntry: false,
      nextField: 'noOfEmployees',
    },
    {
      key: 'noOfEmployees',
      label: 'No of Employees',
      placeholder: '00',
      keyboardType: 'numeric',
      returnKeyType: 'next',
      secureTextEntry: false,
      nextField: 'phone',
   
    },
    {
      key: 'phone',
      label: 'Phone No.',
      placeholder: '+91',
      keyboardType: 'phone-pad',
      returnKeyType: 'next',
      secureTextEntry: false,
      nextField: 'email',
      maxLength: 10,
    },
    {
      key: 'email',
      label: 'Email',
      placeholder: 'Your mail',
      keyboardType: 'email-address',
      returnKeyType: 'next',
      secureTextEntry: false,
      autoCapitalize: 'none',
      nextField: 'password',
    },
    {
      key: 'password',
      label: 'Password',
      placeholder: '******',
      keyboardType: 'default',
      returnKeyType: 'next',
      secureTextEntry: true,
      nextField: 'confirmPassword',
    },
    {
      key: 'confirmPassword',
      label: 'Confirm Password',
      placeholder: '******',
      keyboardType: 'default',
      returnKeyType: 'done',
      secureTextEntry: true,
      nextField: null,
    },
  ];

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.noOfEmployees.trim()) {
      newErrors.noOfEmployees = 'Number of employees is required';
    } else if (isNaN(formData.noOfEmployees)) {
      newErrors.noOfEmployees = 'Please enter a valid number';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 3) {
      newErrors.password = 'Password must be at least 3 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (validateForm()) {
      register();
    }
  };

  const handleNavigateToCompanyCode = () => {
    // Navigate to company code screen
    navigation.navigate('Login');
  };

  const register = async () => {
    setLoader(true)
    try {
      const response = await fetch(`${BASE_URL}signup`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          compony_name: formData.companyName,
          name: formData.name,
          email: formData.email,
          mobile_no: formData.phone,
          emp_count: formData.noOfEmployees,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          'Authentication failed. Please check your credentials.',
        );
      }

      const data = await response.json();
      console.log(data?.data, 'deleteemol');

      if (data?.message === 'success') {
        // setData(data?.data);
        // navigation.goBack()
        toast.show(data?.message, {
          type: 'Success',
          duration: 2000,
        });
        setTimeout(() => {
          navigation.navigate('VerifyEmail', {
            email: formData?.email,
          });
        }, 1000);
      } else {
        toast.show(data?.message, {
          type: 'danger',
          duration: 2000,
        });
      }
    } catch (err) {
      // setData([]);
      toast.show('Something went wrong', {
        type: 'danger',
        duration: 2000,
      });
   

      console.log('Authentication error:', err?.message);
    }finally{
      setLoader(false)
    }
  };

  // Reusable Input Component
  const renderInput = field => {
    return (
      <View key={field.key}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={10}
          onPress={() => inputRefs.current[field.key]?.focus()}
          style={[
            styles.inputContainer,
            errors[field.key] && styles.inputError,
          ]}
        >
          <View>
            <Text style={styles.labelText}>{field.label}</Text>
            <TextInput
              ref={ref => (inputRefs.current[field.key] = ref)}
              style={styles.input}
              placeholderTextColor={'#2C436433'}
              value={formData[field.key]}
            
              placeholder={field.placeholder}
              keyboardType={field.keyboardType}
              returnKeyType={field.returnKeyType}
              secureTextEntry={field.secureTextEntry}
              autoCapitalize={field.autoCapitalize || 'sentences'}
              onChangeText={text => updateField(field.key, text)}
              maxLength={field.maxLength}
              onSubmitEditing={() => {
                if (field.nextField) {
                  inputRefs.current[field.nextField]?.focus();
                } else {
                  handleRegister();
                }
              }}
            />
          </View>
        </TouchableOpacity>
        {errors[field.key] ? (
          <Text style={styles.errorText}>{errors[field.key]}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor={'transparent'}
        barStyle={'dark-content'}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SIZE(120) }}
        bounces={false}
        extraScrollHeight={Platform.OS == 'android' ? SIZE(-100) : SIZE(100)}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll={true}
        style={{ paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandIconContainer}>
          <Image
            source={require('../assets/brand.png')}
            style={styles.brandIcon}
            resizeMode="cover"
          />
        </View>

        <View>
          <Text style={styles.createText}>Create your workplace</Text>
          <Text style={styles.subText}>Join and manage your team easily</Text>
        </View>

        <View style={styles.inputContainers}>
          {inputFields.map(renderInput)}
        </View>

        <View style={{ height: SIZE(100) }} />
      </KeyboardAwareScrollView>

      <View style={styles.bottomButtonContainer}>
        <CommonButton
          backgroundColor={'#153CD8'}
          title={'Register'}
          onPress={handleRegister}
          color={'#FFFFFF'}
          loader={loader}
        />
        <TouchableOpacity
          onPress={handleNavigateToCompanyCode}
          style={styles.companyCodeLink}
          hitSlop={10}
          activeOpacity={0.8}
        >
          <Text style={styles.existingUserText}>
            Existing User?{' '}
            <Text style={styles.companyCodeText}>Company Code</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: SIZE(25),
    paddingTop: SIZE(30),
  },
  brandIconContainer: {
    width: SIZE(172),
    height: SIZE(36),
    marginVertical: SIZE(20),
  },
  brandIcon: {
    width: '100%',
    height: '100%',
  },
  createText: {
    fontFamily: Fonts.Semibold,
    fontSize: SIZE(26),
    lineHeight: SIZE(30),
    color: '#000000',
  },
  subText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    fontFamily: Fonts.Regular,
    color: '#272727',
    marginTop: SIZE(10),
  },
  inputContainers: {
    marginTop: SIZE(40),
    gap: SIZE(16),
  },
  inputContainer: {
    justifyContent: 'center',
    height: SIZE(70),
    width: '100%',
    borderWidth: 1,
    borderColor: '#B9BED5',
    borderRadius: SIZE(40),
    paddingHorizontal: SIZE(30),
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#DF0202',
  },
  labelText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
    color: '#515978',
    marginBottom: Platform.OS === 'ios' ? SIZE(5) : 0,
  },
  input: {
    fontSize: SIZE(14),
    lineHeight: SIZE(16),
    color: '#000000',
  },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
    alignSelf: 'flex-start',
    marginLeft: SIZE(30),
  },
  bottomButtonContainer: {
    height: SIZE(100),
    // backgroundColor:'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:SIZE(20)
    // marginTop: SIZE(40),
  },
  companyCodeLink: {
    alignItems: 'center',
    marginTop: SIZE(15),
  },
  existingUserText: {
    lineHeight: SIZE(16),
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    color: '#000000',
  },
  companyCodeText: {
    color: '#153CD8',
    fontFamily: Fonts.Semibold,
  },
});
