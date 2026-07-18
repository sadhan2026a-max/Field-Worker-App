import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, Borders, spacing, typography, hp, wp, FontSize } from '@/core/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...rest }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
  input: {
    height: hp(6.5),
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: Borders.radius1,
    paddingHorizontal: wp(4),
    backgroundColor: colors.surface,
    fontSize: FontSize.small,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: FontSize.extraSmall,
    color: colors.danger,
    marginTop: 2,
  },
});
