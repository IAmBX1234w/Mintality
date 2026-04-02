// app/(setup)/connect-plant.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { database } from '@/config/firebase';

export default function ConnectPlantScreen() {
  const [plantId, setPlantId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerifyPlant = async () => {
    if (!plantId.trim()) {
      Alert.alert('Error', 'Please enter your plant ID');
      return;
    }

    setLoading(true);

    try {
      // Check if plant exists in Firebase
      const plantRef = ref(database, `plants/${plantId.trim()}`);
      const snapshot = await get(plantRef);

      if (!snapshot.exists()) {
        Alert.alert(
          'Plant Not Found',
          'This plant ID does not exist. Please check the ID on your plant screen and try again.'
        );
        setLoading(false);
        return;
      }

      const plantData = snapshot.val();

      // Check if plant is already linked to another user
      if (plantData.userId) {
        Alert.alert(
          'Plant Already Linked',
          'This plant is already linked to another account. Each plant can only be linked to one account.'
        );
        setLoading(false);
        return;
      }

      // Plant exists and is not linked - proceed to signup
      router.push({
        pathname: '/(setup)/signup',
        params: { plantId: plantId.trim() },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="link" size={80} color="#10b981" />
          <Text style={styles.title}>Connect Your Plant</Text>
          <Text style={styles.subtitle}>
            Enter the unique ID displayed on your plant's screen
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Plant ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., GP-A1B2C3"
            value={plantId}
            onChangeText={setPlantId}
            autoCapitalize="characters"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.hint}>
            Your plant ID can be found on the screen of your Growth Plant
          </Text>
        </View>

        <View style={styles.exampleCard}>
          <Ionicons name="tv-outline" size={40} color="#94a3b8" />
          <View style={styles.exampleContent}>
            <Text style={styles.exampleTitle}>Where to find it:</Text>
            <Text style={styles.exampleText}>
              Look at your plant's screen. The ID is displayed as "Plant ID: GP-XXXXXX"
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleVerifyPlant}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Verify & Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={styles.backButtonText}>Back to Instructions</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  exampleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exampleContent: {
    flex: 1,
    marginLeft: 16,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    marginLeft: 8,
  },
});