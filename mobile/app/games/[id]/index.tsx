import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.38;

const MOCK_GAME = {
  id: '1',
  title: 'Friday Night 5v5',
  organizer: 'FC Taguig',
  organizerVerified: true,
  venue: 'Turf Manila, BGC, Taguig City',
  date: 'Friday, June 20, 2026',
  time: '8:00 PM – 10:00 PM',
  format: '5v5',
  price: 150,
  spots: 2,
  totalSpots: 10,
  status: 'open',
  description: 'Competitive 5v5 futsal game at Turf Manila. Teams will be assigned before kickoff. Payment required to confirm your slot. Bring proper footwear — studs not allowed.',
  teams: [
    { name: 'Team Red', color: '#EF4444', players: ['Juan', 'Mike', 'Carlo', 'Rico'], max: 5 },
    { name: 'Team Blue', color: '#3B82F6', players: ['Alex', 'Ben', 'Chris', 'Dave', 'Ed'], max: 5 },
  ],
  paymentType: 'required',
  skillLevel: 'Intermediate',
};

export default function GameDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'info' | 'teams'>('info');
  const isFull = MOCK_GAME.spots === 0;

  return (
    <View style={styles.container}>
      {/* Full-bleed hero */}
      <View style={[styles.hero, { height: HERO_HEIGHT }]}>
        <LinearGradient colors={['#0D2A0D', '#1A3A1A']} style={StyleSheet.absoluteFillObject} />
        <LinearGradient
          colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.95)']}
          style={[StyleSheet.absoluteFillObject, { top: HERO_HEIGHT * 0.4 }]}
        />

        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + spacing.sm }]}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Hero content */}
        <View style={styles.heroContent}>
          <View style={styles.heroTags}>
            <Badge color="yellow">{MOCK_GAME.format}</Badge>
            <Badge color={isFull ? 'red' : 'green'}>{isFull ? 'Full' : `${MOCK_GAME.spots} spots left`}</Badge>
          </View>
          <Text style={styles.heroTitle}>{MOCK_GAME.title}</Text>
          <Text style={styles.heroOrganizer}>
            {MOCK_GAME.organizerVerified ? '✓ ' : ''}{MOCK_GAME.organizer}
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Quick info strip */}
        <View style={styles.infoStrip}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{MOCK_GAME.venue}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>{MOCK_GAME.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>{MOCK_GAME.time}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {(['info', 'teams'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'info' ? 'Details' : 'Teams'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'info' && (
          <View style={styles.section}>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Price', value: `₱${MOCK_GAME.price}` },
                { label: 'Format', value: MOCK_GAME.format },
                { label: 'Skill', value: MOCK_GAME.skillLevel },
                { label: 'Payment', value: 'Required' },
              ].map((s) => (
                <Card key={s.label} style={styles.statCard}>
                  <Text style={styles.statCardLabel}>{s.label}</Text>
                  <Text style={styles.statCardValue}>{s.value}</Text>
                </Card>
              ))}
            </View>

            {/* Description */}
            <Card style={styles.descCard}>
              <Text style={styles.descTitle}>About this game</Text>
              <Text style={styles.descText}>{MOCK_GAME.description}</Text>
            </Card>

            {/* Organizer */}
            <Card style={styles.organizerCard}>
              <View style={styles.organizerRow}>
                <View style={styles.organizerAvatar}>
                  <Text style={styles.organizerAvatarText}>{MOCK_GAME.organizer[0]}</Text>
                </View>
                <View style={styles.organizerInfo}>
                  <Text style={styles.organizerName}>
                    {MOCK_GAME.organizer}
                    {MOCK_GAME.organizerVerified && <Text style={{ color: colors.yellow }}> ✓</Text>}
                  </Text>
                  <Text style={styles.organizerLabel}>Organizer</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/organizers/1')} style={styles.viewOrgBtn}>
                  <Text style={styles.viewOrgText}>View</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {activeTab === 'teams' && (
          <View style={styles.section}>
            {MOCK_GAME.teams.map((team) => (
              <Card key={team.name} style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <View style={[styles.teamColor, { backgroundColor: team.color }]} />
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamCount}>{team.players.length}/{team.max}</Text>
                </View>
                <View style={styles.teamPlayers}>
                  {team.players.map((p) => (
                    <View key={p} style={styles.playerChip}>
                      <Text style={styles.playerChipText}>{p[0]}</Text>
                    </View>
                  ))}
                  {Array.from({ length: team.max - team.players.length }).map((_, i) => (
                    <View key={`empty-${i}`} style={[styles.playerChip, styles.playerChipEmpty]}>
                      <Text style={styles.playerChipEmptyText}>+</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky bottom CTA — Airbnb style */}
      <View style={[styles.cta, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.ctaLeft}>
          <Text style={styles.ctaPrice}>₱{MOCK_GAME.price}</Text>
          <Text style={styles.ctaPer}>per player</Text>
        </View>
        <Button
          onPress={() => router.push(`/games/${id}/join`)}
          disabled={isFull}
          size="lg"
          style={styles.ctaBtn}
        >
          {isFull ? 'Join Waitlist' : 'Join Game'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  hero: { position: 'relative', justifyContent: 'flex-end' },
  backBtn: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },
  heroContent: { padding: spacing.lg, gap: spacing.xs },
  heroTags: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  heroTitle: { ...font.h1, color: colors.text },
  heroOrganizer: { ...font.bodyMed, color: colors.yellow },

  infoStrip: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: { fontSize: 16, width: 24 },
  infoText: { ...font.body, color: colors.textSecondary, flex: 1 },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.yellow },
  tabText: { ...font.bodyMed, color: colors.textMuted },
  tabTextActive: { color: colors.yellow },

  section: { padding: spacing.lg, gap: spacing.md },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: { flex: 1, minWidth: '45%', gap: spacing.xs, alignItems: 'center', padding: spacing.md },
  statCardLabel: { ...font.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  statCardValue: { ...font.h4, color: colors.text },

  descCard: { gap: spacing.sm },
  descTitle: { ...font.h4, color: colors.text },
  descText: { ...font.body, color: colors.textSecondary, lineHeight: 24 },

  organizerCard: {},
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.yellowDim, alignItems: 'center', justifyContent: 'center' },
  organizerAvatarText: { ...font.h4, color: colors.yellow },
  organizerInfo: { flex: 1, gap: 2 },
  organizerName: { ...font.bodyMed, color: colors.text },
  organizerLabel: { ...font.caption, color: colors.textMuted },
  viewOrgBtn: { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 6 },
  viewOrgText: { ...font.bodySmMed, color: colors.textSecondary },

  teamCard: { gap: spacing.md },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  teamColor: { width: 12, height: 12, borderRadius: 6 },
  teamName: { ...font.h4, color: colors.text, flex: 1 },
  teamCount: { ...font.caption, color: colors.textMuted },
  teamPlayers: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  playerChip: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  playerChipText: { ...font.bodySmMed, color: colors.text },
  playerChipEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border },
  playerChipEmptyText: { color: colors.border, fontSize: 18 },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  ctaLeft: { gap: 2 },
  ctaPrice: { ...font.h2, color: colors.yellow },
  ctaPer: { ...font.caption, color: colors.textMuted },
  ctaBtn: { flex: 1 },
});
