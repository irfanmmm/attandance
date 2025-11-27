import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { Fonts, SIZE } from './utils/Styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommonButton from './CommonButton';
import { BASE_URL } from './utils/urls';
import { useToast } from 'react-native-toast-notifications';
import TickIcon from '../assets/svg/blueTick.svg';
import { useAxios } from './utils/useAxios';

export default function Register({ navigation }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { fetchData } = useAxios();

  const inputRefs = useRef({});

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    noOfEmployees: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    officeKitCode: '',
  });

  const [isOfficeKitUser, setIsOfficeKitUser] = useState(false);
  const [errors, setErrors] = useState({});
  const [loader, setLoader] = useState(false);

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
      placeholder: 'Enter phone number',
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

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.companyName.trim())
      newErrors.companyName = 'Company name is required';
    if (!formData.noOfEmployees.trim())
      newErrors.noOfEmployees = 'Number of employees is required';
    else if (isNaN(formData.noOfEmployees))
      newErrors.noOfEmployees = 'Please enter a valid number';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    // else if (formData.phone.length < 10)
    //   newErrors.phone = 'Please enter a valid phone number';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 3)
      newErrors.password = 'Password must be at least 3 characters';

    if (!formData.confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    if (isOfficeKitUser && !formData.officeKitCode.trim()) {
      newErrors.officeKitCode = 'OfficeKit code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const register = async () => {
    setLoader(true);
    try {
      const payload = {
        compony_name: formData.companyName,
        name: formData.name,
        email: formData.email,
        mobile_no: formData.phone,
        emp_count: formData.noOfEmployees,
        password: formData.password,
        client: formData.officeKitCode,
      };

      if (isOfficeKitUser && formData.officeKitCode.trim()) {
        payload.office_kit_code = formData.officeKitCode.trim();
      }

      const response = await fetchData({
        url: 'auth/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });
      // const response = await fetch(`${BASE_URL}signup`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      // if (!response.ok) throw new Error('Authentication failed.');

      // const data = await response.json();

      if (response?.message === 'success') {
        toast.show('Success', { type: 'success', duration: 2000 });
        setTimeout(
          () => navigation.navigate('VerifyEmail', { email: formData.email }),
          1000,
        );
      } else {
        toast.show(response?.message || 'Registration failed', {
          type: 'danger',
          duration: 2000,
        });
      }
    } catch (err) {
      toast.show('Something went wrong', { type: 'danger', duration: 2000 });
      console.log(err);
    } finally {
      setLoader(false);
    }
  };

  const handleRegister = () => {
    if (validateForm()) register();
  };

  const handleNavigateToCompanyCode = () => navigation.navigate('Login');

  const renderInput = field => (
    <View key={field.key}>
      <TouchableOpacity
        activeOpacity={0.8}
        hitSlop={10}
        onPress={() => inputRefs.current[field.key]?.focus()}
        style={[styles.inputContainer, errors[field.key] && styles.inputError]}
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
            // maxLength={field.maxLength}
            onSubmitEditing={() => {
              if (field.nextField) {
                inputRefs.current[field.nextField]?.focus();
              } else if (isOfficeKitUser) {
                inputRefs.current.officeKitCode?.focus();
              } else {
                handleRegister();
              }
            }}
          />
        </View>
      </TouchableOpacity>
      {errors[field.key] && (
        <Text style={styles.errorText}>{errors[field.key]}</Text>
      )}
    </View>
  );

  const renderOfficeKitInput = () => {
    if (!isOfficeKitUser) return null;

    return (
      <View style={{ marginTop: SIZE(16) }}>
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={20}
          onPress={() => inputRefs.current.officeKitCode?.focus()}
          style={[
            styles.inputContainer,
            errors.officeKitCode && styles.inputError,
          ]}
        >
          <View>
            <Text style={styles.labelText}>Company Code</Text>
            <TextInput
              ref={ref => (inputRefs.current.officeKitCode = ref)}
              style={styles.input}
              placeholderTextColor={'#2C436433'}
              placeholder="Enter Your Company Code"
              value={formData.officeKitCode}
              onChangeText={text => updateField('officeKitCode', text)}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>
        </TouchableOpacity>
        {errors.officeKitCode && (
          <Text style={styles.errorText}>{errors.officeKitCode}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SIZE(120) }}
        bounces={false}
        extraScrollHeight={Platform.OS === 'android' ? SIZE(-100) : SIZE(100)}
        enableOnAndroid
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
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

        {/* ========== CUSTOM CHECKBOX ========== */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            // onPress={() => setIsOfficeKitUser(prev => !prev)}
            onPress={() => {
              setIsOfficeKitUser(prev => {
                const newValue = !prev;

                // If user is UNCHECKING the box → clear the company code
                if (!newValue) {
                  setFormData(prev => ({ ...prev, officeKitCode: '' }));
                  setErrors(prev => {
                    const { officeKitCode, ...rest } = prev;
                    return rest; 
                  });
                }

                return newValue;
              });
            }}
            style={styles.customCheckbox}
            activeOpacity={0.7}
          >
            {isOfficeKitUser && <TickIcon width={SIZE(20)} height={SIZE(20)} />}
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={10}
            activeOpacity={0.8}
            onPress={() => setIsOfficeKitUser(prev => !prev)}
            style={styles.checkboxLabel}
          >
            <Text style={styles.checkboxText}>Are you an OfficeKit user?</Text>
          </TouchableOpacity>
        </View>

        {renderOfficeKitInput()}

        <View style={{ height: SIZE(100) }} />
      </KeyboardAwareScrollView>

      <View style={[styles.bottomButtonContainer,{ paddingBottom: insets.bottom }]}>
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

// ==============================================
// STYLES
// ==============================================
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
  brandIcon: { width: '100%', height: '100%' },
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
  inputContainers: { marginTop: SIZE(40), gap: SIZE(16) },
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
  inputError: { borderColor: '#DF0202' },
  labelText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    fontFamily: Fonts.Regular,
    color: '#515978',
    marginBottom: Platform.OS === 'ios' ? SIZE(5) : 0,
  },
  input: { fontSize: SIZE(14), lineHeight: SIZE(16), color: '#000000' },
  errorText: {
    marginTop: SIZE(6),
    fontSize: SIZE(14),
    lineHeight: SIZE(20),
    color: '#DF0202',
    fontFamily: Fonts.Regular,
    marginLeft: SIZE(30),
  },

  // === CUSTOM CHECKBOX ===
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZE(24),
    paddingHorizontal: SIZE(4),
  },
  customCheckbox: {
    width: SIZE(22),
    height: SIZE(22),
    borderRadius: SIZE(6),
    borderWidth: 2,
    borderColor: '#153CD8',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedInner: {
    width: SIZE(12),
    height: SIZE(12),
    borderRadius: SIZE(3),
    backgroundColor: '#153CD8',
  },
  checkboxLabel: { marginLeft: SIZE(10) },
  checkboxText: {
    fontFamily: Fonts.Regular,
    fontSize: SIZE(14),
    color: '#272727',
  },

  bottomButtonContainer: {
    height: SIZE(100),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZE(30),
  },
  companyCodeLink: { alignItems: 'center', marginTop: SIZE(15) },
  existingUserText: {
    lineHeight: SIZE(16),
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    color: '#000000',
  },
  companyCodeText: { color: '#153CD8', fontFamily: Fonts.Semibold },
});
