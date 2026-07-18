import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, spacing, typography } from '@/core/theme';
import { useAssignment } from '@/features/assignment/hooks/useAssignments';

export function PickupItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);

  const handleContinue = () => {
    router.replace(`/assignment/${id}/proof`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Pickup Items</Text>
        <Text style={styles.subtitle}>Confirm items to collect for order #{assignment?.code}</Text>
        
        {assignment?.itemCount ? (
          <View style={styles.card}>
            <Text style={styles.itemText}>Items to pickup: {assignment.itemCount}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No line items recorded for this order.</Text>
          </View>
        )}
      </View>
      
      <ScreenFooter>
        <Button label="Continue" onPress={handleContinue} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  card: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  emptyCard: { padding: spacing.md, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  itemText: { ...typography.bodyMedium },
  emptyText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
});
