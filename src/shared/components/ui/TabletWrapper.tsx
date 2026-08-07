import React, { ReactNode } from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { useTheme, colors } from '@/core/theme';

interface TabletWrapperProps {
  children: ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Wraps content in a centered column for tablets.
 * If the screen width is >= 768px, it constrains the content width to `maxWidth`.
 * Otherwise, it renders as a standard full-width container (`flex: 1`).
 */
export function TabletWrapper({
  children,
  maxWidth = 600,
  backgroundColor = colors.background,
  style,
}: TabletWrapperProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  if (isTablet) {
    return (
      <View style={[styles.tabletBackground, style]}>
        <View style={[styles.centeredContainer, { maxWidth, backgroundColor }]}>
          {children}
        </View>
      </View>
    );
  }

  // On phones, render normally (full width)
  return <View style={[styles.mobileContainer, { backgroundColor }, style]}>{children}</View>;
}

const useStyles = (colors: any) => StyleSheet.create({
  tabletBackground: {
    flex: 1,
    backgroundColor: '#E5E7EB', // Tailwind gray-200 for the gutters
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10, // Shadow for Android tablets
  },
  mobileContainer: {
    flex: 1,
  },
});
