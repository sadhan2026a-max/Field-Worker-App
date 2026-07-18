import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '@/core/theme';

interface ScreenLoaderProps {
  /** Color of the spinner. Defaults to brand primary. */
  color?: string;
}

/**
 * Full-screen centered loading spinner.
 * Used as the fallback while data is being fetched on any screen.
 */
export function ScreenLoader({ color = colors.primary }: ScreenLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={color} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
