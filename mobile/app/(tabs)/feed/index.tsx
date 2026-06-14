import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

// Mock data — replace with Supabase queries
const MOCK_ORGANIZERS = [
  { id: '1', name: 'FC Taguig', avatar: null, verified: true },
  { id: '2', name: 'Rondo PH', avatar: null, verified: true },
  { id: '3', name: 'Futsal MNL', avatar: null, verified: false },
  { id: '4', name: 'Ballers BCG', avatar: null, verified: false },
  { id: '5', name: 'UP Futsal', avatar: null, verified: true },
];

const MOCK_GAMES = [
  {
    id: '1', title: 'Friday Night 5v5', venue: 'Turf Manila, BGC', date: 'Fri Jun 20 · 8:00 PM',
    format: '5v5', price: 150, spots: 2, totalSpots: 10, status: 'open', banner: null, organizer: 'FC Taguig',
  },
  {
    id: '2', title: 'Weekend Ballers', venue: 'Smoke Indoor Futsal, QC', date: 'Sat Jun 21 · 6:00 AM',
    format: '7v7', price: 200, spots: 6, totalSpots: 14, status: 'open', banner: null, organizer: 'Rondo PH',
  },
  {
    id: '3', title: 'Laro ni Bayan', venue: 'Robinsons Futsaland, Maka', date: 'Sun Jun 22 · 3:00 PM',
    format: '3v3', price: 100, spots: 0, totalSpots: 6, status: 'full', banner: null, organizer: 'Futsal MNL',
  },
];

function OrganizerStory({ name, verified }: { name: string; verified: boolean }) {
  return (
    <TouchableOpacity style={styles.story} activeOpacity={0.8}>
      <View style={[styles.storyRing, verified && styles.storyRingVerified]}>
        <View style={styles.storyAvatar}>
          <Text style={styles.storyInitial}>{name[0]}</Text>
        </View>
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{name.split(' ')[0]}</Text>
    </TouchableOpacity>
  );
}

function FeaturedCard({ game }: { game: typeof MOCK_GAMES[0] }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.92}
      style={styles.featuredCard}
    >
      <View style={styles.featuredBanner}>
        <LinearGradient
          colors={['#1A2A1A', '#0D1A0D']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.featuredLabel}>⚡ FEATURED GAME</Text>
        <Text style={styles.featuredTitle}>{game.title}</Text>
        <Text style={styles.featuredVenue}>📍 {game.venue}</Text>
      </View>
      <View style={styles.featuredFooter}>
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredDate}>{game.date}</Text>
          <Badge color="yellow">{game.format}</Badge>
        </View>
        <View style={styles.featuredRight}>
          <Text style={styles.featuredPrice}>₱{game.price}</Text>
          <Text style={styles.featuredSpots}>{game.spots} spots left</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function GameCard({ game }: { game: typeof MOCK_GAMES[0] }) {
  const isFull = game.spots === 0;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.88}
      style={[styles.gameCard, shadow.subtle]}
    >
      <View style={styles.gameBanner}>
        <LinearGradient colors={['#1A2418', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
        <Badge color={isFull ? 'red' : 'green'} style={styles.gameBadge}>
          {isFull ? 'Full' : `${game.spots} left`}
        </Badge>
        <Text style={styles.gameFormat}>{game.format}</Text>
      </View>
      <View style={styles.gameBody}>
        <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.gameMeta} numberOfLines={1}>📍 {game.venue}</Text>
        <Text style={styles.gameMeta}>🕐 {game.date}</Text>
        <View style={styles.gameFooter}>
          <Text style={styles.gameOrganizer}>by {game.organizer}</Text>
          <Text style={styles.gamePrice}>₱{game.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'nearby' | 'upcoming'>('nearby');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good evening 👋</Text>
          <Text style={styles.headerTitle}>Find Your Game</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellBtn}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.yellow} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Stories — Organizers */}
        <View style={styles.storiesSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            {MOCK_ORGANIZERS.map((o) => (
              <OrganizerStory key={o.id} name={o.name} verified={o.verified} />
            ))}
          </ScrollView>
        </View>

        {/* Featured game */}
        <View style={styles.section}>
          <FeaturedCard game={MOCK_GAMES[0]} />
        </View>

        {/* Nearby / Upcoming tabs */}
        <View style={styles.tabsRow}>
          {(['nearby', 'upcoming'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'nearby' ? '📍 Nearby' : '📅 Upcoming'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Games list */}
        <View style={styles.gamesList}>
          {MOCK_GAMES.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerGreeting: { ...font.caption, color: colors.textMuted },
  headerTitle: { ...font.h3, color: colors.text },
  bellBtn: { position: 'relative', padding: spacing.xs },
  bellIcon: { fontSize: 22 },
  bellDot: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },

  storiesSection: { paddingVertical: spacing.md },
  storiesScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  story: { alignItems: 'center', width: 64 },
  storyRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 2,
    marginBottom: 6,
  },
  storyRingVerified: { borderColor: colors.yellow },
  storyAvatar: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitial: { ...font.h4, color: colors.yellow },
  storyName: { ...font.caption, color: colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },

  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  featuredBanner: {
    height: 140,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  featuredLabel: { ...font.captionMed, color: colors.yellow, letterSpacing: 1, marginBottom: spacing.xs },
  featuredTitle: { ...font.h2, color: colors.text, marginBottom: spacing.xs },
  featuredVenue: { ...font.bodySm, color: colors.textSecondary },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  featuredInfo: { gap: spacing.xs },
  featuredDate: { ...font.bodySmMed, color: colors.text },
  featuredRight: { alignItems: 'flex-end' },
  featuredPrice: { ...font.h3, color: colors.yellow },
  featuredSpots: { ...font.caption, color: colors.textMuted },

  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textSecondary },
  tabTextActive: { color: colors.yellow },

  gamesList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  gameBanner: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  gameBadge: {},
  gameFormat: { ...font.captionMed, color: colors.textSecondary },
  gameBody: { padding: spacing.md, gap: spacing.xs },
  gameTitle: { ...font.h4, color: colors.text },
  gameMeta: { ...font.bodySm, color: colors.textSecondary },
  gameFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  gameOrganizer: { ...font.caption, color: colors.textMuted },
  gamePrice: { ...font.h4, color: colors.yellow },
});
