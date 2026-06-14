import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { colors, font, spacing, radius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    router.push('/(auth)/signup');
  };

  const handleGuest = () => {
    router.replace('/(tabs)/feed');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/icon.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(10,10,10,0.2)', 'rgba(10,10,10,0.5)', 'rgba(10,10,10,0.98)']}
          locations={[0, 0.4, 0.85]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* Logo */}
      <View style={[styles.logoArea, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.logoGlow}>
          <Text style={styles.logoText}>rondo</Text>
        </View>
        <Text style={styles.tagline}>Find your game. Play your way.</Text>
      </View>

      {/* Bottom CTAs */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>2.4k+</Text>
            <Text style={styles.statLabel}>Games hosted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>18k+</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>340+</Text>
            <Text style={styles.statLabel}>Organizers</Text>
          </View>
        </View>

        <Button onPress={handleGetStarted} size="lg" style={styles.primaryBtn}>
          Get Started
        </Button>

        <Button onPress={handleSignIn} variant="secondary" size="lg" style={styles.secondaryBtn}>
          Sign In
        </Button>

        <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bg: { ...StyleSheet.absoluteFillObject },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  logoGlow: {
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
  },
  logoText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.yellow,
    letterSpacing: -2,
  },
  tagline: {
    ...font.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  },

  bottom: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { ...font.h3, color: colors.yellow },
  statLabel: { ...font.caption, color: colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },

  primaryBtn: { width: '100%' },
  secondaryBtn: { width: '100%' },

  guestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  guestText: { ...font.bodySmMed, color: colors.textMuted },
});
