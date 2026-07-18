import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, FontSize } from '@/core/theme';

interface StatTileProps {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatTile({ value, label, color = colors.textPrimary, icon }: StatTileProps) {
  return (
    <View style={styles.tile}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconContainer: {
    marginBottom: 4,
    opacity: 0.85,
  },
  value: {
    ...typography.h2,
    fontSize: FontSize.large,
  },
  label: {
    ...typography.caption,
    textAlign: 'center',
  },
});
