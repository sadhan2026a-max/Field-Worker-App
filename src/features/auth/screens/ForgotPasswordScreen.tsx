import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTheme, spacing, typography, FontFamily } from '@/core/theme';
import { requestPasswordReset, confirmPasswordReset } from '@/features/auth/api/authService';

interface ForgotPasswordForm {
  phone: string;
  otp: string;
  newPassword: string;
}

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ defaultValues: { phone: '', otp: '', newPassword: '' } });

  const phoneValue = watch('phone');

  const onRequestOtp = async (values: ForgotPasswordForm) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.phone);
      Toast.show({ type: 'success', text1: 'OTP sent to your phone' });
      setStep(2);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to request OTP' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetPassword = async (values: ForgotPasswordForm) => {
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(values.phone, values.otp, values.newPassword);
      Toast.show({ type: 'success', text1: 'Password reset successfully' });
      router.back();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to reset password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerContainer}>
            <MaterialIcons name="lock-reset" size={48} color={colors.primary} />
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              {step === 1 ? 'Enter your phone number to receive an OTP' : 'Enter the OTP and your new password'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                pattern: { value: /^[0-9]{10}$/, message: 'Must be exactly 10 digits' },
              }}
              render={({ field }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={[styles.inputFieldContainer, errors.phone && styles.inputFieldError]}>
                    <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter phone number"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={field.value}
                      editable={step === 1}
                      onChangeText={(t) => field.onChange(t.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                  {errors.phone && <Text style={styles.inputErrorText}>{errors.phone.message}</Text>}
                </View>
              )}
            />

            {step === 2 && (
              <>
                <Controller
                  control={control}
                  name="otp"
                  rules={{ required: 'OTP is required' }}
                  render={({ field }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>OTP Code</Text>
                      <View style={[styles.inputFieldContainer, errors.otp && styles.inputFieldError]}>
                        <MaterialIcons name="message" size={20} color={colors.textSecondary} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter OTP"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="number-pad"
                          value={field.value}
                          onChangeText={(t) => field.onChange(t.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                      {errors.otp && <Text style={styles.inputErrorText}>{errors.otp.message}</Text>}
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="newPassword"
                  rules={{ required: 'New password is required' }}
                  render={({ field }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={[styles.inputFieldContainer, errors.newPassword && styles.inputFieldError]}>
                        <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter new password"
                          placeholderTextColor={colors.textSecondary}
                          secureTextEntry
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      </View>
                      {errors.newPassword && <Text style={styles.inputErrorText}>{errors.newPassword.message}</Text>}
                    </View>
                  )}
                />
              </>
            )}

            {step === 1 ? (
              <Button
                label="Send OTP"
                onPress={handleSubmit(onRequestOtp)}
                loading={isSubmitting}
                style={styles.submit}
              />
            ) : (
              <Button
                label="Reset Password"
                onPress={handleSubmit(onResetPassword)}
                loading={isSubmitting}
                style={styles.submit}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: 20 },
  backButton: { padding: 8, marginLeft: -8, alignSelf: 'flex-start' },
  headerContainer: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  headerTitle: { fontSize: 28, fontFamily: FontFamily.bold, color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  headerSubtitle: { fontSize: 15, fontFamily: FontFamily.regular, color: colors.textSecondary, textAlign: 'center' },
  formContainer: { gap: spacing.lg },
  inputWrapper: { gap: spacing.xs },
  inputLabel: { fontSize: 13, fontFamily: FontFamily.bold, color: colors.textPrimary, textTransform: 'uppercase' },
  inputFieldContainer: { flexDirection: 'row', alignItems: 'center', height: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background, paddingHorizontal: spacing.md, gap: spacing.sm },
  inputFieldError: { borderColor: colors.danger, backgroundColor: '#FEF2F2' },
  textInput: { flex: 1, height: '100%', fontSize: 15, fontFamily: FontFamily.medium, color: colors.textPrimary },
  inputErrorText: { fontSize: 12, fontFamily: FontFamily.medium, color: colors.danger, marginTop: 4 },
  submit: { marginTop: spacing.sm, borderRadius: 12, height: 52 },
});
