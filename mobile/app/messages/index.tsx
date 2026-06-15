import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { useQuery } from '../../hooks/useQuery';
import * as q from '../../lib/queries';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d`;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const { data, loading, error, refetch } = useQuery(q.listConversations);

  const conversations = data ?? [];
  const filtered = conversations.filter((d) =>
    (d.peer.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Messages" showBack />
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySub}>Message players from their profile.</Text>
            </View>
          ) : filtered.map((dm) => {
            const name = dm.peer.full_name ?? 'Player';
            return (
              <TouchableOpacity key={dm.peer.id} onPress={() => router.push(`/messages/${dm.peer.id}`)} style={styles.row} activeOpacity={0.8}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name[0]}</Text>
                </View>
                <View style={styles.info}>
                  <View style={styles.infoTop}>
                    <Text style={[styles.name, dm.unread > 0 && styles.nameUnread]}>{name}</Text>
                    <Text style={styles.time}>{timeAgo(dm.last.created_at)}</Text>
                  </View>
                  <Text style={[styles.last, dm.unread > 0 && styles.lastUnread]} numberOfLines={1}>{dm.last.body}</Text>
                </View>
                {dm.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{dm.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 44 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, ...font.body, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.error, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodyMed, color: colors.yellow },
  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySub: { ...font.body, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...font.h4, color: colors.text },
  info: { flex: 1, gap: 4 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...font.bodyMed, color: colors.textSecondary },
  nameUnread: { color: colors.text },
  time: { ...font.caption, color: colors.textMuted },
  last: { ...font.bodySm, color: colors.textMuted },
  lastUnread: { color: colors.textSecondary },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  badgeText: { ...font.captionMed, color: colors.bg, fontSize: 11 },
});
