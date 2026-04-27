import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import mascotHappy from '@/assets/mascots/smilingStandingUpMascot1.png';

interface GoalCompleteModalProps {
  visible: boolean;
  goalText: string;
  goalDescription: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export function GoalCompleteModal({
  visible,
  goalText,
  goalDescription,
  onClose,
}: GoalCompleteModalProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.root} onPress={onClose}>

        {/* ── Mascot — bottom ~65% of screen, contain so it isn't stretched ── */}
        <Image
          source={mascotHappy}
          style={styles.mascot}
          resizeMode="contain"
        />

        {/* ── Content — positioned in top third ── */}
        <View style={styles.content} pointerEvents="none">

          {/* "Goal Complete!" */}
          <Text style={styles.title}>Goal Complete!</Text>

          {/* Goal card — green pill matching screenshot */}
          <View style={styles.goalCard}>
            {/* Left: title + description */}
            <View style={styles.goalCardText}>
              <Text style={styles.goalTitle}>{goalText}</Text>
              <Text style={styles.goalDescription}>{goalDescription}</Text>
            </View>

            {/* Right: dark green checkmark box */}
            <View style={styles.checkBox}>
              <Ionicons name="checkmark" size={30} color="rgba(10, 134, 84, 0.85)" />
            </View>
          </View>

        </View>

      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(255, 244, 236, 1)',
  },

  // Mascot — sits in bottom portion, anchored bottom-centre
  // "contain" keeps proportions; left:-20 nudges it to fill edge-to-edge naturally
  mascot: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    width: width + 40,
    height: height * 0.68,
    zIndex: 0,
  },

  // Content layer — top third of the screen
  content: {
    position: 'absolute',
    top: height * 0.14,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 5,
  },

  // "Goal Complete!" — large, dark green, PatrickHandSC
  title: {
    fontSize: 46,
    color: 'rgba(10, 134, 84, 1)',
    fontFamily: 'PatrickHandSC',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 22,
  },

  // Green rounded card — matches screenshot colour rgba(109,175,136)
  goalCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(109, 175, 136, 1)',
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  goalCardText: {
    flex: 1,
    marginRight: 12,
  },

  // Goal title — white, bold
  goalTitle: {
    color: 'rgba(10, 134, 84, 0.85)',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PalanquinDark',
    letterSpacing: -0.3,
  },

  // Goal description — white, slightly smaller
  goalDescription: {
    color: 'rgba(10, 134, 84, 0.85)',
    fontSize: 18,
    fontFamily: 'NTR',
    marginTop: -10,
    letterSpacing: -0.3,
  },

  // Dark green square checkmark box on the right
  checkBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});