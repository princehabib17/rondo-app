import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  ActivityIndicator, Alert, Platform, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useQuery } from '../../../hooks/useQuery';
import * as q from '../../../lib/queries';
import type { Tournament, TournamentTeam, TournamentMatch } from '../../../lib/types';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.34;

type Tab = 'overview' | 'bracket' | 'standings' | 'teams';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'bracket', label: 'Bracket' },
  { key: 'standings', label: 'Standings' },
  { key: 'teams', label: 'Teams' },
];

const STATUS_LABEL: Record<Tournament['status'], string> = {
  registration: 'Open',
  active: 'Live',
  completed: 'Done',
  cancelled: 'Cancelled',
};

function formatFormat(format: Tournament['format']): string {
  return format === 'single_elimination' ? 'Knockout' : 'League';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function roundLabel(round: number, maxRound: number): string {
  if (round === maxRound) return 'Final';
  if (round === maxRound - 1) return 'Semi';
  if (round === maxRound - 2) return 'QF';
  return `R${round}`;
}

interface Standing {
  teamId: string;
  team: string;
  w: number;
  l: number;
  d: number;
  pts: number;
}

function computeStandings(teams: TournamentTeam[], matches: TournamentMatch[]): Standing[] {
  const map = new Map<string, Standing>();
  for (const t of teams) {
    map.set(t.id, { teamId: t.id, team: t.name, w: 0, l: 0, d: 0, pts: 0 });
  }
  for (const m of matches) {
    if (m.status !== 'completed' || m.home_team_id == null || m.away_team_id == null) continue;
    if (m.home_score == null || m.away_score == null) continue;
    const home = map.get(m.home_team_id);
    const away = map.get(m.away_team_id);
    if (!home || !away) continue;
    if (m.home_score > m.away_score) {
      home.w += 1; home.pts += 3; away.l += 1;
    } else if (m.home_score < m.away_score) {
      away.w += 1; away.pts += 3; home.l += 1;
    } else {
      home.d += 1; home.pts += 1; away.d += 1; away.pts += 1;
    }
  }
  return [...map.values()].sort((a, b) => b.pts - a.pts || b.w - a.w);
}

export default function TournamentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [registering, setRegistering] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

  const tournamentQ = useQuery(() => q.getTournament(id), [id]);
  const teamsQ = useQuery(() => q.getTournamentTeams(id), [id]);
  const matchesQ = useQuery(() => q.getTournamentMatches(id), [id]);

  const tournament = tournamentQ.data;
  const teams = teamsQ.data ?? [];
  const matches = matchesQ.data ?? [];

  const loading = tournamentQ.loading || teamsQ.loading || matchesQ.loading;
  const error = tournamentQ.error || teamsQ.error || matchesQ.error;

  const refetchAll = () => {
    tournamentQ.refetch();
    teamsQ.refetch();
    matchesQ.refetch();
  };

  const teamNameById = (tid: string | null): string => {
    if (!tid) return 'TBD';
    return teams.find((t) => t.id === tid)?.name ?? 'TBD';
  };

  async function doRegister(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setRegistering(true);
    try {
      await q.registerTournamentTeam(id, trimmed);
      teamsQ.refetch();
    } catch (e) {
      Alert.alert('Registration failed', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setRegistering(false);
      setModalOpen(false);
      setTeamName('');
    }
  }

  function handleRegisterPress() {
    if (Platform.OS === 'ios' && Alert.prompt) {
      Alert.prompt('Register Team', 'Enter your team name', (value) => {
        if (value) doRegister(value);
      });
    } else {
      setTeamName('');
      setModalOpen(true);
    }
  }

  if (loading && !tournament) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error || !tournament) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? 'Tournament not found'}</Text>
        <TouchableOpacity onPress={refetchAll} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const registeredTeams = teams.filter((t) => t.status === 'registered');
  const isFull = registeredTeams.length >= tournament.max_teams;
  const canRegister = tournament.status === 'registration' && !isFull;
  const standings = computeStandings(teams, matches);
  const maxRound = matches.reduce((m, x) => Math.max(m, x.round), 0);

  const rounds: { round: number; matches: TournamentMatch[] }[] = [];
  for (const m of matches) {
    let entry = rounds.find((r) => r.round === m.round);
    if (!entry) { entry = { round: m.round, matches: [] }; rounds.push(entry); }
    entry.matches.push(m);
  }
  rounds.sort((a, b) => a.round - b.round);

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <LinearGradient colors={['#0D1A2D', '#1A2840', '#0A0A0A']} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.97)']}
          style={[StyleSheet.absoluteFill, { top: HERO_HEIGHT * 0.35 }]}
        />
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.heroTags}>
            <Badge color={tournament.status === 'registration' ? 'green' : tournament.status === 'active' ? 'yellow' : 'muted'}>
              {STATUS_LABEL[tournament.status]}
            </Badge>
            <Badge color="muted">{tournament.team_size}v{tournament.team_size} {formatFormat(tournament.format)}</Badge>
          </View>
          <Text style={styles.heroTitle}>{tournament.name}</Text>
          {tournament.venue_name ? <Text style={styles.heroOrg}>{tournament.venue_name}</Text> : null}
        </View>
      </View>

      <View style={styles.infoStrip}>
        {[
          { icon: '📅', label: formatDate(tournament.starts_at) },
          { icon: '💰', label: `₱${(tournament.entry_fee / 100).toLocaleString()} entry` },
          { icon: '👥', label: `${registeredTeams.length}/${tournament.max_teams} teams` },
        ].map((item) => (
          <View key={item.label} style={styles.infoItem}>
            <Text style={styles.infoIcon}>{item.icon}</Text>
            <Text style={styles.infoText}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 120 }}>
        {activeTab === 'overview' && (
          <>
            <Card style={styles.descCard}>
              <Text style={styles.descTitle}>About</Text>
              <Text style={styles.descText}>{tournament.description ?? 'No description provided.'}</Text>
            </Card>
            <Card>
              <View style={styles.organizerRow}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerAvatarText}>{(tournament.venue_name ?? 'O')[0]}</Text>
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>{tournament.venue_name ?? 'Organizer'}</Text>
                  <Text style={styles.organizerLabel}>Organizer</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/organizers/${tournament.organizer_id}`)} style={styles.viewOrgBtn}>
                  <Text style={styles.viewOrgText}>View</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'bracket' && (
          rounds.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matches scheduled yet.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
              {rounds.map((round) => (
                <View key={round.round} style={styles.bracketRound}>
                  <Text style={styles.roundLabel}>{roundLabel(round.round, maxRound)}</Text>
                  {round.matches.map((match) => (
                    <View key={match.id} style={styles.matchBox}>
                      <View style={styles.matchRow}>
                        <Text style={styles.matchTeam} numberOfLines={1}>{teamNameById(match.home_team_id)}</Text>
                        <Text style={styles.matchScore}>{match.home_score ?? '-'}</Text>
                      </View>
                      <View style={styles.matchDivider} />
                      <View style={styles.matchRow}>
                        <Text style={styles.matchTeam} numberOfLines={1}>{teamNameById(match.away_team_id)}</Text>
                        <Text style={styles.matchScore}>{match.away_score ?? '-'}</Text>
                      </View>
                      {match.status === 'completed' && <Badge color="green" style={styles.doneBadge}>Done</Badge>}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )
        )}

        {activeTab === 'standings' && (
          standings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No standings yet.</Text>
            </View>
          ) : (
            <View style={styles.standingsTable}>
              <View style={[styles.standingsRow, styles.standingsHeaderRow]}>
                <Text style={[styles.sCol, styles.sColRank, styles.sColHeader]}>#</Text>
                <Text style={[styles.sCol, styles.sColTeam, styles.sColHeader]}>Team</Text>
                <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>W</Text>
                <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>L</Text>
                <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>D</Text>
                <Text style={[styles.sCol, styles.sColPts, styles.sColHeader]}>Pts</Text>
              </View>
              {standings.map((row, i) => {
                const rank = i + 1;
                return (
                  <View
                    key={row.teamId}
                    style={[styles.standingsRow, i < standings.length - 1 && styles.standingsRowBorder, rank === 1 && styles.standingsRowTop]}
                  >
                    <Text style={[styles.sCol, styles.sColRank, rank === 1 && { color: colors.yellow }]}>{rank}</Text>
                    <Text style={[styles.sCol, styles.sColTeam]} numberOfLines={1}>{row.team}</Text>
                    <Text style={[styles.sCol, styles.sColStat]}>{row.w}</Text>
                    <Text style={[styles.sCol, styles.sColStat]}>{row.l}</Text>
                    <Text style={[styles.sCol, styles.sColStat]}>{row.d}</Text>
                    <Text style={[styles.sCol, styles.sColPts, { color: colors.yellow }]}>{row.pts}</Text>
                  </View>
                );
              })}
            </View>
          )
        )}

        {activeTab === 'teams' && (
          registeredTeams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No teams registered yet.</Text>
            </View>
          ) : (
            <View style={styles.teamsList}>
              {registeredTeams.map((team) => (
                <Card key={team.id} style={styles.teamCard}>
                  <View style={styles.teamAvatar}>
                    <Text style={styles.teamAvatarText}>{team.name[0]}</Text>
                  </View>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>{tournament.team_size} players · Joined {formatShortDate(team.created_at)}</Text>
                  </View>
                </Card>
              ))}
            </View>
          )
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={handleRegisterPress}
          disabled={!canRegister || registering}
          loading={registering}
          size="lg"
          style={{ flex: 1 }}
        >
          {tournament.status !== 'registration' ? 'Registration Closed' : isFull ? 'Full' : 'Register Team'}
        </Button>
      </View>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Register Team</Text>
            <Text style={styles.modalLabel}>Team name</Text>
            <TextInput
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. FC Taguig"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Button onPress={() => doRegister(teamName)} disabled={!teamName.trim() || registering} loading={registering}>
                Register
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: {
    backgroundColor: colors.yellowDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  hero: { position: 'relative', justifyContent: 'flex-end' },
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
  heroContent: { padding: spacing.lg, gap: spacing.xs },
  heroTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  heroTitle: { ...font.h1, color: colors.text },
  heroOrg: { ...font.bodyMed, color: colors.yellow },

  infoStrip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: { fontSize: 15, width: 22 },
  infoText: { ...font.bodySm, color: colors.textSecondary },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.caption, color: colors.textMuted },
  tabTextActive: { ...font.captionMed, color: colors.yellow },

  descCard: { gap: spacing.sm },
  descTitle: { ...font.h4, color: colors.text },
  descText: { ...font.body, color: colors.textSecondary, lineHeight: 24 },

  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  organizerAvatarText: { ...font.h4, color: colors.yellow },
  organizerInfo: { flex: 1, gap: 2 },
  organizerName: { ...font.bodyMed, color: colors.text },
  organizerLabel: { ...font.caption, color: colors.textMuted },
  viewOrgBtn: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 6 },
  viewOrgText: { ...font.bodySmMed, color: colors.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...font.body, color: colors.textMuted, textAlign: 'center' },

  bracketScroll: { gap: spacing.md, paddingBottom: spacing.sm },
  bracketRound: { width: 148, gap: spacing.sm },
  roundLabel: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs },
  matchBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTeam: { ...font.caption, color: colors.text, flex: 1 },
  matchScore: { ...font.captionMed, color: colors.yellow, minWidth: 20, textAlign: 'center' },
  matchDivider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 2 },
  doneBadge: { alignSelf: 'flex-end', marginTop: spacing.xs },

  standingsTable: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  standingsHeaderRow: { backgroundColor: colors.surfaceElevated },
  standingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm + 2 },
  standingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  standingsRowTop: { backgroundColor: colors.yellowGlow },
  sCol: { ...font.bodySm, color: colors.text },
  sColHeader: { ...font.caption, color: colors.textMuted },
  sColRank: { width: 24, textAlign: 'center' },
  sColTeam: { flex: 1, paddingLeft: spacing.sm },
  sColStat: { width: 28, textAlign: 'center' },
  sColPts: { width: 36, textAlign: 'center', fontWeight: '700' },

  teamsList: { gap: spacing.sm },
  teamCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  teamAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  teamAvatarText: { ...font.bodySmMed, color: colors.accent },
  teamInfo: { flex: 1, gap: 2 },
  teamName: { ...font.bodyMed, color: colors.text },
  teamMeta: { ...font.caption, color: colors.textMuted },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: { ...font.h4, color: colors.text },
  modalLabel: { ...font.caption, color: colors.textMuted, marginTop: spacing.xs },
  modalInput: {
    ...font.body,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.sm },
  modalCancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  modalCancelText: { ...font.bodySmMed, color: colors.textSecondary },
});
