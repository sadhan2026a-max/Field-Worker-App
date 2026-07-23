import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing } from '@/core/theme';

interface AvatarProps {
  /** The full name — first character is used as the initial. */
  name: string;
  /** Diameter of the circle in dp. Default 44. */
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ name, size = 44, style }: AvatarProps) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const fontSize = Math.round(size * 0.4);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primary,
    fontWeight: '700',
    lineHeight: undefined, // let the system calculate
  },
});
