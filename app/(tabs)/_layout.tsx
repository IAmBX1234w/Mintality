import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="index" />     {/* HOME */}
      <Tabs.Screen name="memories" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}