import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import profileIcon from '@/assets/icons/profileIcon.png';
import friendsIcon from '@/assets/icons/friendsIcon.png';
import homeIcon from '@/assets/icons/homeIcon.png';
import memoriesIcon from '@/assets/icons/memoriesIcon.png';
import settingsIcon from '@/assets/icons/settingsIcon.png';

const iconMap: Record<string, any> = {
  profile: profileIcon,
  friends: friendsIcon,
  memories: memoriesIcon,
  settings: settingsIcon,
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const homeRoute = state.routes.find(r => r.name === 'index');

  return (
    <View style={styles.wrapper}>
      {/* 🔹 Bottom Bar */}
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          // skip home (handled as floating button)
          if (route.name === 'index') {
            return <View key={route.key} style={styles.tab} />;
          }

          const icon = iconMap[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
            >
              <Image
                source={icon}
                style={[
                  styles.icon,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 🔥 Floating Home Button */}
      {homeRoute && (
        <TouchableOpacity
          onPress={() => navigation.navigate(homeRoute.name)}
          style={styles.floatingButton}
        >
          <Image source={homeIcon} style={styles.floatingIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },

  container: {
    flexDirection: 'row',
    backgroundColor: '#f2f7f2',
    width: '100%',
    height: 80,
    justifyContent: 'space-around',
    alignItems: 'center',

    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
  },

  icon: {
    width: 26,
    height: 26,
  },

  floatingButton: {
    position: 'absolute',
    top: -15,

    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#f2f7f2',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,

    // 🔥 optional Figma polish
    borderWidth: 5,
    borderColor: '#ffffff',
  },

  floatingIcon: {
    width: 32,
    height: 32,
  },
});