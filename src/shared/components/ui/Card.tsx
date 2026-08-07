import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Borders, spacing, colors, useTheme } from '@/core/theme';

export function Card({ style, children, ...rest }: ViewProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: Borders.radius2,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
