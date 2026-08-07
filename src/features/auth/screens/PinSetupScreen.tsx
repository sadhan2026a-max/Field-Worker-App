import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTheme, spacing, typography, FontFamily } from '@/core/theme';
import { setPin } from '@/features/auth/api/authService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initAuth, selectDriver } from '@/features/auth/redux/authSlice';
import { TextInput } from 'react-native';

interface PinSetupForm {
  currentPassword: string;
  pin: string;
  confirmPin: string;
}

export function PinSetupScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PinSetupForm>({ defaultValues: { currentPassword: '', pin: '', confirmPin: '' } });

  const onSubmit = async (values: PinSetupForm) => {
    if (values.pin !== values.confirmPin) {
      Toast.show({ type: 'error', text1: 'PINs do not match' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await setPin(values.currentPassword, values.pin);
      Toast.show({ type: 'success', text1: 'PIN set successfully' });
      
      // Re-initialize auth to get the updated driver object (hasPin: true)
      await dispatch(initAuth());
      router.replace('/(tabs)');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to set PIN' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <MaterialIcons name="lock-outline" size={48} color={colors.primary} />
            <Text style={styles.headerTitle}>Set Your PIN</Text>
            <Text style={styles.headerSubtitle}>Create a 6-digit PIN for quick login</Text>
          </View>

          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="currentPassword"
              rules={{ required: 'Current password is required' }}
              render={({ field }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={[styles.inputFieldContainer, errors.currentPassword && styles.inputFieldError]}>
                    <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  </View>
                  {errors.currentPassword && <Text style={styles.inputErrorText}>{errors.currentPassword.message}</Text>}
                </View>
              )}
            />
            <Controller
              control={control}
              name="pin"
              rules={{ 
                required: 'PIN is required',
                minLength: { value: 6, message: 'PIN must be exactly 6 digits' },
                maxLength: { value: 6, message: 'PIN must be exactly 6 digits' }
              }}
              render={({ field }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>New 6-Digit PIN</Text>
                  <View style={[styles.inputFieldContainer, errors.pin && styles.inputFieldError]}>
                    <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new PIN"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      keyboardType="number-pad"
                      maxLength={6}
                      value={field.value}
                      onChangeText={(t) => field.onChange(t.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                  {errors.pin && <Text style={styles.inputErrorText}>{errors.pin.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPin"
              rules={{ 
                required: 'Confirm PIN is required'
              }}
              render={({ field }) => (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm PIN</Text>
                  <View style={[styles.inputFieldContainer, errors.confirmPin && styles.inputFieldError]}>
                    <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter new PIN"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      keyboardType="number-pad"
                      maxLength={6}
                      value={field.value}
                      onChangeText={(t) => field.onChange(t.replace(/[^0-9]/g, ''))}
                    />
                  </View>
                  {errors.confirmPin && <Text style={styles.inputErrorText}>{errors.confirmPin.message}</Text>}
                </View>
              )}
            />

            <Button
              label="Set PIN & Continue"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              style={styles.submit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: 60 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
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
