


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
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, tint, tintLight), [colors, tint, tintLight]);

  return (
    <View style={styles.actionContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
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
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        <MaterialIcons name="chevron-right" size={15} color={colors.border} />
      </Pressable>
    </View>
  );
}

const useStyles = (colors: any, tint: string, tintLight: string) => StyleSheet.create({
  actionContainer: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  action: {
    flexDirection: 'row',
    paddingHorizontal: 9,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
  },
  actionPressed: {
    opacity: 0.85,
    backgroundColor: tint + '08',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: tint + '14',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 9.5,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 0.5,
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  badgeCount: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: FontFamily.bold,
    lineHeight: 9,
  },
});
