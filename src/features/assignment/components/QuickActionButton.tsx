import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { spacing, FontFamily, useTheme } from '@/core/theme';

interface QuickActionButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
  badgeCount?: number;
}

export function QuickActionButton({ icon, label, subtitle, tint, tintLight, onPress, badgeCount }: QuickActionButtonProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors, tint, tintLight), [colors, tint, tintLight]);
  return (
    <View style={styles.actionContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
        android_ripple={{ color: tint + '20' }}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} color={tint} size={18} />
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
      </Pressable>
    </View>
  );
}

const useStyles = (colors: any, tint: string, tintLight: string) => StyleSheet.create({
  actionContainer: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: tint + '20',
  },
  action: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: tint + '15',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeCount: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.bold,
    lineHeight: 11,
  },
});

