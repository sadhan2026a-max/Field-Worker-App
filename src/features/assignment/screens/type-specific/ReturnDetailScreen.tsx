import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { getReturnReasons, saveReturnDetail } from '@/features/assignment/api/assignmentService';
import { ReturnReasonOption } from '@/features/assignment/types/Assignment';

export function ReturnDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  const [reasons, setReasons] = useState<ReturnReasonOption[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [conditionNotes, setConditionNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getReturnReasons().then((data) => {
      setReasons(data);
      setIsLoading(false);
    });
  }, []);

  const handleContinue = async () => {
    if (!selectedReasonId) return;
    await saveReturnDetail(id as string, { returnReasonOptionId: selectedReasonId, conditionNotes });
    safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: id as string } });
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Verify Return</Text>
        <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

        <Text style={styles.label}>Select Return Reason *</Text>
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

        <Text style={styles.label}>Condition Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="E.g. Box opened, item unused..."
          value={conditionNotes}
          onChangeText={setConditionNotes}
          textAlignVertical="top"
        />
      </ScrollView>

      <ScreenFooter>
        <Button label="Continue to Proof" onPress={handleContinue} disabled={!selectedReasonId} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2,
    color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: { ...typography.body,
    color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.h3,
    color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.md },
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
  }
});
