import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { radius, spacing, typography, colors, useTheme } from '@/core/theme';

import { PaymentMode } from '@/domain/entities/Assignment';
import { useAssignment, useConfirmPayment } from '@/hooks/useAssignments';
import { safeRouter } from '@/shared/utils/navigation';

const PAYMENT_MODES: { key: PaymentMode; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'cash', label: 'Cash', icon: 'payments' },
  { key: 'upi', label: 'UPI', icon: 'qr-code' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
];

export function PaymentScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const confirmPayment = useConfirmPayment();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const amountValue = receivedAmount ?? String(assignment.codAmount);
  const numericAmount = Number(amountValue) || 0;
  const isPartial = numericAmount < assignment.codAmount;

  const onConfirmPayment = async () => {
    await confirmPayment.mutateAsync({
      id: assignment.id,
      paymentMode,
      receivedAmount: numericAmount,
      referenceNumber: paymentMode !== 'cash' ? referenceNumber : undefined,
    });

    safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: assignment.id } });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `${assignment.code} · ${assignment.customer.name}` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Payment Collection</Text>

        <Card style={styles.codCard}>
          <Text style={styles.label}>Expected COD Amount</Text>
          <Text style={styles.codAmount}>₹{(assignment.codAmount ?? 0).toLocaleString()}</Text>
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
          label="Collected Amount"
          keyboardType="numeric"
          value={amountValue}
          onChangeText={setReceivedAmount}
        />

        {paymentMode !== 'cash' && (
          <Input
            label="Reference Number"
            placeholder="Enter transaction ID or reference"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
          />
        )}

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
          label={isPartial ? `Mark as Partially Collected (₹${numericAmount})` : 'Mark as Collected'}
          onPress={onConfirmPayment}
          loading={confirmPayment.isPending}
        />
      </ScreenFooter>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
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
    color: colors.textPrimary,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
