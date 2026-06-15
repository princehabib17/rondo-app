import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font } from '../../constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed/map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="Map" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tournaments/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" label="Tournaments" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community/index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Community" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 8 },
  tabEmoji: { fontSize: 20, opacity: 0.4 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { ...font.caption, color: colors.textMuted },
  tabLabelActive: { color: colors.yellow, fontWeight: '600' },
});
