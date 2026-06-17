import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors, font, spacing, radius, shadow } from '../../../constants/theme';
import * as q from '../../../lib/queries';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const STEP_LABELS = ['Cover', 'Venue', 'Format', 'Entry', 'Review'];
const FORMATS = [
  { id: 'knockout', label: 'Knockout', desc: 'Direct bracket. Lose once and the run is over.', mark: 'KO' },
  { id: 'league', label: 'League', desc: 'Round-robin table. Better when every team should get minutes.', mark: 'RR' },
];

type Form = {
  coverPhoto: string | null;
  name: string;
  format: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  maxTeams: string;
  perSide: string;
  entryFee: string;
  description: string;
};

const INITIAL: Form = {
  coverPhoto: null,
  name: '',
  format: 'knockout',
  venue: '',
  address: '',
  date: '',
  time: '',
  maxTeams: '8',
  perSide: '5',
  entryFee: '',
  description: '',
};

export default function CreateTournamentScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(INITIAL);
  const [loading, setLoading] = useState(false);
  const update = (k: keyof Form, v: string | null) => setForm((f) => ({ ...f, [k]: v }));

  const maxTeams = parseInt(form.maxTeams || '0', 10) || 0;
  const perSide = parseInt(form.perSide || '0', 10) || 0;
  const entryFee = parseFloat(form.entryFee || '0') || 0;
  const totalPlayers = maxTeams * perSide;
  const grossEntry = useMemo(() => maxTeams * entryFee, [maxTeams, entryFee]);
  const selectedFormat = FORMATS.find((item) => item.id === form.format) ?? FORMATS[0];

  const canAdvance = () => {
    if (step === 1) return form.name.trim().length >= 3;
    if (step === 2) return !!form.venue && !!form.date && !!form.time;
    if (step === 3) return !!form.format;
    if (step === 4) return !!form.maxTeams && !!form.perSide;
    return true;
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.86,
    });
    if (!result.canceled) update('coverPhoto', result.assets[0].uri);
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      const dateTimeStr = `${form.date} ${form.time}`;
      const startsAt = new Date(dateTimeStr);
      const isoStartsAt = isNaN(startsAt.getTime()) ? new Date().toISOString() : startsAt.toISOString();
      const entryFeeCentavos = form.entryFee ? Math.round(parseFloat(form.entryFee) * 100) : 0;
      await q.createTournament({
        name: form.name,
        description: form.description || null,
        format: form.format === 'knockout' ? 'single_elimination' : 'round_robin',
        venue_name: form.venue,
        venue_address: form.address || null,
        starts_at: isoStartsAt,
        max_teams: maxTeams,
        team_size: perSide,
        entry_fee: entryFeeCentavos,
        status: 'registration',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/organizer/(tabs)/tournaments');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>{step === 1 ? '×' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
          <Text style={styles.stepName}>{STEP_LABELS[step - 1]}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 124 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View style={styles.step}>
            <TouchableOpacity onPress={pickCover} activeOpacity={0.9} style={[styles.coverShell, shadow.card]}>
              {form.coverPhoto ? (
                <Image source={{ uri: form.coverPhoto }} style={styles.coverImage} contentFit="cover" alt="" />
              ) : (
                <LinearGradient colors={['#26270D', '#080808']} style={styles.coverPlaceholder}>
                  <Text style={styles.coverMark}>CUP</Text>
                  <Text style={styles.coverTitle}>Build the stage</Text>
                  <Text style={styles.coverSub}>Add a poster-style cover from the organizer library.</Text>
                </LinearGradient>
              )}
              <View style={styles.coverAction}>
                <Text style={styles.coverActionText}>{form.coverPhoto ? 'Change cover' : 'Add cover'}</Text>
              </View>
            </TouchableOpacity>

            <Input label="Tournament name" placeholder="Rondo Summer Cup" value={form.name} onChangeText={(v) => update('name', v)} />
            <Input
              label="Story and rules"
              placeholder="Prize, refund policy, match format, schedule notes..."
              value={form.description}
              onChangeText={(v) => update('description', v)}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <View style={styles.mapCard}>
              <View style={styles.mapNodePrimary} />
              <View style={styles.mapNodeSecondary} />
              <View style={styles.mapLineA} />
              <View style={styles.mapLineB} />
              <Text style={styles.mapKicker}>Venue preview</Text>
              <Text style={styles.mapTitle}>{form.venue || 'Pick the arena'}</Text>
              <Text style={styles.mapSub}>{form.address || 'Address appears here after you add it.'}</Text>
            </View>
            <Input label="Venue name" placeholder="Turf Manila, BGC" value={form.venue} onChangeText={(v) => update('venue', v)} />
            <Input label="Address" placeholder="Full address" value={form.address} onChangeText={(v) => update('address', v)} />
            <View style={styles.twoCol}>
              <Input label="Start date" placeholder="Jun 28" value={form.date} onChangeText={(v) => update('date', v)} containerStyle={styles.twoColItem} />
              <Input label="Start time" placeholder="9:00 AM" value={form.time} onChangeText={(v) => update('time', v)} containerStyle={styles.twoColItem} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.screenTitle}>Choose the competition shape</Text>
            {FORMATS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  update('format', item.id);
                }}
                activeOpacity={0.86}
                style={[styles.formatCard, form.format === item.id && styles.formatCardActive]}
              >
                <View style={styles.formatMark}>
                  <Text style={styles.formatMarkText}>{item.mark}</Text>
                </View>
                <View style={styles.formatBody}>
                  <Text style={styles.formatTitle}>{item.label}</Text>
                  <Text style={styles.formatDesc}>{item.desc}</Text>
                </View>
                <Text style={[styles.check, form.format === item.id && styles.checkActive]}>✓</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.screenTitle}>Set team capacity and entry</Text>
            <View style={styles.twoCol}>
              <Input label="Max teams" placeholder="8" value={form.maxTeams} onChangeText={(v) => update('maxTeams', v)} keyboardType="numeric" containerStyle={styles.twoColItem} />
              <Input label="Players per side" placeholder="5" value={form.perSide} onChangeText={(v) => update('perSide', v)} keyboardType="numeric" containerStyle={styles.twoColItem} />
            </View>
            <Input label="Entry fee per team (PHP)" placeholder="Leave blank for free" value={form.entryFee} onChangeText={(v) => update('entryFee', v)} keyboardType="numeric" />

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalPlayers || 0}</Text>
                <Text style={styles.statLabel}>Max players</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>PHP {grossEntry || 0}</Text>
                <Text style={styles.statLabel}>Gross entry</Text>
              </View>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.step}>
            <View style={styles.reviewHero}>
              {form.coverPhoto ? (
                <Image source={{ uri: form.coverPhoto }} style={styles.reviewImage} contentFit="cover" alt="" />
              ) : (
                <LinearGradient colors={['#24240A', '#070707']} style={styles.reviewImage} />
              )}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.92)']} style={styles.reviewShade} />
              <View style={styles.reviewCopy}>
                <Text style={styles.reviewKicker}>{selectedFormat.label}</Text>
                <Text style={styles.reviewTitle}>{form.name || 'Tournament'}</Text>
                <Text style={styles.reviewMeta}>{form.date || 'Date'} · {form.time || 'Time'} · {form.venue || 'Venue'}</Text>
              </View>
            </View>

            <View style={styles.reviewRows}>
              {[
                ['Teams', `${maxTeams || 0}`],
                ['Per side', `${perSide || 0}v${perSide || 0}`],
                ['Entry', entryFee ? `PHP ${entryFee}/team` : 'Free'],
                ['Capacity', `${totalPlayers || 0} players`],
                ['Address', form.address || 'Not added'],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{label}</Text>
                  <Text style={styles.reviewValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button onPress={handleNext} disabled={!canAdvance()} loading={loading} size="lg">
          {step === TOTAL_STEPS ? 'Publish tournament' : 'Continue →'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, color: colors.textSecondary },
  headerCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { ...font.captionMed, color: colors.yellow, textTransform: 'uppercase', letterSpacing: 1.4 },
  stepName: { ...font.h4, color: colors.text },
  headerRight: { width: 44 },
  progressTrack: { height: 3, backgroundColor: colors.surfaceElevated },
  progressFill: { height: '100%', backgroundColor: colors.yellow },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  step: { gap: spacing.lg },
  coverShell: {
    height: (width - spacing.lg * 2) * 1.08,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  coverImage: { flex: 1 },
  coverPlaceholder: { flex: 1, justifyContent: 'flex-end', padding: spacing.xl, gap: spacing.sm },
  coverMark: { color: colors.yellow, fontSize: 14, fontWeight: '900', letterSpacing: 4 },
  coverTitle: { color: colors.text, fontSize: 38, fontWeight: '900', lineHeight: 38, textTransform: 'uppercase' },
  coverSub: { ...font.bodySm, color: colors.textSecondary, lineHeight: 20 },
  coverAction: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.yellow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  coverActionText: { ...font.captionMed, color: colors.bg, textTransform: 'uppercase', letterSpacing: 1 },
  mapCard: {
    height: 190,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  mapNodePrimary: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.yellow, top: 52, left: 78 },
  mapNodeSecondary: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, right: 70, top: 88 },
  mapLineA: { position: 'absolute', width: 220, height: 1, backgroundColor: colors.border, transform: [{ rotate: '-18deg' }], top: 94, left: 34 },
  mapLineB: { position: 'absolute', width: 180, height: 1, backgroundColor: colors.borderSubtle, transform: [{ rotate: '28deg' }], top: 112, left: 98 },
  mapKicker: { ...font.captionMed, color: colors.yellow, textTransform: 'uppercase', letterSpacing: 1.2 },
  mapTitle: { ...font.h2, color: colors.text, marginTop: 5 },
  mapSub: { ...font.bodySm, color: colors.textSecondary, marginTop: 3 },
  twoCol: { flexDirection: 'row', gap: spacing.md },
  twoColItem: { flex: 1 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: colors.text, lineHeight: 31, textTransform: 'uppercase' },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  formatCardActive: { borderColor: colors.yellow, backgroundColor: colors.yellowGlow },
  formatMark: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.glassStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatMarkText: { color: colors.yellow, fontSize: 16, fontWeight: '900', letterSpacing: 1.2 },
  formatBody: { flex: 1, gap: 4 },
  formatTitle: { ...font.bodyMed, color: colors.text },
  formatDesc: { ...font.caption, color: colors.textMuted, lineHeight: 17 },
  check: { color: colors.textFaint, fontSize: 20, fontWeight: '900' },
  checkActive: { color: colors.yellow },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  statValue: { color: colors.yellow, fontSize: 24, fontWeight: '900' },
  statLabel: { ...font.captionMed, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  reviewHero: { height: 320, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surface },
  reviewImage: { ...StyleSheet.absoluteFillObject },
  reviewShade: { ...StyleSheet.absoluteFillObject },
  reviewCopy: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  reviewKicker: { ...font.captionMed, color: colors.yellow, textTransform: 'uppercase', letterSpacing: 1.6 },
  reviewTitle: { color: colors.text, fontSize: 42, fontWeight: '900', lineHeight: 42, textTransform: 'uppercase', marginTop: 4 },
  reviewMeta: { ...font.bodySm, color: colors.textSecondary, marginTop: 8 },
  reviewRows: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, overflow: 'hidden' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle, gap: spacing.md },
  reviewLabel: { ...font.bodySm, color: colors.textMuted },
  reviewValue: { ...font.bodySmMed, color: colors.text, textAlign: 'right', flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.bg,
  },
});
