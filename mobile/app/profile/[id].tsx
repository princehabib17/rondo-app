import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../constants/theme';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');
const REEL_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;
const BANNER_HEIGHT = 150;

const MOCK_PLAYER = {
  id: '1',
  name: 'Carlo Reyes',
  username: 'carloreyes',
  flag: '🇵🇭',
  skill: 'Competitive',
  position: 'Midfielder',
  bio: 'Box-to-box midfielder. 5v5 specialist. BGC & Makati. Always up for a run ⚽',
  games: 132,
  following: 48,
  followers: 210,
  reels: 4,
};

// W = win, L = loss, D = draw — most recent first
const MOCK_FORM = ['W', 'W', 'L', 'D', 'W'];

const MOCK_RECENT = [
  { id: '1', title: 'Friday Night 5v5', org: 'FC Taguig', date: 'Jun 13', result: 'W' },
  { id: '2', title: 'Sunday League', org: 'BGC Strikers', date: 'Jun 8', result: 'L' },
  { id: '3', title: 'Weekday Rondo', org: 'FC Taguig', date: 'Jun 4', result: 'D' },
];

const FORM_COLOR: Record<string, string> = {
  W: colors.success,
  L: colors.error,
  D: colors.textMuted,
};

export default function PlayerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [following, setFollowing] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  const toggleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowing((f) => !f);
  };

  const toggleShortlist = () => {
    Haptics.selectionAsync();
    setShortlisted((s) => !s);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.banner}>
          <LinearGradient colors={['#1A1400', '#0D2A0D', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleShortlist}
            style={[styles.bookmarkBtn, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.bookmarkIcon}>{shortlisted ? '🔖' : '📑'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_PLAYER.name[0]}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{MOCK_PLAYER.flag} {MOCK_PLAYER.name}</Text>
          </View>
          <Text style={styles.username}>@{MOCK_PLAYER.username}</Text>

          <View style={styles.tagRow}>
            <Badge color="yellow">{MOCK_PLAYER.skill}</Badge>
            <Badge color="muted">{MOCK_PLAYER.position}</Badge>
          </View>

          <Text style={styles.bio}>{MOCK_PLAYER.bio}</Text>

          <View style={styles.statsRow}>
            {[
              { label: 'Games', value: MOCK_PLAYER.games },
              { label: 'Following', value: MOCK_PLAYER.following },
              { label: 'Followers', value: MOCK_PLAYER.followers + (following ? 1 : 0) },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <Button
              onPress={toggleFollow}
              variant={following ? 'secondary' : 'primary'}
              style={styles.ctaBtn}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
            <Button
              onPress={() => router.push(`/messages/${id}`)}
              variant="secondary"
              style={styles.ctaBtn}
            >
              Message
            </Button>
          </View>
        </View>

        {/* Recent form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Form</Text>
          <View style={styles.formRow}>
            {MOCK_FORM.map((r, i) => (
              <View key={i} style={[styles.formChip, { backgroundColor: FORM_COLOR[r] + '22', borderColor: FORM_COLOR[r] + '55' }]}>
                <Text style={[styles.formText, { color: FORM_COLOR[r] }]}>{r}</Text>
              </View>
            ))}
            <Text style={styles.formHint}>Last 5 games</Text>
          </View>
        </View>

        {/* Reels grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎬 Reels</Text>
            <TouchableOpacity onPress={() => router.push('/reels')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reelsGrid}>
            {Array.from({ length: 3 }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push('/reels')}
                style={[styles.reelThumb, { width: REEL_SIZE, height: REEL_SIZE * 1.4 }]}
              >
                <LinearGradient colors={['#0D2A0D', '#0A0A1A']} style={StyleSheet.absoluteFillObject} />
                <Text style={styles.reelIcon}>▶️</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          <View style={styles.gamesList}>
            {MOCK_RECENT.map((g, i) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => router.push(`/games/${g.id}`)}
                style={[styles.gameRow, i < MOCK_RECENT.length - 1 && styles.gameRowBorder]}
                activeOpacity={0.7}
              >
                <View style={[styles.resultDot, { backgroundColor: FORM_COLOR[g.result] }]}>
                  <Text style={styles.resultDotText}>{g.result}</Text>
                </View>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameTitle}>{g.title}</Text>
                  <Text style={styles.gameMeta}>{g.org} · {g.date}</Text>
                </View>
                <Text style={styles.gameArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  banner: { height: BANNER_HEIGHT, position: 'relative' },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },
  bookmarkBtn: {
    position: 'absolute',
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIcon: { fontSize: 18 },

  profileSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  avatarWrap: { marginTop: -(48 + spacing.sm) },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.yellowDim,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font.h1, color: colors.yellow },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
  name: { ...font.h2, color: colors.text },
  username: { ...font.bodySm, color: colors.textMuted },
  tagRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  bio: { ...font.body, color: colors.textSecondary, lineHeight: 22, marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...font.h3, color: colors.text },
  statLabel: { ...font.caption, color: colors.textMuted },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ctaBtn: { flex: 1 },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...font.h4, color: colors.text },
  sectionLink: { ...font.bodySm, color: colors.yellow },

  formRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  formChip: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  formText: { ...font.bodySmMed, fontWeight: '700' },
  formHint: { ...font.caption, color: colors.textMuted, marginLeft: spacing.xs },

  reelsGrid: { flexDirection: 'row', gap: spacing.sm },
  reelThumb: { borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reelIcon: { fontSize: 24 },

  gamesList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  gameRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  resultDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultDotText: { ...font.captionMed, color: colors.bg, fontWeight: '700' },
  gameInfo: { flex: 1, gap: 2 },
  gameTitle: { ...font.bodyMed, color: colors.text },
  gameMeta: { ...font.caption, color: colors.textMuted },
  gameArrow: { fontSize: 20, color: colors.textMuted },
});
