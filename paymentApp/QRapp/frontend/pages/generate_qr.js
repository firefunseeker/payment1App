import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const GenerateQRPage = ({ navigation }) => {
  const { makeAuthenticatedRequest } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/qr/generate', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || 'Payment'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        Alert.alert('Success', 'QR code generated successfully!');
      } else {
        Alert.alert('Error', data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewQR = () => {
    setQrCode(null);
    setAmount('');
    setDescription('');
  };

  if (qrCode) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Payment QR Code</Text>
        
        <View style={styles.qrContainer}>
          <Image 
            source={{ uri: qrCode.qrCodeImage }} 
            style={styles.qrImage}
            resizeMode="contain"
          />
          
          <View style={styles.qrDetails}>
            <Text style={styles.qrDetailText}>Amount: R {qrCode.amount.toFixed(2)}</Text>
            <Text style={styles.qrDetailText}>Description: {qrCode.description}</Text>
            <Text style={styles.qrDetailText}>
              Expires: {new Date(qrCode.expiresAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <Text style={styles.instructions}>
          Show this QR code to the customer to scan and pay
        </Text>

        <View style={styles.buttonContainer}>
          <Button title="Generate New QR" onPress={handleNewQR} />
          <View style={styles.buttonSpacing} />
          <Button title="Back to Dashboard" onPress={() => navigation.goBack()} color="#666" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate Payment QR Code</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Amount (R)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
      />

      <Button 
        title={loading ? "Generating..." : "Generate QR Code"} 
        onPress={handleGenerateQR}
        disabled={loading}
      />
      
      <View style={styles.buttonContainer}>
        <Button title="Back to Dashboard" onPress={() => navigation.goBack()} color="#666" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: 300,
    height: 300,
    marginBottom: 15,
  },
  qrDetails: {
    alignItems: 'center',
  },
  qrDetailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  instructions: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});

export default GenerateQRPage;
