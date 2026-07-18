import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, typography, Borders } from '@/core/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  tint?: string;
  tintLight?: string;
  style?: ViewStyle;
}

/** Centered icon + title + description, used wherever a list or card has nothing to show. */
export function EmptyState({
  icon,
  title,
  description,
  tint = colors.primary,
  tintLight = colors.primaryLight,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconBg, { backgroundColor: tintLight }]}>
        <MaterialIcons name={icon} size={32} color={tint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: Borders.radius2,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
