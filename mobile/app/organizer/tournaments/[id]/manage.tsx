import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';

type Tab = 'bracket' | 'standings' | 'teams';

const MOCK_BRACKET = [
  {
    round: 'Quarter-finals',
    matches: [
      { id: 'm1', teamA: 'FC Taguig', teamB: 'Ballers United', scoreA: '3', scoreB: '1', done: true },
      { id: 'm2', teamA: 'BGC Strikers', teamB: 'Southside FC', scoreA: '2', scoreB: '2', done: true },
      { id: 'm3', teamA: 'Manila Kings', teamB: 'Rondo XI', scoreA: '', scoreB: '', done: false },
      { id: 'm4', teamA: 'East Leg FC', teamB: 'Northside SC', scoreA: '', scoreB: '', done: false },
    ],
  },
  {
    round: 'Semi-finals',
    matches: [
      { id: 'm5', teamA: 'FC Taguig', teamB: 'TBD', scoreA: '', scoreB: '', done: false },
      { id: 'm6', teamA: 'TBD', teamB: 'TBD', scoreA: '', scoreB: '', done: false },
    ],
  },
  {
    round: 'Final',
    matches: [
      { id: 'm7', teamA: 'TBD', teamB: 'TBD', scoreA: '', scoreB: '', done: false },
    ],
  },
];

const MOCK_STANDINGS = [
  { rank: 1, team: 'FC Taguig', w: 3, l: 0, d: 0, pts: 9 },
  { rank: 2, team: 'BGC Strikers', w: 2, l: 0, d: 1, pts: 7 },
  { rank: 3, team: 'Ballers United', w: 1, l: 1, d: 1, pts: 4 },
  { rank: 4, team: 'Manila Kings', w: 1, l: 2, d: 0, pts: 3 },
  { rank: 5, team: 'Southside FC', w: 0, l: 2, d: 1, pts: 1 },
  { rank: 6, team: 'Rondo XI', w: 0, l: 3, d: 0, pts: 0 },
];

const MOCK_TEAMS = [
  { id: 't1', name: 'FC Taguig', players: 5, registeredOn: 'Jun 1' },
  { id: 't2', name: 'BGC Strikers', players: 5, registeredOn: 'Jun 2' },
  { id: 't3', name: 'Ballers United', players: 5, registeredOn: 'Jun 3' },
  { id: 't4', name: 'Manila Kings', players: 5, registeredOn: 'Jun 4' },
  { id: 't5', name: 'Southside FC', players: 5, registeredOn: 'Jun 5' },
  { id: 't6', name: 'Rondo XI', players: 5, registeredOn: 'Jun 6' },
];

type Match = typeof MOCK_BRACKET[0]['matches'][0];

function BracketTab() {
  const [editing, setEditing] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});

  const getScore = (id: string, side: 'a' | 'b', fallback: string) =>
    scores[id]?.[side] ?? fallback;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
      {MOCK_BRACKET.map((round) => (
        <View key={round.round} style={styles.bracketRound}>
          <Text style={styles.roundLabel}>{round.round}</Text>
          {round.matches.map((match) => (
            <TouchableOpacity
              key={match.id}
              onPress={() => setEditing(editing === match.id ? null : match.id)}
              activeOpacity={0.85}
              style={[styles.matchBox, editing === match.id && styles.matchBoxActive]}
            >
              <View style={styles.matchRow}>
                <Text style={styles.matchTeam} numberOfLines={1}>{match.teamA}</Text>
                {editing === match.id ? (
                  <TextInput
                    style={styles.scoreInput}
                    value={getScore(match.id, 'a', match.scoreA)}
                    onChangeText={(v) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], a: v } }))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ) : (
                  <Text style={styles.matchScore}>{getScore(match.id, 'a', match.scoreA) || '-'}</Text>
                )}
              </View>
              <View style={styles.matchDivider} />
              <View style={styles.matchRow}>
                <Text style={styles.matchTeam} numberOfLines={1}>{match.teamB}</Text>
                {editing === match.id ? (
                  <TextInput
                    style={styles.scoreInput}
                    value={getScore(match.id, 'b', match.scoreB)}
                    onChangeText={(v) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], b: v } }))}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ) : (
                  <Text style={styles.matchScore}>{getScore(match.id, 'b', match.scoreB) || '-'}</Text>
                )}
              </View>
              {match.done && (
                <Badge color="green" style={styles.doneBadge}>Done</Badge>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function StandingsTab() {
  return (
    <View style={styles.listSection}>
      <View style={styles.standingsHeader}>
        <Text style={[styles.col, styles.colRank, styles.colHeader]}>#</Text>
        <Text style={[styles.col, styles.colTeam, styles.colHeader]}>Team</Text>
        <Text style={[styles.col, styles.colStat, styles.colHeader]}>W</Text>
        <Text style={[styles.col, styles.colStat, styles.colHeader]}>L</Text>
        <Text style={[styles.col, styles.colStat, styles.colHeader]}>D</Text>
        <Text style={[styles.col, styles.colPts, styles.colHeader]}>Pts</Text>
      </View>
      {MOCK_STANDINGS.map((row, i) => (
        <View
          key={row.rank}
          style={[styles.standingsRow, i < MOCK_STANDINGS.length - 1 && styles.standingsRowBorder, row.rank === 1 && styles.standingsRowTop]}
        >
          <Text style={[styles.col, styles.colRank, row.rank === 1 && { color: colors.yellow }]}>{row.rank}</Text>
          <Text style={[styles.col, styles.colTeam]} numberOfLines={1}>{row.team}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.w}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.l}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.d}</Text>
          <Text style={[styles.col, styles.colPts, { color: colors.yellow }]}>{row.pts}</Text>
        </View>
      ))}
    </View>
  );
}

function TeamsTab() {
  return (
    <View style={styles.listSection}>
      {MOCK_TEAMS.map((team) => (
        <Card key={team.id} style={styles.teamRow}>
          <View style={styles.teamAvatar}>
            <Text style={styles.teamAvatarText}>{team.name[0]}</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamMeta}>{team.players} players · Registered {team.registeredOn}</Text>
          </View>
          <Badge color="muted">{team.players}v{team.players}</Badge>
        </Card>
      ))}
    </View>
  );
}

export default function ManageTournamentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('bracket');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'bracket', label: 'Bracket' },
    { key: 'standings', label: 'Standings' },
    { key: 'teams', label: 'Teams' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>BGC Summer Cup</Text>
          <Text style={styles.headerSub}>Manage Tournament</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'bracket' && <BracketTab />}
        {activeTab === 'standings' && <StandingsTab />}
        {activeTab === 'teams' && <TeamsTab />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },
  headerRight: { width: 40 },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textMuted },
  tabTextActive: { color: colors.yellow },

  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  bracketScroll: { gap: spacing.md, paddingBottom: spacing.sm },
  bracketRound: { width: 160, gap: spacing.sm },
  roundLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  matchBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  matchBoxActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { ...font.caption, color: colors.text, flex: 1 },
  matchScore: { ...font.captionMed, color: colors.yellow, minWidth: 20, textAlign: 'center' },
  scoreInput: {
    ...font.captionMed,
    color: colors.yellow,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.yellow,
    minWidth: 28,
    textAlign: 'center',
    paddingVertical: 2,
  },
  matchDivider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 2 },
  doneBadge: { alignSelf: 'flex-end', marginTop: spacing.xs },

  listSection: { gap: spacing.sm },

  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  standingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  standingsRowTop: { backgroundColor: colors.yellowGlow },
  col: { ...font.bodySm, color: colors.text },
  colHeader: { ...font.caption, color: colors.textMuted },
  colRank: { width: 24, textAlign: 'center' },
  colTeam: { flex: 1, paddingLeft: spacing.sm },
  colStat: { width: 28, textAlign: 'center' },
  colPts: { width: 36, textAlign: 'center', fontWeight: '700' },

  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: { ...font.bodySmMed, color: colors.accent },
  teamInfo: { flex: 1, gap: 2 },
  teamName: { ...font.bodyMed, color: colors.text },
  teamMeta: { ...font.caption, color: colors.textMuted },
});
