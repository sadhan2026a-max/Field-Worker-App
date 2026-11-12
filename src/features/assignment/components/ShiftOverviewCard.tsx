import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, useTheme } from '@/core/theme';
import { safeRouter } from '@/shared/utils/navigation';
import { getOverviewTheme, OverviewThemePalette } from './overviewTheme';

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
  const { colors, theme, isDark } = useTheme();
  const palette = React.useMemo(() => getOverviewTheme(theme, isDark), [theme, isDark]);
  const styles = React.useMemo(() => useStyles(colors, palette), [colors, palette]);

  return (
    <View style={styles.container}>
      {/* ── 1. Header Row: [✓] Today Overview  |  View All > ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.titleIconChip}>
            <MaterialIcons name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.titleText}>Today Overview</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.viewAllPill, pressed && styles.viewAllPressed]}
          onPress={() => safeRouter.push('/wallet')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="chevron-right" size={14} color={palette.viewAllText} />
        </Pressable>
      </View>

      {/* ── 2. Dual Financial Cards (Theme-Aware Gradients & Proportions) ── */}
      <View style={styles.podsRow}>
        {/* Left: Today's Earnings */}
        <Pressable
          style={({ pressed }) => [styles.podWrapper, pressed && styles.podPressed]}
          onPress={() => safeRouter.push('/wallet')}
        >
          <LinearGradient
            colors={palette.earningsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.podContent, styles.earningsBorder]}
          >
            <Text style={styles.podLabel} numberOfLines={1}>Today's Earnings</Text>
            <View style={styles.podDivider} />

            <View style={styles.podBottomRow}>
              <Text style={styles.podAmount} numberOfLines={1}>
                ₹{totalEarnings.toLocaleString('en-IN')}
              </Text>
              <Image source={CASH_IMG} style={styles.podIcon} resizeMode="contain" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Right: COD in Hand */}
        <Pressable
          style={({ pressed }) => [styles.podWrapper, pressed && styles.podPressed]}
          onPress={() => safeRouter.push('/wallet?tab=cash')}
        >
          <LinearGradient
            colors={palette.codGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.podContent, styles.codBorder]}
          >
            <Text style={styles.podLabel} numberOfLines={1}>COD in Hand</Text>
            <View style={styles.podDivider} />

            <View style={styles.podBottomRow}>
              <Text style={styles.podAmount} numberOfLines={1}>
                ₹{codCollection.toLocaleString('en-IN')}
              </Text>
              <Image source={WALLET_IMG} style={styles.podIcon} resizeMode="contain" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ── 3. Bottom Operational Status Pills (Theme-Aware Pastel Pills) ── */}
      <View style={styles.tasksRow}>
        {/* Pending Pill */}
        <Pressable
          style={({ pressed }) => [styles.taskPill, styles.pendingPill, pressed && styles.pillPressed]}
          onPress={() => safeRouter.push('/(tabs)/assignments?tab=pending')}
        >
          <View style={styles.pendingBadge}>
            <MaterialIcons name="schedule" size={13} color={palette.pendingIcon} />
          </View>
          <Text style={styles.pendingText}>
            <Text style={styles.countBold}>{pendingCount}</Text> Pending
          </Text>
        </Pressable>

        {/* Completed Pill */}
        <Pressable
          style={({ pressed }) => [styles.taskPill, styles.completedPill, pressed && styles.pillPressed]}
          onPress={() => safeRouter.push('/(tabs)/assignments?tab=completed')}
        >
          <View style={styles.completedBadge}>
            <MaterialIcons name="check" size={12} color="#FFFFFF" />
          </View>
          <Text style={styles.completedText}>
            <Text style={styles.countBold}>{completedCount}</Text> Completed
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = (colors: any, palette: OverviewThemePalette) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },

    /* Header Row */
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    titleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    titleIconChip: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: palette.titleChipBg,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.titleChipBg,
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        },
        android: {
          elevation: 1.5,
        },
      }),
    },
    titleText: {
      fontSize: 14,
      fontFamily: FontFamily.bold,
      color: palette.titleText,
      letterSpacing: -0.2,
    },
    viewAllPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: palette.viewAllBg,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: palette.viewAllBorder,
    },
    viewAllPressed: {
      opacity: 0.75,
      backgroundColor: palette.viewAllBorder,
    },
    viewAllText: {
      fontSize: 11,
      fontFamily: FontFamily.bold,
      color: palette.viewAllText,
    },

    /* Pods Row */
    podsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    podWrapper: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    podPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    podContent: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 16,
      minHeight: 74,
      justifyContent: 'space-between',
    },
    earningsBorder: {
      borderWidth: 1,
      borderColor: palette.earningsBorder,
    },
    codBorder: {
      borderWidth: 1,
      borderColor: palette.codBorder,
    },
    podLabel: {
      fontSize: 11,
      fontFamily: FontFamily.bold,
      color: palette.earningsLabel,
      letterSpacing: -0.1,
    },
    podDivider: {
      height: 1,
      backgroundColor: palette.podDivider,
      marginTop: 4,
      marginBottom: 6,
      width: '100%',
    },
    podBottomRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    podAmount: {
      fontSize: 19,
      fontFamily: FontFamily.bold,
      color: palette.earningsAmount,
      letterSpacing: -0.4,
    },
    podIcon: {
      width: 34,
      height: 34,
    },

    /* Task Pills */
    tasksRow: {
      flexDirection: 'row',
      gap: 10,
    },
    taskPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 22,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderWidth: 1,
      gap: 7,
    },
    pillPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.985 }],
    },
    pendingPill: {
      backgroundColor: palette.pendingBg,
      borderColor: palette.pendingBorder,
    },
    completedPill: {
      backgroundColor: palette.completedBg,
      borderColor: palette.completedBorder,
    },
    pendingBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: palette.pendingBadge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completedBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: palette.completedBadge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBold: {
      fontFamily: FontFamily.bold,
      fontSize: 12.5,
    },
    pendingText: {
      fontSize: 12,
      fontFamily: FontFamily.medium,
      color: palette.pendingText,
    },
    completedText: {
      fontSize: 12,
      fontFamily: FontFamily.medium,
      color: palette.completedText,
    },
  });
