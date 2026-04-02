// app/(setup)/_layout.tsx
import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="loading" />
      <Stack.Screen name="instructions" />
      <Stack.Screen name="connect-plant" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="app-guide" />
    </Stack>
  );
}