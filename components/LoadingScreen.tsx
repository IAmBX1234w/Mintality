import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';

import logoFull1 from '@/assets/images/logoFull1.png';

const { width, height } = Dimensions.get('window');

export function LoadingScreen({ fadeOut }: { fadeOut: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // floating animation (same as before)
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -10,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (fadeOut) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500, // smooth fade out
        useNativeDriver: true,
      }).start();
    }
  }, [fadeOut]);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <Animated.Image
        source={logoFull1}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            transform: [{ translateY: float }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(255, 244, 236, 1)',
  },
  logo: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: width * 1,
    height: height * 1,
  },
});