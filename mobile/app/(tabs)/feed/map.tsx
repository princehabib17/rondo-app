import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';

const { height } = Dimensions.get('window');

const FILTERS = ['All', '3v3', '5v5', '7v7', '11v11', 'Free', '< ₱150', '< ₱300'];

const MOCK_GAMES = [
  { id: '1', title: 'Friday Night 5v5', venue: 'Turf Manila, BGC', date: 'Fri · 8PM', format: '5v5', price: 150, spots: 2, lat: 14.551, lng: 121.049 },
  { id: '2', title: 'Weekend Ballers', venue: 'Smoke Futsal, QC', date: 'Sat · 6AM', format: '7v7', price: 200, spots: 6, lat: 14.676, lng: 121.044 },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const SHEET_PEEK = 200;
  const SHEET_FULL = height * 0.65;

  return (
    <View style={styles.container}>
      {/* Map placeholder — replace with MapView from react-native-maps */}
      <View style={styles.mapPlaceholder}>
        <LinearGradientFallback />
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapHint}>Apple Maps / Google Maps</Text>
        <Text style={styles.mapSubHint}>react-native-maps renders here{'\n'}(requires Expo Go or dev build)</Text>

        {/* Pin markers */}
        {MOCK_GAMES.map((g) => (
          <TouchableOpacity
            key={g.id}
            onPress={() => { setSelectedGame(g.id); setSheetExpanded(true); }}
            style={[
              styles.mapPin,
              g.id === '1' ? { top: '40%', left: '35%' } : { top: '25%', left: '60%' },
              selectedGame === g.id && styles.mapPinActive,
            ]}
          >
            <Text style={styles.mapPinText}>₱{g.price}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search bar over map */}
      <View style={[styles.searchBar, { top: insets.top + spacing.sm }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search venues or locations…</Text>
      </View>

      {/* Filter chips */}
      <View style={[styles.filtersContainer, { top: insets.top + spacing.sm + 52 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom sheet */}
      <View style={[styles.sheet, { height: sheetExpanded ? SHEET_FULL : SHEET_PEEK, paddingBottom: insets.bottom }]}>
        <TouchableOpacity onPress={() => setSheetExpanded(!sheetExpanded)} style={styles.sheetHandle}>
          <View style={styles.handle} />
        </TouchableOpacity>

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {sheetExpanded ? `${MOCK_GAMES.length} games nearby` : 'Nearby games'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.sheetLink}>See list →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}>
          {MOCK_GAMES.map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => router.push(`/games/${g.id}`)}
              activeOpacity={0.88}
              style={[styles.sheetCard, selectedGame === g.id && styles.sheetCardSelected]}
            >
              <View style={styles.sheetCardLeft}>
                <Text style={styles.sheetGameTitle} numberOfLines={1}>{g.title}</Text>
                <Text style={styles.sheetGameVenue} numberOfLines={1}>📍 {g.venue}</Text>
                <Text style={styles.sheetGameDate}>{g.date}</Text>
              </View>
              <View style={styles.sheetCardRight}>
                <Text style={styles.sheetPrice}>₱{g.price}</Text>
                <Badge color={g.spots > 0 ? 'green' : 'red'}>{g.spots > 0 ? `${g.spots} left` : 'Full'}</Badge>
                <Badge color="muted">{g.format}</Badge>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function LinearGradientFallback() {
  return (
    <View style={{
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0D1A0D',
    }} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1A0D',
  },
  mapEmoji: { fontSize: 48, marginBottom: spacing.sm },
  mapHint: { ...font.h4, color: colors.textSecondary },
  mapSubHint: { ...font.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },

  mapPin: {
    position: 'absolute',
    backgroundColor: colors.yellow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadow.glow,
  },
  mapPinActive: {
    transform: [{ scale: 1.15 }],
  },
  mapPinText: { ...font.captionMed, color: colors.bg },

  searchBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    ...shadow.card,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...font.body, color: colors.textMuted, flex: 1 },

  filtersContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filtersScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  filterText: { ...font.captionMed, color: colors.textSecondary },
  filterTextActive: { color: colors.yellow },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: { alignItems: 'center', paddingVertical: spacing.md },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { ...font.h4, color: colors.text },
  sheetLink: { ...font.bodySmMed, color: colors.yellow },

  sheetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sheetCardSelected: { borderColor: colors.yellow },
  sheetCardLeft: { flex: 1, gap: 4, marginRight: spacing.md },
  sheetGameTitle: { ...font.bodyMed, color: colors.text },
  sheetGameVenue: { ...font.caption, color: colors.textSecondary },
  sheetGameDate: { ...font.caption, color: colors.textMuted },
  sheetCardRight: { alignItems: 'flex-end', gap: 6 },
  sheetPrice: { ...font.h4, color: colors.yellow },
});
