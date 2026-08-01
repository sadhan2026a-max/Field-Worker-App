import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, radius, spacing, typography } from '@/core/theme';
import { useAssignment, useCompleteAssignment, useVerifyOrderOtp } from '@/hooks/useAssignments';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState } from 'react';
import { TextInput } from 'react-native';

export function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const completeAssignment = useCompleteAssignment();
  const verifyOtp = useVerifyOrderOtp();
  const [otp, setOtp] = useState('');

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const handleCompleteJob = async () => {
    if (assignment.requiresDeliveryOtp && !assignment.deliveryOtpVerifiedAt) {
      if (!otp || otp.length < 6) {
        Toast.show({ type: 'error', text1: 'OTP Required', text2: 'Please enter the 6-digit OTP provided by the customer.' });
        return;
      }
      try {
        await verifyOtp.mutateAsync({ id: assignment.id, otp });
        Toast.show({ type: 'success', text1: 'OTP Verified' });
      } catch (e: any) {
        Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'The OTP entered is incorrect.' });
        return;
      }
    }

    try {
      await completeAssignment.mutateAsync(assignment.id);
      router.replace({ pathname: '/assignment/[id]/complete', params: { id: assignment.id } });
    } catch (error: any) {
      let errorMessage = error.response?.data?.error || error.response?.data?.message || 'An error occurred while saving.';
      
      const missingReqs = error.response?.data?.details?.missingRequirements;
      if (Array.isArray(missingReqs) && missingReqs.length > 0) {
        // Find the first missing requirement to route back to
        const req = missingReqs[0];
        
        if (req.startsWith('checklist:')) {
          const checklistId = req.split(':')[1];
          const checklistItem = assignment.checklist?.find(c => c.id === checklistId);
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: `Please complete checklist: "${checklistItem?.label || 'Item'}"` });
          safeRouter.push({ pathname: '/assignment/[id]/checklist', params: { id: assignment.id } });
          return;
        } else if (req === 'photo' || req === 'signature') {
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: 'Proof of Delivery is incomplete.' });
          safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } });
          return;
        } else if (req === 'payment') {
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: 'Payment collection is pending.' });
          safeRouter.push({ pathname: '/assignment/[id]/payment', params: { id: assignment.id } });
          return;
        } else if (req === 'return_detail') {
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: 'Return details are pending.' });
          safeRouter.push({ pathname: '/assignment/[id]/return', params: { id: assignment.id } });
          return;
        } else if (req === 'service_detail') {
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: 'Service details are pending.' });
          safeRouter.push({ pathname: '/assignment/[id]/service', params: { id: assignment.id } });
          return;
        } else if (req === 'meetingNotes' || req === 'outcome' || req === 'sales_detail') {
          Toast.show({ type: 'error', text1: 'Missing Requirement', text2: 'Sales details are pending.' });
          safeRouter.push({ pathname: '/assignment/[id]/sales', params: { id: assignment.id } });
          return;
        }
        
        errorMessage += `\nMissing: ${missingReqs.join(', ')}`;
      }

      Toast.show({ type: 'error', text1: 'Submission Failed', text2: errorMessage });
    }
  };

  // Determine recap status
  const proofCaptured = assignment.type !== 'sales_visit' && assignment.type !== 'inspection'; // Usually true if we reached here
  const paymentCollected = assignment.receivedAmount !== undefined && assignment.receivedAmount > 0;
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Job Summary' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Review Job Completion</Text>
        
        <Card style={styles.card}>
          <View style={styles.recapRow}>
            <MaterialIcons name="local-shipping" size={24} color={colors.primary} />
            <View style={styles.recapTextContainer}>
              <Text style={styles.recapLabel}>Assignment Type</Text>
              <Text style={styles.recapValue}>{assignment.type.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          {proofCaptured && (
            <View style={styles.recapRow}>
              <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
              <View style={styles.recapTextContainer}>
                <Text style={styles.recapLabel}>Proof of Delivery</Text>
                <Text style={styles.recapValue}>Captured</Text>
              </View>
            </View>
          )}

          {assignment.codAmount > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.recapRow}>
                <MaterialIcons name="payments" size={24} color={colors.primary} />
                <View style={styles.recapTextContainer}>
                  <Text style={styles.recapLabel}>Payment Collection</Text>
                  <Text style={styles.recapValue}>
                    {paymentCollected ? `Collected ₹${(assignment.receivedAmount ?? 0).toLocaleString()}` : 'Pending / Not Completed'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {assignment.checklist && assignment.checklist.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.recapRow}>
                <MaterialIcons name="checklist" size={24} color={colors.primary} />
                <View style={styles.recapTextContainer}>
                  <Text style={styles.recapLabel}>Checklist</Text>
                  <Text style={styles.recapValue}>
                    {assignment.checklist.filter(c => c.isChecked || c.value).length} / {assignment.checklist.length} items filled
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {assignment.requiresDeliveryOtp && !assignment.deliveryOtpVerifiedAt && (
          <Card style={styles.card}>
            <View style={styles.otpContainer}>
              <MaterialIcons name="security" size={24} color={colors.primary} />
              <View style={styles.otpTextContainer}>
                <Text style={styles.recapLabel}>OTP Verification Required</Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={colors.textSecondary}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      <ScreenFooter>
        <Button 
          label={assignment.requiresDeliveryOtp && !assignment.deliveryOtpVerifiedAt ? "Verify OTP & Complete" : "Complete Job"} 
          onPress={handleCompleteJob} 
          loading={completeAssignment.isPending || verifyOtp.isPending} 
        />
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  recapTextContainer: {
    flex: 1,
  },
  recapLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  recapValue: {
    ...typography.body,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: '#fff8f0', // Slight orange/warning tint
  },
  otpTextContainer: {
    flex: 1,
  },
  otpInput: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
});
