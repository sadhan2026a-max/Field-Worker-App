import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography } from '@/core/theme';
import { useAssignment } from '@/features/assignment/hooks/useAssignments';
// Assuming we'll add an API hook for saving this, but we'll mock it for now
import { saveReturnDetail } from '@/features/assignment/api/assignmentService';

export function InspectionRemarksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [remarks, setRemarks] = useState('');

  const handleComplete = async () => {
    // In a real app we'd save this to the API. For now we just go to complete step.
    // Wait, inspection skips signature, goes to Complete.
    router.replace(`/assignment/${id}/complete`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Inspection Remarks</Text>
        <Text style={styles.subtitle}>Enter any final remarks before completing</Text>
        
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder="Enter remarks here..."
          value={remarks}
          onChangeText={setRemarks}
          textAlignVertical="top"
        />
      </View>
      
      <ScreenFooter>
        <Button label="Continue to Complete" onPress={handleComplete} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    minHeight: 120,
  }
});
