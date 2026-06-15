import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Game } from '../../../lib/types';

const { width } = Dimensions.get('window');
const GAME_CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm) / 2;
const BANNER_HEIGHT = 160;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function spotsLeft(game: Game): number {
  return game.max_players; // accurate spot count needs join with game_players; approximate here
}

export default function OrganizerPublicProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profileQuery = useQuery(() => q.getProfile(id!), [id]);
  const gamesQuery = useQuery(() => q.listGames({ organizerId: id!, upcomingOnly: true }), [id]);
  const statsQuery = useQuery(() => q.getPlayerStats(id!), [id]);

  const loading = profileQuery.loading;
  const error = profileQuery.error;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !profileQuery.data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? 'Organizer not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = profileQuery.data;
  const games = gamesQuery.data ?? [];
  const stats = statsQuery.data ?? { games: 0, following: 0, followers: 0 };
  const name = profile.full_name ?? 'Organizer';
  const initial = name[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {/* Banner */}
        <View style={[styles.banner, { height: BANNER_HEIGHT }]}>
          <LinearGradient colors={['#001A0A', '#0A0A1A', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {profile.role === 'organizer' && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Organizer</Text>
              </View>
            )}
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            {[
              { label: 'Games hosted', value: games.length },
              { label: 'Followers', value: stats.followers },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <Button variant="secondary" onPress={() => {}} style={styles.ctaBtn}>Follow</Button>
            <Button variant="secondary" onPress={() => router.push(`/messages/${id}`)} style={styles.ctaBtn}>Message</Button>
          </View>
        </View>

        {/* Upcoming games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Games</Text>
          {gamesQuery.loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : games.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming games</Text>
          ) : (
            <View style={styles.gamesGrid}>
              {games.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => router.push(`/games/${g.id}`)}
                  style={[styles.gameCard, { width: GAME_CARD_WIDTH }]}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#001A0A', '#0A0A1A']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.gameFormat}>{g.format}</Text>
                  <Text style={styles.gameTitle} numberOfLines={2}>{g.title}</Text>
                  <Text style={styles.gameDate}>{formatDate(g.date_time)}</Text>
                  <Text style={styles.gamePrice}>₱{(g.price_per_player / 100).toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.accent },

  banner: { position: 'relative' },
  backBtn: {
    position: 'absolute', left: spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },

  profileSection: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  avatarWrap: { marginTop: -(48 + spacing.sm) },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.accentDim, borderWidth: 3, borderColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...font.h1, color: colors.accent },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  name: { ...font.h2, color: colors.text },
  verifiedBadge: { backgroundColor: colors.accentDim, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: colors.accent + '44' },
  verifiedText: { ...font.captionMed, color: colors.accent },
  bio: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...font.h3, color: colors.text },
  statLabel: { ...font.caption, color: colors.textMuted },
  ctaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  ctaBtn: { flex: 1 },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.h4, color: colors.text },
  emptyText: { ...font.body, color: colors.textMuted },

  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gameCard: {
    borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.borderSubtle,
    padding: spacing.md, gap: spacing.xs, minHeight: 110,
  },
  gameFormat: { ...font.captionMed, color: colors.accent },
  gameTitle: { ...font.bodyMed, color: colors.text },
  gameDate: { ...font.caption, color: colors.textMuted },
  gamePrice: { ...font.bodySmMed, color: colors.yellow },
});
