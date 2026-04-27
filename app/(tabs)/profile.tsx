// app/(tabs)/profile.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    if (Platform.OS == "web") {
      if (confirm("Are you sure you want to sign out?")) {
        logout();
        router.replace("/(auth)/login");
      }
      return;
    }

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
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
            {userData?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <Text style={styles.name}>{userData?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.plantId}>Plant ID: {userData?.plantId}</Text>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color="#10b981" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemSubtext}>Goal reminders & updates</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color="#3b82f6" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Daily Reminders</Text>
            <Text style={styles.menuItemSubtext}>Set goal reminder times</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="leaf-outline" size={24} color="#22c55e" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Plant Settings</Text>
            <Text style={styles.menuItemSubtext}>Watering & maintenance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color="#8b5cf6" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>Help & Support</Text>
            <Text style={styles.menuItemSubtext}>Get help with your plant</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="book-outline" size={24} color="#f59e0b" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>User Guide</Text>
            <Text style={styles.menuItemSubtext}>Learn how to use the app</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#06b6d4" />
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemText}>About Growth Plant</Text>
            <Text style={styles.menuItemSubtext}>Version 1.0.0</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    paddingTop: 60,
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
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
  },
  plantId: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
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