import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TextInput, Button, ScrollView, FlatList } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from './frontend/pages/landing_page';
import ProfilePage from './frontend/pages/profile_page';
import SignUpPage from './frontend/pages/signup_page';
import LoadingPage from './frontend/pages/loading_page';
import LoginPage from './frontend/pages/login_page';
import QRScannerPage from './frontend/pages/QR_page';
import PaymentPage from './frontend/pages/payment_page';


// Styles (shared)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  text: {
    marginTop: 10,
  },
});

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="Profile" component={ProfilePage} />
        <Stack.Screen name="SignUp" component={SignUpPage} />
        <Stack.Screen name="Loading" component={LoadingPage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="QRScanner" component={QRScannerPage} />
        <Stack.Screen name="Payment" component={PaymentPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}