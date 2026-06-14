import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';

const MOCK = [
  { id: '1', name: 'BGC Summer Cup', format: 'Knockout', status: 'Open', teams: 4, maxTeams: 8, date: 'Jun 28' },
  { id: '2', name: 'Rondo League S3', format: 'League', status: 'Live', teams: 6, maxTeams: 6, date: 'Jun 15' },
];

export default function OrganizerTournamentsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tournaments</Text>
        <TouchableOpacity onPress={() => router.push('/organizer/create/tournament')} style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {MOCK.map((t) => (
          <TouchableOpacity key={t.id} onPress={() => router.push(`/organizer/tournaments/${t.id}/manage`)} style={styles.card} activeOpacity={0.85}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{t.name}</Text>
              <Badge color={t.status === 'Live' ? 'yellow' : 'green'}>{t.status}</Badge>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>🏆 {t.format}</Text>
              <Text style={styles.metaText}>📅 {t.date}</Text>
              <Text style={styles.metaText}>👥 {t.teams}/{t.maxTeams} teams</Text>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(t.teams / t.maxTeams) * 100}%` }]} /></View>
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
  newBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow, paddingHorizontal: spacing.md, paddingVertical: 6 },
  newBtnText: { ...font.bodySmMed, color: colors.yellow },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { ...font.h4, color: colors.text, flex: 1, marginRight: spacing.sm },
  cardMeta: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  metaText: { ...font.caption, color: colors.textSecondary },
  progressBar: { height: 4, backgroundColor: colors.surfaceElevated, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
});
