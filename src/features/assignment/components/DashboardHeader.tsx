import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, FontFamily, palette } from '@/core/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { router } from 'expo-router';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

interface DashboardHeaderProps {
  name: string;
  isAvailable: boolean;
  onToggleAvailability: () => void;
}

export function DashboardHeader({ name, isAvailable, onToggleAvailability }: DashboardHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textGroup}>
        <Text style={styles.greeting}>{getTimeGreeting()}</Text>
        <Text style={styles.name}>{name} 👋</Text>
      </View>
      
      <View style={styles.rightActions}>
        <Pressable
          style={[styles.badge, !isAvailable && styles.badgeOffline]}
          onPress={onToggleAvailability}
        >
          <Text style={[styles.badgeText, !isAvailable && styles.badgeTextOffline]}>
            {isAvailable ? 'Available' : 'Offline'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  textGroup: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: palette.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeCount: {
    color: palette.white,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    lineHeight: 12,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeOffline: {
    backgroundColor: palette.grey200,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  badgeTextOffline: {
    color: palette.grey700,
  },
});
