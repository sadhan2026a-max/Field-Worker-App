import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, spacing, typography } from '@/core/theme';
import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { getReturnReasons, saveReturnDetail } from '@/features/assignment/api/assignmentService';
import { ReturnReasonOption } from '@/features/assignment/types/Assignment';

export function ReturnDetailScreen() {
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
    router.replace(`/assignment/${id}/proof`);
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.h3, marginBottom: spacing.sm, marginTop: spacing.md },
  reasonsContainer: { gap: spacing.sm, marginBottom: spacing.lg },
  reasonButton: { alignSelf: 'flex-start' },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    minHeight: 100,
  }
});
