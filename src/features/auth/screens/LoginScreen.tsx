import { ReactNode, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Redirect } from 'expo-router';
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
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk, selectDriver } from '@/features/auth/redux/authSlice';
import { colors, spacing, typography, FontSize, FontFamily, palette } from '@/core/theme';

interface LoginForm {
  phone: string;
  pin: string;
}

interface CustomInputProps extends TextInputProps {
  label: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  rightLabel?: ReactNode;
  error?: string;
}

function CustomInput({ label, leftIcon, rightElement, rightLabel, error, style, ...rest }: CustomInputProps) {
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
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ defaultValues: { phone: '', pin: '' } });

  if (driver) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async (values: LoginForm) => {
    setIsSubmitting(true);
    try {
      await dispatch(loginThunk({ phone: values.phone, pin: values.pin })).unwrap();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : 'Please check your credentials and try again.';
      Toast.show({ type: 'error', text1: 'Login failed', text2: errorMessage });
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
              rules={{ required: 'Phone number is required' }}
              render={({ field }) => (
                <CustomInput
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={errors.phone?.message}
                  leftIcon={<MaterialIcons name="phone" size={20} color={colors.textSecondary} />}
                />
              )}
            />

            {/* PIN Field */}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Match the dashboard background for consistency
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
    backgroundColor: '#EEF2FF',
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
  inputFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputFieldFocused: {
    borderColor: colors.primary,
    backgroundColor: palette.white,
  },
  inputFieldError: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
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
  submit: {
    marginTop: spacing.sm,
    borderRadius: 12,
    height: 52,
  },
  submitText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
  },
});
