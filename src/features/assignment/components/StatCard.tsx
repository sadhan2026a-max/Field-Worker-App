import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { FontFamily, useTheme } from '@/core/theme';

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

export function StatCard({
  icon,
  value,
  label,
  tint = '#16A34A',
  tintLight = '#E7F7ED',
  variant = 'compact',
  valueColor,
  trend,
  onPress,
}: StatCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, tint, tintLight), [colors, tint, tintLight]);
  const isWide = variant === 'wide';
  const isDashboard = variant === 'dashboard';

  if (isDashboard) {
    const cardContent = (
      <View style={styles.dashboardContent}>
        <View style={styles.dashboardHeader}>
          {icon && (
            <View style={[styles.dashboardIconChip, { backgroundColor: tint + '14' }]}>
              <MaterialIcons name={icon} size={13} color={tint} />
            </View>
          )}
          {trend ? (
            <View style={[styles.trendBadge, { backgroundColor: tint + '12' }]}>
              <Text style={[styles.trendText, { color: tint }]}>{trend}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[
            styles.dashboardValue,
            { color: valueColor || colors.textPrimary },
          ]}
          numberOfLines={1}
        >
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
                backgroundColor: pressed ? (tint + '10') : colors.surface,
                borderColor: pressed ? (tint + '40') : colors.border,
                opacity: Platform.OS === 'ios' && pressed ? 0.88 : 1,
              },
            ]}
            android_ripple={{ color: tint + '15', borderless: false }}
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

  // Fallback for standard variant
  const cardInner = (
    <>
      {isWide ? (
        <View style={styles.headerWide}>
          {icon && (
            <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
              <MaterialIcons name={icon} size={16} color={tint} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : (
        icon ? (
          <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
            <MaterialIcons name={icon} size={16} color={tint} />
          </View>
        ) : null
      )}
      <Text
        style={[
          styles.value,
          isWide && styles.valueWide,
          valueColor && { color: valueColor },
        ]}
      >
        {value}
      </Text>
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
              backgroundColor: pressed ? (tint + '10') : colors.surface,
              borderColor: pressed ? (tint + '40') : colors.border,
              opacity: Platform.OS === 'ios' && pressed ? 0.88 : 1,
            },
          ]}
          android_ripple={{ color: tint + '15', borderless: false }}
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    overflow: 'hidden',
  },
  dashboardCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  dashboardContent: {
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 7,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  dashboardIconChip: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  trendText: {
    fontSize: 8.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.1,
  },
  dashboardValue: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  dashboardLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.1,
  },
  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  valueWide: {
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
