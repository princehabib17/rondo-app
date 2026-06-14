import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';

const MOCK_SHORTLIST = [
  { id: '1', name: 'Carlo Reyes', flag: '🇵🇭', skill: 'Competitive', position: 'Midfielder', reels: 4 },
  { id: '2', name: 'Alex Torres', flag: '🇵🇭', skill: 'Intermediate', position: 'Striker', reels: 2 },
];

export default function ScoutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Scout Shortlist" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.md }}>
        {MOCK_SHORTLIST.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔖</Text>
            <Text style={styles.emptyTitle}>No players shortlisted</Text>
            <Text style={styles.emptySub}>Bookmark players from Reels to add them here.</Text>
            <TouchableOpacity onPress={() => router.push('/reels')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Browse Reels →</Text>
            </TouchableOpacity>
          </View>
        ) : MOCK_SHORTLIST.map((p) => (
          <View key={p.id} style={styles.card}>
            <TouchableOpacity onPress={() => router.push(`/profile/${p.id}`)} style={styles.cardLeft} activeOpacity={0.8}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{p.name[0]}</Text></View>
              <View style={styles.info}>
                <Text style={styles.name}>{p.flag} {p.name}</Text>
                <Text style={styles.meta}>{p.skill} · {p.position}</Text>
                <Text style={styles.reels}>🎬 {p.reels} reels</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => router.push(`/messages/${p.id}`)} style={styles.msgBtn}>
                <Text style={styles.msgBtnText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  info: { gap: 2 },
  name: { ...font.bodyMed, color: colors.text },
  meta: { ...font.caption, color: colors.textSecondary },
  reels: { ...font.caption, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  msgBtn: { backgroundColor: colors.accentDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.accent + '44', paddingHorizontal: spacing.md, paddingVertical: 6 },
  msgBtnText: { ...font.captionMed, color: colors.accent },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.errorDim, borderWidth: 1, borderColor: colors.error + '44', alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.error, fontWeight: '700' },
});
