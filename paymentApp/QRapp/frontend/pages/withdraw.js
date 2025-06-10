import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const WithdrawPage = ({ navigation }) => {
  const { makeAuthenticatedRequest, user, updateUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const merchantBalance = user?.merchantProfile?.merchantBalance || 0;

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > merchantBalance) {
      Alert.alert('Error', 'Insufficient merchant balance');
      return;
    }

    setLoading(true);

    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/payments/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update user balance in context
        const updatedUser = { ...user };
        updatedUser.merchantProfile.merchantBalance = data.newBalance;
        updateUser(updatedUser);

        Alert.alert(
          'Withdrawal Successful!',
          `R ${amount} has been transferred to your bank account.\nNew balance: R ${data.newBalance.toFixed(2)}`,
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Withdrawal Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Withdraw Funds</Text>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>R {merchantBalance.toFixed(2)}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Withdrawal amount (R)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <View style={styles.bankInfo}>
        <Text style={styles.bankTitle}>💳 Bank Account (Simulated)</Text>
        <Text style={styles.bankText}>Account: ****1234</Text>
        <Text style={styles.bankText}>Bank: Demo Bank</Text>
        <Text style={styles.note}>Funds will be transferred instantly for demo purposes</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Processing..." : `Withdraw R ${amount || '0'}`}
          onPress={handleWithdraw}
          disabled={loading || !amount}
        />
        
        <View style={styles.buttonSpacing} />
        
        <Button 
          title="Cancel" 
          onPress={() => navigation.goBack()}
          color="#666"
        />
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
  balanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34C759',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  bankInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  bankText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonSpacing: {
    height: 10,
  },
});

export default WithdrawPage;
