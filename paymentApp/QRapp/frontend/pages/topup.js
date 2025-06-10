import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const TopUpPage = ({ navigation }) => {
  const { makeAuthenticatedRequest, user, updateUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    holderName: ''
  });
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = [50, 100, 200, 500, 1000];

  const handleTopUp = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > 10000) {
      Alert.alert('Error', 'Maximum top-up amount is R 10,000');
      return;
    }

    // Validate card details (for simulation)
    if (paymentMethod === 'card') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.holderName) {
        Alert.alert('Error', 'Please fill in all card details');
        return;
      }

      // Simulate card validation
      if (cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
        Alert.alert('Error', 'Please enter a valid 16-digit card number');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/payments/topup', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: paymentMethod
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update user balance in context
        const updatedUser = { ...user };
        updatedUser.customerProfile.balance = data.newBalance;
        updateUser(updatedUser);

        Alert.alert(
          'Top-Up Successful!',
          `R ${amount} has been added to your wallet.\nNew balance: R ${data.newBalance.toFixed(2)}`,
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert('Top-Up Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    // Add slash after 2 digits
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Top Up Wallet</Text>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>R {user?.customerProfile?.balance?.toFixed(2) || '0.00'}</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Amounts</Text>
      <View style={styles.quickAmounts}>
        {predefinedAmounts.map((quickAmount) => (
          <Button
            key={quickAmount}
            title={`R ${quickAmount}`}
            onPress={() => setAmount(quickAmount.toString())}
            color={amount === quickAmount.toString() ? '#007AFF' : '#666'}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Custom Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount (R)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      {/* Simulated Card Payment */}
      <View style={styles.cardForm}>
        <Text style={styles.cardTitle}>💳 Card Payment (Simulated)</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Card Number"
          value={cardDetails.cardNumber}
          onChangeText={(text) => setCardDetails(prev => ({ 
            ...prev, 
            cardNumber: formatCardNumber(text) 
          }))}
          keyboardType="numeric"
          maxLength={19}
        />
        
        <View style={styles.cardRow}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="MM/YY"
            value={cardDetails.expiryDate}
            onChangeText={(text) => setCardDetails(prev => ({ 
              ...prev, 
              expiryDate: formatExpiryDate(text) 
            }))}
            keyboardType="numeric"
            maxLength={5}
          />
          
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="CVV"
            value={cardDetails.cvv}
            onChangeText={(text) => setCardDetails(prev => ({ 
              ...prev, 
              cvv: text.replace(/\D/g, '').substring(0, 3) 
            }))}
            keyboardType="numeric"
            maxLength={3}
            secureTextEntry
          />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Cardholder Name"
          value={cardDetails.holderName}
          onChangeText={(text) => setCardDetails(prev => ({ 
            ...prev, 
            holderName: text 
          }))}
        />
      </View>

      <Text style={styles.note}>
        💡 This is a demo app. Use any 16-digit number for testing.
      </Text>

      <View style={styles.buttonContainer}>
        <Button 
          title={loading ? "Processing..." : `Top Up R ${amount || '0'}`}
          onPress={handleTopUp}
          disabled={loading || !amount}
        />
        
        <View style={styles.buttonSpacing} />
        
        <Button 
          title="Cancel" 
          onPress={() => navigation.goBack()}
          color="#666"
        />
      </View>
    </ScrollView>
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
    color: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  cardForm: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  buttonSpacing: {
    height: 10,
  },
});

export default TopUpPage;
