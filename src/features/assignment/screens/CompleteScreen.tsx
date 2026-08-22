import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View, Pressable, BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment } from '@/hooks/useAssignments';

export function CompleteScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const completedOn = assignment.completedAt
    ? new Date(assignment.completedAt).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const getTypeTitle = () => {
    switch (assignment.type) {
      case 'delivery': return 'Delivery';
      case 'pickup': return 'Pickup';
      case 'return': return 'Return';
      case 'inspection': return 'Inspection';
      case 'installation': return 'Installation';
      case 'sales_visit': return 'Sales Visit';
      case 'service_visit': return 'Service Visit';
      default: return 'Job';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true, 
          title: assignment.code,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.replace('/(tabs)')}
              style={{ padding: 8, marginLeft: -8, marginRight: 16 }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
          )
        }} 
      />

      <View style={styles.checkCircle}>
        <MaterialIcons name="check" size={48} color={colors.textInverse} />
      </View>
      <Text style={styles.title}>{getTypeTitle()} Completed Successfully</Text>

      {(['delivery', 'pickup', 'return'].includes(assignment.type) || (assignment.codAmount ?? 0) > 0) && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>COD Collected</Text>
          <Text style={styles.summaryValue}>₹{((assignment.receivedAmount ?? assignment.codAmount) ?? 0).toLocaleString()}</Text>
        </View>
      )}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{getTypeTitle() === 'Job' ? 'Completed On' : `${getTypeTitle()} On`}</Text>
        <Text style={styles.summaryValue}>{completedOn}</Text>
      </View>

      <Button label="Back to Workspace" onPress={() => router.replace('/(tabs)')} style={styles.button} />
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  summary: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  button: {
    marginTop: spacing.xl,
    width: '100%',
  },
});
