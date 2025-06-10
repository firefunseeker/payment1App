// Sign Up Page
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';

export const SignUpPage = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: ['customer'], // Default role
    businessName: '' // For merchants
  });
  const [loading, setLoading] = useState(false);

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSignUp = async () => {
    // Validation
    if (!formData.username || !formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.roles.length === 0) {
      Alert.alert('Error', 'Please select at least one account type');
      return;
    }

    if (formData.roles.includes('merchant') && !formData.businessName) {
      Alert.alert('Error', 'Business name is required for merchant accounts');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roles: formData.roles,
          businessName: formData.businessName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
        secureTextEntry
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
        secureTextEntry
      />

      <Text style={styles.sectionTitle}>Account Type</Text>
      
      <TouchableOpacity 
        style={[styles.roleOption, formData.roles.includes('customer') && styles.roleSelected]}
        onPress={() => toggleRole('customer')}
      >
        <Text style={[styles.roleText, formData.roles.includes('customer') && styles.roleTextSelected]}>
          Customer Account (Make Payments)
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.roleOption, formData.roles.includes('merchant') && styles.roleSelected]}
        onPress={() => toggleRole('merchant')}
      >
        <Text style={[styles.roleText, formData.roles.includes('merchant') && styles.roleTextSelected]}>
          Merchant Account (Accept Payments)
        </Text>
      </TouchableOpacity>

      {formData.roles.includes('merchant') && (
        <TextInput
          style={styles.input}
          placeholder="Business Name"
          value={formData.businessName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
        />
      )}

      <Button 
        title={loading ? "Creating Account..." : "Sign Up"} 
        onPress={handleSignUp}
        disabled={loading}
      />
      
      <View style={styles.text}>
        <Button 
          title="Back to Login" 
          onPress={() => navigation.navigate('Login')}
          color="#666"
        />
      </View>
    </ScrollView>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  roleOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  roleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  roleText: {
    fontSize: 14,
    color: '#666',
  },
  roleTextSelected: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default SignUpPage;