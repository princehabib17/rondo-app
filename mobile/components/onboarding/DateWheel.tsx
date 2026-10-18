import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, font, radius } from '../../constants/theme';

const ROW = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ROW;

export function DateWheelFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.frame} accessibilityRole="adjustable">
      <View pointerEvents="none" style={styles.fadeTop} />
      <View pointerEvents="none" style={styles.selection} />
      <View pointerEvents="none" style={styles.fadeBottom} />
      <View style={styles.cols}>{children}</View>
    </View>
  );
}

export function WheelColumn({
  items,
  index,
  onIndexChange,
  flex = 1,
  accessibilityLabel,
}: {
  items: readonly string[];
  index: number;
  onIndexChange: (index: number) => void;
  flex?: number;
  accessibilityLabel: string;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const y = Math.max(0, Math.min(items.length - 1, index)) * ROW;
    ref.current?.scrollTo({ y, animated: false });
  }, [index, items.length]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped !== index) {
      Haptics.selectionAsync();
      onIndexChange(clamped);
    }
    ref.current?.scrollTo({ y: clamped * ROW, animated: true });
  };

  return (
    <ScrollView
      ref={ref}
      style={{ flex }}
      snapToInterval={ROW}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={settle}
      onScrollEndDrag={settle}
      contentContainerStyle={{ paddingVertical: PAD }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: index + 1, min: 1, max: items.length, text: items[index] }}
    >
      {items.map((label, i) => (
        <View key={`${label}-${i}`} style={styles.row}>
          <Text style={[styles.label, i === index && styles.active]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: ROW * VISIBLE,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cols: { flex: 1, flexDirection: 'row' },
  selection: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: PAD,
    height: ROW,
    borderRadius: radius.sm,
    backgroundColor: colors.yellowDim,
    borderWidth: 1,
    borderColor: 'rgba(232,210,74,0.35)',
    zIndex: 1,
  },
  fadeTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: PAD,
    backgroundColor: 'rgba(22,22,15,0.35)',
    zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PAD,
    backgroundColor: 'rgba(22,22,15,0.35)',
    zIndex: 2,
  },
  row: { height: ROW, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  label: { ...font.body, color: colors.textMuted, textAlign: 'center' },
  active: { ...font.bodyMed, color: colors.text },
});
