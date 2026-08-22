import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment, useCompleteAssignment } from '@/features/assignment/hooks/useAssignments';
import { saveSalesDetail } from '@/features/assignment/api/assignmentService';
import { SalesOutcome } from '@/features/assignment/types/Assignment';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCompletionRequirements } from '@/features/assignment/redux/assignmentSlice';

export function SalesDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  const completionRequirements = useAppSelector(selectCompletionRequirements);
  const reqs = assignment ? completionRequirements?.[assignment.type.toLowerCase()] : null;
  const requiresSalesOutcome = reqs ? reqs.requiresSalesOutcome : true; // Fallback

  const dispatch = useAppDispatch();
  const [meetingNotes, setMeetingNotes] = useState(assignment?.salesDetail?.meetingNotes || '');
  const [outcome, setOutcome] = useState<SalesOutcome | ''>(assignment?.salesDetail?.outcome || '');
  const initialDate = assignment?.salesDetail?.followUpDate || '';
  const initialDisplayDate = initialDate.includes('-') && initialDate.split('-')[0].length === 4
    ? `${initialDate.split('-')[2]}-${initialDate.split('-')[1]}-${initialDate.split('-')[0]}`
    : initialDate;
  const [followUpDate, setFollowUpDate] = useState(initialDisplayDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setFollowUpDate(`${day}-${month}-${year}`);
    }
  };

  const getParsedDate = (val: string) => {
    if (!val || val.length !== 10) return new Date();
    const parts = val.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date();
  };

  const handleDateTextChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) formatted += cleaned.substring(0, 2);
    if (cleaned.length > 2) formatted += '-' + cleaned.substring(2, 4);
    if (cleaned.length > 4) formatted += '-' + cleaned.substring(4, 8);
    setFollowUpDate(formatted);
  };

  React.useEffect(() => {
    if (!assignment) return;
    const timeout = setTimeout(() => {
      dispatch({
        type: 'assignment/addAssignment',
        payload: {
          ...assignment,
          salesDetail: {
            ...assignment.salesDetail,
            meetingNotes,
            outcome: outcome || undefined,
            followUpDate: followUpDate.length === 10 ? `${followUpDate.split('-')[2]}-${followUpDate.split('-')[1]}-${followUpDate.split('-')[0]}` : followUpDate,
          }
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [meetingNotes, outcome, followUpDate]);

  const outcomes: { label: string; value: SalesOutcome }[] = [
    { label: 'Interested', value: 'Interested' },
    { label: 'Not Interested', value: 'NotInterested' },
    { label: 'Follow-up Needed', value: 'FollowUpNeeded' },
    { label: 'Closed', value: 'Closed' },
    { label: 'No Response', value: 'NoResponse' },
  ];

  const handleComplete = async () => {
    if (requiresSalesOutcome) {
      if (!meetingNotes || !outcome) return;
      if (outcome === 'FollowUpNeeded' && !followUpDate) return;
    }

    let formattedDateForBackend = followUpDate;
    if (followUpDate && outcome === 'FollowUpNeeded' && followUpDate.length === 10) {
      formattedDateForBackend = `${followUpDate.split('-')[2]}-${followUpDate.split('-')[1]}-${followUpDate.split('-')[0]}`;
    }

    await saveSalesDetail(id as string, {
      meetingNotes,
      outcome: outcome as SalesOutcome,
      followUpDate: outcome === 'FollowUpNeeded' ? formattedDateForBackend : undefined
    });

    // Sales skips proof/payment entirely
    safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: id as string } });
  };

  const isValidDate = (dateString: string) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateString)) return false;
    const parts = dateString.split('-');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;
    return true;
  };

  const isFormValid = requiresSalesOutcome
    ? (meetingNotes.length > 0 && outcome !== '' && (outcome !== 'FollowUpNeeded' || (followUpDate.length > 0 && isValidDate(followUpDate))))
    : true;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm, marginLeft: -8, padding: spacing.xs }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { marginBottom: 0 }]}>Sales Visit</Text>
        </View>
        <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

        <Text style={styles.label}>Meeting Notes <Text style={styles.asterisk}>*</Text></Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="Enter notes..."
          placeholderTextColor={colors.textSecondary}
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
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', padding: 0 }]}>
              <TextInput
                style={[
                  { flex: 1, padding: spacing.md, color: colors.textPrimary },
                  followUpDate.length > 0 && !isValidDate(followUpDate) && styles.inputError
                ]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={colors.textSecondary}
                value={followUpDate}
                onChangeText={handleDateTextChange}
                keyboardType="number-pad"
                maxLength={10}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 250);
                }}
              />
              <Pressable onPress={() => setShowDatePicker(true)} style={{ padding: spacing.md }}>
                <MaterialIcons name="calendar-today" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            {followUpDate.length > 0 && !isValidDate(followUpDate) && (
              <Text style={styles.errorText}>Please enter a valid date in DD-MM-YYYY format.</Text>
            )}
            {showDatePicker && (
              <DateTimePicker
                value={getParsedDate(followUpDate)}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
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
  content: { padding: spacing.lg, paddingBottom: 265 },
  title: {
    ...typography.h2,
    color: colors.textPrimary, marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary, marginBottom: spacing.xl
  },
  label: {
    ...typography.h3,
    color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md
  },
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
