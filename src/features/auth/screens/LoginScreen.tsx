import React, { ReactNode, useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  shakeTrigger?: number;
}

function CustomInput({ label, leftIcon, rightElement, rightLabel, error, shakeTrigger, style, ...rest }: CustomInputProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const [isFocused, setIsFocused] = useState(false);
  
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake ONLY when shakeTrigger changes (explicit button hit), NEVER while typing!
  useEffect(() => {
    if (shakeTrigger && shakeTrigger > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -12, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true })
      ]).start();
    }
  }, [shakeTrigger]);

  return (
    <View style={styles.inputWrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {rightLabel && <View style={styles.rightLabelContainer}>{rightLabel}</View>}
      </View>
      <Animated.View
        style={[
          styles.inputFieldContainer,
          isFocused && styles.inputFieldFocused,
          error ? styles.inputFieldError : null,
          { transform: [{ translateX: shakeAnim }] }
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
      </Animated.View>
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

  // Separate shake triggers that ONLY increment when the user hits the Log In button
  const [shakePin, setShakePin] = useState(0);
  const [shakePassword, setShakePassword] = useState(0);

  const [loginMode, setLoginMode] = useState<'pin' | 'password'>('pin');

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginForm>({ defaultValues: { phone: '', pin: '', password: '' } });

  if (driver) {
    if (!driver.hasPin) {
      return <Redirect href="/pin-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  // Called ONLY when the user hits the Log In button and client validation fails
  const onInvalid = (fieldErrors: any) => {
    // In PIN mode: shake ONLY if user entered an incomplete PIN (1-5 digits).
    // If PIN is completely empty ('required'), DO NOT shake.
    if (loginMode === 'pin' && fieldErrors.pin?.type === 'minLength') {
      setShakePin(prev => prev + 1);
    }
    // In Password mode: if password is empty ('required'), DO NOT shake.
  };

  // Called ONLY when client validation passes and user hits the Log In button
  const onSubmit = async (values: LoginForm) => {
    setIsSubmitting(true);
    try {
      await dispatch(loginThunk({
        phone: values.phone,
        pin: loginMode === 'pin' ? values.pin : undefined,
        password: loginMode === 'password' ? values.password : undefined
      })).unwrap();
    } catch (err: any) {
      const errorMsg = String(err);
      if (errorMsg === 'Account does not exist.') {
        setError('phone', { type: 'manual', message: errorMsg });
      } else if (errorMsg.includes('Incorrect') || errorMsg.includes('credentials') || errorMsg.includes('password')) {
        if (loginMode === 'pin') {
          setError('pin', { type: 'manual', message: 'Incorrect PIN.' });
          setShakePin(prev => prev + 1);
        } else {
          setError('password', { type: 'manual', message: 'Incorrect password.' });
          setShakePassword(prev => prev + 1);
        }
      } else {
        if (loginMode === 'pin') {
          setError('pin', { type: 'manual', message: errorMsg });
          setShakePin(prev => prev + 1);
        } else {
          setError('password', { type: 'manual', message: errorMsg });
          setShakePassword(prev => prev + 1);
        }
      }
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
                  returnKeyType="next"
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
                    maxLength={6}
                    value={field.value}
                    onChangeText={(text: string) => field.onChange(text.replace(/[^0-9]/g, ''))}
                    error={errors.pin?.message}
                    shakeTrigger={shakePin}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit, onInvalid)}
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
                    shakeTrigger={shakePassword}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit, onInvalid)}
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

            <Pressable
              onPress={() => {
                clearErrors(['pin', 'password']);
                setLoginMode(m => m === 'pin' ? 'password' : 'pin');
              }}
              style={styles.toggleModeBtn}
            >
              <Text style={styles.toggleModeText}>
                {loginMode === 'pin' ? 'Login with Password instead' : 'Login with PIN instead'}
              </Text>
            </Pressable>

            {/* Submit button */}
            <Button
              label="Log In"
              onPress={handleSubmit(onSubmit, onInvalid)}
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
