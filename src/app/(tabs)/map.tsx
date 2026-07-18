import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/core/theme';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Live map coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.caption,
  },
});
