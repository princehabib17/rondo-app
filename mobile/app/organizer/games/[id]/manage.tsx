import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useQuery, useMutation } from '../../../../hooks/useQuery';
import * as q from '../../../../lib/queries';
import type { Team, Announcement } from '../../../../lib/types';

type Tab = 'teams' | 'announcements';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TeamsTab({ gameId, maxPlayers, numTeams }: { gameId: string; maxPlayers: number; numTeams: number }) {
  const teamsQuery = useQuery(() => q.getGameTeams(gameId), [gameId]);
  const playersQuery = useQuery(() => q.getGamePlayers(gameId), [gameId]);

  if (teamsQuery.loading || playersQuery.loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.yellow} /></View>;
  }

  const teams = teamsQuery.data ?? [];
  const players = playersQuery.data ?? [];

  const slotSize = numTeams > 0 ? Math.floor(maxPlayers / numTeams) : maxPlayers;

  if (teams.length === 0) {
    const teamlessPlayers = players;
    return (
      <View style={styles.teamlessContainer}>
        <Text style={styles.teamlessHint}>No teams configured for this game</Text>
        {teamlessPlayers.length > 0 && (
          <View style={styles.chipsWrap}>
            {teamlessPlayers.map((gp) => (
              <View key={gp.id} style={styles.playerChip}>
                <Text style={styles.chipName}>{gp.profile?.full_name ?? 'Player'}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.teamsGrid}>
      {teams.map((team: Team) => {
        const teamPlayers = players.filter((gp) => gp.team_id === team.id);
        const openSlots = Math.max(0, slotSize - teamPlayers.length);
        return (
          <Card key={team.id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={[styles.teamDot, { backgroundColor: team.color }]} />
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCount}>{teamPlayers.length}/{slotSize}</Text>
            </View>
            <View style={styles.chipsWrap}>
              {teamPlayers.map((gp) => (
                <View key={gp.id} style={[styles.playerChip, { borderColor: team.color + '50' }]}>
                  <View style={[styles.chipDot, { backgroundColor: team.color }]} />
                  <Text style={styles.chipName}>{gp.profile?.full_name ?? 'Player'}</Text>
                </View>
              ))}
              {Array.from({ length: openSlots }).map((_, i) => (
                <View key={`open-${i}`} style={styles.playerChipEmpty}>
                  <Text style={styles.chipEmptyText}>Open</Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </View>
  );
}

function AnnouncementsTab({ gameId }: { gameId: string }) {
  const { data, loading, refetch } = useQuery(() => q.getAnnouncements(gameId), [gameId]);
  const postMutation = useMutation((body: string) => q.postAnnouncement(gameId, body));
  const [text, setText] = useState('');

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await postMutation.mutate(trimmed);
      setText('');
      refetch();
    } catch { /* error in postMutation.error */ }
  };

  const announcements = data ?? [];

  return (
    <View style={styles.listSection}>
      <Card style={styles.announceInput}>
        <TextInput
          style={styles.announceTextInput}
          placeholder="Write an announcement…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={300}
        />
        {postMutation.error ? <Text style={styles.postError}>{postMutation.error}</Text> : null}
        <Button size="sm" onPress={submit} disabled={!text.trim()} loading={postMutation.loading}>
          Post
        </Button>
      </Card>
      {loading ? (
        <ActivityIndicator color={colors.yellow} />
      ) : announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={styles.emptyText}>No announcements yet</Text>
        </View>
      ) : (
        announcements.map((a: Announcement) => (
          <Card key={a.id} style={styles.announcePost}>
            <Text style={styles.announceBody}>{a.body}</Text>
            <Text style={styles.announceTime}>{timeAgo(a.created_at)}</Text>
          </Card>
        ))
      )}
    </View>
  );
}

export default function ManageGameScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('teams');

  const gameQuery = useQuery(() => q.getGame(id!), [id]);
  const game = gameQuery.data;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'teams', label: 'Teams' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {gameQuery.loading ? 'Loading…' : (game?.title ?? 'Manage Game')}
          </Text>
          <Text style={styles.headerSub}>Manage Game</Text>
        </View>
        <TouchableOpacity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push(`/organizer/games/${id}/payments` as any)}
          style={styles.paymentsBtn}
        >
          <Text style={styles.paymentsBtnText}>Payments</Text>
        </TouchableOpacity>
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
        {activeTab === 'teams' && game && (
          <TeamsTab gameId={id!} maxPlayers={game.max_players} numTeams={game.num_teams} />
        )}
        {activeTab === 'teams' && !game && !gameQuery.loading && (
          <View style={styles.center}><Text style={styles.emptyText}>Game not found</Text></View>
        )}
        {activeTab === 'announcements' && (
          <AnnouncementsTab gameId={id!} />
        )}
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
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },
  paymentsBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  paymentsBtnText: { ...font.bodySmMed, color: colors.yellow },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.bodySmMed, color: colors.textMuted },
  tabTextActive: { color: colors.yellow },

  scroll: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },

  teamlessContainer: { gap: spacing.md },
  teamlessHint: { ...font.body, color: colors.textMuted },
  teamsGrid: { flexDirection: 'row', gap: spacing.sm },
  teamCard: { flex: 1, gap: spacing.md },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamName: { ...font.bodySmMed, color: colors.text, flex: 1 },
  teamCount: { ...font.caption, color: colors.textMuted },
  chipsWrap: { gap: spacing.xs },
  playerChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceElevated, borderRadius: radius.sm,
    borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipName: { ...font.caption, color: colors.text },
  playerChipEmpty: {
    backgroundColor: 'transparent', borderRadius: radius.sm, borderWidth: 1,
    borderStyle: 'dashed', borderColor: colors.border,
    paddingHorizontal: spacing.sm, paddingVertical: 5, alignItems: 'center',
  },
  chipEmptyText: { ...font.caption, color: colors.textFaint },

  listSection: { gap: spacing.sm },
  announceInput: { gap: spacing.sm },
  announceTextInput: {
    ...font.body, color: colors.text,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    minHeight: 72, textAlignVertical: 'top',
  },
  postError: { ...font.caption, color: colors.error },
  announcePost: { gap: spacing.xs },
  announceBody: { ...font.body, color: colors.text, lineHeight: 22 },
  announceTime: { ...font.caption, color: colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyText: { ...font.bodyMed, color: colors.textMuted },
});
