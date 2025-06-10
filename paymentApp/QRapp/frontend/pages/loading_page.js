// Loading Page
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export const LoadingPage = () => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.text}>Loading...</Text>
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

export default LoadingPage;