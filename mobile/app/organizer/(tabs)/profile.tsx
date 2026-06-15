import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Button } from '../../../components/ui/Button';

export default function OrganizerProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/feed')} style={styles.switchBtn}>
          <Text style={styles.switchText}>← Switch to Player</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>F</Text></View>
          <Text style={styles.name}>FC Taguig</Text>
          <Text style={styles.handle}>@fctaguig · Organizer</Text>
          <Button onPress={() => {}} variant="secondary" style={styles.editBtn}>Edit Organization</Button>
        </View>
        {[
          { label: 'Settings', icon: '⚙️', route: '' },
          { label: 'Help & Support', icon: '❓', route: '/help' },
          { label: 'Sign Out', icon: '🚪', route: '' },
        ].map((item) => (
          <TouchableOpacity key={item.label} onPress={() => item.route && router.push(item.route as any)} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  headerTitle: { ...font.h3, color: colors.text },
  switchBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  switchText: { ...font.bodySmMed, color: colors.textSecondary },
  profileCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentDim, borderWidth: 2.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.accent },
  name: { ...font.h3, color: colors.text },
  handle: { ...font.body, color: colors.textMuted },
  editBtn: { width: '100%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderSubtle },
  menuIcon: { fontSize: 20 },
  menuLabel: { ...font.body, color: colors.text, flex: 1 },
  menuArrow: { fontSize: 20, color: colors.textMuted },
});
