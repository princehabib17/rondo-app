import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../../../constants/theme';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';

type Tab = 'teams' | 'waitlist' | 'announcements';

const MOCK_TEAMS = [
  {
    name: 'Team Red',
    color: '#EF4444',
    players: ['Juan D.', 'Mike S.', 'Carlo R.', 'Rico M.'],
    max: 5,
  },
  {
    name: 'Team Blue',
    color: '#3B82F6',
    players: ['Alex T.', 'Ben C.', 'Chris V.', 'Dave P.', 'Ed N.'],
    max: 5,
  },
];

const MOCK_WAITLIST = [
  { id: 'w1', name: 'Marco Reyes', joined: '10 min ago' },
  { id: 'w2', name: 'Sam Lim', joined: '25 min ago' },
  { id: 'w3', name: 'Paolo Cruz', joined: '1 hr ago' },
];

const MOCK_ANNOUNCEMENTS = [
  { id: 'a1', body: 'Bring your own water and towel.', time: '2h ago' },
  { id: 'a2', body: 'Game starts 8PM sharp — arrive 15 mins early for warm-up.', time: '5h ago' },
];

function TeamsTab() {
  return (
    <View style={styles.teamsGrid}>
      {MOCK_TEAMS.map((team) => (
        <Card key={team.name} style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <View style={[styles.teamDot, { backgroundColor: team.color }]} />
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamCount}>{team.players.length}/{team.max}</Text>
          </View>
          <View style={styles.chipsWrap}>
            {team.players.map((p) => (
              <View key={p} style={[styles.playerChip, { borderColor: team.color + '50' }]}>
                <View style={[styles.chipDot, { backgroundColor: team.color }]} />
                <Text style={styles.chipName}>{p}</Text>
              </View>
            ))}
            {Array.from({ length: team.max - team.players.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.playerChipEmpty}>
                <Text style={styles.chipEmptyText}>Open</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </View>
  );
}

function WaitlistTab() {
  const [list, setList] = useState(MOCK_WAITLIST);

  const promote = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setList((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <View style={styles.listSection}>
      {list.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Waitlist is empty</Text>
        </View>
      )}
      {list.map((player) => (
        <Card key={player.id} style={styles.waitlistRow}>
          <View style={styles.waitlistAvatar}>
            <Text style={styles.waitlistAvatarText}>{player.name[0]}</Text>
          </View>
          <View style={styles.waitlistInfo}>
            <Text style={styles.waitlistName}>{player.name}</Text>
            <Text style={styles.waitlistTime}>Joined {player.joined}</Text>
          </View>
          <Button size="sm" variant="secondary" onPress={() => promote(player.id)}>
            Promote
          </Button>
        </Card>
      ))}
    </View>
  );
}

function AnnouncementsTab() {
  const [text, setText] = useState('');
  const [posts, setPosts] = useState(MOCK_ANNOUNCEMENTS);

  const post = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts((prev) => [{ id: Date.now().toString(), body: text.trim(), time: 'Just now' }, ...prev]);
    setText('');
  };

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
        <Button size="sm" onPress={post} disabled={!text.trim()}>
          Post
        </Button>
      </Card>
      {posts.map((a) => (
        <Card key={a.id} style={styles.announcePost}>
          <Text style={styles.announceBody}>{a.body}</Text>
          <Text style={styles.announceTime}>{a.time}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function ManageGameScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('teams');

  const TABS: { key: Tab; label: string }[] = [
    { key: 'teams', label: 'Teams' },
    { key: 'waitlist', label: 'Waitlist' },
    { key: 'announcements', label: 'Announcements' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Friday Night 5v5</Text>
          <Text style={styles.headerSub}>Manage Game</Text>
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
        {activeTab === 'teams' && <TeamsTab />}
        {activeTab === 'waitlist' && <WaitlistTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
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

  teamsGrid: { flexDirection: 'row', gap: spacing.sm },
  teamCard: { flex: 1, gap: spacing.md },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamName: { ...font.bodySmMed, color: colors.text, flex: 1 },
  teamCount: { ...font.caption, color: colors.textMuted },
  chipsWrap: { gap: spacing.xs },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipName: { ...font.caption, color: colors.text },
  playerChipEmpty: {
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    alignItems: 'center',
  },
  chipEmptyText: { ...font.caption, color: colors.textFaint },

  listSection: { gap: spacing.sm },
  waitlistRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  waitlistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistAvatarText: { ...font.bodySmMed, color: colors.yellow },
  waitlistInfo: { flex: 1, gap: 2 },
  waitlistName: { ...font.bodyMed, color: colors.text },
  waitlistTime: { ...font.caption, color: colors.textMuted },

  announceInput: { gap: spacing.sm },
  announceTextInput: {
    ...font.body,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  announcePost: { gap: spacing.xs },
  announceBody: { ...font.body, color: colors.text, lineHeight: 22 },
  announceTime: { ...font.caption, color: colors.textMuted },

  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 36 },
  emptyText: { ...font.bodyMed, color: colors.textMuted },
});
