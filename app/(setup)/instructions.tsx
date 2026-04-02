// app/(setup)/instructions.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function InstructionsScreen() {
  const router = useRouter();

  const steps = [
    {
      icon: 'cube-outline',
      title: 'Unbox Your Plant',
      description: 'Carefully remove the Growth Plant from the packaging.',
    },
    {
      icon: 'water-outline',
      title: 'Fill Water Reservoir',
      description: 'Fill the water reservoir at the base of the plant. Use room temperature water.',
    },
    {
      icon: 'power-outline',
      title: 'Connect Power',
      description: 'Plug the USB-C cable into the plant and connect to a power source.',
    },
    {
      icon: 'wifi-outline',
      title: 'Wait for WiFi Mode',
      description: 'The screen will display "WiFi Setup Mode" when ready. This may take 30 seconds.',
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Connect to WiFi',
      description: 'On your phone, connect to the WiFi network "GrowthPlant-XXXX" and follow the prompts.',
    },
    {
      icon: 'checkmark-circle-outline',
      title: 'Verify Connection',
      description: 'Once connected, the plant screen will show "Connected" and display your plant ID.',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="construct" size={60} color="#10b981" />
          <Text style={styles.title}>Setup Your Plant</Text>
          <Text style={styles.subtitle}>
            Follow these steps to get your Growth Plant ready
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              
              <View style={styles.stepIconContainer}>
                <Ionicons name={step.icon as any} size={32} color="#10b981" />
              </View>
              
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#3b82f6" />
          <Text style={styles.noteText}>
            Make sure your plant is within range of your WiFi router for the best connection.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(setup)/connect-plant')}>
          <Text style={styles.buttonText}>I've Completed Setup</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  stepsContainer: {
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepIconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
});