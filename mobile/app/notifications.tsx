import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';

type NotifType = 'game' | 'payment' | 'chat' | 'system';

const MOCK_NOTIFS = [
  { id: '1', type: 'payment' as NotifType, title: 'Payment confirmed', body: 'Your payment for Friday Night 5v5 was received.', time: '5m ago', read: false, route: '/games/1' },
  { id: '2', type: 'game' as NotifType, title: 'Game starts in 1 hour', body: 'Friday Night 5v5 at Turf Manila starts at 8:00 PM.', time: '30m ago', read: false, route: '/games/1' },
  { id: '3', type: 'chat' as NotifType, title: 'New message in Squad Chat', body: 'FC Taguig: "Please arrive 15 mins early!"', time: '1h ago', read: true, route: '/games/1/chat' },
  { id: '4', type: 'game' as NotifType, title: 'New game near you', body: 'Sunday League is open — 6 spots left.', time: '3h ago', read: true, route: '/games/2' },
  { id: '5', type: 'system' as NotifType, title: 'Welcome to Rondo!', body: 'Browse games near you and join your first match.', time: 'Yesterday', read: true, route: '/(tabs)/feed' },
];

const TYPE_ICONS: Record<NotifType, string> = { game: '⚽', payment: '💰', chat: '💬', system: '🔔' };
const TYPE_COLORS: Record<NotifType, string> = { game: colors.success, payment: colors.yellow, chat: colors.accent, system: colors.textMuted };

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const today = MOCK_NOTIFS.filter((n) => !n.time.includes('Yesterday'));
  const earlier = MOCK_NOTIFS.filter((n) => n.time.includes('Yesterday'));

  const renderGroup = (title: string, items: typeof MOCK_NOTIFS) => (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupItems}>
        {items.map((n, i) => (
          <TouchableOpacity
            key={n.id}
            onPress={() => router.push(n.route as any)}
            style={[styles.notifRow, !n.read && styles.notifRowUnread, i < items.length - 1 && styles.notifRowBorder]}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: TYPE_COLORS[n.type] + '22' }]}>
              <Text style={styles.icon}>{TYPE_ICONS[n.type]}</Text>
            </View>
            <View style={styles.notifInfo}>
              <Text style={[styles.notifTitle, !n.read && styles.notifTitleUnread]}>{n.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
              <Text style={styles.notifTime}>{n.time}</Text>
            </View>
            {!n.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Notifications" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.xl }}>
        {today.length > 0 && renderGroup('Today', today)}
        {earlier.length > 0 && renderGroup('Earlier', earlier)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
