import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors, spacing, shadows, FontFamily, palette } from '@/core/theme';
import { Assignment } from '@/domain/entities/Assignment';
import { DistanceDisplay } from '@/features/assignment/components';
import { useCurrentLocation } from '@/shared/utils/location';

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    en_route: 'En Route',
    arrived: 'Arrived',
    in_progress: 'In Progress',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): { text: string; bg: string } {
  const statusColors: Record<string, { text: string; bg: string }> = {
    pending: { text: palette.orange, bg: palette.orangeLight },
    accepted: { text: palette.purple, bg: palette.purpleLight },
    en_route: { text: palette.blue, bg: palette.blueLight },
    arrived: { text: palette.grey700, bg: palette.grey100 },
    in_progress: { text: palette.blue, bg: palette.blueLight },
  };
  return statusColors[status] || { text: palette.grey700, bg: palette.grey100 };
}

interface NextDeliveryCardProps {
  assignment: Assignment;
  onStart: () => void;
}

export function NextDeliveryCard({ assignment, onStart }: NextDeliveryCardProps) {
  const currentLocation = useCurrentLocation();
  const statusColor = getStatusColor(assignment.status);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.text }]} />
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(assignment.status)}
            </Text>
          </View>
          <Text style={styles.orderCode}>#{assignment.code}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.row}>
          <Avatar name={assignment.customer.name} size={44} />
          <View style={styles.meta}>
            <Text style={styles.name}>{assignment.customer.name}</Text>
            <DistanceDisplay
              style={styles.distance}
              currentLocation={currentLocation}
              targetLocation={assignment.customer.location}
              targetAddress={assignment.customer.address}
              backendDistanceKm={assignment.distanceKm}
            />
          </View>
        </View>

        {/* Action Button */}
        <Button
          label="Navigate"
          onPress={onStart}
          style={styles.button}
          textStyle={styles.buttonText}
        />
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
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    padding: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  orderCode: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  distance: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: colors.textSecondary,
    marginTop: 3,
  },
  button: {
    borderRadius: 12,
    height: 38,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
});
