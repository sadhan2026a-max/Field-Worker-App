import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Pressable, Image } from 'react-native';
import { FontFamily, useTheme } from '@/core/theme';
import { safeRouter } from '@/shared/utils/navigation';

const WALLET_IMG = require('../../../../assets/wallete.png');
const CASH_IMG = require('../../../../assets/image.png');

interface ShiftOverviewCardProps {
  totalEarnings: number;
  codCollection: number;
  pendingCount: number;
  completedCount: number;
}

export function ShiftOverviewCard({
  totalEarnings,
  codCollection,
  pendingCount,
  completedCount,
}: ShiftOverviewCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);

  return (
    <View style={styles.cardContainer}>
      {/* ─── 1. Header Bar: Title & Direct Interactive Wallet Pill ─── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.headerIconChip, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="trending-up" size={13} color={colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Today Overview</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.walletPill, pressed && styles.pillPressed]}
          onPress={() => safeRouter.push('/wallet')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.walletPillText}>Wallet & Payout</Text>
          <MaterialIcons name="arrow-forward" size={11} color={colors.primary} />
        </Pressable>
      </View>

      {/* ─── 2. Dual Financial Bento Pods (Compact & Restructured) ─── */}
      <View style={styles.bentoRow}>
        {/* Earnings Pod */}
        <Pressable
          style={({ pressed }) => [
            styles.bentoPod,
            styles.earningsPod,
            pressed && styles.podPressed,
          ]}
          onPress={() => safeRouter.push('/wallet')}
        >
          <View style={styles.podHeader}>
            <Text style={styles.podLabel} numberOfLines={1}>Today's Earnings</Text>
            <Image source={WALLET_IMG} style={styles.podIllustration} resizeMode="contain" />
          </View>

          <View style={styles.podValueRow}>
            <Text style={styles.podAmount} numberOfLines={1}>
              ₹{totalEarnings.toLocaleString('en-IN')}
            </Text>
            <MaterialIcons name="chevron-right" size={13} color={colors.primary} style={{ opacity: 0.65 }} />
          </View>
        </Pressable>

        {/* COD In Hand Pod */}
        <Pressable
          style={({ pressed }) => [
            styles.bentoPod,
            styles.codPod,
            pressed && styles.podPressed,
          ]}
          onPress={() => safeRouter.push('/wallet?tab=cash')}
        >
          <View style={styles.podHeader}>
            <Text style={styles.podLabel} numberOfLines={1}>COD In Hand</Text>
            <Image source={CASH_IMG} style={styles.podIllustration} resizeMode="contain" />
          </View>

          <View style={styles.podValueRow}>
            <Text style={[styles.podAmount, { color: '#0369A1' }]} numberOfLines={1}>
              ₹{codCollection.toLocaleString('en-IN')}
            </Text>
            <MaterialIcons name="chevron-right" size={13} color="#0284C7" style={{ opacity: 0.65 }} />
          </View>
        </Pressable>
      </View>

      {/* ─── 3. Interactive Operational Task Counters (Pending & Completed) ─── */}
      <View style={styles.tasksRow}>
        {/* Pending Task Tile (Warm Amber Theme) */}
        <Pressable
          style={({ pressed }) => [
            styles.taskTile,
            styles.pendingTile,
            pressed && styles.tilePressed,
          ]}
          onPress={() => safeRouter.push('/(tabs)/assignments?tab=pending')}
        >
          <View style={styles.taskTileLeft}>
            <View style={[styles.taskIconChip, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="pending-actions" size={13} color="#D97706" />
            </View>
            <View style={styles.taskTextGroup}>
              <Text style={styles.taskCountTextPending}>{pendingCount}</Text>
              <Text style={styles.taskLabelTextPending}>Pending</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={14} color="#D97706" />
        </Pressable>

        {/* Completed Task Tile (Fresh Emerald Theme) */}
        <Pressable
          style={({ pressed }) => [
            styles.taskTile,
            styles.completedTile,
            pressed && styles.tilePressed,
          ]}
          onPress={() => safeRouter.push('/(tabs)/assignments?tab=completed')}
        >
          <View style={styles.taskTileLeft}>
            <View style={[styles.taskIconChip, { backgroundColor: '#DCFCE7' }]}>
              <MaterialIcons name="check-circle" size={13} color="#16A34A" />
            </View>
            <View style={styles.taskTextGroup}>
              <Text style={styles.taskCountTextCompleted}>{completedCount}</Text>
              <Text style={styles.taskLabelTextCompleted}>Completed</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={14} color="#16A34A" />
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillPressed: {
    opacity: 0.75,
  },
  walletPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bentoPod: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 52,
  },
  podPressed: {
    opacity: 0.8,
  },
  earningsPod: {
    backgroundColor: colors.primary + '08',
    borderColor: colors.primary + '22',
  },
  codPod: {
    backgroundColor: '#0284C708',
    borderColor: '#0284C722',
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 4,
  },
  podIconChip: {
    width: 19,
    height: 19,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podIllustration: {
    width: 26,
    height: 26,
  },
  podLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.semiBold,
    color: colors.textSecondary,
    flex: 1,
    letterSpacing: -0.1,
  },
  podValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  podAmount: {
    fontSize: 16.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  tasksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  taskTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  tilePressed: {
    opacity: 0.8,
  },
  pendingTile: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  completedTile: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  taskTileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  taskIconChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCountTextPending: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#B45309',
  },
  taskLabelTextPending: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },
  taskCountTextCompleted: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
  taskLabelTextCompleted: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#166534',
  },
});
