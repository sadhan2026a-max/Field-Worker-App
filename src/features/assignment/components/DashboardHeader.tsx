import React from 'react';
import { Pressable, TouchableOpacity, StyleSheet, Text, View, Platform, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, FontFamily } from '@/core/theme';
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
    .filter(Boolean)
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

export function DashboardHeader({
  driverName,
  isAvailable,
  isTogglingAvailability,
  tenant,
  unreadCount,
  onToggleAvailability,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const styles = React.useMemo(() => useStyles(themeColors), [themeColors]);

  const gradientColors: [string, string, ...string[]] = isAvailable
    ? (themeColors.headerGradient as [string, string, ...string[]] || [themeColors.primaryDark || '#047857', themeColors.primary || '#10B981'])
    : ['#0F172A', '#1E293B', '#334155'];

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.9 }}
        style={[styles.banner, { paddingTop: insets.top + 6 }]}
      >
        {/* Subtle Ambient Decorative Glows */}
        <View style={styles.decorMeshLight} />
        <View style={styles.decorMeshRing} />

        <View style={styles.contentRow}>
          {/* Driver Avatar & Identity */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarGlow, isAvailable ? styles.avatarGlowOnline : styles.avatarGlowOffline]}>
                {tenant?.logoUrl ? (
                  <Image source={{ uri: tenant.logoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{getInitials(tenant?.name || driverName)}</Text>
                  </View>
                )}
              </View>
              {/* Online / Offline Status Dot */}
              <View style={[styles.statusDot, !isAvailable && styles.statusDotOffline]} />
            </View>

            <View style={styles.textDetails}>
              {tenant?.name ? (
                <View style={styles.tenantBadge}>
                  <MaterialIcons name="business" size={10} color="#FFFFFF" style={{ opacity: 0.85 }} />
                  <Text style={styles.tenantText} numberOfLines={1}>{tenant.name}</Text>
                </View>
              ) : (
                <Text style={styles.greetingText} numberOfLines={1}>
                  {getTimeGreeting()}
                </Text>
              )}
              <Text style={styles.driverNameText} numberOfLines={1}>
                {driverName}
              </Text>
            </View>
          </View>

          {/* Right Action Controls: Duty Status Pill + Notification Icon */}
          <View style={styles.actionsSection}>
            {/* Duty Toggle Pill (Online / Offline) */}
            <TouchableOpacity
              style={[
                styles.dutyPill,
                isAvailable ? styles.dutyPillOnline : styles.dutyPillOffline,
              ]}
              onPress={onToggleAvailability}
              activeOpacity={0.8}
              disabled={isTogglingAvailability}
            >
              {isTogglingAvailability ? (
                <ActivityIndicator
                  size="small"
                  color={isAvailable ? themeColors.primary : '#FFFFFF'}
                  style={{ transform: [{ scale: 0.65 }], marginHorizontal: 4 }}
                />
              ) : (
                <View style={styles.dutyPillContent}>
                  <View
                    style={[
                      styles.dutyDot,
                      isAvailable ? styles.dutyDotOnline : styles.dutyDotOffline,
                    ]}
                  />
                  <Text
                    style={[
                      styles.dutyPillText,
                      isAvailable ? styles.dutyPillTextOnline : styles.dutyPillTextOffline,
                    ]}
                  >
                    {isAvailable ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notification Bell Button */}
            <Pressable
              style={styles.notifButton}
              onPress={() => router.push('/notifications')}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <MaterialIcons name="notifications-none" size={20} color="#FFFFFF" />
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
    marginBottom: 12,
  },
  banner: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  decorMeshLight: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorMeshRing: {
    position: 'absolute',
    bottom: -35,
    left: '25%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 9,
  },
  avatarGlow: {
    padding: 2,
    borderRadius: 14,
  },
  avatarGlowOnline: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  avatarGlowOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statusDotOffline: {
    backgroundColor: '#94A3B8',
    borderColor: '#1E293B',
  },
  textDetails: {
    flex: 1,
  },
  tenantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 1,
  },
  tenantText: {
    fontSize: 10.5,
    fontFamily: FontFamily.semiBold,
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.2,
  },
  greetingText: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: 'rgba(255, 255, 255, 0.82)',
    marginBottom: 1,
  },
  driverNameText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dutyPill: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dutyPillOnline: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.15, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  dutyPillOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  dutyPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dutyDotOnline: {
    backgroundColor: '#10B981',
  },
  dutyDotOffline: {
    backgroundColor: '#94A3B8',
  },
  dutyPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.4,
  },
  dutyPillTextOnline: {
    color: themeColors.primaryDark || '#059669',
  },
  dutyPillTextOffline: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  notifButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: FontFamily.bold,
    lineHeight: 10,
  },
});
