import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { colors, spacing, shadows, FontFamily } from '@/core/theme';

interface QuickActionButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
  badgeCount?: number;
}

export function QuickActionButton({ icon, label, tint, tintLight, onPress, badgeCount }: QuickActionButtonProps) {
  return (
    <View style={styles.actionContainer}>
      <Pressable
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
        ]}
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: tintLight }]}>
          <MaterialIcons name={icon} color={tint} size={22} />
        </View>
        <Text style={styles.label}>{label}</Text>
        <MaterialIcons name="chevron-right" size={18} color={colors.textSecondary} style={styles.chevron} />
        {!!badgeCount && badgeCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeCount}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  action: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#101828',
  },
  chevron: {
    opacity: 0.4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeCount: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    lineHeight: 12,
  },
});
