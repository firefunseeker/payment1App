import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useAuth } from '../context/AuthContext';

export const ScanQRPage = ({ navigation }) => {
  const { makeAuthenticatedRequest, user } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [validatingQR, setValidatingQR] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setValidatingQR(true);

    try {
      // First validate the QR code
      const validateResponse = await makeAuthenticatedRequest('http://localhost:3001/api/qr/validate', {
        method: 'POST',
        body: JSON.stringify({ qrData: data })
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok) {
        Alert.alert('Invalid QR Code', validateData.message, [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
        return;
      }

      const { qrCode, customerBalance, hasInsufficientBalance } = validateData;

      if (hasInsufficientBalance) {
        Alert.alert(
          'Insufficient Balance',
          `Your balance: R ${customerBalance.toFixed(2)}\nRequired: R ${qrCode.amount.toFixed(2)}\n\nPlease top up your wallet first.`,
          [
            { text: 'Top Up', onPress: () => navigation.navigate('TopUp') },
            { text: 'Cancel', onPress: () => setScanned(false) }
          ]
        );
        return;
      }

      // Show payment confirmation
      Alert.alert(
        'Confirm Payment',
        `Merchant: ${qrCode.merchantName}\nAmount: R ${qrCode.amount.toFixed(2)}\nDescription: ${qrCode.description}\n\nYour balance: R ${customerBalance.toFixed(2)}`,
        [
          {
            text: 'Cancel',
            onPress: () => setScanned(false),
            style: 'cancel'
          },
          {
            text: 'Pay Now',
            onPress: () => processPayment(qrCode.qrId)
          }
        ]
      );
    } catch (error) {
      console.error('QR validation error:', error);
      Alert.alert('Error', 'Failed to validate QR code. Please try again.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    } finally {
      setValidatingQR(false);
    }
  };

  const processPayment = async (qrId) => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:3001/api/payments/qr-payment', {
        method: 'POST',
        body: JSON.stringify({ qrId })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Payment Successful!',
          `New balance: R ${data.newBalance.toFixed(2)}`,
          [
            { text: 'OK', onPress: () => navigation.navigate('CustomerDashboard') }
          ]
        );
      } else if (response.status === 429) {
        // Suspicious activity detected
        Alert.alert(
          'Security Check',
          'Please verify your password to continue.',
          [
            { text: 'Cancel', onPress: () => setScanned(false) },
            { text: 'Verify', onPress: () => navigation.navigate('PasswordVerification', { qrId }) }
          ]
        );
      } else {
        Alert.alert('Payment Failed', data.message, [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR Code to Pay</Text>
      
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
        
        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              {validatingQR ? 'Validating QR code...' : 'QR code scanned!'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          Point your camera at the merchant's QR code
        </Text>
        <Text style={styles.balanceText}>
          Your balance: R {user?.customerProfile?.balance?.toFixed(2) || '0.00'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {scanned && (
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        )}
        <View style={styles.buttonSpacing} />
        <Button title="Back to Dashboard" onPress={() => navigation.goBack()} color="#666" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  buttonSpacing: {
    height: 10,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
});

export default ScanQRPage;
