import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { FontFamily, useTheme } from '@/core/theme';

interface QuickActionButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
  badgeCount?: number;
}

export function QuickActionButton({
  icon,
  label,
  subtitle,
  tint,
  tintLight,
  onPress,
  badgeCount,
}: QuickActionButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(
    () => useStyles(colors, tint, tintLight, isDark),
    [colors, tint, tintLight, isDark]
  );

  return (
    <View style={styles.actionContainer}>
      <Pressable
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        android_ripple={{ color: tint + '15' }}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} color={tint} size={16} />
          {!!badgeCount && badgeCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeCount}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.labelGroup}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <MaterialIcons
          name="chevron-right"
          size={14}
          color={isDark ? '#94A3B8' : '#CBD5E1'}
        />
      </Pressable>
    </View>
  );
}

const useStyles = (colors: any, tint: string, tintLight: string, isDark: boolean) =>
  StyleSheet.create({
    actionContainer: {
      flexBasis: '48%',
      flexGrow: 1,
      borderRadius: 16,
      backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#333338' : '#E2E8F0',
      overflow: 'hidden',
    },
    action: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 10,
      alignItems: 'center',
      gap: 8,
      borderRadius: 16,
    },
    actionPressed: {
      opacity: 0.85,
      backgroundColor: tint + '08',
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: tint + (isDark ? '22' : '14'),
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    labelGroup: {
      flex: 1,
    },
    label: {
      fontSize: 12,
      fontFamily: FontFamily.bold,
      color: isDark ? '#FFFFFF' : '#0F172A',
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: 9.5,
      fontFamily: FontFamily.medium,
      color: isDark ? '#94A3B8' : '#64748B',
      marginTop: 1,
    },
    badgeContainer: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: '#EF4444',
      borderRadius: 7.5,
      minWidth: 15,
      height: 15,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2.5,
      borderWidth: 1.5,
      borderColor: isDark ? '#1E1E24' : '#FFFFFF',
    },
    badgeCount: {
      color: '#FFFFFF',
      fontSize: 8,
      fontFamily: FontFamily.bold,
      lineHeight: 9.5,
    },
  });
