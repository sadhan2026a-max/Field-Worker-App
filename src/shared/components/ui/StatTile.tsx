import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { spacing, typography, FontSize, colors, useTheme } from '@/core/theme';

interface StatTileProps {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function StatTile({ value, label, color, icon, style }: StatTileProps) {
  const { colors: themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => useStyles(themeColors), [themeColors]);
  
  const actualColor = color || themeColors.primary;
  const bgOpacity = isDark ? '15' : '10';
  const backgroundColor = actualColor + bgOpacity;

  return (
    <View style={[styles.tile, { backgroundColor, borderColor: actualColor + '20' }, style]}>
      <View style={styles.valueRow}>
        {icon}
        <Text style={[styles.value, { color: actualColor }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  value: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
