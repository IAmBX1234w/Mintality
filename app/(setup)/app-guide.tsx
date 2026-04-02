// app/(setup)/app-guide.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AppGuideScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const pages = [
    {
      icon: 'checkmark-done',
      color: '#10b981',
      title: 'Set Daily Goals',
      description: 'Every day, set goals you want to accomplish. Complete them to keep your plant happy!',
    },
    {
      icon: 'leaf',
      color: '#22c55e',
      title: 'Watch Your Plant Grow',
      description: 'As you complete tasks, your plant\'s screen will update to show your progress.',
    },
    {
      icon: 'water',
      color: '#3b82f6',
      title: 'Complete 100% to Water',
      description: 'When you finish all your goals, your plant automatically gets watered!',
    },
    {
      icon: 'analytics',
      color: '#8b5cf6',
      title: 'Track Your Progress',
      description: 'View your completion history and see how consistent you\'ve been.',
    },
  ];

  const handleContinue = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const currentPageData = pages[currentPage];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: currentPageData.color }]}>
            <Ionicons name={currentPageData.icon as any} size={80} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>{currentPageData.title}</Text>
        <Text style={styles.description}>{currentPageData.description}</Text>

        <View style={styles.dotsContainer}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentPage && styles.dotActive,
                index === currentPage && { backgroundColor: currentPageData.color },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentPageData.color }]}
          onPress={handleContinue}>
          <Text style={styles.buttonText}>
            {currentPage === pages.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
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
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 48,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
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