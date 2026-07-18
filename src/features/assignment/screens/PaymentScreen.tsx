import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, radius, spacing, typography } from '@/core/theme';
import { PaymentMode } from '@/domain/entities/Assignment';
import { useAssignment, useCompleteAssignment, useConfirmPayment } from '@/hooks/useAssignments';

const PAYMENT_MODES: { key: PaymentMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'cash', label: 'Cash', icon: 'payments' },
  { key: 'upi', label: 'UPI', icon: 'qr-code' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
];

export function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const confirmPayment = useConfirmPayment();
  const completeAssignment = useCompleteAssignment();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const amountValue = receivedAmount ?? String(assignment.codAmount);

  const onConfirmPayment = async () => {
    await confirmPayment.mutateAsync({
      id: assignment.id,
      paymentMode,
      receivedAmount: Number(amountValue) || 0,
    });
    await completeAssignment.mutateAsync(assignment.id);
    router.push({ pathname: '/assignment/[id]/complete', params: { id: assignment.id } });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `${assignment.code} · ${assignment.customer.name}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Payment Collection</Text>

        <Card style={styles.codCard}>
          <Text style={styles.label}>Collect COD</Text>
          <Text style={styles.codAmount}>₹{assignment.codAmount.toLocaleString()}</Text>
        </Card>

        <View>
          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.modeRow}>
            {PAYMENT_MODES.map((mode) => {
              const selected = paymentMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  style={[styles.modeOption, selected && styles.modeOptionSelected]}
                  onPress={() => setPaymentMode(mode.key)}
                >
                  <MaterialIcons name={mode.icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>{mode.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Received Amount"
          keyboardType="numeric"
          value={amountValue}
          onChangeText={setReceivedAmount}
        />

        <Input
          label="Customer Notes"
          placeholder="Write notes here..."
          multiline
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

      <ScreenFooter>
        <Button
          label="Confirm Payment"
          onPress={onConfirmPayment}
          loading={confirmPayment.isPending || completeAssignment.isPending}
        />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  codCard: {
    gap: spacing.xs,
  },
  codAmount: {
    ...typography.h1,
    color: colors.primary,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  modeLabel: {
    ...typography.caption,
  },
  modeLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  notesInput: {
    minHeight: 80,
    height: 'auto',
    textAlignVertical: 'top',
  },
});
