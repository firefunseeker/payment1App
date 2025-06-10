// Profile Page
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export const ProfilePage = ({ isAdmin }) => (
  <ScrollView style={styles.container}>
    <Text style={styles.title}>Your Balance: $100.00</Text>
    {isAdmin && (
      <View>
        <Text style={styles.title}>Transaction History</Text>
        <Picker>
          <Picker.Item label="Daily" value="daily" />
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
        </Picker>
        <FlatList data={[]} renderItem={({ item }) => <Text>{item}</Text>} />
        <Text>Graph Here (e.g., using Victory or Recharts)</Text>
      </View>
    )}
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

export default ProfilePage;