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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 0,
    shadowColor: '#8a8a8a', // Lighter shadow color for a softer look on Android
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Higher elevation spreads the shadow out, making it smooth instead of a hard line
  },
});
