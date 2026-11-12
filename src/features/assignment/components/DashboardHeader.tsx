import React from 'react';
import {
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, FontFamily } from '@/core/theme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TenantInfo } from '@/features/auth/api/authService';
import { getOverviewTheme, OverviewThemePalette } from './overviewTheme';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
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
  children?: React.ReactNode;
}

export function DashboardHeader({
  driverName,
  isAvailable,
  isTogglingAvailability,
  tenant,
  unreadCount,
  onToggleAvailability,
  children,
}: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, theme, isDark } = useTheme();
  const palette = React.useMemo(
    () => getOverviewTheme(theme, isDark, isAvailable),
    [theme, isDark, isAvailable]
  );
  const styles = React.useMemo(
    () => useStyles(themeColors, palette, isAvailable, isDark),
    [themeColors, palette, isAvailable, isDark]
  );

  return (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={palette.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + 6 }]}
      >
        {/* Subtle Ambient Decorative Circles */}
        <View style={styles.decorLight} />
        <View style={styles.decorRing} />

        {/* ── Single Main Header Row: Avatar + Name (Left) | Online/Offline Pill + Notification (Right) ── */}
        <View style={styles.topRow}>
          {/* Left: Driver Profile & Avatar */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              {tenant?.logoUrl ? (
                <Image source={{ uri: tenant.logoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{getInitials(tenant?.name || driverName)}</Text>
                </View>
              )}
              <View style={[styles.statusDot, !isAvailable && styles.statusDotOffline]} />
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.companyName} numberOfLines={1}>
                {tenant?.name || 'Demo Logistics'}
              </Text>
              <Text style={styles.driverName} numberOfLines={1}>
                {driverName}
              </Text>
            </View>
          </View>

          {/* Right Controls: Online/Offline Pill + Notification Bell */}
          <View style={styles.rightControls}>
            {/* Duty Toggle Pill */}
            <TouchableOpacity
              style={[styles.dutyPill, isAvailable ? styles.dutyPillOnline : styles.dutyPillOffline]}
              onPress={onToggleAvailability}
              activeOpacity={0.8}
              disabled={isTogglingAvailability}
            >
              {isTogglingAvailability ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ transform: [{ scale: 0.65 }], marginHorizontal: 4 }}
                />
              ) : (
                <View style={styles.dutyPillContent}>
                  <View style={[styles.dutyDot, isAvailable ? styles.dutyDotOnline : styles.dutyDotOffline]} />
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
              android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            >
              <MaterialIcons
                name="notifications-none"
                size={20}
                color={palette.headerNotifIcon}
              />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Bottom Decorative City & Park Silhouette (Theme-Aware) ── */}
        <View style={styles.skylineSection} pointerEvents="none">
          {/* Background Buildings */}
          <View style={styles.skylineRowBack}>
            <View style={[styles.buildingBack, { height: 16, width: 10, left: '6%' }]} />
            <View style={[styles.buildingBack, { height: 24, width: 12, left: '16%' }]} />
            <View style={[styles.buildingBack, { height: 28, width: 14, left: '26%' }]} />
            <View style={[styles.buildingBack, { height: 20, width: 10, left: '38%' }]} />
            <View style={[styles.buildingBack, { height: 32, width: 13, left: '50%' }]} />
            <View style={[styles.buildingBack, { height: 22, width: 11, left: '62%' }]} />
            <View style={[styles.spireTower, { height: 34, width: 8, left: '72%' }]} />
            <View style={[styles.buildingBack, { height: 26, width: 12, left: '82%' }]} />
            <View style={[styles.buildingBack, { height: 18, width: 10, left: '92%' }]} />
          </View>

          {/* Midground Skyline & Landmark Tower */}
          <View style={styles.skylineRowMid}>
            <View style={[styles.buildingMid, { height: 14, width: 12, left: '2%' }]} />
            <View style={[styles.treeCircle, { width: 12, height: 12, left: '12%', bottom: 2 }]} />
            <View style={[styles.buildingMid, { height: 20, width: 14, left: '22%' }]} />
            <View style={[styles.treeCircle, { width: 14, height: 14, left: '32%', bottom: 2 }]} />
            <View style={[styles.buildingMid, { height: 24, width: 15, left: '44%' }]} />
            <View style={[styles.treeCircle, { width: 11, height: 11, left: '56%', bottom: 2 }]} />
            <View style={[styles.buildingMid, { height: 28, width: 16, left: '68%', borderRadius: 3 }]} />
            <View style={[styles.treeCircle, { width: 16, height: 16, left: '78%', bottom: 2 }]} />
            <View style={[styles.buildingMid, { height: 16, width: 12, left: '88%' }]} />
          </View>

          {/* Smooth Soft Foreground Wave/Hill */}
          <View style={styles.groundWave} />
        </View>

        {children}
      </LinearGradient>
    </View>
  );
}

const useStyles = (themeColors: any, palette: OverviewThemePalette, isAvailable: boolean, isDark: boolean) =>
  StyleSheet.create({
    headerWrapper: {
      marginHorizontal: -12,
      marginTop: -12,
      marginBottom: 10,
    },
    banner: {
      paddingHorizontal: 14,
      paddingBottom: 2,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: isAvailable ? palette.headerPrimary : '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isAvailable ? 0.08 : 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: isAvailable ? 2 : 5,
        },
      }),
    },
    decorLight: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: palette.headerDecorLight,
    },
    decorRing: {
      position: 'absolute',
      top: 30,
      left: -20,
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: palette.headerDecorRing,
    },

    /* Top Row */
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      paddingTop: 2,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    avatarWrapper: {
      position: 'relative',
      marginRight: 9,
    },
    avatarFallback: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isAvailable ? palette.headerPrimary : '#475569',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? '#27272A' : '#FFFFFF',
    },
    avatarImage: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? '#27272A' : '#FFFFFF',
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
      borderColor: isDark ? '#1E1E24' : '#FFFFFF',
    },
    statusDotOffline: {
      backgroundColor: '#94A3B8',
    },
    nameBlock: {
      flex: 1,
    },
    companyName: {
      fontSize: 11,
      fontFamily: FontFamily.medium,
      color: palette.headerCompanyName,
      marginBottom: 1,
    },
    driverName: {
      fontSize: 15,
      fontFamily: FontFamily.bold,
      color: palette.headerDriverName,
      letterSpacing: -0.2,
    },

    /* Right Controls Group (Duty Pill + Notif Bell side-by-side) */
    rightControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    dutyPill: {
      height: 29,
      paddingHorizontal: 10,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dutyPillOnline: {
      backgroundColor: palette.headerPrimary,
      ...Platform.select({
        ios: {
          shadowColor: palette.headerPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
        },
        android: {
          elevation: 2.5,
        },
      }),
    },
    dutyPillOffline: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
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
      backgroundColor: '#FFFFFF',
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
      color: '#FFFFFF',
    },
    dutyPillTextOffline: {
      color: 'rgba(255, 255, 255, 0.9)',
    },

    notifButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.headerNotifBg,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderWidth: 1,
      borderColor: palette.headerNotifBorder,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    notifBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: '#EF4444',
      borderRadius: 8,
      minWidth: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: isDark ? '#27272A' : '#FFFFFF',
      paddingHorizontal: 2.5,
    },
    notifBadgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontFamily: FontFamily.bold,
      lineHeight: 10,
    },

    /* Skyline Section */
    skylineSection: {
      height: 30,
      width: '100%',
      position: 'relative',
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginTop: 2,
    },
    skylineRowBack: {
      position: 'absolute',
      bottom: 5,
      left: 0,
      right: 0,
      height: 30,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    buildingBack: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: palette.headerSkylineBack,
      borderTopLeftRadius: 2,
      borderTopRightRadius: 2,
    },
    spireTower: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: palette.headerSkylineSpire,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    skylineRowMid: {
      position: 'absolute',
      bottom: 4,
      left: 0,
      right: 0,
      height: 26,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    buildingMid: {
      position: 'absolute',
      bottom: 0,
      backgroundColor: palette.headerSkylineMid,
      borderTopLeftRadius: 2.5,
      borderTopRightRadius: 2.5,
    },
    treeCircle: {
      position: 'absolute',
      backgroundColor: palette.headerSkylineTree,
      borderRadius: 10,
    },
    groundWave: {
      height: 6,
      width: '100%',
      backgroundColor: palette.headerSkylineWave,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      opacity: isAvailable ? 0.85 : 0.4,
    },
  });
