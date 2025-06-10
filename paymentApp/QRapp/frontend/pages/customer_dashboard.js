import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const CustomerDashboard = ({ navigation }) => {
  const { user, makeAuthenticatedRequest, updateUser, logout } = useAuth();
  const [balance, setBalance] = useState(user?.customerProfile?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get updated user profile
      const profileResponse = await makeAuthenticatedRequest('http://localhost:3001/api/users/profile');
      const profileData = await profileResponse.json();
      
      if (profileResponse.ok) {
        setBalance(profileData.user.customerProfile.balance);
        updateUser(profileData.user);
      }

      // Get recent transactions
      const transactionsResponse = await makeAuthenticatedRequest('http://localhost:3001/api/payments/history?limit=5');
      const transactionsData = await transactionsResponse.json();
      
      if (transactionsResponse.ok) {
        setTransactions(transactionsData.transactions);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleTopUp = () => {
    navigation.navigate('TopUp');
  };

  const handleScanQR = () => {
    navigation.navigate('ScanQR');
  };

  const handleTransactionHistory = () => {
    navigation.navigate('TransactionHistory');
  };

  const handleSwitchToMerchant = () => {
    if (user.roles.includes('merchant')) {
      navigation.navigate('MerchantDashboard');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Welcome, {user?.name}!</Text>
      
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>R {balance.toFixed(2)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Top Up Wallet" onPress={handleTopUp} />
        <View style={styles.buttonSpacing} />
        <Button title="Scan QR to Pay" onPress={handleScanQR} />
        <View style={styles.buttonSpacing} />
        <Button title="Transaction History" onPress={handleTransactionHistory} />
      </View>

      {user.roles.includes('merchant') && (
        <View style={styles.roleSwitch}>
          <Text style={styles.text}>You also have a merchant account</Text>
          <Button title="Switch to Merchant View" onPress={handleSwitchToMerchant} color="#007AFF" />
        </View>
      )}

      <View style={styles.recentTransactions}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <Text style={styles.transactionText}>
                {transaction.type === 'payment' ? 'Payment to' : 'Top-up'} 
                {transaction.merchantId?.merchantProfile?.businessName || transaction.merchantId?.name}
              </Text>
              <Text style={[styles.transactionAmount, 
                transaction.type === 'topup' ? styles.positive : styles.negative
              ]}>
                {transaction.type === 'topup' ? '+' : '-'}R {transaction.amount.toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.text}>No recent transactions</Text>
        )}
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Logout" onPress={logout} color="#FF3B30" />
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  buttonSpacing: {
    height: 10,
  },
  roleSwitch: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  recentTransactions: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionText: {
    fontSize: 14,
    flex: 1,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  text: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  logoutContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});

export default CustomerDashboard;
