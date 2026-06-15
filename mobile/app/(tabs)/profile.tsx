import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, spacing, radius } from '../../constants/theme';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');
const REEL_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

const MOCK_USER = {
  name: 'Juan dela Cruz',
  username: 'juandc',
  flag: '🇵🇭',
  skill: 'Competitive',
  bio: 'Futsal player based in BGC. 5v5 and 7v7. Always down for a game ⚽',
  games: 48,
  following: 12,
  followers: 34,
  wallet: 850,
};

const MENU_ITEMS = [
  { icon: '💰', label: 'Wallet', route: '/wallet' },
  { icon: '📅', label: 'My Games', route: '/my-games' },
  { icon: '🔖', label: 'Scout Shortlist', route: '/scout' },
  { icon: '🏟️', label: 'Switch to Organizer', route: '/organizer/dashboard', accent: true },
  { icon: '🔔', label: 'Notifications', route: '/notifications' },
  { icon: '❓', label: 'Help & Support', route: '/help' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.username}>@{MOCK_USER.username}</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar + stats */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{MOCK_USER.name[0]}</Text>
          </View>
          <View style={styles.statsRow}>
            {[
              { label: 'Games', value: MOCK_USER.games },
              { label: 'Following', value: MOCK_USER.following },
              { label: 'Followers', value: MOCK_USER.followers },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bio}>
          <Text style={styles.bioName}>{MOCK_USER.flag} {MOCK_USER.name}</Text>
          <Badge color="yellow" style={{ alignSelf: 'flex-start', marginBottom: spacing.xs }}>{MOCK_USER.skill}</Badge>
          <Text style={styles.bioText}>{MOCK_USER.bio}</Text>
        </View>

        {/* Edit profile */}
        <View style={styles.actions}>
          <Button variant="secondary" onPress={() => {}} style={{ flex: 1 }}>Edit Profile</Button>
          <Button variant="secondary" onPress={() => router.push('/organizers/1')} style={{ flex: 1 }}>Share</Button>
        </View>

        {/* Wallet balance strip */}
        <TouchableOpacity onPress={() => router.push('/wallet')} style={styles.walletStrip}>
          <LinearGradient colors={['#1A1400', '#0A0A0A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.walletLeft}>
            <Text style={styles.walletLabel}>💰 Wallet Balance</Text>
            <Text style={styles.walletAmount}>₱{MOCK_USER.wallet.toLocaleString()}</Text>
          </View>
          <Text style={styles.walletArrow}>→</Text>
        </TouchableOpacity>

        {/* Reels grid */}
        <View style={styles.reelsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎬 Reels</Text>
            <TouchableOpacity onPress={() => router.push('/reels')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reelsGrid}>
            {Array.from({ length: 3 }, (_, i) => (
              <View key={i} style={[styles.reelThumb, { width: REEL_SIZE, height: REEL_SIZE * 1.4 }]}>
                <View style={styles.reelPlaceholder}>
                  <Text style={styles.reelIcon}>▶️</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, item.accent && { color: colors.accent }]}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  username: { ...font.h4, color: colors.text },
  settingsBtn: { padding: spacing.xs },
  settingsIcon: { fontSize: 22 },

  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.yellowDim, borderWidth: 2.5, borderColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.yellow },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...font.h3, color: colors.text },
  statLabel: { ...font.caption, color: colors.textMuted },

  bio: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.md },
  bioName: { ...font.bodyMed, color: colors.text },
  bioText: { ...font.body, color: colors.textSecondary, lineHeight: 22 },

  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },

  walletStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  walletLeft: { gap: 2 },
  walletLabel: { ...font.caption, color: colors.textMuted },
  walletAmount: { ...font.h3, color: colors.yellow },
  walletArrow: { fontSize: 20, color: colors.yellow },

  reelsSection: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { ...font.h4, color: colors.text },
  sectionLink: { ...font.bodySm, color: colors.yellow },
  reelsGrid: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  reelThumb: { borderRadius: radius.sm, overflow: 'hidden' },
  reelPlaceholder: { flex: 1, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  reelIcon: { fontSize: 24 },

  menuSection: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden', marginBottom: spacing.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { ...font.body, color: colors.text, flex: 1 },
  menuArrow: { fontSize: 20, color: colors.textMuted },

  signOutBtn: { alignItems: 'center', paddingVertical: spacing.md },
  signOutText: { ...font.bodyMed, color: colors.error },
});
