import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

import mascot      from '@/assets/mascots/smilingStandingUpMascot1.png';
import wateringCan from '@/assets/decorations/wateringCan1.png';
import sparkle5    from '@/assets/decorations/sparkle5.png';

interface WateringModalProps {
  visible: boolean;
  onComplete: () => void;
  plantId: string;
}

const { width, height } = Dimensions.get('window');

export function WateringModal({ visible, onComplete }: WateringModalProps) {
  const progress = useState(new Animated.Value(0))[0];
  const [done, setDone] = useState(false);

  // Watering can subtle sway
  const sway = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible) return;

    setDone(false);
    progress.setValue(0);
    sway.setValue(0);

    // Fill the progress bar over 5 seconds
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => setDone(true));

    // Gentle watering-can rock while in progress
    Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 6,  duration: 400, useNativeDriver: true }),
        Animated.timing(sway, { toValue: -6, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, [visible]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <TouchableWithoutFeedback onPress={() => done && onComplete()}>
        <View style={styles.root}>

          {/* ── Mascot — bottom portion, contain ── */}
          <Image
            source={mascot}
            style={styles.mascot}
            resizeMode="contain"
          />

          {/* ── Top UI: title + progress bar ── */}
          <View style={styles.topUI}>
            <Text style={styles.title}>
              {done ? 'WATERING COMPLETE!' : 'WATERING IN PROGRESS...'}
            </Text>

            {/* Progress bar — light blue outer, darker fill */}
            <View style={styles.progressOuter}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: done ? '100%' : progressWidth },
                ]}
              />
            </View>
          </View>

          {/* ── Watering can (visible while in progress) ── */}
          {!done && (
            <Animated.Image
              source={wateringCan}
              style={[
                styles.wateringCan,
                { transform: [{ rotate: sway.interpolate({ inputRange: [-6, 6], outputRange: ['-8deg', '8deg'] }) }] },
              ]}
              resizeMode="contain"
            />
          )}

          {/* ── Sparkles (visible when done) ── */}
          {done && (
            <>
              <Image source={sparkle5} style={[styles.sparkle, styles.sp1]} resizeMode="contain" />
              <Image source={sparkle5} style={[styles.sparkle, styles.sp2]} resizeMode="contain" />
              <Image source={sparkle5} style={[styles.sparkle, styles.sp3]} resizeMode="contain" />
            </>
          )}

          {/* Tap to dismiss hint when done */}
          {/* {done && (
            <Text style={styles.tapHint}>Tap anywhere to continue</Text>
          )} */}

        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(255, 244, 236, 1)',
  },

  // Mascot — fills bottom ~68%, contain keeps proportions
  mascot: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    width: width + 40,
    height: height * 0.68,
    zIndex: 0,
  },

  // ── Top UI ──
  topUI: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },

  // "WATERING IN PROGRESS..." — teal, PatrickHandSC
  title: {
    fontSize: 30,
    color: 'rgba(61, 152, 170, 1)',
    fontFamily: 'PatrickHandSC',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: -0.41,
  },

  // Outer pill — light cyan
  progressOuter: {
    width: 350,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(197, 237, 247, 1)',
    overflow: 'hidden',
  },

  // Fill — medium blue matching screenshot
  progressFill: {
    height: '100%',
    borderRadius: 17,
    backgroundColor: 'rgba(121, 181, 228, 1)',
  },

  // ── Watering can — mid-right, ~25% from top ──
  wateringCan: {
    position: 'absolute',
    top: height * 0.22,
    right: 20,
    width: 250,
    height: 200,
    zIndex: 5,
  },

  // ── Sparkles ──
  sparkle: {
    position: 'absolute',
    width: 90,
    height: 90,
    zIndex: 6,
  },
  sp1: { top: height * 0.28, right: 18 },
  sp2: { top: height * 0.38, left: 20 },
  sp3: { top: height * 0.18, left: width * 0.35 },

  // Tap to dismiss hint
  tapHint: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(109, 175, 136, 1)',
    fontSize: 14,
    fontFamily: 'NTR',
    zIndex: 10,
  },
});