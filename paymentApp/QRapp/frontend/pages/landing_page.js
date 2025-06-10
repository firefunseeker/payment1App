// Landing Page
import { StyleSheet, Text, View, Button } from 'react-native';

export const LandingPage = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Welcome</Text>
    <Button title="Login" onPress={() => navigation?.navigate?.('Login')} />
    <Button title="Sign Up" onPress={() => navigation?.navigate?.('SignUp')} />
  </View>
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

export default LandingPage;