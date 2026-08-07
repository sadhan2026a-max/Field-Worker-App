import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { typography, colors, useTheme } from '@/core/theme';

export default function MapScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Live map coming soon</Text>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.h3,
    color: colors.textSecondary,
  },
});
