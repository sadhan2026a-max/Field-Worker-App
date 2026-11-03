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
      {/* ─── Card Header: Date & Status at the top ─── */}
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={13} color={colors.textSecondary} />
          <Text style={styles.dateText}>{formattedDate}, {formattedTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isCash ? '#FEF3C7' : '#DCFCE7' }]}>
          <Text style={[styles.statusText, { color: isCash ? '#D97706' : '#16A34A' }]}>
            {isCash ? 'Settled' : 'Payout'}
          </Text>
        </View>
      </View>

      {/* ─── Main Content Row ─── */}
      <View style={styles.mainRow}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <MaterialIcons name={iconName} size={22} color={iconColor} />
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

          <View style={styles.recordedByContainer}>
            <MaterialIcons name="person" size={13} color={colors.textSecondary} />
            <Text style={styles.recordedByText} numberOfLines={1} ellipsizeMode="tail">
              {item.recordedByName}
            </Text>
          </View>
        </View>
      </View>

      {item.notes ? (
        <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
      ) : null}
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
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
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...typography.caption,
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10.5,
    fontFamily: FontFamily.semiBold,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
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
  recordedByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flex: 1,
    minWidth: 0,
  },
  recordedByText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  notesText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  }
});
