import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { spacing, typography, Borders, useTheme } from '@/core/theme';

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  tint?: string;
  tintLight?: string;
  style?: ViewStyle | ViewStyle[];
}

/** Centered icon + title + description, used wherever a list or card has nothing to show. */
export function EmptyState({
  icon,
  title,
  description,
  tint,
  tintLight,
  style,
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  
  const actualTint = tint || colors.primary;
  const defaultTintLight = colors.primary + '20';
  const actualTintLight = tintLight || defaultTintLight;
  

  const styles = React.useMemo(() => useStyles(colors, isDark), [colors, isDark]);
  
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconBg, { backgroundColor: actualTintLight }]}>
        <MaterialIcons name={icon} size={32} color={actualTint} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const useStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
    borderRadius: Borders.radius2,
    borderWidth: 1,
    borderColor: isDark ? '#333338' : '#E2E8F0',
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
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: isDark ? '#94A3B8' : colors.textSecondary,
    textAlign: 'center',
  },
});
