import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export const TransactionHistoryPage = ({ navigation }) => {
  const { makeAuthenticatedRequest, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/payments/history');
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
      } else {
        Alert.alert('Error', 'Failed to load transaction history');
      }
    } catch (error) {
      console.error('Transaction history error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTransactionIcon = (transaction) => {
    switch (transaction.type) {
      case 'topup':
        return '💰';
      case 'payment':
        if (transaction.customerId._id === user._id) {
          return '💸'; // Outgoing payment
        } else {
          return '💵'; // Incoming payment (for merchants)
        }
      case 'withdrawal':
        return '🏦';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  };

  const getTransactionText = (transaction) => {
    switch (transaction.type) {
      case 'topup':
        return 'Wallet Top-up';
      case 'payment':
        if (transaction.customerId._id === user._id) {
          return `Payment to ${transaction.merchantId.merchantProfile?.businessName || transaction.merchantId.name}`;
        } else {
          return `Payment from ${transaction.customerId.name}`;
        }
      case 'withdrawal':
        return 'Withdrawal to Bank';
      case 'refund':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  const getTransactionAmount = (transaction) => {
    const isOutgoing = transaction.type === 'payment' && transaction.customerId._id === user._id;
    const isWithdrawal = transaction.type === 'withdrawal';
    const isTopup = transaction.type === 'topup';
    
    if (isOutgoing || isWithdrawal) {
      return `-R ${transaction.amount.toFixed(2)}`;
    } else if (isTopup || (transaction.type === 'payment' && transaction.merchantId._id === user._id)) {
      return `+R ${transaction.amount.toFixed(2)}`;
    }
    
    return `R ${transaction.amount.toFixed(2)}`;
  };

  const getAmountColor = (transaction) => {
    const isOutgoing = transaction.type === 'payment' && transaction.customerId._id === user._id;
    const isWithdrawal = transaction.type === 'withdrawal';
    const isTopup = transaction.type === 'topup';
    
    if (isOutgoing || isWithdrawal) {
      return styles.negative;
    } else if (isTopup || (transaction.type === 'payment' && transaction.merchantId._id === user._id)) {
      return styles.positive;
    }
    
    return styles.neutral;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      
      <ScrollView 
        style={styles.transactionsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {transactions.length > 0 ? (
          transactions.map((transaction, index) => (
            <View key={transaction._id || index} style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionIcon}>{getTransactionIcon(transaction)}</Text>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionText}>{getTransactionText(transaction)}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                  {transaction.description && (
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  )}
                </View>
                <Text style={[styles.transactionAmount, getAmountColor(transaction)]}>
                  {getTransactionAmount(transaction)}
                </Text>
              </View>
              
              <View style={styles.transactionStatus}>
                <Text style={[
                  styles.statusText,
                  transaction.status === 'completed' ? styles.statusCompleted :
                  transaction.status === 'pending' ? styles.statusPending :
                  styles.statusFailed
                ]}>
                  {transaction.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {user.roles.includes('customer') 
                ? 'Start by topping up your wallet or making a payment'
                : 'Generate QR codes to receive payments'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  neutral: {
    color: '#333',
  },
  transactionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  statusFailed: {
    backgroundColor: '#F8D7DA',
    color: '#721C24',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default TransactionHistoryPage;
