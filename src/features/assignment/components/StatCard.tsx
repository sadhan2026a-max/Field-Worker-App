import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { colors, spacing, shadows, FontFamily } from '@/core/theme';

interface StatCardProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  tint?: string;
  tintLight?: string;
  /** 'compact' stacks icon/value/label for a 3-up row; 'wide' puts icon+label in a header row above the value. 'dashboard' removes shadow and uses tintLight as background. */
  variant?: 'compact' | 'wide' | 'dashboard';
  valueColor?: string;
}

export function StatCard({ icon, value, label, tint, tintLight, variant = 'compact', valueColor }: StatCardProps) {
  const isWide = variant === 'wide';
  const isDashboard = variant === 'dashboard';

  if (isDashboard) {
    return (
      <View style={[styles.dashboardCard, styles.cardShadow, tintLight ? { backgroundColor: tintLight } : undefined]}>
        <View style={styles.dashboardContent}>
          <View style={styles.dashboardTopRow}>
            {icon && (
              <View style={[styles.dashboardIconChip, { backgroundColor: '#FFFFFF' }]}>
                <MaterialIcons name={icon} size={16} color={tint} />
              </View>
            )}
            <Text style={[styles.dashboardValue, valueColor && { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          </View>
          <Text style={styles.dashboardLabel} numberOfLines={1}>{label}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, shadows.card]}>
      {isWide ? (
        <View style={styles.headerWide}>
          {icon && (
            <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
              <MaterialIcons name={icon} size={20} color={tint} />
            </View>
          )}
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : (
        icon ? (
          <View style={[styles.iconChip, { backgroundColor: tintLight }]}>
            <MaterialIcons name={icon} size={20} color={tint} />
          </View>
        ) : null
      )}
      <Text style={[
        styles.value,
        isWide && styles.valueWide,
        valueColor && { color: valueColor }
      ]}>{value}</Text>
      {!isWide ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-start',
  },
  dashboardCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dashboardContent: {
    padding: 12,
    alignItems: 'flex-start',
  },
  dashboardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dashboardIconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardValue: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#101828',
    flexShrink: 1,
  },
  dashboardLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#374151',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
