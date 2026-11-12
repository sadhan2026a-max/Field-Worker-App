import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Borders, spacing, colors, useTheme } from '@/core/theme';

export function Card({ style, children, ...rest }: ViewProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, isDark), [colors, isDark]);
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const useStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: isDark ? '#333338' : '#E2E8F0',
  },
});
