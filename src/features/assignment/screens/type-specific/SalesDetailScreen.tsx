import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment, useCompleteAssignment } from '@/features/assignment/hooks/useAssignments';
import { saveSalesDetail } from '@/features/assignment/api/assignmentService';
import { SalesOutcome } from '@/features/assignment/types/Assignment';

export function SalesDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);

  const [meetingNotes, setMeetingNotes] = useState('');
  const [outcome, setOutcome] = useState<SalesOutcome | ''>('');
  const [followUpDate, setFollowUpDate] = useState(''); // Simplified to string for now

  const outcomes: { label: string; value: SalesOutcome }[] = [
    { label: 'Interested', value: 'Interested' },
    { label: 'Not Interested', value: 'NotInterested' },
    { label: 'Follow-up Needed', value: 'FollowUpNeeded' },
    { label: 'Closed', value: 'Closed' },
    { label: 'No Response', value: 'NoResponse' },
  ];

  const handleComplete = async () => {
    if (!meetingNotes || !outcome) return;
    if (outcome === 'FollowUpNeeded' && !followUpDate) return;

    await saveSalesDetail(id as string, {
      meetingNotes,
      outcome: outcome as SalesOutcome,
      followUpDate: outcome === 'FollowUpNeeded' ? followUpDate : undefined
    });

    // Sales skips proof/payment entirely
    safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: id as string } });
  };

  const isValidDate = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const isFormValid = meetingNotes.length > 0 && 
                      outcome !== '' && 
                      (outcome !== 'FollowUpNeeded' || (followUpDate.length > 0 && isValidDate(followUpDate)));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Sales Visit</Text>
        <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

        <Text style={styles.label}>Meeting Notes <Text style={styles.asterisk}>*</Text></Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Enter notes..."
          value={meetingNotes}
          onChangeText={setMeetingNotes}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Outcome <Text style={styles.asterisk}>*</Text></Text>
        <View style={styles.outcomesContainer}>
          {outcomes.map((o) => (
            <Button
              key={o.value}
              label={o.label}
              variant={outcome === o.value ? 'primary' : 'outline'}
              onPress={() => setOutcome(o.value)}
              style={styles.outcomeButton}
            />
          ))}
        </View>

        {outcome === 'FollowUpNeeded' && (
          <View>
            <Text style={styles.label}>Follow-up Date <Text style={styles.asterisk}>*</Text></Text>
            <TextInput
              style={[styles.input, followUpDate.length > 0 && !isValidDate(followUpDate) && styles.inputError]}
              placeholder="YYYY-MM-DD"
              value={followUpDate}
              onChangeText={setFollowUpDate}
              keyboardType="number-pad"
            />
            {followUpDate.length > 0 && !isValidDate(followUpDate) && (
              <Text style={styles.errorText}>Please enter a valid date in YYYY-MM-DD format.</Text>
            )}
          </View>
        )}
      </ScrollView>

      <ScreenFooter>
        <Button 
          label="Review Job" 
          onPress={handleComplete} 
          disabled={!isFormValid} 
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { ...typography.h2,
    color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body,
    color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.h3,
    color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
  outcomesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  outcomeButton: { alignSelf: 'flex-start' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger || '#FF3B30',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger || '#FF3B30',
    marginTop: spacing.xs,
  },
  asterisk: {
    color: colors.danger || '#FF3B30',
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 100,
  }
});
