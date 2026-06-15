import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../constants/theme';
import { useQuery } from '../../hooks/useQuery';
import { useAuth } from '../../hooks/useAuth';
import * as q from '../../lib/queries';
import type { DirectMessage, Profile } from '../../lib/types';

type DisplayMsg = DirectMessage & { mine: boolean };

function MessageBubble({ msg, prevSenderId, peerName }: { msg: DisplayMsg; prevSenderId?: string; peerName: string }) {
  const showAvatar = !msg.mine && msg.sender_id !== prevSenderId;
  const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.messageRow, msg.mine && styles.messageRowMine]}>
      {!msg.mine && (
        <View style={[styles.avatar, !showAvatar && styles.avatarHidden]}>
          <Text style={styles.avatarText}>{showAvatar ? (peerName[0] ?? '?').toUpperCase() : ''}</Text>
        </View>
      )}
      <View style={styles.bubbleCol}>
        <View style={[styles.bubble, msg.mine && styles.bubbleMine]}>
          <Text style={[styles.bubbleText, msg.mine && styles.bubbleTextMine]}>{msg.body}</Text>
        </View>
        <Text style={[styles.time, msg.mine && styles.timeMine]}>{timeStr}</Text>
      </View>
    </View>
  );
}

export default function DirectMessageScreen() {
  const insets = useSafeAreaInsets();
  const { id: peerId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const peerQuery = useQuery(() => q.getProfile(peerId!), [peerId]);
  const msgsQuery = useQuery(() => q.getConversation(peerId!), [peerId]);

  const peer = peerQuery.data;
  const rawMsgs = msgsQuery.data ?? [];
  const messages: DisplayMsg[] = rawMsgs.map((m) => ({ ...m, mine: m.sender_id === user?.id }));

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    const body = input.trim();
    if (!body || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSending(true);
    setInput('');
    try {
      await q.sendDirectMessage(peerId!, body);
      msgsQuery.refetch();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  const peerName = peer?.full_name ?? 'User';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${peerId}`)}
          style={styles.headerCenter}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>{peerQuery.loading ? '…' : peerName}</Text>
          <Text style={styles.headerSub}>Tap to view profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/profile/${peerId}`)} style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{peerName[0]?.toUpperCase() ?? '?'}</Text>
        </TouchableOpacity>
      </View>

      {msgsQuery.loading && !msgsQuery.data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              msg={item}
              prevSenderId={messages[index - 1]?.sender_id}
              peerName={peerName}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet — say hi!</Text>
            </View>
          }
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || sending}
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
        >
          {sending ? <ActivityIndicator size="small" color={colors.bg} /> : <Text style={styles.sendIcon}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 22, color: colors.yellow },
  headerCenter: { flex: 1 },
  headerTitle: { ...font.h4, color: colors.text },
  headerSub: { ...font.caption, color: colors.textMuted },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.yellowDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { ...font.bodySmMed, color: colors.yellow },

  messageList: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  emptyChat: { paddingTop: spacing.xxl, alignItems: 'center' },
  emptyChatText: { ...font.body, color: colors.textMuted },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.xs },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarHidden: { opacity: 0 },
  avatarText: { ...font.captionMed, color: colors.yellow },

  bubbleCol: { maxWidth: '72%', gap: 3 },
  bubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg, borderBottomLeftRadius: radius.xs,
    padding: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.yellow,
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.xs,
  },
  bubbleText: { ...font.body, color: colors.text, lineHeight: 20 },
  bubbleTextMine: { color: colors.bg },

  time: { ...font.caption, color: colors.textFaint, paddingLeft: spacing.sm },
  timeMine: { textAlign: 'right', paddingLeft: 0, paddingRight: spacing.sm },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
    gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    ...font.body, color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 100, minHeight: 40,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.yellow,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceElevated },
  sendIcon: { color: colors.bg, fontSize: 18, fontWeight: '700' },
});
