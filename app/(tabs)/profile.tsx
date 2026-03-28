// app/(tabs)/profile.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.userId}>ID: {user?.uid.substring(0, 12)}...</Text>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Configuration</Text>
        
        <View style={styles.menuItem}>
          <Ionicons name="hardware-chip" size={24} color="#3b82f6" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>ESP32 Device ID</Text>
            <Text style={styles.menuItemSubtext}>device1</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <Ionicons name="wifi" size={24} color="#10b981" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Connection Status</Text>
            <Text style={styles.menuItemSubtext}>Real-time Database</Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color="#f59e0b" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemSubtext}>Configure alerts</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color="#8b5cf6" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Data Refresh Rate</Text>
            <Text style={styles.menuItemSubtext}>Real-time</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#06b6d4" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Privacy & Security</Text>
            <Text style={styles.menuItemSubtext}>Manage permissions</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#94a3b8" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>App Version</Text>
            <Text style={styles.menuItemSubtext}>1.0.0</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#94a3b8" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Text style={styles.menuItemSubtext}>Get assistance</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

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
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 13,
    color: '#94a3b8',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
});