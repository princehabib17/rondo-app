import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { useQuery } from '../../../../hooks/useQuery';
import * as q from '../../../../lib/queries';
import type { TournamentMatch, TournamentTeam } from '../../../../lib/types';

type Tab = 'bracket' | 'standings' | 'teams';

function timeAgo(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function roundLabel(round: number, maxRound: number): string {
  if (round === maxRound) return 'Final';
  if (round === maxRound - 1) return 'Semi-finals';
  if (round === maxRound - 2) return 'Quarter-finals';
  return `Round ${round}`;
}

function BracketTab({ tournamentId }: { tournamentId: string }) {
  const matchesQuery = useQuery(() => q.getTournamentMatches(tournamentId), [tournamentId]);
  const teamsQuery = useQuery(() => q.getTournamentTeams(tournamentId), [tournamentId]);
  const [editing, setEditing] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);
  const teams = teamsQuery.data ?? [];

  const teamName = (id: string | null) => {
    if (!id) return 'TBD';
    return teams.find((t) => t.id === id)?.name ?? 'TBD';
  };

  const maxRound = matches.reduce((max, m) => Math.max(max, m.round), 0);

  const byRound = useMemo(() => {
    const map = new Map<number, TournamentMatch[]>();
    for (const m of matches) {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const saveScore = async (match: TournamentMatch) => {
    const entry = scores[match.id];
    if (!entry) return;
    const homeScore = parseInt(entry.a ?? '', 10);
    const awayScore = parseInt(entry.b ?? '', 10);
    if (isNaN(homeScore) || isNaN(awayScore)) {
      Alert.alert('Invalid scores', 'Please enter valid numbers.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await q.updateTournamentMatch(match.id, homeScore, awayScore);
      setEditing(null);
      matchesQuery.refetch();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save score');
    } finally {
      setSaving(false);
    }
  };

  if (matchesQuery.loading) return <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>;

  if (matches.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>No matches generated yet</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
      {byRound.map(([round, roundMatches]) => (
        <View key={round} style={styles.bracketRound}>
          <Text style={styles.roundLabel}>{roundLabel(round, maxRound)}</Text>
          {roundMatches.map((match) => {
            const isEditing = editing === match.id;
            const homeScore = scores[match.id]?.a ?? (match.home_score?.toString() ?? '');
            const awayScore = scores[match.id]?.b ?? (match.away_score?.toString() ?? '');
            return (
              <TouchableOpacity
                key={match.id}
                onPress={() => match.status !== 'bye' && setEditing(isEditing ? null : match.id)}
                activeOpacity={0.85}
                style={[styles.matchBox, isEditing && styles.matchBoxActive]}
              >
                <View style={styles.matchRow}>
                  <Text style={styles.matchTeam} numberOfLines={1}>{teamName(match.home_team_id)}</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.scoreInput}
                      value={homeScore}
                      onChangeText={(v) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], a: v } }))}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  ) : (
                    <Text style={styles.matchScore}>{homeScore || '-'}</Text>
                  )}
                </View>
                <View style={styles.matchDivider} />
                <View style={styles.matchRow}>
                  <Text style={styles.matchTeam} numberOfLines={1}>{teamName(match.away_team_id)}</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.scoreInput}
                      value={awayScore}
                      onChangeText={(v) => setScores((s) => ({ ...s, [match.id]: { ...s[match.id], b: v } }))}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  ) : (
                    <Text style={styles.matchScore}>{awayScore || '-'}</Text>
                  )}
                </View>
                {isEditing && (
                  <TouchableOpacity
                    onPress={() => saveScore(match)}
                    disabled={saving}
                    style={styles.saveBtn}
                  >
                    <Text style={styles.saveBtnText}>{saving ? '…' : 'Save'}</Text>
                  </TouchableOpacity>
                )}
                {match.status === 'completed' && !isEditing && (
                  <Badge color="green" style={styles.doneBadge}>Done</Badge>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

function StandingsTab({ tournamentId }: { tournamentId: string }) {
  const matchesQuery = useQuery(() => q.getTournamentMatches(tournamentId), [tournamentId]);
  const teamsQuery = useQuery(() => q.getTournamentTeams(tournamentId), [tournamentId]);

  if (matchesQuery.loading || teamsQuery.loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>;
  }

  const matches = matchesQuery.data ?? [];
  const teams = teamsQuery.data ?? [];

  const standings = teams.map((team) => {
    let w = 0, l = 0, d = 0;
    for (const m of matches) {
      if (m.status !== 'completed') continue;
      const isHome = m.home_team_id === team.id;
      const isAway = m.away_team_id === team.id;
      if (!isHome && !isAway) continue;
      const myScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const theirScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      if (myScore > theirScore) w++;
      else if (myScore < theirScore) l++;
      else d++;
    }
    return { id: team.id, name: team.name, w, l, d, pts: w * 3 + d };
  }).sort((a, b) => b.pts - a.pts || b.w - a.w);

  if (standings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No standings yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.listSection}>
      <View style={styles.standingsHeader}>
        {['#', 'Team', 'W', 'L', 'D', 'Pts'].map((h) => (
          <Text key={h} style={[styles.col, h === 'Team' ? styles.colTeam : h === '#' ? styles.colRank : h === 'Pts' ? styles.colPts : styles.colStat, styles.colHeader]}>{h}</Text>
        ))}
      </View>
      {standings.map((row, i) => (
        <View
          key={row.id}
          style={[styles.standingsRow, i < standings.length - 1 && styles.standingsRowBorder, i === 0 && styles.standingsRowTop]}
        >
          <Text style={[styles.col, styles.colRank, i === 0 && { color: colors.yellow }]}>{i + 1}</Text>
          <Text style={[styles.col, styles.colTeam]} numberOfLines={1}>{row.name}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.w}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.l}</Text>
          <Text style={[styles.col, styles.colStat]}>{row.d}</Text>
          <Text style={[styles.col, styles.colPts, { color: colors.yellow }]}>{row.pts}</Text>
        </View>
      ))}
    </View>
  );
}

function TeamsTab({ tournamentId, teamSize }: { tournamentId: string; teamSize: number }) {
  const teamsQuery = useQuery(() => q.getTournamentTeams(tournamentId), [tournamentId]);
  const teams = teamsQuery.data ?? [];

  if (teamsQuery.loading) return <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>;

  return (
    <View style={styles.listSection}>
      {teams.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No teams registered yet</Text>
        </View>
      ) : teams.map((team: TournamentTeam) => (
        <Card key={team.id} style={styles.teamRow}>
          <View style={styles.teamAvatar}>
            <Text style={styles.teamAvatarText}>{(team.name[0] ?? 'T').toUpperCase()}</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamMeta}>{teamSize}v{teamSize} · Registered {timeAgo(team.created_at)}</Text>
          </View>
          <Badge color={team.status === 'registered' ? 'green' : 'red'}>{team.status}</Badge>
        </Card>
      ))}
    </View>
  );
}

export default function ManageTournamentScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('bracket');

  const tournamentQuery = useQuery(() => q.getTournament(id!), [id]);
  const tournament = tournamentQuery.data;

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {tournamentQuery.loading ? 'Loading…' : (tournament?.name ?? 'Tournament')}
          </Text>
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
        {activeTab === 'bracket' && <BracketTab tournamentId={id!} />}
        {activeTab === 'standings' && <StandingsTab tournamentId={id!} />}
        {activeTab === 'teams' && <TeamsTab tournamentId={id!} teamSize={tournament?.team_size ?? 5} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },
  headerRight: { width: 40 },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textMuted },
  tabTextActive: { color: colors.yellow },

  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  bracketScroll: { gap: spacing.md, paddingBottom: spacing.sm },
  bracketRound: { width: 160, gap: spacing.sm },
  roundLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  matchBox: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderSubtle, padding: spacing.sm, gap: spacing.xs,
  },
  matchBoxActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { ...font.caption, color: colors.text, flex: 1 },
  matchScore: { ...font.captionMed, color: colors.yellow, minWidth: 20, textAlign: 'center' },
  scoreInput: {
    ...font.captionMed, color: colors.yellow,
    backgroundColor: colors.surfaceElevated, borderRadius: radius.xs,
    borderWidth: 1, borderColor: colors.yellow, minWidth: 28, textAlign: 'center', paddingVertical: 2,
  },
  matchDivider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 2 },
  doneBadge: { alignSelf: 'flex-end', marginTop: spacing.xs },
  saveBtn: { backgroundColor: colors.yellow, borderRadius: radius.sm, padding: 4, alignItems: 'center', marginTop: spacing.xs },
  saveBtnText: { ...font.captionMed, color: colors.bg, fontWeight: '700' },

  listSection: { gap: spacing.sm },
  standingsHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  standingsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 2,
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
  teamAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  teamAvatarText: { ...font.bodySmMed, color: colors.accent },
  teamInfo: { flex: 1, gap: 2 },
  teamName: { ...font.bodyMed, color: colors.text },
  teamMeta: { ...font.caption, color: colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyText: { ...font.bodyMed, color: colors.textMuted },
});
