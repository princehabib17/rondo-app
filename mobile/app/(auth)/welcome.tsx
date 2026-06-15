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
          colors={['rgba(10,10,10,0.15)', 'rgba(10,10,10,0.45)', 'rgba(10,10,10,0.97)']}
          locations={[0, 0.5, 0.88]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      {/* Logo — top third */}
      <View style={[styles.logoArea, { paddingTop: insets.top + spacing.xxl }]}>
        <View style={styles.logoGlow}>
          <Text style={styles.logoText}>rondo</Text>
        </View>
        <Text style={styles.tagline}>Find your game. Play your way.</Text>
      </View>

      {/* Single CTA — bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Button onPress={handleGetStarted} size="lg" style={styles.primaryBtn}>
          Get Started
        </Button>

        <TouchableOpacity onPress={handleSignIn} style={styles.signInRow}>
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGuest} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bg: { ...StyleSheet.absoluteFill },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  logoGlow: {
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
  },
  logoText: {
    fontSize: 64,
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
  primaryBtn: { width: '100%' },

  signInRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  signInText: { ...font.bodySm, color: colors.textMuted },
  signInLink: { color: colors.yellow, fontWeight: '600' },

  guestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  guestText: { ...font.caption, color: colors.textFaint },
});
