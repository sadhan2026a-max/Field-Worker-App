import React from 'react';
import { Pressable, TouchableOpacity, StyleSheet, Text, View, Platform, ActivityIndicator, Image } from 'react-native';
import { colors, spacing, FontFamily, palette } from '@/core/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/core/theme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TenantInfo } from '@/features/auth/api/authService';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
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
  const { colors: themeColors } = useTheme();
  const styles = React.useMemo(() => useStyles(themeColors), [themeColors]);

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={isAvailable ? (themeColors.headerGradient as [string, string, ...string[]] || [themeColors.primaryDark, themeColors.primary]) : ['#1E293B', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorGlow} />

        <View style={styles.topRow}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarGlowRing, isAvailable ? styles.avatarGlowOnline : styles.avatarGlowOffline]}>
              {tenant?.logoUrl ? (
                <Image source={{ uri: tenant.logoUrl }} style={styles.tenantLogo} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(tenant?.name || driverName)}</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusDot, !isAvailable && styles.statusDotOffline]} />
          </View>

          <View style={styles.greetingGroup}>
            <View style={styles.subTitleRow}>
              <Text style={styles.greeting} numberOfLines={1}>
                {tenant?.name || getTimeGreeting()}
              </Text>
            </View>

            <Text style={styles.name} numberOfLines={1}>{driverName}</Text>
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.customSwitchContainer} onPress={onToggleAvailability} activeOpacity={0.8}>
              <View style={[styles.switchTrack, isAvailable ? styles.switchTrackOnline : styles.switchTrackOffline]}>
                <View style={[styles.switchThumb, isAvailable ? styles.switchThumbOnline : styles.switchThumbOffline]}>
                  {isTogglingAvailability ? (
                    <ActivityIndicator size="small" color={isAvailable ? themeColors.primary : '#FFFFFF'} style={{ transform: [{ scale: 0.65 }] }} />
                  ) : (
                    <MaterialIcons name={isAvailable ? 'power-settings-new' : 'pause'} size={12} color={isAvailable ? themeColors.primary : '#64748B'} />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            <Pressable
              style={styles.iconButton}
              onPress={() => router.push('/notifications')}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <MaterialIcons name="notifications-none" size={22} color="#FFFFFF" />
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
      </LinearGradient>
    </View>
  );
}

const useStyles = (themeColors: any) => StyleSheet.create({
  headerWrapper: {
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 16,
  },
  banner: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
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
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decorGlow: {
    position: 'absolute',
    top: 0,
    left: '30%',
    width: 100,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarGlowRing: {
    padding: 2.5,
    borderRadius: 26,
  },
  avatarGlowOnline: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarGlowOffline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tenantLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: themeColors.primaryDark,
  },
  statusDotOffline: {
    backgroundColor: '#9CA3AF',
    borderColor: '#334155',
  },
  greetingGroup: {
    flex: 1,
    marginRight: 8,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.82)',
  },
  name: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customSwitchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOnline: {
    backgroundColor: '#FFFFFF',
  },
  switchTrackOffline: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchThumbOnline: {
    transform: [{ translateX: 22 }],
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 3 },
    }),
  },
  switchThumbOffline: {
    transform: [{ translateX: 2 }],
    backgroundColor: '#E2E8F0',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: themeColors.primaryDark,
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.bold,
    lineHeight: 11,
  },
});
