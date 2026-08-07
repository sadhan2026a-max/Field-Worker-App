import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { palette, typography, spacing, FontFamily, colors, useTheme } from '@/core/theme';

import { LedgerEntryDto } from '../types/Wallet';

interface LedgerItemProps {
  item: LedgerEntryDto;
  type: 'cash' | 'payout';
}

export function LedgerItem({ item, type }: LedgerItemProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const isCash = type === 'cash';
  const iconName = isCash ? 'account-balance-wallet' : 'account-balance';
  const iconColor = isCash ? palette.orange : palette.green;
  const bgColor = isCash ? palette.orangeLight : palette.greenLight;

  // Format date: e.g., "Oct 12, 10:30 AM"
  const dateObj = new Date(item.recordedAt);
  const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <MaterialIcons name={iconName} size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {isCash ? 'Cash Settled' : 'Payout Received'}
          </Text>
          <Text style={[styles.amount, { color: iconColor }]}>
            ₹{item.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.dateContainer}>
            <MaterialIcons name="event" size={14} color={colors.textSecondary} />
            <Text style={styles.dateText}>{formattedDate}, {formattedTime}</Text>
          </View>

          <View style={styles.recordedByContainer}>
            <MaterialIcons name="person" size={14} color={colors.textSecondary} />
            <Text style={styles.recordedByText}>{item.recordedByName}</Text>
          </View>
        </View>

        {item.notes ? (
          <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
        ) : null}
      </View>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.semiBold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: FontFamily.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  recordedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordedByText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  notesText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  }
});
