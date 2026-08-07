import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette, radius, typography, colors, useTheme } from '@/core/theme';

import { Coordinates } from '@/domain/entities/Assignment';

interface RouteMapPreviewProps {
  origin: Coordinates | null;
  destination: Coordinates;
  height?: number;
}

/**
 * react-native-maps has no web renderer, so this stands in for the live map on web.
 * It draws a stylised (not geographically accurate) origin → destination route so the
 * screen doesn't look broken while testing in a browser; native renders a real map.
 */
export function RouteMapPreview({ height = 260 }: RouteMapPreviewProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  return (
    <View style={[styles.placeholder, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 220" style={StyleSheet.absoluteFill}>
        <Path d="M40 180 Q 120 40, 280 40" stroke={colors.info} strokeWidth={4} strokeLinecap="round" strokeDasharray="2 14" fill="none" />
        <Circle cx={40} cy={180} r={9} fill={colors.info} />
        <Circle cx={40} cy={180} r={16} fill={colors.info} opacity={0.2} />
        <Circle cx={280} cy={40} r={9} fill={colors.danger} />
        <Circle cx={280} cy={40} r={16} fill={colors.danger} opacity={0.2} />
      </Svg>
      <Text style={styles.text}>Live map available in the mobile app</Text>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  placeholder: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
});
