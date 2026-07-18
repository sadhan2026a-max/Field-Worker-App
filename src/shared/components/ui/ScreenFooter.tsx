import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/core/theme';

interface ScreenFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Sticky bottom action bar used on detail/action screens.
 * Automatically adds bottom padding for notch devices and home indicators.
 */
export function ScreenFooter({ children, style }: ScreenFooterProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.footer, 
        { paddingBottom: Math.max(insets.bottom, spacing.lg) }, 
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
