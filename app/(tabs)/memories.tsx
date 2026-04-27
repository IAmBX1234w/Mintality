import { View, Text, StyleSheet } from 'react-native';

export default function MemoriesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memories</Text>
      <Text style={styles.subtitle}>Your past activity will live here 📸</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0a8654',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 10,
  },
});