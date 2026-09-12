import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { spacing, FontFamily, useTheme } from '@/core/theme';

interface StatCardProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  tint?: string;
  tintLight?: string;
  /** 'compact' stacks icon/value/label for a 3-up row; 'wide' puts icon+label in a header row above the value; 'dashboard' renders high-visibility modern card. */
  variant?: 'compact' | 'wide' | 'dashboard';
  valueColor?: string;
  trend?: string;
  onPress?: () => void;
}

export function StatCard({ icon, value, label, tint = '#16A34A', tintLight = '#E7F7ED', variant = 'compact', valueColor, trend, onPress }: StatCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, tint, tintLight), [colors, tint, tintLight]);
  const isWide = variant === 'wide';
  const isDashboard = variant === 'dashboard';

  if (isDashboard) {
    const cardContent = (
      <View style={styles.dashboardContent}>
        <View style={styles.dashboardHeader}>
          {icon && (
            <View style={[styles.dashboardIconChip, { backgroundColor: tint + '15' }]}>
              <MaterialIcons name={icon} size={14} color={tint} />
            </View>
          )}
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: tint + '15' }]}>
              <Text style={[styles.trendText, { color: tint }]}>{trend}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.dashboardValue, { color: colors.textPrimary }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={[styles.dashboardLabel, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );

    if (onPress) {
      return (
        <View style={styles.wrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.dashboardCard,
              {
                backgroundColor: pressed ? (tint + '14') : colors.surface,
                borderColor: pressed ? (tint + '40') : colors.border,
                opacity: Platform.OS === 'ios' && pressed ? 0.88 : 1,
              },
            ]}
            android_ripple={{ color: tint + '20', borderless: false }}
            onPress={onPress}
          >
            {cardContent}
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.wrapper}>
        <View style={[styles.dashboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {cardContent}
        </View>
      </View>
    );
  }

  const cardInner = (
    <>
      {isWide ? (
        <View style={styles.headerWide}>
          {icon && (
            <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
              <MaterialIcons name={icon} size={18} color={tint} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : (
        icon ? (
          <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
            <MaterialIcons name={icon} size={18} color={tint} />
          </View>
        ) : null
      )}
      <Text style={[
        styles.value,
        isWide && styles.valueWide,
        valueColor && { color: valueColor }
      ]}>{value}</Text>
      {!isWide ? <Text style={styles.label}>{label}</Text> : null}
    </>
  );

  if (onPress) {
    return (
      <View style={styles.wrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            {
              backgroundColor: pressed ? (tint + '14') : colors.surface,
              borderColor: pressed ? (tint + '40') : colors.border,
              opacity: Platform.OS === 'ios' && pressed ? 0.88 : 1,
            },
          ]}
          android_ripple={{ color: tint + '20', borderless: false }}
          onPress={onPress}
        >
          {cardInner}
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {cardInner}
    </View>
  );
}

const useStyles = (colors: any, tint: string, tintLight: string) => StyleSheet.create({
  wrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    overflow: 'hidden',
  },
  dashboardCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topAccentBar: {
    height: 3.5,
    width: '100%',
    opacity: 0.85,
  },
  dashboardContent: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  dashboardIconChip: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  dashboardValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.2,
    marginBottom: 0,
  },
  dashboardLabel: {
    fontSize: 9,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.1,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  valueWide: {
    fontSize: 18,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

