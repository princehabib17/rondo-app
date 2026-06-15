import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';
import type { AppNotification } from '../lib/types';

const TYPE_ICONS: Record<string, string> = {
  game: '⚽',
  payment: '💰',
  chat: '💬',
  system: '🔔',
  follow: '👤',
  announcement: '📢',
};
const TYPE_COLORS: Record<string, string> = {
  game: colors.success,
  payment: colors.yellow,
  chat: colors.accent,
  system: colors.textMuted,
  follow: colors.yellow,
  announcement: colors.accent,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function isToday(iso: string): boolean {
  const diff = Date.now() - new Date(iso).getTime();
  return diff < 86400000;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, loading, error, refetch } = useQuery(() => q.getNotifications());

  const handlePress = useCallback(async (n: AppNotification) => {
    if (!n.read_at) {
      await q.markNotificationRead(n.id);
      refetch();
    }
    if (n.link) router.push(n.link as any);
  }, [refetch]);

  const notifs = data ?? [];
  const today = notifs.filter((n) => isToday(n.created_at));
  const earlier = notifs.filter((n) => !isToday(n.created_at));

  const renderGroup = (title: string, items: AppNotification[]) => (
    <View style={styles.group} key={title}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupItems}>
        {items.map((n, i) => {
          const icon = TYPE_ICONS[n.type] ?? '🔔';
          const color = TYPE_COLORS[n.type] ?? colors.textMuted;
          return (
            <TouchableOpacity
              key={n.id}
              onPress={() => handlePress(n)}
              style={[styles.notifRow, !n.read_at && styles.notifRowUnread, i < items.length - 1 && styles.notifRowBorder]}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
              <View style={styles.notifInfo}>
                <Text style={[styles.notifTitle, !n.read_at && styles.notifTitleUnread]}>{n.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
              </View>
              {!n.read_at && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Notifications" showBack />
      {loading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.yellow} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.xl }}
        >
          {today.length > 0 && renderGroup('Today', today)}
          {earlier.length > 0 && renderGroup('Earlier', earlier)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  errorText: { ...font.body, color: colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.yellow },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...font.body, color: colors.textMuted },

  group: { gap: spacing.sm },
  groupTitle: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  groupItems: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md },
  notifRowUnread: { backgroundColor: colors.yellowGlow },
  notifRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon: { fontSize: 18 },
  notifInfo: { flex: 1, gap: 3 },
  notifTitle: { ...font.bodySmMed, color: colors.textSecondary },
  notifTitleUnread: { color: colors.text },
  notifBody: { ...font.caption, color: colors.textMuted, lineHeight: 18 },
  notifTime: { ...font.caption, color: colors.textFaint },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow, marginTop: 6 },
});
