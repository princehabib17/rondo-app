import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../constants/theme';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useQuery, useMutation } from '../../hooks/useQuery';
import { useAuth } from '../../hooks/useAuth';
import * as q from '../../lib/queries';
import type { GamePlayer, Game } from '../../lib/types';

const { width } = Dimensions.get('window');
const REEL_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;
const BANNER_HEIGHT = 150;

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Competitive',
};

const POS_LABELS: Record<string, string> = {
  goalkeeper: 'Goalkeeper',
  defender: 'Defender',
  midfielder: 'Midfielder',
  forward: 'Forward',
  any: 'Any Position',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PlayerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const profileQuery = useQuery(() => q.getProfile(id!), [id]);
  const statsQuery = useQuery(() => q.getPlayerStats(id!), [id]);
  const reelsQuery = useQuery(() => q.listReelsByPlayer(id!), [id]);
  const gamesQuery = useQuery(() => q.getPlayerRecentGames(id!, 5), [id]);
  const followingQuery = useQuery(() => q.isFollowing(id!), [id]);
  const shortlistQuery = useQuery(() => q.isOnShortlist(id!), [id]);

  const [followOverride, setFollowOverride] = useState<boolean | null>(null);
  const [shortlistOverride, setShortlistOverride] = useState<boolean | null>(null);

  const isFollowing = followOverride ?? followingQuery.data ?? false;
  const isShortlisted = shortlistOverride ?? shortlistQuery.data ?? false;

  const loading = profileQuery.loading || statsQuery.loading;
  const error = profileQuery.error;

  const toggleFollow = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isFollowing;
    setFollowOverride(next);
    try {
      await q.toggleFollow(id!, next);
    } catch {
      setFollowOverride(!next);
    }
  };

  const toggleShortlist = async () => {
    Haptics.selectionAsync();
    const next = !isShortlisted;
    setShortlistOverride(next);
    try {
      if (next) await q.addToShortlist(id!);
      else await q.removeFromShortlist(id!);
    } catch {
      setShortlistOverride(!next);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !profileQuery.data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? 'Player not found'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = profileQuery.data;
  const stats = statsQuery.data ?? { games: 0, following: 0, followers: 0 };
  const reels = reelsQuery.data ?? [];
  const recentGames = gamesQuery.data ?? [];

  const name = profile.full_name ?? 'Unknown';
  const username = profile.email?.split('@')[0] ?? name.toLowerCase().replace(/\s+/g, '');
  const avatarInitial = name[0]?.toUpperCase() ?? '?';
  const skillLabel = profile.skill_level ? (SKILL_LABELS[profile.skill_level] ?? profile.skill_level) : null;
  const posLabel = profile.position ? (POS_LABELS[profile.position] ?? profile.position) : null;
  const followerCount = stats.followers + (followOverride === true ? 1 : followOverride === false ? -1 : 0);

  const isOwnProfile = user?.id === id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.banner}>
          <LinearGradient colors={['#1A1400', '#0D2A0D', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          {!isOwnProfile && (
            <TouchableOpacity
              onPress={toggleShortlist}
              style={[styles.bookmarkBtn, { top: insets.top + spacing.sm }]}
            >
              <Text style={styles.bookmarkIcon}>{isShortlisted ? '🔖' : '📑'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.nationality ? `${profile.nationality} ` : ''}{name}</Text>
          </View>
          <Text style={styles.username}>@{username}</Text>

          <View style={styles.tagRow}>
            {skillLabel && <Badge color="yellow">{skillLabel}</Badge>}
            {posLabel && <Badge color="muted">{posLabel}</Badge>}
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            {[
              { label: 'Games', value: stats.games },
              { label: 'Following', value: stats.following },
              { label: 'Followers', value: followerCount },
            ].map((s) => (
              <View key={s.label} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {!isOwnProfile && (
            <View style={styles.ctaRow}>
              <Button
                onPress={toggleFollow}
                variant={isFollowing ? 'secondary' : 'primary'}
                style={styles.ctaBtn}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                onPress={() => router.push(`/messages/${id}`)}
                variant="secondary"
                style={styles.ctaBtn}
              >
                Message
              </Button>
            </View>
          )}
        </View>

        {/* Reels grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎬 Reels</Text>
            <TouchableOpacity onPress={() => router.push('/reels')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          {reels.length === 0 ? (
            <Text style={styles.emptyText}>No reels yet</Text>
          ) : (
            <View style={styles.reelsGrid}>
              {reels.slice(0, 3).map((reel) => (
                <TouchableOpacity
                  key={reel.id}
                  onPress={() => router.push('/reels')}
                  style={[styles.reelThumb, { width: REEL_SIZE, height: REEL_SIZE * 1.4 }]}
                >
                  <LinearGradient colors={['#0D2A0D', '#0A0A1A']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.reelIcon}>▶️</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Games</Text>
            <View style={styles.gamesList}>
              {recentGames.map((gp: GamePlayer & { game: Game | null }, i) => {
                const game = gp.game;
                if (!game) return null;
                return (
                  <TouchableOpacity
                    key={gp.id}
                    onPress={() => router.push(`/games/${game.id}`)}
                    style={[styles.gameRow, i < recentGames.length - 1 && styles.gameRowBorder]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusDot, { backgroundColor: colors.success }]}>
                      <Text style={styles.statusDotText}>✓</Text>
                    </View>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameTitle}>{game.title}</Text>
                      <Text style={styles.gameMeta}>{game.venue_name} · {formatDate(game.date_time)}</Text>
                    </View>
                    <Text style={styles.gameArrow}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.yellow },
  emptyText: { ...font.body, color: colors.textMuted },

  banner: { height: BANNER_HEIGHT, position: 'relative' },
  backBtn: {
    position: 'absolute', left: spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },
  bookmarkBtn: {
    position: 'absolute', right: spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  bookmarkIcon: { fontSize: 18 },

  profileSection: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  avatarWrap: { marginTop: -(48 + spacing.sm) },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.yellowDim, borderWidth: 3, borderColor: colors.bg,
    alignItems: 'center', justifyContent: 'center',
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

  reelsGrid: { flexDirection: 'row', gap: spacing.sm },
  reelThumb: { borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reelIcon: { fontSize: 24 },

  gamesList: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  gameRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  statusDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusDotText: { ...font.captionMed, color: colors.bg, fontWeight: '700' },
  gameInfo: { flex: 1, gap: 2 },
  gameTitle: { ...font.bodyMed, color: colors.text },
  gameMeta: { ...font.caption, color: colors.textMuted },
  gameArrow: { fontSize: 20, color: colors.textMuted },
});
