// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';


export default function RootLayout() {
  const [loaded] = useFonts({
    PatrickHandSC: require('../assets/fonts/PatrickHandSC-Regular.ttf'),
    PalanquinDark: require('../assets/fonts/PalanquinDark-Regular.ttf'),
    Pangolin: require('../assets/fonts/Pangolin-Regular.ttf'),
    NTR: require('../assets/fonts/NTR-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(setup)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}