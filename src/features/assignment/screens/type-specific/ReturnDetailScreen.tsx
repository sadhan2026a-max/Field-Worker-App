import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { getReturnReasons, saveReturnDetail } from '@/features/assignment/api/assignmentService';
import { ReturnReasonOption } from '@/features/assignment/types/Assignment';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCompletionRequirements } from '@/features/assignment/redux/assignmentSlice';

export function ReturnDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  const completionRequirements = useAppSelector(selectCompletionRequirements);
  const reqs = assignment ? completionRequirements?.[assignment.type.toLowerCase()] : null;
  const requiresReturnReason = reqs ? reqs.requiresReturnReason : true; // Fallback

  const [reasons, setReasons] = useState<ReturnReasonOption[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>(assignment?.returnDetail?.returnReasonOptionId || '');
  const [conditionNotes, setConditionNotes] = useState<string>(assignment?.returnDetail?.conditionNotes || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getReturnReasons().then((data) => {
      setReasons(data);
      setIsLoading(false);
    });
  }, []);

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!assignment) return;
    const timeout = setTimeout(() => {
      dispatch({
        type: 'assignment/addAssignment',
        payload: {
          ...assignment,
          returnDetail: {
            ...assignment.returnDetail,
            returnReasonOptionId: selectedReasonId,
            conditionNotes,
          }
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [selectedReasonId, conditionNotes]);

  const handleContinue = async () => {
    if (requiresReturnReason && !selectedReasonId) return;
    await saveReturnDetail(id as string, { returnReasonOptionId: selectedReasonId, conditionNotes });
    safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: id as string } });
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm, marginLeft: -8, padding: spacing.xs }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { marginBottom: 0 }]}>Verify Return</Text>
        </View>
        <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

        {assignment?.returnDetail?.originalInvoiceNumber ? (
          <View style={styles.invoiceContainer}>
            <MaterialIcons name="receipt" size={20} color={colors.primary} />
            <Text style={styles.invoiceText}>
              Original Invoice: <Text style={{ fontFamily: 'Inter-Bold', fontWeight: 'bold' }}>{assignment.returnDetail.originalInvoiceNumber}</Text>
            </Text>
          </View>
        ) : null}

        {requiresReturnReason ? (
          <>
            <Text style={styles.label}>
              Select Return Reason <Text style={{ color: colors.danger }}>*</Text>
            </Text>
            <View style={styles.reasonsContainer}>
              {reasons.map((reason) => (
                <Button
                  key={reason.id}
                  label={reason.label}
                  variant={selectedReasonId === reason.id ? 'primary' : 'outline'}
                  onPress={() => setSelectedReasonId(reason.id)}
                  style={styles.reasonButton}
                />
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.label}>Return reason not required for this order.</Text>
        )}

        <Text style={styles.label}>Condition Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="E.g. Box opened, item unused..."
          placeholderTextColor={colors.textSecondary}
          value={conditionNotes}
          onChangeText={setConditionNotes}
          textAlignVertical="top"
        />
      </ScrollView>

      <ScreenFooter>
        <Button
          label="Continue to Proof"
          onPress={handleContinue}
          disabled={requiresReturnReason && !selectedReasonId}
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
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
  reasonsContainer: { gap: spacing.sm, marginBottom: spacing.lg },
  reasonButton: { alignSelf: 'flex-start' },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 100,
  },
  invoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  invoiceText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  }
});
