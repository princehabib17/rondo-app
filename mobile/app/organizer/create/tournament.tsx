import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius } from '../../../constants/theme';

const TOTAL_STEPS = 4;
const STEP_LABELS = ['Name & Format', 'Schedule & Venue', 'Teams & Entry', 'Review'];
const FORMATS = [
  { id: 'knockout', label: 'Knockout', desc: 'Lose once, you\'re out.', icon: '⚡' },
  { id: 'league', label: 'League', desc: 'Everyone plays everyone.', icon: '🔄' },
];

type Form = { name: string; format: string; venue: string; address: string; date: string; time: string; maxTeams: string; perSide: string; entryFee: string; description: string };
const INITIAL: Form = { name: '', format: '', venue: '', address: '', date: '', time: '', maxTeams: '8', perSide: '5', entryFee: '', description: '' };

export default function CreateTournamentScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(INITIAL);
  const [loading, setLoading] = useState(false);
  const update = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canAdvance = () => {
    if (step === 1) return !!form.name && !!form.format;
    if (step === 2) return !!form.venue && !!form.date && !!form.time;
    if (step === 3) return !!form.maxTeams && !!form.perSide;
    return true;
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) { setStep((s) => s + 1); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/organizer/(tabs)/tournaments');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep((s) => s - 1)} style={styles.backBtn}>
          <Text style={styles.backArrow}>{step === 1 ? '✕' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
          <Text style={styles.stepName}>{STEP_LABELS[step - 1]}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.title}>Name your tournament</Text>
            <Input label="Tournament name" placeholder="e.g. BGC Summer Cup" value={form.name} onChangeText={(v) => update('name', v)} />
            <Text style={styles.fieldLabel}>Format</Text>
            {FORMATS.map((f) => (
              <TouchableOpacity key={f.id} onPress={() => { Haptics.selectionAsync(); update('format', f.id); }} style={[styles.formatCard, form.format === f.id && styles.formatCardActive]}>
                <Text style={styles.formatIcon}>{f.icon}</Text>
                <View style={styles.formatInfo}>
                  <Text style={[styles.formatLabel, form.format === f.id && { color: colors.yellow }]}>{f.label}</Text>
                  <Text style={styles.formatDesc}>{f.desc}</Text>
                </View>
                {form.format === f.id && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
            <Input label="Description (optional)" placeholder="Rules, format details, prize info…" value={form.description} onChangeText={(v) => update('description', v)} multiline numberOfLines={3} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.title}>Schedule & Venue</Text>
            <Input label="Venue name" placeholder="e.g. Turf Manila, BGC" value={form.venue} onChangeText={(v) => update('venue', v)} />
            <Input label="Address (optional)" placeholder="Full address" value={form.address} onChangeText={(v) => update('address', v)} />
            <Input label="Start date" placeholder="e.g. Jun 28" value={form.date} onChangeText={(v) => update('date', v)} />
            <Input label="Start time" placeholder="e.g. 9:00 AM" value={form.time} onChangeText={(v) => update('time', v)} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.title}>Teams & Entry</Text>
            <Input label="Max teams" placeholder="e.g. 8" value={form.maxTeams} onChangeText={(v) => update('maxTeams', v)} keyboardType="numeric" hint="Must be a power of 2 for knockout format." />
            <Input label="Players per side" placeholder="e.g. 5" value={form.perSide} onChangeText={(v) => update('perSide', v)} keyboardType="numeric" />
            <Input label="Entry fee per team (₱)" placeholder="Leave blank for free" value={form.entryFee} onChangeText={(v) => update('entryFee', v)} keyboardType="numeric" />

            {form.maxTeams && form.perSide && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Max total players</Text>
                <Text style={styles.summaryValue}>{parseInt(form.maxTeams) * parseInt(form.perSide) || '—'}</Text>
              </View>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.title}>Review & Publish</Text>
            <View style={styles.reviewCard}>
              {[
                { l: 'Name', v: form.name || '—' },
                { l: 'Format', v: FORMATS.find((f) => f.id === form.format)?.label || '—' },
                { l: 'Venue', v: form.venue || '—' },
                { l: 'Date', v: form.date || '—' },
                { l: 'Time', v: form.time || '—' },
                { l: 'Max teams', v: form.maxTeams },
                { l: 'Per side', v: `${form.perSide}v${form.perSide}` },
                { l: 'Entry fee', v: form.entryFee ? `₱${form.entryFee}/team` : 'Free' },
              ].map((r, i, arr) => (
                <View key={r.l} style={[styles.reviewRow, i < arr.length - 1 && styles.reviewRowBorder]}>
                  <Text style={styles.reviewLabel}>{r.l}</Text>
                  <Text style={styles.reviewValue}>{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button onPress={handleNext} disabled={!canAdvance()} loading={loading} size="lg">
          {step === TOTAL_STEPS ? '🏆 Publish Tournament' : 'Continue →'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: colors.textSecondary },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { ...font.caption, color: colors.yellow },
  stepName: { ...font.h4, color: colors.text },
  progressBar: { height: 3, backgroundColor: colors.surfaceElevated },
  progressFill: { height: '100%', backgroundColor: colors.yellow },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  step: { gap: spacing.md },
  title: { ...font.h2, color: colors.text, marginBottom: spacing.sm },
  fieldLabel: { ...font.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  formatCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md },
  formatCardActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  formatIcon: { fontSize: 28 },
  formatInfo: { flex: 1, gap: 2 },
  formatLabel: { ...font.bodyMed, color: colors.textSecondary },
  formatDesc: { ...font.caption, color: colors.textMuted },
  check: { color: colors.yellow, fontSize: 20, fontWeight: '700' },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  summaryLabel: { ...font.body, color: colors.textSecondary },
  summaryValue: { ...font.h3, color: colors.yellow },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  reviewLabel: { ...font.body, color: colors.textMuted },
  reviewValue: { ...font.bodyMed, color: colors.text },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderSubtle, backgroundColor: colors.bg },
});
