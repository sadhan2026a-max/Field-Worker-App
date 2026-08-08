import React, { ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Redirect, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  View,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk, selectDriver, selectAuthError } from '@/features/auth/redux/authSlice';
import { useTheme, spacing, typography, FontSize, FontFamily, palette } from '@/core/theme';

interface LoginForm {
  phone: string;
  pin?: string;
  password?: string;
}

interface CustomInputProps extends TextInputProps {
  label: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  rightLabel?: ReactNode;
  error?: string;
}

function CustomInput({ label, leftIcon, rightElement, rightLabel, error, style, ...rest }: CustomInputProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {rightLabel && <View style={styles.rightLabelContainer}>{rightLabel}</View>}
      </View>
      <View
        style={[
          styles.inputFieldContainer,
          isFocused && styles.inputFieldFocused,
          error ? styles.inputFieldError : null
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.textInput, style]}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {rightElement && <View style={styles.rightElementContainer}>{rightElement}</View>}
      </View>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
    </View>
  );
}

export function LoginScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const driver = useAppSelector(selectDriver);
  const authError = useAppSelector(selectAuthError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginMode, setLoginMode] = useState<'pin' | 'password'>('pin');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ defaultValues: { phone: '', pin: '', password: '' } });

  if (driver) {
    if (!driver.hasPin) {
      return <Redirect href="/pin-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async (values: LoginForm) => {
    setIsSubmitting(true);
    try {
      await dispatch(loginThunk({
        phone: values.phone,
        pin: loginMode === 'pin' ? values.pin : undefined,
        password: loginMode === 'password' ? values.password : undefined
      })).unwrap();
    } catch (_err) {
      // Error is already stored in Redux state by loginThunk.rejected
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoPlaceholder}>
              <MaterialIcons name="local-shipping" size={48} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSubtitle}>Sign in to access your rider dashboard</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Phone Field */}
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' },
              }}
              render={({ field }) => (
                <CustomInput
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={field.value}
                  onChangeText={(text: string) => field.onChange(text.replace(/[^0-9]/g, ''))}
                  error={errors.phone?.message}
                  leftIcon={<MaterialIcons name="phone" size={20} color={colors.textSecondary} />}
                />
              )}
            />

            {/* Password/PIN Field */}
            {loginMode === 'pin' ? (
              <Controller
                control={control}
                name="pin"
                rules={{
                  required: 'PIN is required',
                  minLength: { value: 6, message: 'PIN must be at least 6 digits' }
                }}
                render={({ field }) => (
                  <CustomInput
                    label="6-Digit PIN"
                    placeholder="Enter your PIN"
                    secureTextEntry={!showPassword}
                    keyboardType="number-pad"
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.pin?.message}
                    leftIcon={<MaterialIcons name="lock" size={20} color={colors.textSecondary} />}
                    rightElement={
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                        <MaterialIcons
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
            ) : (
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required'
                }}
                render={({ field }) => (
                  <CustomInput
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    value={field.value}
                    onChangeText={field.onChange}
                    error={errors.password?.message}
                    leftIcon={<MaterialIcons name="lock" size={20} color={colors.textSecondary} />}
                    rightLabel={
                      <Pressable onPress={() => router.push('/forgot-password')}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                      </Pressable>
                    }
                    rightElement={
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                        <MaterialIcons
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    }
                  />
                )}
              />
            )}

            <Pressable onPress={() => setLoginMode(m => m === 'pin' ? 'password' : 'pin')} style={styles.toggleModeBtn}>
              <Text style={styles.toggleModeText}>
                {loginMode === 'pin' ? 'Login with Password instead' : 'Login with PIN instead'}
              </Text>
            </Pressable>

            {/* Login Error */}
            {authError ? (
              <View style={styles.loginErrorContainer}>
                <MaterialIcons name="error-outline" size={18} color={colors.danger} />
                <Text style={styles.loginErrorText}>{authError}</Text>
              </View>
            ) : null}

            {/* Submit button */}
            <Button
              label="Log In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submit}
              textStyle={styles.submitText}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background, // Match the dashboard background for consistency
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: spacing.xxxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    gap: spacing.lg,
  },
  inputWrapper: {
    gap: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightLabelContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputFieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputFieldError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '15',
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: colors.textPrimary,
  },
  rightElementContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 4,
  },
  inputErrorText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.danger,
    marginTop: 4,
  },
  loginErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loginErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: colors.danger,
  },
  submit: {
    marginTop: spacing.sm,
    borderRadius: 12,
    height: 52,
  },
  submitText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: colors.primary,
  },
  toggleModeBtn: {
    alignSelf: 'center',
    marginTop: 8,
    padding: 8,
  },
  toggleModeText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
