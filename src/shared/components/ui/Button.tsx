import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, Borders, spacing, typography, hp, wp, FontSize, FontFamily } from '@/core/theme';

type Variant = 'primary' | 'secondary' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  /** Optional icon rendered to the left of the label. */
  icon?: ReactNode;
  /** Overrides the label's text style. */
  textStyle?: TextStyle;
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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        !!icon && styles.baseWithIcon,
        variantStyles[variant],
        isDisabled && styles.disabled,
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

const styles = StyleSheet.create({
  base: {
    height: hp(5.5),
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  baseWithIcon: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disabled: {
    backgroundColor: '#E8E6EA',
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
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.textPrimary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary, shadowOpacity: 0, elevation: 0 },
};

