import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={[
      styles.card, 
      !isDashboard && shadows.card,
      isDashboard && { backgroundColor: tintLight, padding: 12 }
    ]}>
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
        isDashboard && styles.valueDashboard,
        valueColor && { color: valueColor }
      ]}>{value}</Text>
      {!isWide ? <Text style={[styles.label, isDashboard && styles.labelDashboard]}>{label}</Text> : null}
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
  valueDashboard: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  labelDashboard: {
    fontSize: 11,
    marginTop: 0,
  },
});
