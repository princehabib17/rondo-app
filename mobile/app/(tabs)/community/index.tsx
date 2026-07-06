import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useQuery, useMutation } from '../../../hooks/useQuery';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import type { Profile } from '../../../lib/types';

const { width } = Dimensions.get('window');

const TABS = ['Posts', 'Reels', 'Players', 'DMs'] as const;
type Tab = typeof TABS[number];

const REEL_SIZE = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

type PostItem = Awaited<ReturnType<typeof q.listPosts>>[number];
type ReelItem = Awaited<ReturnType<typeof q.listReels>>[number];
type ConversationItem = Awaited<ReturnType<typeof q.listConversations>>[number];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function initial(name: string | null | undefined): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Centered>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </Centered>
  );
}

function PostCard({ post }: { post: PostItem; onChanged: () => void }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await q.togglePostLike(post.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{initial(post.author?.full_name)}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>{post.author?.full_name ?? 'Unknown'}</Text>
          <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={toggleLike} style={styles.postAction}>
          <Text style={styles.postActionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.postActionText, liked && { color: colors.error }]}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.postActionIcon}>💬</Text>
          <Text style={styles.postActionText}>{post.comment_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.postActionIcon}>↗️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PostsTab() {
  const { profile } = useAuth();
  const { data, loading, error, refetch } = useQuery(() => q.listPosts());
  const createPost = useMutation((body: string) => q.createPost(body));
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await createPost.mutate(trimmed);
      setBody('');
      setComposing(false);
      refetch();
    } catch {
      /* error surfaced via createPost.error */
    }
  };

  if (loading && !data) return <Centered><ActivityIndicator color={colors.yellow} /></Centered>;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const posts = data ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {composing ? (
        <View style={styles.composerActive}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Share something with the community…"
            placeholderTextColor={colors.textMuted}
            style={styles.composerTextInput}
            multiline
            autoFocus
          />
          <View style={styles.composerActions}>
            <TouchableOpacity onPress={() => { setComposing(false); setBody(''); }} style={styles.composerCancel}>
              <Text style={styles.composerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={!body.trim() || createPost.loading}
              style={[styles.composerPost, (!body.trim() || createPost.loading) && styles.composerPostDisabled]}
            >
              <Text style={styles.composerPostText}>{createPost.loading ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
          {createPost.error ? <Text style={styles.composerError}>{createPost.error}</Text> : null}
        </View>
      ) : (
        <TouchableOpacity style={styles.composer} onPress={() => setComposing(true)}>
          <View style={styles.composerAvatar}>
            <Text style={styles.composerAvatarText}>{initial(profile?.full_name)}</Text>
          </View>
          <View style={styles.composerInput}>
            <Text style={styles.composerPlaceholder}>Share something with the community…</Text>
          </View>
          <Text style={styles.composerCamera}>📷</Text>
        </TouchableOpacity>
      )}

      {posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChanged={refetch} />)
      )}
    </ScrollView>
  );
}

function ReelsTab() {
  const { data, loading, error, refetch } = useQuery(() => q.listReels());

  if (loading && !data) return <Centered><ActivityIndicator color={colors.yellow} /></Centered>;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const reels = data ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reelsGrid}>
      {reels.length === 0 ? (
        <Text style={styles.emptyText}>No reels yet.</Text>
      ) : (
        <View style={styles.reelsRow}>
          {reels.map((r: ReelItem) => (
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
      )}
      <TouchableOpacity style={styles.uploadReelBtn} onPress={() => router.push('/reels')}>
        <Text style={styles.uploadReelText}>+ Upload a Reel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PlayersTab() {
  const { data, loading, error, refetch } = useQuery(() => q.listPlayers(50));

  if (loading && !data) return <Centered><ActivityIndicator color={colors.yellow} /></Centered>;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const players = data ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHint}>Players near you</Text>
      {players.length === 0 ? (
        <Text style={styles.emptyText}>No players found.</Text>
      ) : (
        players.map((p: Profile) => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/profile/${p.id}`)} style={styles.playerRow}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>{initial(p.full_name)}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{p.full_name ?? 'Unknown'}</Text>
              <Text style={styles.playerMeta}>
                {[p.skill_level, p.preferred_areas].filter(Boolean).join(' · ') || 'Player'}
              </Text>
            </View>
            <TouchableOpacity style={styles.messageBtn} onPress={() => router.push(`/messages/${p.id}`)}>
              <Text style={styles.messageBtnText}>Message</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function DMsTab() {
  const { data, loading, error, refetch } = useQuery(() => q.listConversations());

  if (loading && !data) return <Centered><ActivityIndicator color={colors.yellow} /></Centered>;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const convos = data ?? [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {convos.length === 0 ? (
        <Text style={styles.emptyText}>No conversations yet.</Text>
      ) : (
        convos.map((dm: ConversationItem) => (
          <TouchableOpacity
            key={dm.peer.id}
            onPress={() => router.push(`/messages/${dm.peer.id}`)}
            style={styles.dmRow}
          >
            <View style={styles.dmAvatar}>
              <Text style={styles.dmAvatarText}>{initial(dm.peer.full_name)}</Text>
            </View>
            <View style={styles.dmInfo}>
              <Text style={[styles.dmName, dm.unread > 0 && styles.dmNameUnread]}>{dm.peer.full_name ?? 'Unknown'}</Text>
              <Text style={styles.dmLast} numberOfLines={1}>{dm.last.body}</Text>
            </View>
            <View style={styles.dmRight}>
              <Text style={styles.dmTime}>{timeAgo(dm.last.created_at)}</Text>
              {dm.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{dm.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
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
      {tab === 'Posts' && <PostsTab />}
      {tab === 'Reels' && <ReelsTab />}
      {tab === 'Players' && <PlayersTab />}
      {tab === 'DMs' && <DMsTab />}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.yellowDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { ...font.bodySmMed, color: colors.yellow },
  emptyText: { ...font.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },

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
  composerActive: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  composerTextInput: { ...font.body, color: colors.text, minHeight: 60, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md },
  composerCancel: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  composerCancelText: { ...font.bodySmMed, color: colors.textSecondary },
  composerPost: { backgroundColor: colors.yellow, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  composerPostDisabled: { opacity: 0.4 },
  composerPostText: { ...font.bodySmMed, color: colors.bg },
  composerError: { ...font.caption, color: colors.error },
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
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.sm,
  },
  postHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { ...font.bodySmMed, color: colors.yellow },
  postMeta: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
