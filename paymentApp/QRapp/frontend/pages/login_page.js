// Login Page
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LoginPage = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        // Navigate based on user roles
        const roles = data.user.roles;
        
        if (roles.includes('admin')) {
          navigation.navigate('AdminDashboard');
        } else if (roles.includes('customer') && roles.includes('merchant')) {
          navigation.navigate('RoleSelection'); // Let user choose which role to use
        } else if (roles.includes('merchant')) {
          navigation.navigate('MerchantDashboard');
        } else {
          navigation.navigate('CustomerDashboard');
        }
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput 
        placeholder="Username or Email" 
        style={styles.input}
        value={formData.username}
        onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
        autoCapitalize="none"
      />
      
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        style={styles.input}
        value={formData.password}
        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
      />
      
      <Button 
        title={loading ? "Logging in..." : "Login"} 
        onPress={handleLogin}
        disabled={loading}
      />
      
      <View style={styles.text}>
        <Button 
          title="Don't have an account? Sign Up" 
          onPress={() => navigation.navigate('SignUp')}
          color="#666"
        />
      </View>
    </View>
  );
};

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

export default LoginPage;