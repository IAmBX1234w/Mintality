// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/config/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface PlantState {
  isOnline: boolean;
  soilMoisture: number;
  motorState: 'on' | 'off';
  screenState: string;
  lastWatered: number | null;
}

export default function HomeScreen() {
  const { user, userData } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showWateringPopup, setShowWateringPopup] = useState(false);
  const [plantState, setPlantState] = useState<PlantState>({
    isOnline: false,
    soilMoisture: 0,
    motorState: 'off',
    screenState: 'idle',
    lastWatered: null,
  });
  const [selectedPresetGoals, setSelectedPresetGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const presetGoals = [
    'Complete work tasks',
    'Exercise for 30 minutes',
    'Read for 20 minutes',
    'Meditate',
    'Drink 8 glasses of water',
    'Study for 1 hour',
    'Clean workspace',
    'Call a friend',
  ];

  // Check if today's goals are set
  useEffect(() => {
    if (!user || !userData) return;

    const today = new Date().toISOString().split('T')[0];
    const goalsRef = ref(database, `users/${user.uid}/goals/${today}`);

    const unsubscribe = onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        const goalsArray = Object.keys(goalsData).map((key) => ({
          id: key,
          ...goalsData[key],
        }));
        setGoals(goalsArray);
        
        // Calculate completion percentage
        const completed = goalsArray.filter((g) => g.completed).length;
        const total = goalsArray.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        setCompletionPercentage(percentage);
        
        // Update screen state based on completion
        updateScreenState(percentage);
      } else {
        // No goals set for today - show modal
        setShowGoalModal(true);
      }
    });

    return unsubscribe;
  }, [user, userData]);

  // Listen to plant state
  useEffect(() => {
    if (!userData?.plantId) return;

    const plantRef = ref(database, `plants/${userData.plantId}`);

    const unsubscribe = onValue(plantRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        const newPlantState: PlantState = {
          isOnline: data.isOnline || false,
          soilMoisture: data.soilMoisture || 0,
          motorState: data.motorState || 'off',
          screenState: data.screenState || 'idle',
          lastWatered: data.lastWatered || null,
        };
        
        // Check if watering just completed
        if (plantState.motorState === 'on' && newPlantState.motorState === 'off') {
          setShowWateringPopup(true);
          markWateringComplete();
        }
        
        setPlantState(newPlantState);
      }
    });

    return unsubscribe;
  }, [userData?.plantId, plantState.motorState]);

  const updateScreenState = async (percentage: number) => {
    if (!userData?.plantId) return;

    let screenState = 'idle';
    if (percentage >= 100) {
      screenState = 'celebrating';
    } else if (percentage >= 75) {
      screenState = 'happy';
    } else if (percentage >= 50) {
      screenState = 'neutral';
    } else if (percentage >= 25) {
      screenState = 'waiting';
    } else {
      screenState = 'sad';
    }

    await update(ref(database, `plants/${userData.plantId}`), {
      screenState,
      completionPercentage: percentage,
    });

    // If 100% complete, trigger watering
    if (percentage === 100) {
      await update(ref(database, `plants/${userData.plantId}`), {
        motorState: 'on',
      });
    }
  };

  const markWateringComplete = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    await update(ref(database, `users/${user.uid}/watering/${today}`), {
      completed: true,
      timestamp: Date.now(),
    });
  };

  const handleSaveGoals = async () => {
    if (selectedPresetGoals.length === 0 && !customGoal.trim()) {
      Alert.alert('Error', 'Please select at least one goal');
      return;
    }

    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const goalsData: { [key: string]: { text: string; completed: boolean } } = {};

    selectedPresetGoals.forEach((goal, index) => {
      goalsData[`goal_${index}`] = {
        text: goal,
        completed: false,
      };
    });

    if (customGoal.trim()) {
      goalsData[`goal_${selectedPresetGoals.length}`] = {
        text: customGoal.trim(),
        completed: false,
      };
    }

    await set(ref(database, `users/${user.uid}/goals/${today}`), goalsData);
    
    setShowGoalModal(false);
    setSelectedPresetGoals([]);
    setCustomGoal('');
  };

  const toggleGoalCompletion = async (goalId: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const goal = goals.find((g) => g.id === goalId);
    
    if (goal) {
      await update(ref(database, `users/${user.uid}/goals/${today}/${goalId}`), {
        completed: !goal.completed,
      });
    }
  };

  const togglePresetGoal = (goal: string) => {
    if (selectedPresetGoals.includes(goal)) {
      setSelectedPresetGoals(selectedPresetGoals.filter((g) => g !== goal));
    } else {
      setSelectedPresetGoals([...selectedPresetGoals, goal]);
    }
  };

  const getPlantMoistureStatus = () => {
    if (plantState.soilMoisture > 70) return { text: 'Well watered', color: '#10b981' };
    if (plantState.soilMoisture > 40) return { text: 'Adequate', color: '#22c55e' };
    if (plantState.soilMoisture > 20) return { text: 'Needs water', color: '#f59e0b' };
    return { text: 'Very dry', color: '#ef4444' };
  };

  const moistureStatus = getPlantMoistureStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userData?.name}!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
        <View style={styles.plantStatus}>
          <View style={[styles.statusDot, { 
            backgroundColor: plantState.isOnline ? '#10b981' : '#ef4444' 
          }]} />
          <Text style={styles.statusText}>
            {plantState.isOnline ? 'Plant Connected' : 'Plant Offline'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
          </View>
          
          <Text style={styles.progressSubtitle}>
            {goals.filter(g => g.completed).length} of {goals.length} goals completed
          </Text>
        </View>

        {/* Plant Status Card */}
        <View style={styles.plantCard}>
          <View style={styles.plantCardHeader}>
            <Ionicons name="leaf" size={32} color="#10b981" />
            <Text style={styles.plantCardTitle}>Plant Status</Text>
          </View>
          
          <View style={styles.plantInfoRow}>
            <Text style={styles.plantInfoLabel}>Soil Moisture:</Text>
            <Text style={[styles.plantInfoValue, { color: moistureStatus.color }]}>
              {plantState.soilMoisture}% - {moistureStatus.text}
            </Text>
          </View>
          
          <View style={styles.plantInfoRow}>
            <Text style={styles.plantInfoLabel}>Plant Mood:</Text>
            <Text style={styles.plantInfoValue}>{plantState.screenState}</Text>
          </View>
        </View>

        {/* Goals List */}
        <View style={styles.goalsSection}>
          <View style={styles.goalsSectionHeader}>
            <Text style={styles.goalsTitle}>Today's Goals</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(true)}>
              <Ionicons name="add-circle" size={28} color="#10b981" />
            </TouchableOpacity>
          </View>

          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalItem}
              onPress={() => toggleGoalCompletion(goal.id)}>
              <View style={[
                styles.checkbox,
                goal.completed && styles.checkboxCompleted,
              ]}>
                {goal.completed && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </View>
              <Text style={[
                styles.goalText,
                goal.completed && styles.goalTextCompleted,
              ]}>
                {goal.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Goal Selection Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Today's Goals</Text>
            <Text style={styles.modalSubtitle}>
              Select goals you want to accomplish today
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {presetGoals.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetGoalItem,
                    selectedPresetGoals.includes(goal) && styles.presetGoalItemSelected,
                  ]}
                  onPress={() => togglePresetGoal(goal)}>
                  <Text style={[
                    styles.presetGoalText,
                    selectedPresetGoals.includes(goal) && styles.presetGoalTextSelected,
                  ]}>
                    {goal}
                  </Text>
                  {selectedPresetGoals.includes(goal) && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}

              <TextInput
                style={styles.customGoalInput}
                placeholder="Add custom goal..."
                value={customGoal}
                onChangeText={setCustomGoal}
                placeholderTextColor="#94a3b8"
              />
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleSaveGoals}>
              <Text style={styles.modalButtonText}>Save Goals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Watering Complete Popup */}
      <Modal
        visible={showWateringPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWateringPopup(false)}>
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Ionicons name="water" size={80} color="#3b82f6" />
            <Text style={styles.popupTitle}>🎉 Plant Watered!</Text>
            <Text style={styles.popupText}>
              Great job completing all your goals today! Your plant has been watered.
            </Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={() => setShowWateringPopup(false)}>
              <Text style={styles.popupButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#94a3b8',
  },
  plantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  plantCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  plantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  plantCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 12,
  },
  plantInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plantInfoLabel: {
    fontSize: 16,
    color: '#94a3b8',
  },
  plantInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  goalsSection: {
    marginBottom: 24,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  goalItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#334155',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  goalTextCompleted: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 24,
  },
  modalScroll: {
    maxHeight: 400,
    marginBottom: 24,
  },
  presetGoalItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  presetGoalItemSelected: {
    borderColor: '#10b981',
    backgroundColor: '#10b98110',
  },
  presetGoalText: {
    fontSize: 16,
    color: '#fff',
  },
  presetGoalTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  customGoalInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#334155',
  },
  modalButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#334155',
  },
  popupTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  popupText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  popupButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  popupButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});