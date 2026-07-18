import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    <Pressable style={[styles.action, { backgroundColor: tintLight }]} onPress={onPress}>
      <MaterialIcons name={icon} color={tint} size={22} />
      <Text style={styles.label}>{label}</Text>
      {!!badgeCount && badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeCount}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E44C4C',
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
