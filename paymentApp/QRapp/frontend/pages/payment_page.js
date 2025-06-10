// Payment Page
import { StyleSheet, Text, TextInput, Button, ScrollView } from 'react-native';


export const PaymentPage = () => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Top Up</Text>
    <TextInput placeholder="Cardholder Name" style={styles.input} />
    <TextInput placeholder="Card Number" keyboardType="number-pad" style={styles.input} />
    <TextInput placeholder="Security Code" keyboardType="number-pad" style={styles.input} />
    <TextInput placeholder="Sort Code" keyboardType="number-pad" style={styles.input} />
    <TextInput placeholder="Expiry Date (MM/YY)" style={styles.input} />
    <Button title="Top Up" onPress={() => {}} />
  </ScrollView>
);

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

export default PaymentPage;