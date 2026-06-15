import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';
import type { Profile, ScoutShortlist } from '../lib/types';

type ShortlistItem = ScoutShortlist & { player: Profile | null };

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
        {shortlist.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>No players shortlisted</Text>
            <Text style={styles.emptySub}>Bookmark players from Reels to add them here.</Text>
            <TouchableOpacity onPress={() => router.push('/reels')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Browse Reels →</Text>
            </TouchableOpacity>
          </View>
        ) : shortlist.map((item: ShortlistItem) => {
          const p = item.player;
          if (!p) return null;
          const skillLabel = p.skill_level ? SKILL_LABELS[p.skill_level] ?? p.skill_level : null;
          const posLabel = p.position ? p.position.charAt(0).toUpperCase() + p.position.slice(1) : null;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity onPress={() => router.push(`/profile/${p.id}`)} style={styles.cardLeft} activeOpacity={0.8}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{(p.full_name?.[0] ?? '?').toUpperCase()}</Text></View>
                <View style={styles.info}>
                  <Text style={styles.name}>{p.nationality ? `${p.nationality} ` : ''}{p.full_name ?? 'Unknown'}</Text>
                  <Text style={styles.meta}>{[skillLabel, posLabel].filter(Boolean).join(' · ') || 'Player'}</Text>
                  {item.note ? <Text style={styles.note}>"{item.note}"</Text> : null}
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
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

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md, gap: spacing.md },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.h4, color: colors.yellow },
  info: { gap: 2, flex: 1 },
  name: { ...font.bodyMed, color: colors.text },
  meta: { ...font.caption, color: colors.textSecondary },
  note: { ...font.caption, color: colors.textMuted, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  msgBtn: { backgroundColor: colors.accentDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.accent + '44', paddingHorizontal: spacing.md, paddingVertical: 6 },
  msgBtnText: { ...font.captionMed, color: colors.accent },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.errorDim, borderWidth: 1, borderColor: colors.error + '44', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.error, fontWeight: '700' },
});
