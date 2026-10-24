import React, { useRef, useState } from 'react';
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
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { colors, font, radius, spacing } from '../../constants/theme';

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
  const isLast = index === SLIDES.length - 1;

  const scrollX = useSharedValue(0);

  const cardWidth = width - H_PAD * 2;
  const cardHeight = Math.min(cardWidth * 1.02, height * 0.46);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
    if (clamped === index) return;
    Haptics.selectionAsync();
    scrollRef.current?.scrollTo({ x: clamped * width, animated: !reduceMotion });
    setIndex(clamped);
  };

  const start = () => router.push('/(auth)/onboarding/username');

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) Haptics.selectionAsync();
    setIndex(next);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerSide} />
        <Text style={styles.wordmark} accessibilityRole="header">
          rondo<Text style={styles.wordmarkDot}>.</Text>
        </Text>
        <TouchableOpacity
          onPress={start}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
            <Rail key={s.key} index={i} scrollX={scrollX} width={width} onPress={() => goTo(i)} />
          ))}
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => goTo(index - 1)}
            disabled={index === 0}
            style={[styles.backBtn, index === 0 && styles.backBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Button
            onPress={isLast ? start : () => goTo(index + 1)}
            size="lg"
            style={styles.primaryBtn}
          >
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </View>

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

/** Dot that stretches into a gold bar as its slide scrolls into place. */
function Rail({
  index,
  scrollX,
  width,
  onPress,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      width: 8 + t * (RAIL_WIDTH - 8),
      opacity: 0.35 + t * 0.65,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Go to slide ${index + 1}`}
    >
      <Animated.View style={[styles.rail, style]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.lg,
  },
  headerSide: { width: 56, alignItems: 'flex-end' },
  skip: { ...font.bodyMed, color: colors.textSecondary },
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
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.yellow,
  },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnDisabled: { opacity: 0.3 },
  backArrow: { fontSize: 22, color: colors.text, fontWeight: '700' },
  primaryBtn: { flex: 1, borderRadius: radius.full },

  linkRow: { alignItems: 'center', paddingVertical: spacing.xs },
  signInText: { ...font.bodySm, color: colors.textMuted },
  signInLink: { color: colors.yellow, fontWeight: '600' },

  guestBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  guestText: { ...font.caption, color: colors.textFaint },
});
