import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../../constants/theme';
import { useQuery, useMutation } from '../../../hooks/useQuery';
import { useAuth } from '../../../hooks/useAuth';
import * as q from '../../../lib/queries';
import type { Game, Message, Profile } from '../../../lib/types';

type ChatMessage = Message & { profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function firstChar(name: string | null | undefined) {
  return (name ?? '?').trim()[0]?.toUpperCase() ?? '?';
}

function countdownLabel(iso: string | undefined): string | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return '⚽ Game in progress';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `⚽ Game starts in ${mins} minute${mins !== 1 ? 's' : ''}`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `⚽ Game starts in ${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.round(hours / 24);
  return `⚽ Game starts in ${days} day${days !== 1 ? 's' : ''}`;
}

function MessageBubble({
  msg, mine, showAvatar, showName,
}: { msg: ChatMessage; mine: boolean; showAvatar: boolean; showName: boolean }) {
  const name = msg.profile?.full_name ?? 'Player';
  return (
    <View style={[styles.messageRow, mine && styles.messageRowMine]}>
      {!mine && (
        <View style={[styles.avatar, !showAvatar && styles.avatarHidden]}>
          <Text style={styles.avatarText}>{showAvatar ? firstChar(name) : ''}</Text>
        </View>
      )}
      <View style={styles.bubbleCol}>
        {showName && !mine && (
          <Text style={styles.senderName}>{name}</Text>
        )}
        <View style={[styles.bubble, mine && styles.bubbleMine]}>
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{msg.body}</Text>
        </View>
        <Text style={[styles.time, mine && styles.timeMine]}>{formatTime(msg.created_at)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = rawId ?? '';
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const { data: messages, loading, error, refetch } = useQuery<ChatMessage[]>(() => q.getGameMessages(id), [id]);
  const { data: game } = useQuery<Game>(() => q.getGame(id), [id]);
  const sendMutation = useMutation((body: string) => q.sendGameMessage(id, body));

  const list = messages ?? [];
  const countdown = countdownLabel(game?.date_time);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || sendMutation.loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    try {
      await sendMutation.mutate(body);
      await refetch();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInput(body); // restore on failure
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Squad Chat</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{game?.title ?? 'Game chat'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/games/${id}`)}>
          <Text style={styles.headerInfo}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Countdown banner */}
      {!!countdown && (
        <View style={styles.countdownBanner}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Messages */}
      {loading && !messages ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No messages yet. Say hi 👋</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={list}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const mine = !!user && item.user_id === user.id;
            const prev = list[index - 1];
            const showAvatar = !mine && prev?.user_id !== item.user_id;
            return (
              <MessageBubble msg={item} mine={mine} showAvatar={showAvatar} showName={showAvatar} />
            );
          }}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TouchableOpacity style={styles.attachBtn} onPress={() => Alert.alert('Attach Photo', 'Photo sharing coming soon!')}>
          <Text style={styles.attachIcon}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || sendMutation.loading}
          style={[styles.sendBtn, (!input.trim() || sendMutation.loading) && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  headerInfo: { fontSize: 20, padding: spacing.xs },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1, borderColor: colors.yellow },
  retryText: { ...font.bodySmMed, color: colors.yellow },
  emptyText: { ...font.body, color: colors.textSecondary },

  countdownBanner: {
    backgroundColor: colors.yellowDim,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245,197,24,0.2)',
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
  },
  countdownText: { ...font.bodySmMed, color: colors.yellow },

  messageList: { padding: spacing.md, gap: spacing.sm },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.xs },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  avatarHidden: { opacity: 0 },
  avatarText: { ...font.captionMed, color: colors.yellow },

  bubbleCol: { maxWidth: '72%', gap: 3 },
  senderName: { ...font.caption, color: colors.textMuted, paddingLeft: spacing.sm },
  bubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    padding: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.yellow,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
  },
  bubbleText: { ...font.body, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.bg },

  time: { ...font.caption, color: colors.textFaint, paddingLeft: spacing.sm },
  timeMine: { textAlign: 'right', paddingLeft: 0, paddingRight: spacing.sm },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
  attachBtn: { paddingBottom: spacing.xs },
  attachIcon: { fontSize: 22 },
  input: {
    flex: 1,
    ...font.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceElevated },
  sendIcon: { color: colors.bg, fontSize: 18, fontWeight: '700' },
});
