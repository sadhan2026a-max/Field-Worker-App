import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, spacing, shadows, FontFamily, palette } from '@/core/theme';
import { Assignment } from '@/domain/entities/Assignment';
import { DistanceDisplay } from '@/features/assignment/components';
import { useCurrentLocation } from '@/shared/utils/location';

interface NextDeliveryCardProps {
  assignment: Assignment;
  onStart: () => void;
}

export function NextDeliveryCard({ assignment, onStart }: NextDeliveryCardProps) {
  const currentLocation = useCurrentLocation();

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.content}>
        <View style={styles.row}>
          <Avatar name={assignment.customer.name} size={48} />
          <View style={styles.meta}>
            <Text style={styles.name}>{assignment.customer.name}</Text>
            <DistanceDisplay
              style={styles.distance}
              currentLocation={currentLocation}
              targetLocation={assignment.customer.location}
              targetAddress={assignment.customer.address}
              backendDistanceKm={assignment.distanceKm}
            />
            <Text style={styles.code}>Order #{assignment.code}</Text>
          </View>
          <Button label="Navigate" onPress={onStart} style={styles.button} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  distance: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  code: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 40,
  },
});
