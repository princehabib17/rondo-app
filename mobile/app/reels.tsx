import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity,
  TouchableWithoutFeedback, ViewToken, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, font, spacing, radius } from '../constants/theme';
import { useQuery } from '../hooks/useQuery';
import * as q from '../lib/queries';

const { width, height } = Dimensions.get('window');

type ReelItem = Awaited<ReturnType<typeof q.listReels>>[number];

function Reel({ reel, active }: { reel: ReelItem; active: boolean }) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(reel.liked_by_me);
  const [likeCount, setLikeCount] = useState(reel.like_count);
  const [saved, setSaved] = useState(false);
  const [paused, setPaused] = useState(false);

  const toggleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await q.toggleReelLike(reel.id, next);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  };

  /* TikTok: tap anywhere on video to pause/play */
  const handleVideoTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaused((p) => !p);
  };

  const creatorName = reel.player?.full_name ?? 'Unknown';
  const tags = [reel.position, reel.skill_level].filter(Boolean) as string[];

  return (
    <View style={styles.reel}>
      <LinearGradient colors={['#0D2A0D', '#0A0A1A', '#1A0A0A']} style={StyleSheet.absoluteFill} />

      {/* Tap to pause/play — full screen touch area */}
      <TouchableWithoutFeedback onPress={handleVideoTap}>
        <View style={styles.videoArea}>
          <Text style={[styles.playIcon, !active && styles.playIconDim]}>
            {paused ? '▶️' : (active ? '⏸' : '▶️')}
          </Text>
          {paused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>Paused</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + spacing.sm }]}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Upload FAB */}
      <TouchableOpacity style={[styles.uploadFab, { top: insets.top + spacing.sm }]}>
        <Text style={styles.uploadIcon}>+</Text>
      </TouchableOpacity>

      {/* Right actions — TikTok style */}
      <View style={[styles.rightActions, { bottom: 140 + insets.bottom }]}>
        <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionCount}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setSaved(!saved); }} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{saved ? '🔖' : '📑'}</Text>
          <Text style={styles.actionCount}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionCount}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => reel.player && router.push(`/profile/${reel.player.id}`)}
          style={styles.creatorAvatar}
        >
          <Text style={styles.creatorAvatarText}>{(creatorName[0] ?? '?').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info — creator bottom-left (TikTok) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <View style={styles.bottomInfo}>
          <TouchableOpacity onPress={() => reel.player && router.push(`/profile/${reel.player.id}`)}>
            <Text style={styles.creatorHandle}>@{creatorName.toLowerCase().replace(/\s/g, '')}</Text>
            <Text style={styles.creatorName}>{creatorName}</Text>
          </TouchableOpacity>
          {reel.caption ? <Text style={styles.reelDesc}>{reel.caption}</Text> : null}
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function ReelsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, loading, error, refetch } = useQuery(() => q.listReels());

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0);
  }, []);

  if (loading && !data) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.yellow} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const reels = data ?? [];

  if (reels.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAlt}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>No reels yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reels}
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
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...font.body, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },
  retryBtn: { backgroundColor: colors.yellowDim, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { ...font.bodySmMed, color: colors.yellow },

  reel: { width, height, position: 'relative' },

  videoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  playIcon: { fontSize: 56, opacity: 0.6 },
  playIconDim: { opacity: 0.3 },
  pausedBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pausedText: { ...font.captionMed, color: colors.white },

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
  backBtnAlt: {
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

  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, justifyContent: 'flex-end' },
  bottomInfo: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  creatorHandle: { ...font.caption, color: 'rgba(255,255,255,0.7)' },
  creatorName: { ...font.h4, color: colors.white },
  reelDesc: { ...font.body, color: 'rgba(255,255,255,0.85)', lineHeight: 22, marginTop: spacing.xs },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  tag: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  tagText: { ...font.captionMed, color: colors.white },
});
