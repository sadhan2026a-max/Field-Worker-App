import React from 'react';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Borders, spacing, typography, hp, wp, FontSize, FontFamily, colors, useTheme } from '@/core/theme';

type Variant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional icon rendered to the left of the label. */
  icon?: ReactNode;
  /** Overrides the label's text style. */
  textStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  icon,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        !!icon && styles.baseWithIcon,
        variant === 'primary' && styles.variantPrimary,
        variant === 'secondary' && styles.variantSecondary,
        variant === 'outline' && styles.variantOutline,
        (disabled && !loading) && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textInverse} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, variant === 'outline' && styles.outlineLabel, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  base: {
    height: hp(5.5),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    // No shadow
  },
  baseWithIcon: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: colors.textInverse,
  },
  outlineLabel: {
    color: colors.primary,
  },
  variantPrimary: {
    backgroundColor: colors.primary,
  },
  variantSecondary: {
    backgroundColor: colors.textPrimary,
  },
  variantOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
});
