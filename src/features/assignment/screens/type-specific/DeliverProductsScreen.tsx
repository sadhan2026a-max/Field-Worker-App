import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';

import { spacing, typography, palette, colors, useTheme } from '@/core/theme';

import { useAssignment } from '@/features/assignment/hooks/useAssignments';

export function DeliverProductsScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);

  const handleContinue = () => {
    safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: id as string } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm, marginLeft: -8, padding: spacing.xs }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { marginBottom: 0 }]}>Deliver Products</Text>
        </View>
        <Text style={styles.subtitle}>Confirm items to handover for order #{assignment?.code}</Text>

        {assignment?.items && assignment.items.length > 0 ? (
          <View style={styles.itemsList}>
            {assignment.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.quantity} {item.unitName}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{((item.unitPrice ?? 0) * (item.quantity ?? 0)).toLocaleString()}</Text>
              </View>
            ))}
          </View>
        ) : assignment?.itemCount ? (
          <View style={styles.card}>
            <Text style={styles.itemText}>Items to deliver: {assignment.itemCount}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No line items recorded for this order.</Text>
          </View>
        )}

        {assignment && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Amount Due</Text>
            <Text style={styles.summaryValue}>₹{(assignment.totalAmount ?? 0).toLocaleString()}</Text>
          </View>
        )}
      </ScrollView>

      <ScreenFooter>
        <Button label="Confirm & Continue" onPress={handleContinue} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: {
    ...typography.h2,
    color: colors.textPrimary, marginBottom: spacing.sm
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary, marginBottom: spacing.xl
  },
  card: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  emptyCard: { padding: spacing.md, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  itemText: { ...typography.bodyMedium },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center'
  },
  itemsList: { gap: spacing.sm },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: { flex: 1, paddingRight: spacing.md },
  itemDescription: {
    ...typography.bodyMedium,
    color: colors.textPrimary, marginBottom: 2
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textSecondary
  },
  itemPrice: {
    ...typography.bodyMedium,
    color: colors.textPrimary, fontFamily: typography.h2.fontFamily
  },
  summaryCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.bodyMedium,
    color: colors.primary, fontWeight: 'bold'
  },
  summaryValue: {
    ...typography.h2,
    color: colors.primary
  },
});
