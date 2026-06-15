import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const { width } = Dimensions.get('window');
const GAME_CARD_WIDTH = (width - spacing.lg * 2 - spacing.sm) / 2;
const BANNER_HEIGHT = 160;

const MOCK_ORGANIZER = {
  id: '1',
  name: 'FC Taguig',
  verified: true,
  bio: 'Premier futsal organizer in BGC. Weekly games, monthly cups, seasonal leagues.',
  gamesHosted: 84,
  playersTotal: 620,
  followers: 312,
};

const MOCK_UPCOMING = [
  { id: '1', title: 'Friday Night 5v5', date: 'Jun 20', format: '5v5', spots: 2, price: 150 },
  { id: '2', title: 'Sunday League', date: 'Jun 22', format: '7v7', spots: 5, price: 200 },
  { id: '3', title: 'Weekday Rondo', date: 'Jun 25', format: '3v3', spots: 0, price: 100 },
  { id: '4', title: 'Ballers Cup QF', date: 'Jun 28', format: '5v5', spots: 4, price: 300 },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', body: 'New venue available from July — Smoke Indoor Futsal, QC. Bigger courts, same rates.', time: '2h ago' },
  { id: 'a2', body: 'BGC Summer Cup bracket is now live! Check the tournament page for your team\'s first match.', time: '1d ago' },
  { id: 'a3', body: 'Weekly games will be suspended on Jun 19 (holiday). We\'ll see you on Jun 20!', time: '3d ago' },
];

function GameCard({ game }: { game: typeof MOCK_UPCOMING[0] }) {
  const isFull = game.spots === 0;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/games/${game.id}`)}
      activeOpacity={0.85}
      style={styles.gameCard}
    >
      <View style={styles.gameCardHeader}>
        <LinearGradient colors={['#1A1400', '#0A0A0A']} style={StyleSheet.absoluteFill} />
        <Badge color={isFull ? 'red' : 'green'} style={styles.gameCardBadge}>
          {isFull ? 'Full' : `${game.spots} left`}
        </Badge>
        <Text style={styles.gameCardFormat}>{game.format}</Text>
      </View>
      <View style={styles.gameCardBody}>
        <Text style={styles.gameCardTitle} numberOfLines={2}>{game.title}</Text>
        <Text style={styles.gameCardDate}>📅 {game.date}</Text>
        <Text style={styles.gameCardPrice}>₱{game.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrganizerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [following, setFollowing] = useState(false);

  const toggleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowing((f) => !f);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.banner}>
          <LinearGradient colors={['#1A2840', '#0D2A0D', '#0A0A0A']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + spacing.sm }]}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_ORGANIZER.name[0]}</Text>
            </View>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{MOCK_ORGANIZER.name}</Text>
            {MOCK_ORGANIZER.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <Text style={styles.bio}>{MOCK_ORGANIZER.bio}</Text>

          <View style={styles.statsRow}>
            {[
              { label: 'Games', value: MOCK_ORGANIZER.gamesHosted },
              { label: 'Players', value: MOCK_ORGANIZER.playersTotal },
              { label: 'Followers', value: MOCK_ORGANIZER.followers + (following ? 1 : 0) },
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Games</Text>
          <View style={styles.gamesGrid}>
            {MOCK_UPCOMING.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          <View style={styles.announcements}>
            {MOCK_ANNOUNCEMENTS.map((a, i) => (
              <View
                key={a.id}
                style={[styles.announcement, i < MOCK_ANNOUNCEMENTS.length - 1 && styles.announcementBorder]}
              >
                <Text style={styles.announcementBody}>{a.body}</Text>
                <Text style={styles.announcementTime}>{a.time}</Text>
              </View>
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

  profileSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  avatarWrap: { marginTop: -(48 + spacing.sm) },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.yellowDim,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...font.h2, color: colors.yellow },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { ...font.h2, color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.yellowDim,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  verifiedText: { ...font.captionMed, color: colors.yellow },
  bio: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.xl },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...font.h3, color: colors.text },
  statLabel: { ...font.caption, color: colors.textMuted },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  ctaBtn: { flex: 1 },

  section: { padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  sectionTitle: { ...font.h4, color: colors.text },

  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gameCard: {
    width: GAME_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  gameCardHeader: {
    height: 60,
    justifyContent: 'flex-end',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  gameCardBadge: { alignSelf: 'flex-start' },
  gameCardFormat: { ...font.captionMed, color: colors.textMuted },
  gameCardBody: { padding: spacing.sm, gap: spacing.xs },
  gameCardTitle: { ...font.bodySmMed, color: colors.text },
  gameCardDate: { ...font.caption, color: colors.textMuted },
  gameCardPrice: { ...font.bodySmMed, color: colors.yellow },

  announcements: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  announcement: { padding: spacing.md, gap: spacing.xs },
  announcementBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  announcementBody: { ...font.body, color: colors.text, lineHeight: 22 },
  announcementTime: { ...font.caption, color: colors.textMuted },
});
