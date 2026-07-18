import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, FontSize, FontFamily } from '@/core/theme';
import { AssignmentStatus } from '@/domain/entities/Assignment';

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: 'PENDING',
  accepted: 'ACCEPTED',
  en_route: 'EN ROUTE',
  arrived: 'ARRIVED',
  in_progress: 'IN PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

const STATUS_KEY: Record<AssignmentStatus, keyof typeof colors.status> = {
  pending: 'pending',
  accepted: 'accepted',
  en_route: 'enRoute',
  arrived: 'arrived',
  in_progress: 'inProgress',
  completed: 'completed',
  cancelled: 'cancelled',
};

export function StatusBadge({ status, style }: { status: AssignmentStatus; style?: ViewStyle }) {
  const tone = colors.status[STATUS_KEY[status]];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.label, { color: tone.text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.extraSmall,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
});
