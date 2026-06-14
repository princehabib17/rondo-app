import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../../constants/theme';
import { ScreenHeader } from '../../components/layout/ScreenHeader';

const MOCK_DMS = [
  { id: '1', name: 'FC Taguig', last: 'Please arrive 15 mins early!', time: '10m', unread: 2, isOrg: true },
  { id: '2', name: 'Carlo Reyes', last: 'Can I join your team next week?', time: '1h', unread: 1, isOrg: false },
  { id: '3', name: 'Mike Santos', last: "Sure, I'll be there 👍", time: '3h', unread: 0, isOrg: false },
  { id: '4', name: 'Rondo PH', last: 'Tournament bracket is live!', time: 'Yesterday', unread: 0, isOrg: true },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = MOCK_DMS.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>Message players from their profile.</Text>
          </View>
        ) : filtered.map((dm) => (
          <TouchableOpacity key={dm.id} onPress={() => router.push(`/messages/${dm.id}`)} style={styles.row} activeOpacity={0.8}>
            <View style={[styles.avatar, dm.isOrg && styles.avatarOrg]}>
              <Text style={[styles.avatarText, dm.isOrg && styles.avatarTextOrg]}>{dm.name[0]}</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.infoTop}>
                <Text style={[styles.name, dm.unread > 0 && styles.nameUnread]}>{dm.name}</Text>
                <Text style={styles.time}>{dm.time}</Text>
              </View>
              <Text style={[styles.last, dm.unread > 0 && styles.lastUnread]} numberOfLines={1}>{dm.last}</Text>
            </View>
            {dm.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dm.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 44 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, ...font.body, color: colors.text },
  empty: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySub: { ...font.body, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  avatarOrg: { backgroundColor: colors.yellowDim, borderWidth: 1.5, borderColor: colors.yellow },
  avatarText: { ...font.h4, color: colors.text },
  avatarTextOrg: { color: colors.yellow },
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
