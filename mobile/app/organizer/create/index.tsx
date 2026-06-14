import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const STEP_LABELS = ['Cover', 'Location & Time', 'Format & Teams', 'Pricing', 'Review'];

const FORMATS = ['3v3', '4v4', '5v5', '7v7', '9v9', '11v11'];
const TEAM_COUNTS = [2, 4, 6, 8];
const TEAM_COLORS = [
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'yellow', color: '#F59E0B', label: 'Yellow' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'purple', color: '#A855F7', label: 'Purple' },
  { id: 'white', color: '#E5E7EB', label: 'White' },
];
const SKILL_LEVELS = ['Beginner', 'Casual', 'Intermediate', 'Competitive', 'Open to all'];
const PAYMENT_TYPES = [
  { id: 'required', label: 'Required', desc: 'Players must pay to confirm their spot.' },
  { id: 'optional', label: 'Pay later', desc: 'Players can join and pay on-site.' },
  { id: 'free', label: 'Free', desc: 'No payment needed.' },
];

type FormData = {
  coverPhoto: string | null;
  title: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  format: string;
  teamCount: number;
  teamColors: string[];
  price: string;
  paymentType: string;
  skillLevel: string;
  isPrivate: boolean;
  description: string;
};

const INITIAL: FormData = {
  coverPhoto: null, title: '', venue: '', address: '',
  date: '', time: '', format: '5v5', teamCount: 2,
  teamColors: ['red', 'blue'], price: '', paymentType: 'required',
  skillLevel: 'Open to all', isPrivate: false, description: '',
};

export default function CreateGameScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) update('coverPhoto', result.assets[0].uri);
  };

  const progress = step / TOTAL_STEPS;

  const canAdvance = () => {
    if (step === 1) return !!form.title;
    if (step === 2) return !!form.venue && !!form.date && !!form.time;
    if (step === 3) return !!form.format && form.teamCount > 0;
    if (step === 4) return form.paymentType === 'free' || !!form.price;
    return true;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step === 1) { router.back(); return; }
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // POST to Next.js API /api/matches/create
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/organizer/(tabs)/dashboard');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>{step === 1 ? '✕' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
          <Text style={styles.stepName}>{STEP_LABELS[step - 1]}</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
          <Text style={styles.skipText}>{step < TOTAL_STEPS ? 'Save draft' : ''}</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Cover + Title ── */}
        {step === 1 && (
          <View style={styles.step}>
            <TouchableOpacity onPress={pickCover} style={styles.coverPicker} activeOpacity={0.8}>
              {form.coverPhoto ? (
                <Image source={{ uri: form.coverPhoto }} style={styles.coverImage} contentFit="cover" />
              ) : (
                <LinearGradient colors={['#1A2A1A', '#0A0A0A']} style={styles.coverPlaceholder}>
                  <Text style={styles.coverIcon}>🏟️</Text>
                  <Text style={styles.coverHint}>Add cover photo</Text>
                  <Text style={styles.coverSub}>16:9 · Min 800px wide</Text>
                </LinearGradient>
              )}
              <View style={styles.coverEditBtn}>
                <Text style={styles.coverEditText}>{form.coverPhoto ? 'Change' : 'Add photo'}</Text>
              </View>
            </TouchableOpacity>

            <Input
              label="Game title"
              placeholder="e.g. Friday Night 5v5"
              value={form.title}
              onChangeText={(v) => update('title', v)}
              autoCapitalize="words"
              containerStyle={styles.field}
            />
            <Input
              label="Description (optional)"
              placeholder="Tell players what to expect, rules, footwear, etc."
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={4}
              containerStyle={styles.field}
            />
          </View>
        )}

        {/* ── Step 2: Location + Date/Time ── */}
        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Where & When?</Text>
            <Input label="Venue name" placeholder="e.g. Turf Manila, BGC" value={form.venue} onChangeText={(v) => update('venue', v)} containerStyle={styles.field} />
            <Input label="Address" placeholder="Search or enter full address" value={form.address} onChangeText={(v) => update('address', v)} containerStyle={styles.field} />

            {/* Map pin placeholder */}
            <View style={styles.mapPreview}>
              <Text style={styles.mapPreviewEmoji}>📍</Text>
              <Text style={styles.mapPreviewText}>Map pin will appear here</Text>
            </View>

            <Input label="Date" placeholder="e.g. Jun 20 or Friday" value={form.date} onChangeText={(v) => update('date', v)} containerStyle={styles.field} />
            <Input label="Start time" placeholder="e.g. 8:00 PM" value={form.time} onChangeText={(v) => update('time', v)} containerStyle={styles.field} />
          </View>
        )}

        {/* ── Step 3: Format + Teams ── */}
        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Format & Teams</Text>

            <Text style={styles.fieldLabel}>Format</Text>
            <View style={styles.pillRow}>
              {FORMATS.map((f) => (
                <TouchableOpacity key={f} onPress={() => { Haptics.selectionAsync(); update('format', f); }} style={[styles.pill, form.format === f && styles.pillActive]}>
                  <Text style={[styles.pillText, form.format === f && styles.pillTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Number of teams</Text>
            <View style={styles.pillRow}>
              {TEAM_COUNTS.map((n) => (
                <TouchableOpacity key={n} onPress={() => { Haptics.selectionAsync(); update('teamCount', n); }} style={[styles.pill, form.teamCount === n && styles.pillActive]}>
                  <Text style={[styles.pillText, form.teamCount === n && styles.pillTextActive]}>{n} teams</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Team colors</Text>
            <View style={styles.colorRow}>
              {TEAM_COLORS.slice(0, form.teamCount).map((c, i) => (
                <View key={c.id} style={styles.colorChip}>
                  <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                  <Text style={styles.colorLabel}>{c.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.maxPlayers}>
              <Text style={styles.maxPlayersLabel}>Max players</Text>
              <Text style={styles.maxPlayersValue}>
                {parseInt(form.format) * form.teamCount || '—'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 4: Pricing ── */}
        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Pricing & Rules</Text>

            <Text style={styles.fieldLabel}>Payment type</Text>
            <View style={styles.paymentOptions}>
              {PAYMENT_TYPES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => { Haptics.selectionAsync(); update('paymentType', p.id); }}
                  style={[styles.paymentOption, form.paymentType === p.id && styles.paymentOptionActive]}
                >
                  <View style={styles.paymentOptionLeft}>
                    <Text style={[styles.paymentOptionLabel, form.paymentType === p.id && { color: colors.yellow }]}>{p.label}</Text>
                    <Text style={styles.paymentOptionDesc}>{p.desc}</Text>
                  </View>
                  {form.paymentType === p.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {form.paymentType !== 'free' && (
              <Input
                label="Price per player (₱)"
                placeholder="e.g. 150"
                value={form.price}
                onChangeText={(v) => update('price', v)}
                keyboardType="numeric"
                containerStyle={styles.field}
              />
            )}

            <Text style={styles.fieldLabel}>Skill level</Text>
            <View style={styles.pillRow}>
              {SKILL_LEVELS.map((l) => (
                <TouchableOpacity key={l} onPress={() => { Haptics.selectionAsync(); update('skillLevel', l); }} style={[styles.pill, form.skillLevel === l && styles.pillActive]}>
                  <Text style={[styles.pillText, form.skillLevel === l && styles.pillTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => update('isPrivate', !form.isPrivate)} style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Private game</Text>
                <Text style={styles.toggleDesc}>Only players with invite link can see this game.</Text>
              </View>
              <View style={[styles.toggle, form.isPrivate && styles.toggleActive]}>
                <View style={[styles.toggleThumb, form.isPrivate && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Review & Launch</Text>
            <Text style={styles.stepSubtitle}>Double-check everything before publishing.</Text>

            {form.coverPhoto && (
              <Image source={{ uri: form.coverPhoto }} style={styles.reviewCover} contentFit="cover" />
            )}

            <View style={styles.reviewRows}>
              {[
                { label: 'Title', value: form.title || '—' },
                { label: 'Venue', value: form.venue || '—' },
                { label: 'Date', value: form.date || '—' },
                { label: 'Time', value: form.time || '—' },
                { label: 'Format', value: form.format },
                { label: 'Teams', value: `${form.teamCount} teams` },
                { label: 'Price', value: form.paymentType === 'free' ? 'Free' : `₱${form.price}/player` },
                { label: 'Payment', value: PAYMENT_TYPES.find((p) => p.id === form.paymentType)?.label || '—' },
                { label: 'Skill level', value: form.skillLevel },
                { label: 'Visibility', value: form.isPrivate ? 'Private' : 'Public' },
              ].map((r, i) => (
                <View key={r.label} style={[styles.reviewRow, i < 9 && styles.reviewRowBorder]}>
                  <Text style={styles.reviewLabel}>{r.label}</Text>
                  <Text style={styles.reviewValue}>{r.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={handleNext}
          disabled={!canAdvance()}
          loading={loading}
          size="lg"
          style={styles.nextBtn}
        >
          {step === TOTAL_STEPS ? '🚀 Launch Game' : 'Continue →'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: colors.textSecondary },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { ...font.caption, color: colors.accent },
  stepName: { ...font.h4, color: colors.text },
  skipBtn: { width: 60, alignItems: 'flex-end' },
  skipText: { ...font.caption, color: colors.textMuted },

  progressBar: { height: 3, backgroundColor: colors.surfaceElevated },
  progressFill: { height: '100%', backgroundColor: colors.accent },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },

  step: { gap: spacing.lg },
  stepTitle: { ...font.h2, color: colors.text },
  stepSubtitle: { ...font.body, color: colors.textSecondary, marginTop: -spacing.sm },

  coverPicker: { height: (width - spacing.lg * 2) * 9 / 16, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
  coverImage: { flex: 1 },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  coverIcon: { fontSize: 48 },
  coverHint: { ...font.h4, color: colors.textSecondary },
  coverSub: { ...font.caption, color: colors.textMuted },
  coverEditBtn: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverEditText: { ...font.captionMed, color: colors.white },

  field: {},
  fieldLabel: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm },

  mapPreview: {
    height: 120,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mapPreviewEmoji: { fontSize: 32 },
  mapPreviewText: { ...font.bodySm, color: colors.textMuted },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  pillText: { ...font.bodySmMed, color: colors.textSecondary },
  pillTextActive: { color: colors.accent },

  colorRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  colorChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.surfaceElevated, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: colors.border },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  colorLabel: { ...font.caption, color: colors.textSecondary },

  maxPlayers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  maxPlayersLabel: { ...font.body, color: colors.textSecondary },
  maxPlayersValue: { ...font.h3, color: colors.accent },

  paymentOptions: { gap: spacing.sm },
  paymentOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  paymentOptionActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  paymentOptionLeft: { flex: 1, gap: 4 },
  paymentOptionLabel: { ...font.bodyMed, color: colors.textSecondary },
  paymentOptionDesc: { ...font.caption, color: colors.textMuted },
  checkmark: { color: colors.yellow, fontSize: 18, fontWeight: '700' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  toggleInfo: { flex: 1, gap: 4 },
  toggleLabel: { ...font.bodyMed, color: colors.text },
  toggleDesc: { ...font.caption, color: colors.textMuted },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border, padding: 2 },
  toggleActive: { backgroundColor: colors.yellow },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.text },
  toggleThumbActive: { transform: [{ translateX: 18 }], backgroundColor: colors.bg },

  reviewCover: { height: 180, borderRadius: radius.lg },
  reviewRows: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  reviewLabel: { ...font.body, color: colors.textMuted },
  reviewValue: { ...font.bodyMed, color: colors.text, textAlign: 'right', flex: 1, marginLeft: spacing.md },

  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle, backgroundColor: colors.bg },
  nextBtn: {},
});
