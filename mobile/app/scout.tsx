import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';
import type { Profile, ScoutShortlist } from '../lib/types';

const { width: screenWidth } = Dimensions.get('window');

type ShortlistItem = ScoutShortlist & { player: Profile | null };

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

const POS_LABELS: Record<string, string> = {
  goalkeeper: 'GK',
  defender: 'DEF',
  midfielder: 'MID',
  forward: 'FWD',
  winger: 'WNG',
  striker: 'ST',
};

const SKILL_GRADIENTS: Record<string, [string, string]> = {
  pro: ['#1A0A00', '#3A1A00'],
  advanced: ['#001A1A', '#003A3A'],
  intermediate: ['#001400', '#002800'],
  beginner: ['#0A0A1A', '#1A1A3A'],
};

const SKILL_COLORS: Record<string, string> = {
  pro: '#FF8C00',
  advanced: '#00C8C8',
  intermediate: '#00C840',
  beginner: '#8080FF',
};

const CARD_WIDTH = (screenWidth - spacing.lg * 2 - spacing.md) / 2;

export default function ScoutScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, error, refetch } = useQuery(() => q.getShortlist());

  const handleRemove = async (playerId: string) => {
    await q.removeFromShortlist(playerId);
    refetch();
  };

  if (loading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Scout Shortlist" showBack />
        <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Scout Shortlist" showBack />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const shortlist = data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Scout Shortlist" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}>
        {shortlist.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>No players shortlisted</Text>
            <Text style={styles.emptySub}>Bookmark players from Reels to add them here.</Text>
            <TouchableOpacity onPress={() => router.push('/reels')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Browse Reels →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {shortlist.map((item: ShortlistItem) => {
              const p = item.player;
              if (!p) return null;
              const skillKey = p.skill_level ?? 'beginner';
              const skillLabel = SKILL_LABELS[skillKey] ?? skillKey;
              const posKey = p.position ?? '';
              const posLabel = POS_LABELS[posKey] ?? posKey.charAt(0).toUpperCase() + posKey.slice(1) || 'Player';
              const gradientColors = SKILL_GRADIENTS[skillKey] ?? SKILL_GRADIENTS.beginner;
              const accentColor = SKILL_COLORS[skillKey] ?? colors.yellow;
              return (
                <View key={item.id} style={styles.card}>
                  {/* Gradient header */}
                  <LinearGradient colors={gradientColors} style={styles.cardHeader}>
                    <Text style={styles.flagEmoji}>{p.nationality ? '🏴' : '🌐'}</Text>
                    {posLabel ? (
                      <View style={[styles.posBadge, { backgroundColor: accentColor + '33', borderColor: accentColor + '66' }]}>
                        <Text style={[styles.posLabel, { color: accentColor }]}>{posLabel}</Text>
                      </View>
                    ) : null}
                  </LinearGradient>

                  {/* Card body */}
                  <TouchableOpacity onPress={() => router.push(`/profile/${p.id}`)} style={styles.cardBody} activeOpacity={0.8}>
                    <Text style={styles.name} numberOfLines={1}>{p.full_name ?? 'Unknown'}</Text>
                    <View style={[styles.skillBadge, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
                      <Text style={[styles.skillText, { color: accentColor }]}>{skillLabel}</Text>
                    </View>
                    {item.note ? <Text style={styles.note} numberOfLines={2}>"{item.note}"</Text> : null}
                  </TouchableOpacity>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => router.push(`/messages/${p.id}`)} style={styles.msgBtn}>
                      <Text style={styles.msgBtnText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(p.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySub: { ...font.body, color: colors.textMuted, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.sm },
  emptyBtnText: { ...font.bodyMed, color: colors.yellow },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },

  cardHeader: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  flagEmoji: { fontSize: 22 },
  posBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  posLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  cardBody: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  name: { ...font.bodySmMed, color: colors.text },
  skillBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skillText: { fontSize: 10, fontWeight: '700' },
  note: { ...font.caption, color: colors.textMuted, fontStyle: 'italic' },

  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    paddingTop: 0,
    alignItems: 'center',
  },
  msgBtn: {
    flex: 1,
    backgroundColor: colors.accentDim,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    paddingVertical: 5,
    alignItems: 'center',
  },
  msgBtnText: { ...font.captionMed, color: colors.accent },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.errorDim,
    borderWidth: 1,
    borderColor: colors.error + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: colors.error, fontWeight: '700', fontSize: 11 },
});
