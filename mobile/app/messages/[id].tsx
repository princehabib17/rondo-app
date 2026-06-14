import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../../constants/theme';

type Message = {
  id: string;
  sender: string;
  body: string;
  time: string;
  mine: boolean;
};

const MOCK_PEER = { id: '2', name: 'Carlo Reyes' };

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'Carlo Reyes', body: 'Hey! Saw your reel, great finish 🔥', time: '9:10 AM', mine: false },
  { id: '2', sender: 'You', body: 'Thanks man! Took a few tries haha', time: '9:12 AM', mine: true },
  { id: '3', sender: 'Carlo Reyes', body: 'Are you joining Friday Night 5v5 at BGC?', time: '9:13 AM', mine: false },
  { id: '4', sender: 'You', body: "Already signed up! See you there 💪", time: '9:15 AM', mine: true },
  { id: '5', sender: 'Carlo Reyes', body: 'Nice, let\'s link up before the game', time: '9:16 AM', mine: false },
];

function MessageBubble({ msg, prevSender }: { msg: Message; prevSender?: string }) {
  const showAvatar = !msg.mine && msg.sender !== prevSender;

  return (
    <View style={[styles.messageRow, msg.mine && styles.messageRowMine]}>
      {!msg.mine && (
        <View style={[styles.avatar, !showAvatar && styles.avatarHidden]}>
          <Text style={styles.avatarText}>{showAvatar ? msg.sender[0] : ''}</Text>
        </View>
      )}
      <View style={styles.bubbleCol}>
        {showAvatar && !msg.mine && (
          <Text style={styles.senderName}>{msg.sender}</Text>
        )}
        <View style={[styles.bubble, msg.mine && styles.bubbleMine]}>
          <Text style={[styles.bubbleText, msg.mine && styles.bubbleTextMine]}>{msg.body}</Text>
        </View>
        <Text style={[styles.time, msg.mine && styles.timeMine]}>{msg.time}</Text>
      </View>
    </View>
  );
}

export default function DirectMessageScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'You',
      body: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mine: true,
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

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
          onPress={() => router.push(`/profile/${id}`)}
          style={styles.headerCenter}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>{MOCK_PEER.name}</Text>
          <Text style={styles.headerSub}>Tap to view profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/profile/${id}`)} style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{MOCK_PEER.name[0]}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => (
          <MessageBubble msg={item} prevSender={messages[index - 1]?.sender} />
        )}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
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
          disabled={!input.trim()}
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
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

  messageList: { padding: spacing.md, gap: spacing.sm },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.xs },
  messageRowMine: { flexDirection: 'row-reverse' },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
