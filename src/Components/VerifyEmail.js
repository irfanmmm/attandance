import { StyleSheet, Text, View ,Image, TouchableOpacity} from 'react-native'
import React from 'react'
import { Fonts, SIZE } from './utils/Styles'

export default function VerifyEmail({route,navigation}) {
    const { email } = route?.params || {};


  const handleNavigateToCompanyCode = () => {
    // Navigate to company code screen
    navigation.navigate('Login')
    
  };


  return (
    <View style={styles.container}>
        <View
        style={styles.imageContainer}>
      <Image
      resizeMode='contain'
      width={'100%'}
      height={'100%'}
      source={require('../assets/verifyemail.png')}
      
      />
      </View>
      <Text
      style={styles.checkTxt}>
        <Text style={{color:'#284EF5'}}>Check </Text>Your Email

      </Text>
      <Text style={styles.subText}>
        Login credentials have been sent to <Text style={{fontFamily:Fonts.Semibold,color:'#153CD8'}}>{email} </Text> Please check your inbox to continue.
      </Text>
    <TouchableOpacity 
    hitSlop={10}
    activeOpacity={0.8}
           onPress={handleNavigateToCompanyCode}
           style={styles.companyCodeLink}
         >
           <Text style={styles.existingUserText}>
            Login to <Text style={styles.companyCodeText}>Company Code</Text>
           </Text>
    </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'#FFFFFF'

    },
    imageContainer:{
        width:SIZE(240),
        height:SIZE(240)
    },
    checkTxt:{
    fontSize:SIZE(26),
    lineHeight:SIZE(28),
    fontFamily:Fonts.Semibold,
    color:'#000000'
    },
    subText:{
        maxWidth:SIZE(320),
        textAlign:'center',
        marginTop:SIZE(10),
        lineHeight:SIZE(20),
        fontSize:SIZE(16),
        fontFamily:Fonts.Regular,
        
    },
      existingUserText: {
    lineHeight:SIZE(18),
    fontSize: SIZE(14),
    fontFamily: Fonts.Regular,
    color: '#000000',
  },
    companyCodeLink: {
    alignItems: 'center',
    marginTop: SIZE(15),
  },
    companyCodeText: {
    color: '#153CD8',
    fontFamily: Fonts.Semibold,
  }
})