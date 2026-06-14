import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const { height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.34;

type Tab = 'overview' | 'bracket' | 'standings' | 'teams';

const MOCK_TOURNAMENT = {
  id: '1',
  name: 'BGC Summer Cup',
  status: 'Open',
  date: 'Jun 28, 2026',
  entryFee: 500,
  format: '5v5 Knockout',
  teams: 4,
  maxTeams: 8,
  organizer: 'FC Taguig',
  organizerVerified: true,
  description: 'The biggest summer cup in BGC. 8 teams compete in a single-elimination knockout bracket. Entry includes jersey and post-game food. Open to all skill levels. Team registration required.',
};

const MOCK_STANDINGS = [
  { rank: 1, team: 'FC Taguig', w: 3, l: 0, d: 0, pts: 9 },
  { rank: 2, team: 'BGC Strikers', w: 2, l: 0, d: 1, pts: 7 },
  { rank: 3, team: 'Ballers United', w: 1, l: 1, d: 1, pts: 4 },
  { rank: 4, team: 'Manila Kings', w: 1, l: 2, d: 0, pts: 3 },
];

const MOCK_BRACKET = [
  {
    round: 'QF',
    matches: [
      { id: 'm1', teamA: 'FC Taguig', teamB: 'Ballers United', scoreA: '3', scoreB: '1', done: true },
      { id: 'm2', teamA: 'BGC Strikers', teamB: 'Manila Kings', scoreA: '2', scoreB: '0', done: true },
    ],
  },
  {
    round: 'Semi',
    matches: [
      { id: 'm3', teamA: 'FC Taguig', teamB: 'BGC Strikers', scoreA: '', scoreB: '', done: false },
    ],
  },
  {
    round: 'Final',
    matches: [
      { id: 'm4', teamA: 'TBD', teamB: 'TBD', scoreA: '', scoreB: '', done: false },
    ],
  },
];

const MOCK_TEAMS = [
  { id: 't1', name: 'FC Taguig', players: 5, registeredOn: 'Jun 1' },
  { id: 't2', name: 'BGC Strikers', players: 5, registeredOn: 'Jun 2' },
  { id: 't3', name: 'Ballers United', players: 5, registeredOn: 'Jun 3' },
  { id: 't4', name: 'Manila Kings', players: 5, registeredOn: 'Jun 4' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'bracket', label: 'Bracket' },
  { key: 'standings', label: 'Standings' },
  { key: 'teams', label: 'Teams' },
];

export default function TournamentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isFull = MOCK_TOURNAMENT.teams >= MOCK_TOURNAMENT.maxTeams;

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <LinearGradient colors={['#0D1A2D', '#1A2840', '#0A0A0A']} style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.97)']}
          style={[StyleSheet.absoluteFillObject, { top: HERO_HEIGHT * 0.35 }]}
        />
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.heroTags}>
            <Badge color={MOCK_TOURNAMENT.status === 'Open' ? 'green' : 'yellow'}>
              {MOCK_TOURNAMENT.status}
            </Badge>
            <Badge color="muted">{MOCK_TOURNAMENT.format}</Badge>
          </View>
          <Text style={styles.heroTitle}>{MOCK_TOURNAMENT.name}</Text>
          <Text style={styles.heroOrg}>by {MOCK_TOURNAMENT.organizer}</Text>
        </View>
      </View>

      <View style={styles.infoStrip}>
        {[
          { icon: '📅', label: MOCK_TOURNAMENT.date },
          { icon: '💰', label: `₱${MOCK_TOURNAMENT.entryFee} entry` },
          { icon: '👥', label: `${MOCK_TOURNAMENT.teams}/${MOCK_TOURNAMENT.maxTeams} teams` },
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
              <Text style={styles.descText}>{MOCK_TOURNAMENT.description}</Text>
            </Card>
            <Card>
              <View style={styles.organizerRow}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerAvatarText}>{MOCK_TOURNAMENT.organizer[0]}</Text>
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>
                    {MOCK_TOURNAMENT.organizer}
                    {MOCK_TOURNAMENT.organizerVerified && <Text style={{ color: colors.yellow }}> ✓</Text>}
                  </Text>
                  <Text style={styles.organizerLabel}>Organizer</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/organizers/1')} style={styles.viewOrgBtn}>
                  <Text style={styles.viewOrgText}>View</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'bracket' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bracketScroll}>
            {MOCK_BRACKET.map((round) => (
              <View key={round.round} style={styles.bracketRound}>
                <Text style={styles.roundLabel}>{round.round}</Text>
                {round.matches.map((match) => (
                  <View key={match.id} style={styles.matchBox}>
                    <View style={styles.matchRow}>
                      <Text style={styles.matchTeam} numberOfLines={1}>{match.teamA}</Text>
                      <Text style={styles.matchScore}>{match.scoreA || '-'}</Text>
                    </View>
                    <View style={styles.matchDivider} />
                    <View style={styles.matchRow}>
                      <Text style={styles.matchTeam} numberOfLines={1}>{match.teamB}</Text>
                      <Text style={styles.matchScore}>{match.scoreB || '-'}</Text>
                    </View>
                    {match.done && <Badge color="green" style={styles.doneBadge}>Done</Badge>}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'standings' && (
          <View style={styles.standingsTable}>
            <View style={[styles.standingsRow, styles.standingsHeaderRow]}>
              <Text style={[styles.sCol, styles.sColRank, styles.sColHeader]}>#</Text>
              <Text style={[styles.sCol, styles.sColTeam, styles.sColHeader]}>Team</Text>
              <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>W</Text>
              <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>L</Text>
              <Text style={[styles.sCol, styles.sColStat, styles.sColHeader]}>D</Text>
              <Text style={[styles.sCol, styles.sColPts, styles.sColHeader]}>Pts</Text>
            </View>
            {MOCK_STANDINGS.map((row, i) => (
              <View
                key={row.rank}
                style={[styles.standingsRow, i < MOCK_STANDINGS.length - 1 && styles.standingsRowBorder, row.rank === 1 && styles.standingsRowTop]}
              >
                <Text style={[styles.sCol, styles.sColRank, row.rank === 1 && { color: colors.yellow }]}>{row.rank}</Text>
                <Text style={[styles.sCol, styles.sColTeam]} numberOfLines={1}>{row.team}</Text>
                <Text style={[styles.sCol, styles.sColStat]}>{row.w}</Text>
                <Text style={[styles.sCol, styles.sColStat]}>{row.l}</Text>
                <Text style={[styles.sCol, styles.sColStat]}>{row.d}</Text>
                <Text style={[styles.sCol, styles.sColPts, { color: colors.yellow }]}>{row.pts}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'teams' && (
          <View style={styles.teamsList}>
            {MOCK_TEAMS.map((team) => (
              <Card key={team.id} style={styles.teamCard}>
                <View style={styles.teamAvatar}>
                  <Text style={styles.teamAvatarText}>{team.name[0]}</Text>
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamMeta}>{team.players} players · Joined {team.registeredOn}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={() => {}}
          disabled={isFull}
          size="lg"
          style={{ flex: 1 }}
        >
          {isFull ? 'Full — Join Waitlist' : 'Register Team'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

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
});
