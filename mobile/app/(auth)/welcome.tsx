import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { colors, font, radius, spacing } from '../../constants/theme';

const DWELL_MS = 4500;
const H_PAD = spacing.lg;
const RAIL_WIDTH = 28;

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  chip: string;
  image: number;
};

/* eslint-disable @typescript-eslint/no-require-imports */
const SLIDES: Slide[] = [
  {
    key: 'level',
    eyebrow: 'Skill-matched games',
    title: 'Find your level.',
    body: 'Every game is tagged Beginner to Pro, so you play with people who play like you.',
    chip: 'Intermediate · 5v5 · 2 spots left',
    image: require('../../assets/onboarding/level.jpg'),
  },
  {
    key: 'nearby',
    eyebrow: 'Pickup near you',
    title: 'Find players near you.',
    body: 'See courts on the map, who’s in and spots left. Grab yours in a tap.',
    chip: 'BGC Turf · 1.2 km · Tonight 8 PM',
    image: require('../../assets/onboarding/nearby.jpg'),
  },
  {
    key: 'tournaments',
    eyebrow: 'Leagues & cups',
    title: 'Win tournaments.',
    body: 'Enter cups with your squad, follow the bracket and play for the trophy.',
    chip: 'Copa Manila · Final',
    image: require('../../assets/onboarding/tournaments.jpg'),
  },
];
/* eslint-enable @typescript-eslint/no-require-imports */

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(0);
  const dwell = useSharedValue(0);

  const cardWidth = width - H_PAD * 2;
  const cardHeight = Math.min(cardWidth * 1.02, height * 0.46);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  useEffect(() => {
    activeIndex.value = index;
    cancelAnimation(dwell);
    dwell.value = 0;
    if (reduceMotion || paused) {
      dwell.value = reduceMotion ? 1 : 0;
      return;
    }
    dwell.value = withTiming(1, { duration: DWELL_MS, easing: Easing.linear });
    if (index >= SLIDES.length - 1) return;
    const t = setTimeout(() => {
      const next = index + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setIndex(next);
    }, DWELL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, width, activeIndex, dwell]);

  const handleDragStart = () => setPaused(true);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) Haptics.selectionAsync();
    setIndex(next);
    setPaused(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.wordmark} accessibilityRole="header">
          rondo<Text style={styles.wordmarkDot}>.</Text>
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleDragStart}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.pager}
      >
        {SLIDES.map((slide, i) => (
          <SlidePage
            key={slide.key}
            slide={slide}
            index={i}
            width={width}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            scrollX={scrollX}
            reduceMotion={reduceMotion}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
        <View
          style={styles.rails}
          accessible
          accessibilityLabel={`Slide ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((s, i) => (
            <Rail key={s.key} index={i} activeIndex={activeIndex} dwell={dwell} />
          ))}
        </View>

        <Button
          onPress={() => router.push('/(auth)/signup')}
          size="lg"
          style={styles.primaryBtn}
        >
          Get Started
        </Button>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.linkRow}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)/feed')} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SlidePage({
  slide,
  index,
  width,
  cardWidth,
  cardHeight,
  scrollX,
  reduceMotion,
}: {
  slide: Slide;
  index: number;
  width: number;
  cardWidth: number;
  cardHeight: number;
  scrollX: SharedValue<number>;
  reduceMotion: boolean;
}) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];
  const drift = cardWidth * 0.14;

  // The image travels slower than the page and the copy faster, so slides read as layered.
  const cardStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [{ scale: interpolate(scrollX.value, range, [0.9, 1, 0.9], Extrapolation.CLAMP) }],
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    if (reduceMotion) return {};
    return {
      transform: [
        { translateX: interpolate(scrollX.value, range, [-drift, 0, drift], Extrapolation.CLAMP) },
        { scale: interpolate(scrollX.value, range, [1.12, 1, 1.12], Extrapolation.CLAMP) },
      ],
    };
  });

  const chipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: reduceMotion
      ? []
      : [{ translateX: interpolate(scrollX.value, range, [width * 0.3, 0, -width * 0.3], Extrapolation.CLAMP) }],
  }));

  const copyStyle = useAnimatedStyle(() => {
    const tight = [(index - 0.6) * width, index * width, (index + 0.6) * width];
    return {
      opacity: interpolate(scrollX.value, tight, [0, 1, 0], Extrapolation.CLAMP),
      transform: reduceMotion
        ? []
        : [{ translateX: interpolate(scrollX.value, range, [width * 0.4, 0, -width * 0.4], Extrapolation.CLAMP) }],
    };
  });

  return (
    <View style={[styles.page, { width }]}>
      <Animated.View style={[styles.card, { width: cardWidth, height: cardHeight }, cardStyle]}>
        <Animated.View
          style={[
            { position: 'absolute', top: 0, bottom: 0, left: -drift, right: -drift },
            imageStyle,
          ]}
        >
          <Image source={slide.image} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Animated.View>
        <LinearGradient
          colors={['rgba(22,22,15,0)', 'rgba(22,22,15,0.85)']}
          locations={[0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.cardMark}>rondo.</Text>
        <Animated.View style={[styles.chip, chipStyle]}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText} numberOfLines={1}>
            {slide.chip}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {slide.title}
        </Text>
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>
    </View>
  );
}

function Rail({
  index,
  activeIndex,
  dwell,
}: {
  index: number;
  activeIndex: SharedValue<number>;
  dwell: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => {
    const filled = index < activeIndex.value ? 1 : index === activeIndex.value ? dwell.value : 0;
    return { width: filled * RAIL_WIDTH };
  });

  return (
    <View style={styles.rail}>
      <Animated.View style={[styles.railFill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: { alignItems: 'center', paddingBottom: spacing.lg },
  wordmark: { fontSize: 44, fontWeight: '900', color: colors.text, letterSpacing: -1.5 },
  wordmarkDot: { color: colors.yellow },

  pager: { flexGrow: 0 },
  page: { alignItems: 'center', paddingHorizontal: H_PAD },

  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardMark: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  chip: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(22,22,15,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.yellow },
  chipText: { ...font.captionMed, color: colors.text },

  copy: { alignItems: 'center', paddingTop: spacing.lg, maxWidth: 330 },
  eyebrow: {
    ...font.captionMed,
    color: colors.yellow,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  title: { ...font.h1, fontSize: 30, color: colors.text, textAlign: 'center' },
  body: {
    ...font.bodySm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.sm,
  },

  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: H_PAD,
    gap: spacing.sm,
  },
  rails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  rail: {
    width: RAIL_WIDTH,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  railFill: { height: '100%', backgroundColor: colors.yellow, borderRadius: radius.full },

  primaryBtn: { width: '100%', borderRadius: radius.full },

  linkRow: { alignItems: 'center', paddingVertical: spacing.xs },
  signInText: { ...font.bodySm, color: colors.textMuted },
  signInLink: { color: colors.yellow, fontWeight: '600' },

  guestBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  guestText: { ...font.caption, color: colors.textFaint },
});
