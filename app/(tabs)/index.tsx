// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAuth } from '@/contexts/AuthContext';
import { database } from '@/config/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { geminiService } from '@/services/geminiService';
import { GoalCompleteModal } from '@/components/GoalCompleteModal';
import { WateringModal } from '@/components/WateringModal';

// ── Figma Assets ──────────────────────────────────────────────
import backgroundScene  from '@/assets/images/img025021.png';
import union            from '@/assets/decorations/union1.png';
import union2           from '@/assets/decorations/union2.png';
import union3           from '@/assets/decorations/union3.png';
import mascotSitDown    from '@/assets/mascots/mascotSitDown1.png';
import mascotSleep      from '@/assets/mascots/sleepMascot31.png';   // shown after watering
import cup21            from '@/assets/icons/cup21.png';
import pencilIcon       from '@/assets/icons/pencilIcon1.png';
import footstepsIcon    from '@/assets/icons/footstepsIcon1.png';
import yogaMatIcon      from '@/assets/icons/yogaMatIcon1.png';
import leafFill         from '@/assets/icons/leafFill.png';
import z                from '@/assets/icons/z.png';

// ─────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  text: string;
  description?: string;
  icon?: string;
  color?: string;
  completed: boolean;
}

interface PlantState {
  isOnline: boolean;
  soilMoisture: number;
  motorState: 'on' | 'off';
  screenState: string;
  lastWatered: number | null;
}

const GOAL_ICON_MAP: Record<string, any> = {
  'Drink 8+ cups of water': cup21,
  'Journal for 5 minutes':  pencilIcon,
  '10 minute walk':         footstepsIcon,
  '15 minute yoga':         yogaMatIcon,
};

const { width, height } = Dimensions.get('window');


// ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, userData } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [plantState, setPlantState] = useState<PlantState>({
    isOnline: false,
    soilMoisture: 0,
    motorState: 'off',
    screenState: 'idle',
    lastWatered: null,
  });

  // Goal picking
  const [selectedPresetGoals, setSelectedPresetGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [customGoals, setCustomGoals] = useState<string[]>([]);

  // Progress & watering
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showGoalCompleteModal, setShowGoalCompleteModal] = useState(false);
  const [lastCompletedGoal, setLastCompletedGoal] = useState<{ text: string; description: string } | null>(null);
  const [showWateringModal, setShowWateringModal] = useState(false);
  // true once the user has tapped "TAP TO WATER" and the WateringModal finishes
  const [hasWatered, setHasWatered] = useState(false);

  // Goal confirmation popup
  const [confirmGoal, setConfirmGoal]       = useState<Goal | null>(null);
  const [showCamera, setShowCamera]         = useState(false);
  const [capturedPhoto, setCapturedPhoto]   = useState<string | null>(null);
  const [verifying, setVerifying]           = useState(false);
  const [verifyResult, setVerifyResult]     = useState<'success' | 'fail' | null>(null);

  // ─────────────────────────────────────────────

  const presetGoals = [
    { text: 'Drink 8+ cups of water', description: 'Stay hydrated for the day',   icon: 'water',   color: 'rgba(10, 134, 84, 1)'  },
    { text: 'Journal for 5 minutes',  description: 'Write about your day',         icon: 'create',  color: 'rgba(248, 125, 168, 1)' },
    { text: '10 minute walk',         description: 'Spend some time in nature',    icon: 'walk',    color: 'rgba(69, 48, 36, 1)'   },
    { text: '15 minute yoga',         description: 'Stretch and relax',            icon: 'fitness', color: 'rgba(109, 175, 136, 1)' },
    { text: 'Read for 20 minutes',    description: 'Pick your favorite book',      icon: 'book',    color: 'rgba(224, 152, 51, 1)'  },
  ];

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getImageUri = (base64: string) => {
    if (base64.startsWith('data:image/')) return base64;
    return `data:image/jpeg;base64,${base64}`;
  };

  // ── Firebase: goals ──
  useEffect(() => {
    if (!user || !userData) return;
    const today = getTodayDate();
    const goalsRef = ref(database, `users/${user.uid}/goals/${today}`);
    const unsub = onValue(goalsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const arr: Goal[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
        setGoals(arr);
        const pct = arr.length > 0
          ? Math.round((arr.filter((g) => g.completed).length / arr.length) * 100)
          : 0;
        setCompletionPercentage(pct);
        updateScreenState(pct);
      } else {
        setGoals([]);
        setCompletionPercentage(0);
        setShowGoalModal(true);
      }
    });
    return unsub;
  }, [user, userData]);

  // ── Firebase: plant ──
  useEffect(() => {
    if (!userData?.plantId) return;
    const unsub = onValue(ref(database, `plants/${userData.plantId}`), (snap) => {
      if (snap.exists()) {
        const d = snap.val();
        setPlantState({
          isOnline:     d.isOnline     || false,
          soilMoisture: d.soilMoisture || 0,
          motorState:   d.motorState   || 'off',
          screenState:  d.screenState  || 'idle',
          lastWatered:  d.lastWatered  || null,
        });
        // If we reload and today's plant was already watered, restore state
        const today = getTodayDate();
        if (d.lastWateredDate === today) setHasWatered(true);
      }
    });
    return unsub;
  }, [userData?.plantId]);

  const updateScreenState = async (pct: number) => {
    if (!userData?.plantId) return;
    const s = pct >= 100 ? 'celebrating'
            : pct >= 75  ? 'happy'
            : pct >= 50  ? 'neutral'
            : pct >= 25  ? 'waiting'
            :              'sad';
    await update(ref(database, `plants/${userData.plantId}`), {
      screenState: s,
      completionPercentage: pct,
    });
    // ⚠️ No automatic watering — user must tap the bar
  };

  // ── Called when user taps "TAP TO WATER YOUR PLANT" ──
  const handleWaterTap = async () => {
    if (completionPercentage < 100 || hasWatered) return;
    // Start the motor
    if (userData?.plantId) {
      await update(ref(database, `plants/${userData.plantId}`), { motorState: 'on' });
    }
    setShowWateringModal(true);
  };

  // ── Called when WateringModal animation completes ──
  const handleWateringComplete = async () => {
    setShowWateringModal(false);
    // Stop motor, record date
    const today = getTodayDate();
    if (userData?.plantId) {
      await update(ref(database, `plants/${userData.plantId}`), {
        motorState:      'off',
        lastWatered:     Date.now(),
        lastWateredDate: today,       // used to restore state on reload
      });
    }
    setHasWatered(true);
  };

  // ── Goal picking ──
  const handleSaveGoals = async () => {
    // if (selectedPresetGoals.length === 0 && customGoals.length === 0) {
    //   Alert.alert('Error', 'Please select at least one goal');
    //   return;
    // }
    if (!user) return;
    const today = getTodayDate();
    const goalsData: Record<string, any> = {};
    selectedPresetGoals.forEach((text, i) => {
      const pg = presetGoals.find((g) => g.text === text);
      goalsData[`goal_${i}`] = {
        text,
        description: pg?.description || '',
        icon:        pg?.icon        || 'checkmark-circle',
        color:       pg?.color       || 'rgba(112, 180, 140, 1)',
        completed:   false,
      };
    });
    customGoals.forEach((text, i) => {
      goalsData[`goal_${selectedPresetGoals.length + i}`] = {
        text,
        description: 'Custom goal',
        icon:        'star',
        color:       'rgba(112, 180, 140, 1)',
        completed:   false,
      };
    });
    await set(ref(database, `users/${user.uid}/goals/${today}`), goalsData);
    // Reset watering state — new goals mean the day resets
    setHasWatered(false);
    if (userData?.plantId) {
      await update(ref(database, `plants/${userData.plantId}`), {
        lastWateredDate: null,
        motorState: 'off',
      });
    }
    setShowGoalModal(false);
    setSelectedPresetGoals([]);
    setCustomGoal('');
    setCustomGoals([]);
  };

  const addCustomGoal = () => {
    if (customGoal.trim()) {
      setCustomGoals([...customGoals, customGoal.trim()]);
      setCustomGoal('');
    }
  };
  const removeCustomGoal = (i: number) =>
    setCustomGoals(customGoals.filter((_, idx) => idx !== i));
  const togglePresetGoal = (text: string) =>
    setSelectedPresetGoals((prev) =>
      prev.includes(text) ? prev.filter((g) => g !== text) : [...prev, text]
    );

  // ── Goal confirmation flow ──
  const handleGoalCardPress = (goal: Goal) => {
    if (goal.completed) return;
    setConfirmGoal(goal);
    setShowCamera(false);
    setCapturedPhoto(null);
    setVerifyResult(null);
  };

  const closeConfirmModal = () => {
    setConfirmGoal(null);
    setShowCamera(false);
    setCapturedPhoto(null);
    setVerifyResult(null);
    setVerifying(false);
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera permission required', 'Please allow camera access to verify your goal.');
        return;
      }
    }
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      setCapturedPhoto(photo?.base64 || null);
      setShowCamera(false);
    } catch {
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const handleVerifyWithGemini = async () => {
    if (!capturedPhoto || !confirmGoal) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await geminiService.verifyGoalCompletion({
        imageBase64:     capturedPhoto,
        goalText:        confirmGoal.text,
        goalDescription: confirmGoal.description || '',
      });
      if (result.completed) {
        setVerifyResult('success');
        await markGoalComplete(confirmGoal.id);
      } else {
        setVerifyResult('fail');
      }
    } catch {
      Alert.alert('Verification failed', 'Could not verify your goal. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const markGoalComplete = async (goalId: string) => {
    if (!user) return;
    const today = getTodayDate();
    await update(ref(database, `users/${user.uid}/goals/${today}/${goalId}`), { completed: true });
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setLastCompletedGoal({
        text:        goal.text,
        description: goal.description || 'Great job staying on track!',
      });
    }
  };

  const handleVerifySuccess = () => {
    closeConfirmModal();
    setShowGoalCompleteModal(true);
  };

  // ─────────────────────────────────────────────
  const allComplete  = completionPercentage === 100;
  const goalsLeft    = goals.filter((g) => !g.completed).length;
  // Which mascot to show
  const activeMascot = hasWatered ? mascotSleep : mascotSitDown;

  // ─────────────────────────────────────────────

  return (
    <View style={styles.root}>

      {/* ══════════════════════════════════════════════
          FULL-SCREEN BACKGROUND LAYERS
      ══════════════════════════════════════════════ */}
      <View style={styles.fullBackground}>
        <View style={styles.bgCream} />
        <View style={styles.bgGreenBottom} />
        <Image source={backgroundScene} style={styles.bgScene} resizeMode="cover" />
        <Image source={union2} style={styles.union2} resizeMode="contain" />
        <Image source={union}  style={styles.union1} resizeMode="contain" />
        <Image source={union3} style={styles.union3} resizeMode="contain" />
      </View>

      {/* ══════════════════════════════════════════════
          FOREGROUND
      ══════════════════════════════════════════════ */}
      <View style={styles.foreground}>

        {/* 2 DAY STREAK */}
        <View style={styles.streakBadge} pointerEvents="none">
          <Image source={leafFill} style={styles.streakLeaf} resizeMode="contain" />
          <Text style={styles.streakText}>2 DAY STREAK</Text>
        </View>

        {/* Mascot — swaps to sleep mascot after watering */}
        <View style={styles.mascotArea} pointerEvents="none">
          <Image source={activeMascot} style={styles.mascot} resizeMode="contain" />
        </View>

          {hasWatered && (
            <>
              <Image source={z} style={[styles.z, styles.z1]} resizeMode="contain" />
              <Image source={z} style={[styles.z, styles.z2]} resizeMode="contain" />
              <Image source={z} style={[styles.z, styles.z3]} resizeMode="contain" />
            </>
          )}

        {/* ── FIXED CONTENT CARD ── */}
        <View style={styles.contentOuter}>
          <View style={styles.contentCard}>

            {/* ── Progress / Water bar ── */}
            {hasWatered ? (
              /* ── COMPLETED state (GoalsAndWaterCompleted Figma) ──
                 rectangle65: teal block rgba(72,187,210), "COMPLETED" in light cyan */
              <View style={styles.completedBarOuter}>
                <View style={styles.completedBarFill} />
                <Text style={styles.completedBarLabel}>COMPLETED</Text>
              </View>
            ) : (
              /* ── Normal / tap-to-water progress bar ── */
              <TouchableOpacity
                style={styles.progressOuter}
                onPress={handleWaterTap}
                disabled={!allComplete}
                activeOpacity={allComplete ? 0.75 : 1}
              >
                <View style={styles.progressTrack}>
                  {/* Cyan fill — always rendered so bar shows 100% full at tap-to-water stage */}
                  <View style={[styles.progressFill, { width: `${completionPercentage}%` as any }]} />
                  {/* Water drops — hidden at 100% so only the tap label shows */}
                  {!allComplete && (
                    <View style={styles.dropsRow}>
                      {[0, 1, 2].map((i) => (
                        <Ionicons
                          key={i}
                          name="water"
                          size={20}
                          color={completionPercentage > i * 33
                            ? 'rgba(72, 187, 210, 1)'
                            : 'rgba(197, 220, 202, 1)'}
                          style={{ marginHorizontal: 2 }}
                        />
                      ))}
                    </View>
                  )}
                </View>

                {/* Label — centered "TAP TO WATER" at 100%, right-aligned % otherwise */}
                <Text style={[
                  styles.progressLabel,
                  allComplete && styles.progressLabelCentered,
                ]}>
                  {allComplete ? 'TAP TO WATER YOUR PLANT' : `${completionPercentage}%`}
                </Text>
              </TouchableOpacity>
            )}

            {/* ── Subtitle ── */}
            <Text style={styles.subtitleText}>Complete goals to water your plant!</Text>

            {/* ── Goals header ── */}
            <View style={styles.goalsHeader}>
              <Text style={styles.goalsLeftCount}>{goalsLeft}</Text>
              <Text style={styles.goalsLeftWord}>
                {' '}{goalsLeft === 1 ? 'Goal left' : 'Goals left'}
              </Text>
              <View style={styles.goalsHeaderActions}>
                <TouchableOpacity style={styles.editGoalsBtn} onPress={() => setShowGoalModal(true)}>
                  <Text style={styles.editGoalsText}>EDIT GOALS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.plusBtn} onPress={() => setShowGoalModal(true)}>
                  <Text style={styles.plusBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Goal cards (inner scroll only) ── */}
            <ScrollView
              style={styles.goalsScroll}
              contentContainerStyle={styles.goalsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {goals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    There are currently no selected goals for the day
                  </Text>
                  <Text style={styles.emptySubtitle}>Select goals to start your day!</Text>
                </View>
              ) : (
                goals.map((goal) => {
                  const pngIcon = GOAL_ICON_MAP[goal.text];
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={styles.goalCard}
                      onPress={() => handleGoalCardPress(goal)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.goalIconWrap}>
                        {pngIcon
                          ? <Image source={pngIcon} style={styles.goalIconImg} resizeMode="contain" />
                          : <Ionicons
                              name={(goal.icon as any) || 'checkmark-circle'}
                              size={42}
                              color={goal.color || 'rgba(112, 180, 140, 1)'}
                            />
                        }
                      </View>
                      <View style={styles.goalTextBlock}>
                        <Text style={[styles.goalTitle, { color: goal.color || 'rgba(69, 48, 36, 1)' }]}>
                          {goal.text}
                        </Text>
                        {goal.description
                          ? <Text style={[styles.goalDesc, { color: goal.color || 'rgba(130, 155, 136, 1)' }]}>
                              {goal.description}
                            </Text>
                          : null}
                      </View>
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleGoalCardPress(goal)}
                      >
                        <Text style={styles.completeBtnText}>
                          {goal.completed ? 'COMPLETED' : 'COMPLETE'}
                        </Text>
                      </TouchableOpacity>
                      {goal.completed && <View style={styles.completedOverlay} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Plant status */}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, {
                backgroundColor: plantState.isOnline
                  ? 'rgba(112, 180, 140, 1)'
                  : 'rgba(239, 68, 68, 1)',
              }]} />
              <Text style={styles.statusText}>
                {plantState.isOnline ? 'Plant Connected' : 'Plant Offline'}
                {plantState.isOnline ? `  ·  Moisture: ${plantState.soilMoisture}%` : ''}
              </Text>
            </View>

          </View>
        </View>
      </View>

      {/* ══════════════════════════════════════════════
          GOAL CONFIRMATION MODAL
      ══════════════════════════════════════════════ */}
      <Modal
        visible={!!confirmGoal}
        animationType="fade"
        transparent
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.confirmOverlay}>

          {showCamera ? (
            <View style={styles.cameraContainer}>
              <CameraView ref={cameraRef} style={styles.camera} facing="back">
                <View style={styles.cameraControls}>
                  <TouchableOpacity style={styles.cameraBackBtn} onPress={() => setShowCamera(false)}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraShutterBtn} onPress={handleTakePhoto}>
                    <View style={styles.cameraShutterInner} />
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>

          ) : capturedPhoto && verifyResult === null && !verifying ? (
            <View style={styles.confirmCard}>
              <Image source={{ uri: getImageUri(capturedPhoto) }} style={styles.photoPreview} />
              <Text style={styles.confirmPhotoHint}>Does this show you completing the goal?</Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.confirmBackBtn} onPress={handleOpenCamera}>
                  <Text style={styles.confirmBackText}>RETAKE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmSubmitBtn} onPress={handleVerifyWithGemini}>
                  <Text style={styles.confirmSubmitText}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            </View>

          ) : verifying ? (
            <View style={styles.confirmCard}>
              <ActivityIndicator size="large" color="rgba(112, 180, 140, 1)" style={{ marginBottom: 16 }} />
              <Text style={styles.confirmVerifyText}>Checking your photo...</Text>
            </View>

          ) : verifyResult === 'fail' ? (
            <View style={styles.confirmCard}>
              <Ionicons name="close-circle" size={64} color="rgba(239, 68, 68, 1)" style={{ marginBottom: 12 }} />
              <Text style={styles.confirmFailTitle}>Hmm, not quite!</Text>
              <Text style={styles.confirmFailSubtitle}>
                We couldn't verify you completed this goal. Try again!
              </Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.confirmBackBtn}
                  onPress={() => { setCapturedPhoto(null); setVerifyResult(null); }}
                >
                  <Text style={styles.confirmBackText}>RETRY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmCloseBtn} onPress={closeConfirmModal}>
                  <Text style={styles.confirmBackText}>BACK</Text>
                </TouchableOpacity>
              </View>
            </View>

          ) : verifyResult === 'success' ? (
            <View style={styles.confirmCard}>
              <Ionicons name="checkmark-circle" size={64} color="rgba(112, 180, 140, 1)" style={{ marginBottom: 12 }} />
              <Text style={styles.confirmSuccessTitle}>Goal verified!</Text>
              <TouchableOpacity style={styles.confirmSubmitBtn} onPress={handleVerifySuccess}>
                <Text style={styles.confirmSubmitText}>CONTINUE</Text>
              </TouchableOpacity>
            </View>

          ) : (
            <View style={styles.confirmCard}>
              <View style={styles.confirmGoalRow}>
                <View style={styles.confirmGoalIcon}>
                  {confirmGoal && GOAL_ICON_MAP[confirmGoal.text]
                    ? <Image
                        source={GOAL_ICON_MAP[confirmGoal.text]}
                        style={styles.confirmGoalIconImg}
                        resizeMode="contain"
                      />
                    : <Ionicons
                        name={(confirmGoal?.icon as any) || 'checkmark-circle'}
                        size={42}
                        color={confirmGoal?.color || 'rgba(112, 180, 140, 1)'}
                      />
                  }
                </View>
                <View style={styles.confirmGoalText}>
                  <Text style={[styles.confirmGoalTitle, { color: confirmGoal?.color || 'rgba(10, 134, 84, 1)' }]}>
                    {confirmGoal?.text}
                  </Text>
                  <Text style={[styles.confirmGoalDesc, { color: confirmGoal?.color || 'rgba(112, 180, 140, 1)' }]}>
                    {confirmGoal?.description}
                  </Text>
                </View>
              </View>

              <Text style={styles.confirmPrompt}>Take a photo to prove you did it!</Text>

              <View style={styles.confirmDefaultBtnRow}>
                <TouchableOpacity style={styles.takePhotoBtn} onPress={handleOpenCamera}>
                  <Text style={styles.takePhotoBtnText}>TAKE A PHOTO</Text>
                  <Ionicons name="camera" size={18} color="rgba(211, 182, 111, 1)" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBackPill} onPress={closeConfirmModal}>
                  <Text style={styles.confirmBackPillText}>BACK</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          PICKING GOALS MODAL
      ══════════════════════════════════════════════ */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        transparent
        onRequestClose={() => goals.length > 0 ? setShowGoalModal(false) : null}
      >
        <View style={styles.pgOverlay}>
          <View style={styles.pgCard}>

            <View style={styles.pgHeader}>
              <Text style={styles.pgHeaderTitle}>Select your daily goals</Text>
              <Text style={styles.pgHeaderSubtitle}>
                Simple goals that help boost your mood and attitude.
              </Text>
            </View>

            <View style={styles.pgScrollArea}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.pgScrollView}
                contentContainerStyle={styles.pgScrollContent}
              >
                {presetGoals.map((goal, i) => {
                  const sel     = selectedPresetGoals.includes(goal.text);
                  const pngIcon = GOAL_ICON_MAP[goal.text];
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.pgGoalRow}
                      onPress={() => togglePresetGoal(goal.text)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.pgGoalIcon}>
                        {pngIcon
                          ? <Image source={pngIcon} style={styles.pgGoalIconImg} resizeMode="contain" />
                          : <Ionicons name={goal.icon as any} size={38} color={goal.color} />
                        }
                      </View>
                      <View style={styles.pgGoalText}>
                        <Text style={[styles.pgGoalTitle, { color: goal.color }]}>{goal.text}</Text>
                        <Text style={[styles.pgGoalDesc,  { color: goal.color }]}>{goal.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.pgSelectBtn, sel && styles.pgSelectBtnSel]}
                        onPress={() => togglePresetGoal(goal.text)}
                      >
                        <Text style={styles.pgSelectBtnText}>{sel ? 'SELECTED' : 'SELECT'}</Text>
                      </TouchableOpacity>
                      {sel && <View style={styles.pgSelectedOverlay} />}
                    </TouchableOpacity>
                  );
                })}

                {/* Custom goal row */}
                <View style={styles.pgGoalRow}>
                  <View style={styles.pgGoalIcon}>
                    <Ionicons name="star" size={38} color="rgba(109, 175, 136, 1)" />
                  </View>
                  <View style={styles.pgGoalText}>
                    <Text style={[styles.pgGoalTitle, { color: 'rgba(109, 175, 136, 1)' }]}>Custom goal</Text>
                    <Text style={[styles.pgGoalDesc,  { color: 'rgba(112, 180, 140, 1)' }]}>Fully customizable</Text>
                  </View>
                  <TouchableOpacity style={styles.pgEditBtn}>
                    <Text style={styles.pgSelectBtnText}>EDIT</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.pgCustomInputRow}>
                  <TextInput
                    style={styles.pgCustomInput}
                    placeholder="Type your custom goal..."
                    placeholderTextColor="rgba(130, 155, 136, 0.5)"
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    onSubmitEditing={addCustomGoal}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={addCustomGoal} style={styles.pgCustomAddBtn}>
                    <Ionicons name="add-circle" size={36} color="rgba(112, 180, 140, 1)" />
                  </TouchableOpacity>
                </View>

                {customGoals.map((cg, i) => (
                  <View key={i} style={styles.pgCustomGoalChip}>
                    <Text style={styles.pgCustomGoalChipText}>{cg}</Text>
                    <TouchableOpacity onPress={() => removeCustomGoal(i)}>
                      <Ionicons name="close-circle" size={22} color="rgba(239, 68, 68, 1)" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.pgScrollTrack} pointerEvents="none">
                <View style={styles.pgScrollThumb} />
              </View>
            </View>

            <View style={styles.pgFooter}>
              <TouchableOpacity
                style={styles.pgBackBtn}
                onPress={() => goals.length > 0 ? setShowGoalModal(false) : null}
              >
                <Text style={styles.pgBackBtnText}>back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pgContinueBtn} onPress={handleSaveGoals}>
                <Text style={styles.pgContinueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {lastCompletedGoal && (
        <GoalCompleteModal
          visible={showGoalCompleteModal}
          goalText={lastCompletedGoal.text}
          goalDescription={lastCompletedGoal.description}
          onClose={() => setShowGoalCompleteModal(false)}
        />
      )}

      <WateringModal
        visible={showWateringModal}
        onComplete={handleWateringComplete}
        plantId={userData?.plantId || ''}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(254, 245, 236, 1)',
  },

  // ── Background layers ──
  fullBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgCream: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(254, 245, 236, 1)',
  },
  bgGreenBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(118, 172, 128, 1)',
  },
  bgScene: {
    position: 'absolute',
    top: 65,
    left: 0,
    width: 412,
    height: 400,
  },
  union2: { position: 'absolute', top: 42,  left: -8,  width: 197, height: 66 },
  union1: { position: 'absolute', top: 58,  right: 12, width: 134, height: 60 },
  union3: { position: 'absolute', top: 96,  left: 44,  width: 68,  height: 28 },

  // ── Foreground ──
  foreground: { flex: 1, zIndex: 1 },

  // Streak badge
  streakBadge: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6, paddingBottom: 6, paddingLeft: 7, paddingRight: 11,
    borderRadius: 19,
    backgroundColor: 'rgba(112, 180, 140, 1)',
  },
  streakLeaf: { width: 14, height: 14 },
  streakText: {
    color: 'rgba(242, 246, 243, 1)',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },

  // Mascot
  mascotArea: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  mascot: { width: 375, height: 375 },

  // ── Content card ──
  contentOuter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14,
    paddingBottom: 8,
    zIndex: 3,
  },
  contentCard: {
    height: 520,
    backgroundColor: 'rgba(197, 220, 202, 1)',
    borderRadius: 20,
    shadowColor: 'rgba(181, 181, 181, 0.25)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },

  // ── Progress bar (normal) ──
  // rectangle62: teal outer pill
  progressOuter: {
    height: 68,
    borderRadius: 19,
    backgroundColor: 'rgba(72, 187, 210, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  // rectangle63: white inner track
  progressTrack: {
    position: 'absolute',
    left: 12, right: 12,
    height: 46,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 247, 242, 1)',
    overflow: 'hidden',
  },
  // rectangle64: cyan fill
  progressFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: 19,
    backgroundColor: 'rgba(157, 240, 255, 1)',
  },
  // drops sit above fill
  dropsRow: {
    position: 'absolute',
    left: 8, top: 0, bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  // % label — right-aligned normally
  progressLabel: {
    position: 'absolute',
    right: 20,
    color: 'rgba(61, 152, 170, 1)',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: -0.41,
    zIndex: 3,
    fontFamily: 'Pangolin',
  },
  // "TAP TO WATER YOUR PLANT" — centered, slightly larger
  progressLabelCentered: {
    right: undefined,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
  } as any,

  // ── COMPLETED bar (post-watering) ──
  // Based on Figma GoalsAndWaterCompleted:
  //   rectangle62 (teal outer 325×68) + rectangle65 (filled teal 141×101) + "COMPLETED" text
  completedBarOuter: {
    height: 68,
    borderRadius: 19,
    backgroundColor: 'rgba(72, 187, 210, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  // Full-width fill to show completely watered
  completedBarFill: {
    position: 'absolute',
    left: 12, right: 12,
    top: 11, bottom: 11,
    borderRadius: 19,
    backgroundColor: 'rgba(157, 240, 255, 1)',
  },
  // "COMPLETED" label — Figma: rgba(157,240,255) text on teal bg
  // We flip it: white track fill, darker teal text
  completedBarLabel: {
    color: 'rgba(61, 152, 170, 1)',
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
    zIndex: 2,
  },

  // ── Subtitle ──
  subtitleText: {
    color: 'rgba(130, 155, 136, 1)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.41,
    marginBottom: 5,
    fontFamily: 'PalanquinDark',
  },

  // ── Goals header ──
  goalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalsLeftCount: {
    color: 'rgba(61, 112, 73, 1)',
    fontSize: 50,
    fontWeight: '700',
    letterSpacing: -0.41,
    lineHeight: 38,
    fontFamily: 'PatrickHandSC',
  },
  goalsLeftWord: {
    color: 'rgba(61, 112, 73, 1)',
    fontSize: 40,
    fontWeight: '400',
    letterSpacing: -0.41,
    lineHeight: 38,
    flex: 1,
    fontFamily: 'PatrickHandSC',
  },
  goalsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editGoalsBtn: {
    height: 39,
    paddingHorizontal: 14,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: 'rgba(238, 205, 125, 1)',
    backgroundColor: 'rgba(254, 216, 124, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editGoalsText: {
    color: 'rgba(196, 170, 106, 1)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },
  plusBtn: {
    width: 39, height: 39,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: 'rgba(238, 205, 125, 1)',
    backgroundColor: 'rgba(254, 216, 124, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  plusBtnText: {
    color: 'rgba(211, 182, 111, 1)',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 34,
    fontFamily: 'Pangolin',
  },

  // ── Inner goal scroll ──
  goalsScroll: { flex: 1 },
  goalsScrollContent: { paddingBottom: 8 },

  // ── Empty state ──
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: {
    width: 280,
    color: 'rgba(69, 48, 36, 1)',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.41,
    fontFamily: 'PalanquinDark',
  },
  emptySubtitle: {
    color: 'rgba(65, 50, 39, 1)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'NTR',
  },

  // ── Goal card ──
  goalCard: {
    width: '100%',
    minHeight: 64,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 246, 243, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  goalIconWrap: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  goalIconImg:  { width: 60, height: 60 },
  goalTextBlock: { flex: 1 },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.41,
    marginBottom: -8,
    fontFamily: 'PalanquinDark',
  },
  goalDesc: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    opacity: 0.85,
    fontFamily: 'NTR',
  },
  completeBtn: {
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: 'rgba(109, 175, 136, 1)',
    backgroundColor: 'rgba(112, 180, 140, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBtnText: {
    color: 'rgba(242, 246, 243, 1)',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    backgroundColor: 'rgba(4, 52, 33, 0.56)',
  },

  // ── Status row ──
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontSize: 13,
    color: 'rgba(130, 155, 136, 1)',
    fontWeight: '500',
    fontFamily: 'PalanquinDark',
  },

  // ══════════════════════════════════════════════
  // GOAL CONFIRMATION MODAL
  // ══════════════════════════════════════════════
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCard: {
    width: 323,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 246, 243, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  confirmGoalRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  confirmGoalIcon: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  confirmGoalIconImg: { width: 48, height: 48 },
  confirmGoalText: { flex: 1 },
  confirmGoalTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.41, marginBottom: 2, fontFamily: 'PalanquinDark' },
  confirmGoalDesc:  { fontSize: 12, fontWeight: '400', letterSpacing: -0.41, opacity: 0.85, fontFamily: 'NTR' },
  confirmPrompt: {
    color: 'rgba(136, 107, 90, 1)',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: -0.41,
    textAlign: 'center',
    fontFamily: 'PalanquinDark',
    marginBottom: 10,
  },
  confirmDefaultBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  takePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 39,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: 'rgba(238, 205, 125, 1)',
    backgroundColor: 'rgba(254, 216, 124, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  takePhotoBtnText: {
    color: 'rgba(211, 182, 111, 1)',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },
  confirmBackPill: {
    height: 39,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 4,
    borderColor: 'rgba(223, 172, 189, 1)',
    backgroundColor: 'rgba(239, 184, 202, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBackPillText: {
    color: 'rgba(242, 246, 243, 1)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'NTR',
  },
  cameraContainer: { width: '100%', height: '100%' },
  camera: { flex: 1 },
  cameraControls: {
    position: 'absolute',
    bottom: 40, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  cameraBackBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraShutterBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraShutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  photoPreview: { width: '100%', height: 180, borderRadius: 14 },
  confirmPhotoHint: {
    color: 'rgba(130, 155, 136, 1)',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: -0.41,
    marginBottom: 5,
    fontFamily: 'PalanquinDark',
  },
  confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBackBtn: {
    flex: 1, height: 50,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: 'rgba(223, 172, 189, 1)',
    backgroundColor: 'rgba(239, 184, 202, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCloseBtn: {
    flex: 1, height: 39,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: 'rgba(109, 175, 136, 1)',
    backgroundColor: 'rgba(112, 180, 140, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBackText: {
    color: 'rgba(242, 246, 243, 1)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },
  confirmSubmitBtn: {
    flex: 1, height: 50,
    borderRadius: 19,
    borderWidth: 4,
    paddingHorizontal: 15,
    borderColor: 'rgba(9, 119, 75, 1)',
    backgroundColor: 'rgba(10, 134, 84, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmSubmitText: {
    color: 'rgba(254, 255, 255, 1)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    fontFamily: 'Pangolin',
  },
  confirmVerifyText: {
    color: 'rgba(130, 155, 136, 1)',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: -0.41,
    fontFamily: 'PalanquinDark',
  },
  confirmFailTitle: {
    color: 'rgba(69, 48, 36, 1)',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.41,
    fontFamily: 'PalanquinDark',
  },
  confirmFailSubtitle: {
    color: 'rgba(130, 155, 136, 1)',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: -0.41,
    fontFamily: 'NTR',
  },
  confirmSuccessTitle: {
    color: 'rgba(61, 112, 73, 1)',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.41,
    fontFamily: 'PalanquinDark',
  },

  // ══════════════════════════════════════════════
  // PICKING GOALS MODAL
  // ══════════════════════════════════════════════
  pgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pgCard: {
    width: 355,
    maxHeight: 628,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'rgba(196, 221, 203, 1)',
    overflow: 'hidden',
  },
  pgHeader: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 12,
    paddingTop: 19, paddingHorizontal: 17, paddingBottom: 24,
    borderRadius: 15,
    backgroundColor: 'rgba(148, 195, 229, 1)',
    alignItems: 'center',
    gap: 3,
  },
  pgHeaderTitle: {
    color: 'rgba(254, 255, 255, 1)',
    fontSize: 35,
    fontWeight: '400',
    letterSpacing: -0.41,
    textAlign: 'center',
    fontFamily: 'PatrickHandSC',
  },
  pgHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.41,
    textAlign: 'center',
    fontFamily: 'NTR',
  },
  pgScrollArea: { flex: 1, flexDirection: 'row', maxHeight: 400 },
  pgScrollView: { flex: 1 },
  pgScrollContent: { paddingLeft: 16, paddingRight: 8, paddingBottom: 12, gap: 10 },
  pgScrollTrack: {
    width: 9, marginRight: 6, marginVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(242, 247, 242, 1)',
    overflow: 'hidden',
  },
  pgScrollThumb: { width: 9, height: 78, borderRadius: 15, backgroundColor: 'rgba(12, 77, 37, 1)' },
  pgGoalRow: {
    width: '100%',
    minHeight: 54,
    borderRadius: 19,
    backgroundColor: 'rgba(242, 246, 243, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pgGoalIcon: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  pgGoalIconImg: { width: 48, height: 48 },
  pgGoalText: { flex: 1 },
  pgGoalTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.41, marginBottom: -5, fontFamily: 'PalanquinDark' },
  pgGoalDesc:  { fontSize: 15, fontWeight: '400', letterSpacing: -0.41, opacity: 0.85, fontFamily: 'NTR' },
  pgSelectBtn: {
    height: 39, paddingHorizontal: 16,
    borderRadius: 19, borderWidth: 4,
    borderColor: 'rgba(109, 175, 136, 1)',
    backgroundColor: 'rgba(112, 180, 140, 1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pgSelectBtnSel: {
    borderColor: 'rgba(109, 175, 136, 0.6)',
    backgroundColor: 'rgba(112, 180, 140, 0.6)',
  },
  pgSelectBtnText: { color: 'rgba(242, 246, 243, 1)', fontSize: 12, fontWeight: '400', letterSpacing: -0.41, fontFamily: 'Pangolin' },
  pgEditBtn: {
    height: 39, width: 72,
    borderRadius: 19, borderWidth: 4,
    borderColor: 'rgba(109, 175, 136, 1)',
    backgroundColor: 'rgba(112, 180, 140, 1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pgSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 19,
    backgroundColor: 'rgba(4, 52, 33, 0.56)',
  },
  pgCustomInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pgCustomInput: {
    flex: 1, height: 46,
    borderRadius: 15, borderWidth: 2,
    borderColor: 'rgba(109, 175, 136, 1)',
    backgroundColor: 'rgba(242, 246, 243, 1)',
    paddingHorizontal: 14,
    fontSize: 14,
    color: 'rgba(69, 48, 36, 1)',
  },
  pgCustomAddBtn: { padding: 2 },
  pgCustomGoalChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 246, 243, 1)',
    borderRadius: 15, borderWidth: 2,
    borderColor: 'rgba(109, 175, 136, 1)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  pgCustomGoalChipText: { flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(69, 48, 36, 1)', letterSpacing: -0.41, fontFamily: 'PalanquinDark' },
  pgFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
    gap: 12, alignItems: 'center', justifyContent: 'center',
  },
  pgBackBtn: {
    paddingTop: 6, paddingBottom: 13, paddingHorizontal: 20,
    borderRadius: 15, borderWidth: 4,
    borderColor: 'rgba(107, 179, 137, 1)',
    backgroundColor: 'rgba(112, 180, 140, 1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pgBackBtnText: { color: 'rgba(254, 255, 255, 1)', fontSize: 32, fontWeight: '400', letterSpacing: -0.41, fontFamily: 'PatrickHandSC' },
  pgContinueBtn: {
    flex: 1,
    paddingTop: 6, paddingBottom: 13, paddingHorizontal: 20,
    borderRadius: 15, borderWidth: 4,
    borderColor: 'rgba(9, 119, 75, 1)',
    backgroundColor: 'rgba(10, 134, 84, 1)',
    justifyContent: 'center', alignItems: 'center',
  },
  pgContinueBtnText: { color: 'rgba(254, 255, 255, 1)', fontSize: 32, fontWeight: '400', letterSpacing: -0.41, fontFamily: 'PatrickHandSC' },
  z: {
    position: 'absolute',
    width: 30,
    height: 30,
    zIndex: 6,
  },
  z1: { top: height * 0.12, right: width * 0.4 },
  z2: { top: height * 0.08, right: width * 0.37 },
  z3: { top: height * 0.15, right: width * 0.35 },

});