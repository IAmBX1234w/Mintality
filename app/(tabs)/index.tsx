// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { database } from '@/config/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface SensorData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  timestamp?: number;
}

interface ESP32Data {
  status?: string;
  lastSeen?: number;
  sensors?: SensorData;
  ledState?: boolean;
  [key: string]: any; // Allow any other fields from ESP32
}

export default function DashboardScreen() {
  const [esp32Data, setEsp32Data] = useState<ESP32Data>({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Reference to your ESP32 data in Realtime Database
    // Adjust this path to match your actual database structure
    const esp32Ref = ref(database, 'esp32/device1');

    // Listen for real-time updates
    const unsubscribe = onValue(
      esp32Ref,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setEsp32Data(data);
          setConnected(true);
          
          // Check if device is online (last seen within 30 seconds)
          if (data.lastSeen) {
            const now = Date.now();
            const lastSeen = data.lastSeen;
            setConnected(now - lastSeen < 30000);
          }
        } else {
          setConnected(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase read error:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      off(esp32Ref);
    };
  }, []);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => setLoading(true)} />
      }>
      
      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {connected ? 'Device Online' : 'Device Offline'}
          </Text>
        </View>
        <Text style={styles.lastSeenText}>
          Last seen: {formatTimestamp(esp32Data.lastSeen)}
        </Text>
      </View>

      {/* Sensor Data Cards */}
      <View style={styles.gridContainer}>
        {/* Temperature */}
        <View style={styles.sensorCard}>
          <Ionicons name="thermometer-outline" size={32} color="#f59e0b" />
          <Text style={styles.sensorValue}>
            {esp32Data.sensors?.temperature?.toFixed(1) ?? '--'}°C
          </Text>
          <Text style={styles.sensorLabel}>Temperature</Text>
        </View>

        {/* Humidity */}
        <View style={styles.sensorCard}>
          <Ionicons name="water-outline" size={32} color="#3b82f6" />
          <Text style={styles.sensorValue}>
            {esp32Data.sensors?.humidity?.toFixed(1) ?? '--'}%
          </Text>
          <Text style={styles.sensorLabel}>Humidity</Text>
        </View>

        {/* Pressure */}
        <View style={styles.sensorCard}>
          <Ionicons name="speedometer-outline" size={32} color="#8b5cf6" />
          <Text style={styles.sensorValue}>
            {esp32Data.sensors?.pressure?.toFixed(0) ?? '--'} hPa
          </Text>
          <Text style={styles.sensorLabel}>Pressure</Text>
        </View>

        {/* LED Status */}
        <View style={styles.sensorCard}>
          <Ionicons 
            name={esp32Data.ledState ? "bulb" : "bulb-outline"} 
            size={32} 
            color={esp32Data.ledState ? '#fbbf24' : '#6b7280'} 
          />
          <Text style={styles.sensorValue}>
            {esp32Data.ledState ? 'ON' : 'OFF'}
          </Text>
          <Text style={styles.sensorLabel}>LED Status</Text>
        </View>
      </View>

      {/* Raw Data Display */}
      <View style={styles.rawDataCard}>
        <Text style={styles.rawDataTitle}>Raw Data</Text>
        <ScrollView horizontal>
          <Text style={styles.rawDataText}>
            {JSON.stringify(esp32Data, null, 2)}
          </Text>
        </ScrollView>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
        <Text style={styles.infoText}>
          This dashboard displays real-time data from your ESP32 device. 
          Make sure your ESP32 is connected and sending data to Firebase Realtime Database.
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
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  lastSeenText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sensorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sensorValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  rawDataCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rawDataTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  rawDataText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#10b981',
    lineHeight: 18,
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