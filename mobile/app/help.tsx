import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, spacing, radius } from '../constants/theme';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const TICKET_TYPES = ['Payment issue', 'Account problem', 'Game dispute', 'Other'];
const MOCK_TICKETS = [
  { id: '1', type: 'Payment issue', subject: 'Charged but not confirmed', status: 'open', date: 'Jun 10', lastReply: 'Support: We are looking into this.' },
  { id: '2', type: 'Account problem', subject: 'Cannot change phone number', status: 'resolved', date: 'May 28', lastReply: 'Support: Issue resolved.' },
];

const STATUS_COLOR: Record<string, 'yellow' | 'green'> = { open: 'yellow', resolved: 'green' };

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [ticketType, setTicketType] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function openForm() {
    setStep(1);
    setTicketType('');
    setSubject('');
    setBody('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setStep(1);
  }

  function handleDone() {
    setTicketType('');
    setSubject('');
    setBody('');
    setStep(1);
    setShowForm(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Help & Support" showBack right={
        <TouchableOpacity onPress={showForm ? closeForm : openForm}>
          <Text style={{ color: colors.yellow, ...font.bodySmMed }}>{showForm ? 'Cancel' : '+ New'}</Text>
        </TouchableOpacity>
      } />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl, gap: spacing.lg }}>
        {showForm ? (
          <View style={styles.form}>
            {/* Step 1: Category picker */}
            {step === 1 && (
              <>
                <Text style={styles.stepTitle}>What's the issue?</Text>
                <Text style={styles.stepSubtitle}>Choose a category</Text>
                <View style={styles.typeRow}>
                  {TICKET_TYPES.map((t) => (
                    <TouchableOpacity key={t} onPress={() => setTicketType(t)} style={[styles.typePill, ticketType === t && styles.typePillActive]}>
                      <Text style={[styles.typePillText, ticketType === t && styles.typePillTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button onPress={() => setStep(2)} disabled={!ticketType}>Next →</Button>
              </>
            )}

            {/* Step 2: Subject + description */}
            {step === 2 && (
              <>
                <Text style={styles.stepTitle}>Describe the issue</Text>
                <Text style={styles.stepSubtitle}>{ticketType}</Text>
                <Input label="Subject" placeholder="Brief description of the issue" value={subject} onChangeText={setSubject} />
                <Input label="Details" placeholder="Describe what happened in detail…" value={body} onChangeText={setBody} multiline numberOfLines={5} />
                <View style={styles.stepButtons}>
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <View style={styles.submitBtnWrapper}>
                    <Button onPress={() => setStep(3)} disabled={!subject || !body}>Submit</Button>
                  </View>
                </View>
              </>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <View style={styles.successContent}>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Ticket submitted</Text>
                <Text style={styles.successSub}>We'll get back to you within 24 hours</Text>
                <Button onPress={handleDone}>Done</Button>
              </View>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>My Tickets</Text>

            {MOCK_TICKETS.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✉️</Text>
                <Text style={styles.emptyTitle}>No tickets yet</Text>
                <Text style={styles.emptySub}>Tap "+ New" to contact support.</Text>
              </View>
            ) : (
              <View style={styles.tickets}>
                {MOCK_TICKETS.map((t, i) => (
                  <TouchableOpacity key={t.id} style={[styles.ticket, i < MOCK_TICKETS.length - 1 && styles.ticketBorder]} activeOpacity={0.8}>
                    <View style={styles.ticketHeader}>
                      <View style={styles.ticketLeft}>
                        <Text style={styles.ticketSubject}>{t.subject}</Text>
                        <Text style={styles.ticketType}>{t.type} · {t.date}</Text>
                      </View>
                      <Badge color={STATUS_COLOR[t.status]}>{t.status}</Badge>
                    </View>
                    <Text style={styles.ticketReply} numberOfLines={1}>{t.lastReply}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.lg },

  stepTitle: { ...font.h3, color: colors.text },
  stepSubtitle: { ...font.body, color: colors.textSecondary, marginTop: -spacing.sm },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typePill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  typePillActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  typePillText: { ...font.bodySmMed, color: colors.textSecondary },
  typePillTextActive: { color: colors.yellow },

  stepButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  backBtnText: { ...font.bodySmMed, color: colors.textSecondary },
  submitBtnWrapper: { flex: 1 },

  successContent: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  checkCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success + '22', borderWidth: 2, borderColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 28, color: colors.success, fontWeight: '700' },
  successTitle: { ...font.h3, color: colors.text },
  successSub: { ...font.body, color: colors.textSecondary, textAlign: 'center' },

  sectionTitle: { ...font.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  tickets: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSubtle, overflow: 'hidden' },
  ticket: { padding: spacing.md, gap: spacing.xs },
  ticketBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  ticketLeft: { flex: 1, gap: 2 },
  ticketSubject: { ...font.bodyMed, color: colors.text },
  ticketType: { ...font.caption, color: colors.textMuted },
  ticketReply: { ...font.caption, color: colors.textSecondary, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...font.h3, color: colors.text },
  emptySub: { ...font.body, color: colors.textMuted },
});
