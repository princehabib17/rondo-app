import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';

const { width } = Dimensions.get('window');

const TABS = ['Posts', 'Reels', 'Players', 'DMs'] as const;
type Tab = typeof TABS[number];

const MOCK_POSTS = [
  { id: '1', author: 'Juan dela Cruz', avatar: null, time: '2h ago', body: 'Great game tonight at Turf Manila! Thanks to everyone who joined 🔥⚽', likes: 14, comments: 3, flag: '🇵🇭' },
  { id: '2', author: 'Rondo PH', avatar: null, time: '5h ago', body: 'Season 3 bracket is now LIVE! Go check your schedule and prepare. See you on the pitch 💪', likes: 42, comments: 8, flag: '🇵🇭' },
];

const MOCK_PLAYERS = [
  { id: '1', name: 'Juan dela Cruz', distance: '0.8km', flag: '🇵🇭', skill: 'Competitive' },
  { id: '2', name: 'Mike Santos', distance: '1.2km', flag: '🇵🇭', skill: 'Intermediate' },
  { id: '3', name: 'Carlo Reyes', distance: '2.4km', flag: '🇵🇭', skill: 'Casual' },
];

const MOCK_DMS = [
  { id: '1', name: 'Rondo PH', last: 'See you Saturday!', time: '10m', unread: 2 },
  { id: '2', name: 'Juan dela Cruz', last: 'Can I join your team?', time: '1h', unread: 0 },
];

const MOCK_REELS = Array.from({ length: 6 }, (_, i) => ({ id: `${i}`, thumb: null }));
const REEL_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

function PostCard({ post }: { post: typeof MOCK_POSTS[0] }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{post.author[0]}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.flag} {post.author}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.postAction}>
          <Text style={styles.postActionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.postActionText, liked && { color: colors.error }]}>{post.likes + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.postActionIcon}>💬</Text>
          <Text style={styles.postActionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.postActionIcon}>↗️</Text>
          <Text style={styles.postActionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('Posts');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      {/* Sub-tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabPill, tab === t && styles.tabPillActive]}>
            <Text style={[styles.tabPillText, tab === t && styles.tabPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {tab === 'Posts' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Composer */}
          <TouchableOpacity style={styles.composer}>
            <View style={styles.composerAvatar}>
              <Text style={styles.composerAvatarText}>Y</Text>
            </View>
            <View style={styles.composerInput}>
              <Text style={styles.composerPlaceholder}>Share something with the community…</Text>
            </View>
            <Text style={styles.composerCamera}>📷</Text>
          </TouchableOpacity>

          {MOCK_POSTS.map((p) => <PostCard key={p.id} post={p} />)}
        </ScrollView>
      )}

      {tab === 'Reels' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reelsGrid}>
          <View style={styles.reelsRow}>
            {MOCK_REELS.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => router.push('/reels')}
                style={[styles.reelThumb, { width: REEL_SIZE, height: REEL_SIZE * 1.4 }]}
              >
                <View style={styles.reelPlaceholder}>
                  <Text style={styles.reelIcon}>▶️</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.uploadReelBtn}>
            <Text style={styles.uploadReelText}>+ Upload a Reel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab === 'Players' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.sectionHint}>Players near you</Text>
          {MOCK_PLAYERS.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/profile/${p.id}`)} style={styles.playerRow}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>{p.name[0]}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{p.flag} {p.name}</Text>
                <Text style={styles.playerMeta}>{p.skill} · {p.distance}</Text>
              </View>
              <TouchableOpacity style={styles.messageBtn}>
                <Text style={styles.messageBtnText}>Message</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {tab === 'DMs' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {MOCK_DMS.map((dm) => (
            <TouchableOpacity
              key={dm.id}
              onPress={() => router.push(`/messages/${dm.id}`)}
              style={styles.dmRow}
            >
              <View style={styles.dmAvatar}>
                <Text style={styles.dmAvatarText}>{dm.name[0]}</Text>
              </View>
              <View style={styles.dmInfo}>
                <Text style={[styles.dmName, dm.unread > 0 && styles.dmNameUnread]}>{dm.name}</Text>
                <Text style={styles.dmLast} numberOfLines={1}>{dm.last}</Text>
              </View>
              <View style={styles.dmRight}>
                <Text style={styles.dmTime}>{dm.time}</Text>
                {dm.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{dm.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: { ...font.h3, color: colors.text },

  tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tabsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabPillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  tabPillText: { ...font.bodySmMed, color: colors.textSecondary },
  tabPillTextActive: { color: colors.yellow },

  content: { padding: spacing.lg, gap: spacing.md },
  sectionHint: { ...font.caption, color: colors.textMuted, marginBottom: spacing.sm },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: { ...font.bodySmMed, color: colors.yellow },
  composerInput: { flex: 1 },
  composerPlaceholder: { ...font.body, color: colors.textMuted },
  composerCamera: { fontSize: 20 },

  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
  },
  postHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { ...font.bodySmMed, color: colors.yellow },
  postMeta: { gap: 2 },
  postAuthor: { ...font.bodySmMed, color: colors.text },
  postTime: { ...font.caption, color: colors.textMuted },
  postBody: { ...font.body, color: colors.textSecondary, lineHeight: 22 },
  postActions: { flexDirection: 'row', gap: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: spacing.sm },
  postAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  postActionIcon: { fontSize: 16 },
  postActionText: { ...font.bodySm, color: colors.textSecondary },

  reelsGrid: { padding: spacing.lg },
  reelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reelThumb: { borderRadius: radius.sm, overflow: 'hidden' },
  reelPlaceholder: { flex: 1, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  reelIcon: { fontSize: 28 },
  uploadReelBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.yellow,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadReelText: { ...font.bodyMed, color: colors.yellow },

  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { ...font.h4, color: colors.yellow },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { ...font.bodyMed, color: colors.text },
  playerMeta: { ...font.caption, color: colors.textMuted },
  messageBtn: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 6 },
  messageBtnText: { ...font.bodySmMed, color: colors.textSecondary },

  dmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  dmAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  dmAvatarText: { ...font.h4, color: colors.yellow },
  dmInfo: { flex: 1, gap: 2 },
  dmName: { ...font.bodyMed, color: colors.textSecondary },
  dmNameUnread: { color: colors.text },
  dmLast: { ...font.caption, color: colors.textMuted },
  dmRight: { alignItems: 'flex-end', gap: spacing.xs },
  dmTime: { ...font.caption, color: colors.textMuted },
  unreadBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  unreadText: { ...font.captionMed, color: colors.bg, fontSize: 10 },
});
