// app/(tabs)/control.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { database } from '@/config/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function ControlScreen() {
  const [ledState, setLedState] = useState(false);
  const [motorSpeed, setMotorSpeed] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen to current control states
    const controlRef = ref(database, 'esp32/device1/controls');
    
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLedState(data.ledState ?? false);
        setMotorSpeed(data.motorSpeed ?? 0);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleLED = async () => {
    setLoading(true);
    try {
      const controlRef = ref(database, 'esp32/device1/controls/ledState');
      await set(controlRef, !ledState);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const setMotor = async (speed: number) => {
    setLoading(true);
    try {
      const controlRef = ref(database, 'esp32/device1/controls/motorSpeed');
      await set(controlRef, speed);
      setMotorSpeed(speed);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (command: string) => {
    setLoading(true);
    try {
      const commandRef = ref(database, 'esp32/device1/commands');
      await update(commandRef, {
        [command]: {
          timestamp: Date.now(),
          executed: false,
        }
      });
      Alert.alert('Success', `Command "${command}" sent to ESP32`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* LED Control */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="bulb" size={28} color="#fbbf24" />
          <Text style={styles.cardTitle}>LED Control</Text>
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>LED Status</Text>
          <Switch
            value={ledState}
            onValueChange={toggleLED}
            disabled={loading}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor={ledState ? '#60a5fa' : '#f5f5f5'}
          />
        </View>
        <Text style={styles.statusText}>
          {ledState ? '💡 LED is ON' : '⚫ LED is OFF'}
        </Text>
      </View>

      {/* Motor Speed Control */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer" size={28} color="#8b5cf6" />
          <Text style={styles.cardTitle}>Motor Speed</Text>
        </View>
        <Text style={styles.speedValue}>{motorSpeed}%</Text>
        <View style={styles.speedButtons}>
          {[0, 25, 50, 75, 100].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                motorSpeed === speed && styles.speedButtonActive,
              ]}
              onPress={() => setMotor(speed)}
              disabled={loading}>
              <Text
                style={[
                  styles.speedButtonText,
                  motorSpeed === speed && styles.speedButtonTextActive,
                ]}>
                {speed}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Commands */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="terminal" size={28} color="#10b981" />
          <Text style={styles.cardTitle}>Quick Commands</Text>
        </View>
        <View style={styles.commandGrid}>
          <TouchableOpacity
            style={styles.commandButton}
            onPress={() => sendCommand('reset')}
            disabled={loading}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.commandButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commandButton}
            onPress={() => sendCommand('calibrate')}
            disabled={loading}>
            <Ionicons name="settings" size={24} color="#fff" />
            <Text style={styles.commandButtonText}>Calibrate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commandButton}
            onPress={() => sendCommand('sleep')}
            disabled={loading}>
            <Ionicons name="moon" size={24} color="#fff" />
            <Text style={styles.commandButtonText}>Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commandButton}
            onPress={() => sendCommand('wake')}
            disabled={loading}>
            <Ionicons name="sunny" size={24} color="#fff" />
            <Text style={styles.commandButtonText}>Wake</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
        <Text style={styles.infoText}>
          Controls are sent to Firebase Realtime Database. 
          Your ESP32 should listen to these changes and respond accordingly.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#94a3b8',
  },
  statusText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  speedValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  speedButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  speedButtonTextActive: {
    color: '#fff',
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  commandButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  commandButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 12,
    lineHeight: 20,
  },
});