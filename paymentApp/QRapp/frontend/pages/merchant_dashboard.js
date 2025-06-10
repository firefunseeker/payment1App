import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const MerchantDashboard = ({ navigation }) => {
  const { user, makeAuthenticatedRequest, updateUser, logout } = useAuth();
  const [merchantBalance, setMerchantBalance] = useState(user?.merchantProfile?.merchantBalance || 0);
  const [totalSales, setTotalSales] = useState(user?.merchantProfile?.totalSales || 0);
  const [recentSales, setRecentSales] = useState([]);
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
        setMerchantBalance(profileData.user.merchantProfile.merchantBalance);
        setTotalSales(profileData.user.merchantProfile.totalSales);
        updateUser(profileData.user);
      }

      // Get recent sales (transactions where this user is the merchant)
      const salesResponse = await makeAuthenticatedRequest('http://localhost:3001/api/payments/history?limit=5');
      const salesData = await salesResponse.json();
      
      if (salesResponse.ok) {
        // Filter for sales where user is merchant
        const merchantSales = salesData.transactions.filter(t => 
          t.merchantId._id === user._id && t.type === 'payment'
        );
        setRecentSales(merchantSales);
      }
    } catch (error) {
      console.error('Error loading merchant dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleGenerateQR = () => {
    navigation.navigate('GenerateQR');
  };

  const handleWithdraw = () => {
    navigation.navigate('Withdraw');
  };

  const handleSalesHistory = () => {
    navigation.navigate('SalesHistory');
  };

  const handleSwitchToCustomer = () => {
    if (user.roles.includes('customer')) {
      navigation.navigate('CustomerDashboard');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Merchant Dashboard</Text>
      <Text style={styles.subtitle}>{user?.merchantProfile?.businessName || user?.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Available Balance</Text>
          <Text style={styles.statAmount}>R {merchantBalance.toFixed(2)}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statAmount}>R {totalSales.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Generate QR Code" onPress={handleGenerateQR} />
        <View style={styles.buttonSpacing} />
        <Button title="Withdraw Funds" onPress={handleWithdraw} />
        <View style={styles.buttonSpacing} />
        <Button title="Sales History" onPress={handleSalesHistory} />
      </View>

      {user.roles.includes('customer') && (
        <View style={styles.roleSwitch}>
          <Text style={styles.text}>You also have a customer account</Text>
          <Button title="Switch to Customer View" onPress={handleSwitchToCustomer} color="#007AFF" />
        </View>
      )}

      <View style={styles.recentSales}>
        <Text style={styles.sectionTitle}>Recent Sales</Text>
        {recentSales.length > 0 ? (
          recentSales.map((sale, index) => (
            <View key={index} style={styles.saleItem}>
              <Text style={styles.saleText}>
                Payment from {sale.customerId?.name || 'Customer'}
              </Text>
              <Text style={styles.saleAmount}>
                +R {sale.amount.toFixed(2)}
              </Text>
              <Text style={styles.saleDate}>
                {new Date(sale.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.text}>No recent sales</Text>
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
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
  recentSales: {
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
  saleItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  saleText: {
    fontSize: 14,
    marginBottom: 2,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  saleDate: {
    fontSize: 12,
    color: '#666',
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

export default MerchantDashboard;
