import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, FontFamily, palette } from '@/core/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TenantInfo } from '@/features/auth/api/authService';
import { Image } from 'react-native';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface DashboardHeaderProps {
  driverName: string;
  isAvailable: boolean;
  isTogglingAvailability?: boolean;
  tenant?: TenantInfo | null;
  unreadCount: number;
  onToggleAvailability: () => void;
}

export function DashboardHeader({ driverName, isAvailable, isTogglingAvailability, tenant, unreadCount, onToggleAvailability }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
        {/* Decorative circle */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.topRow}>
          <View style={styles.avatarContainer}>
            {tenant?.logoUrl ? (
              <Image source={{ uri: tenant.logoUrl }} style={styles.tenantLogo} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(tenant?.name || driverName)}</Text>
              </View>
            )}
            <View style={[styles.statusDot, !isAvailable && styles.statusDotOffline]} />
          </View>

          {/* Greeting */}
          <View style={styles.greetingGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -4 }}>
              <Text style={[styles.greeting, { marginBottom: 0, flexShrink: 1, marginRight: 8 }]} numberOfLines={1}>
                {tenant?.name || getTimeGreeting()}
              </Text>

              {/* Right Actions */}
              <View style={styles.rightActions}>
                <Pressable style={styles.customSwitchContainer} onPress={onToggleAvailability}>
                  <Text style={[styles.switchLabel, !isAvailable && styles.switchLabelOffline]}>
                    {isAvailable ? 'Online' : 'Offline'}
                  </Text>
                  <View style={[styles.switchTrack, isAvailable ? styles.switchTrackOnline : styles.switchTrackOffline]}>
                    <View style={[styles.switchThumb, isAvailable ? styles.switchThumbOnline : styles.switchThumbOffline, { justifyContent: 'center', alignItems: 'center' }]}>
                      {isTogglingAvailability && (
                        <ActivityIndicator size="small" color={isAvailable ? '#FFFFFF' : colors.primary} style={{ transform: [{ scale: 0.75 }] }} />
                      )}
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.iconButton}
                  onPress={() => router.push('/notifications')}
                >
                  <MaterialIcons name="notifications-none" size={24} color="#FFFFFF" />
                  {isAvailable && unreadCount > 0 && (
                    <View style={styles.notifBadge}>
                      <Text style={styles.notifBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={1}>{driverName}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 14,
  },
  banner: {
    backgroundColor: '#1FA855',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1FA855',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  tenantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF40',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2.5,
    borderColor: '#1FA855',
  },
  statusDotOffline: {
    backgroundColor: '#9CA3AF',
  },
  greetingGroup: {
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1FA855',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    lineHeight: 13,
  },
  customSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  switchLabelOffline: {
    color: 'rgba(255,255,255,0.7)',
  },
  switchTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOnline: {
    backgroundColor: '#FFFFFF',
  },
  switchTrackOffline: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbOnline: {
    backgroundColor: '#168A44',
    alignSelf: 'flex-end',
  },
  switchThumbOffline: {
    backgroundColor: '#D1D5DB',
    alignSelf: 'flex-start',
  },
});
