import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const MOCK_REELS = [
  { id: '1', creator: 'Carlo Reyes', flag: '🇵🇭', desc: 'That finish though 🔥⚽ #futsal #rondo', likes: 142, bookmarked: false, format: '5v5', skill: 'Competitive' },
  { id: '2', creator: 'FC Taguig', flag: '🇵🇭', desc: 'Pre-season training highlights 💪', likes: 87, bookmarked: false, format: '7v7', skill: 'All levels' },
  { id: '3', creator: 'Mike Santos', flag: '🇵🇭', desc: 'Weekend rondo session. Who\'s in? 🟡', likes: 53, bookmarked: true, format: '3v3', skill: 'Casual' },
];

function Reel({ reel, active }: { reel: typeof MOCK_REELS[0]; active: boolean }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(reel.bookmarked);

  return (
    <View style={styles.reel}>
      <LinearGradient colors={['#0D2A0D', '#0A0A1A', '#1A0A0A']} style={StyleSheet.absoluteFillObject} />

      {/* Play icon placeholder */}
      <View style={styles.playArea}>
        <Text style={styles.playIcon}>{active ? '⏸' : '▶️'}</Text>
        <Text style={styles.playHint}>Video plays here{'\n'}(requires native video player)</Text>
      </View>

      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Upload FAB */}
      <TouchableOpacity style={styles.uploadFab}>
        <Text style={styles.uploadIcon}>+</Text>
      </TouchableOpacity>

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLiked(!liked); }} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionCount}>{reel.likes + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setSaved(!saved); }} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{saved ? '🔖' : '📑'}</Text>
          <Text style={styles.actionCount}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/profile/${reel.id}`)} style={styles.creatorAvatar}>
          <Text style={styles.creatorAvatarText}>{reel.creator[0]}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.bottomGradient}>
        <View style={styles.bottomInfo}>
          <TouchableOpacity onPress={() => router.push(`/profile/${reel.id}`)}>
            <Text style={styles.creatorName}>{reel.flag} {reel.creator}</Text>
          </TouchableOpacity>
          <Text style={styles.reelDesc}>{reel.desc}</Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>{reel.format}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{reel.skill}</Text></View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0);
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_REELS}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => <Reel reel={item} active={index === activeIndex} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  reel: { width, height, position: 'relative' },
  playArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  playIcon: { fontSize: 64 },
  playHint: { ...font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 24 },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.white, fontSize: 20 },
  uploadFab: {
    position: 'absolute',
    top: 56,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { color: colors.bg, fontSize: 24, fontWeight: '700' },
  rightActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 140,
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionBtn: { alignItems: 'center', gap: spacing.xs },
  actionIcon: { fontSize: 28 },
  actionCount: { ...font.captionMed, color: colors.white },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellowDim,
    borderWidth: 2,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: { ...font.h4, color: colors.yellow },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, justifyContent: 'flex-end' },
  bottomInfo: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  creatorName: { ...font.h4, color: colors.white },
  reelDesc: { ...font.body, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  tagRow: { flexDirection: 'row', gap: spacing.sm },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  tagText: { ...font.captionMed, color: colors.white },
});
