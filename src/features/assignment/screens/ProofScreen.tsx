import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { router } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { SignaturePad, SignaturePadHandle } from '@/components/ui/SignaturePad';
import { radius, spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment, useSaveDeliveryProof, useCompleteAssignment } from '@/hooks/useAssignments';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCompletionRequirements } from '@/features/assignment/redux/assignmentSlice';

export function ProofScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const saveProof = useSaveDeliveryProof();
  const completeAssignment = useCompleteAssignment();
  const signaturePadRef = useRef<SignaturePadHandle>(null);
  
  const completionRequirements = useAppSelector(selectCompletionRequirements);

  const [photoUris, setPhotoUris] = useState<string[]>(assignment?.proofPhotoUris || []);
  const [hasSignature, setHasSignature] = useState(!!assignment?.signatureUri);
  const [signatureData, setSignatureData] = useState(assignment?.signatureUri || '');
  const [notes, setNotes] = useState(assignment?.deliveryNotes || '');

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (assignment) {
      if (assignment.proofPhotoUris && photoUris.length === 0) setPhotoUris(assignment.proofPhotoUris);
      if (assignment.signatureUri && !signatureData) {
        setSignatureData(assignment.signatureUri);
        setHasSignature(true);
      }
      if (assignment.deliveryNotes && !notes) setNotes(assignment.deliveryNotes);
    }
  }, [assignment]);

  // Sync local state back to Redux so it persists if the user navigates back and forth
  useEffect(() => {
    if (!assignment) return;
    const timeout = setTimeout(() => {
      dispatch({
        type: 'assignment/addAssignment',
        payload: {
          ...assignment,
          proofPhotoUris: photoUris,
          signatureUri: signatureData,
          deliveryNotes: notes,
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [photoUris, signatureData, notes]);

  if (isLoading || !assignment) {
    return <ScreenLoader />;
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Camera permission required' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
    setSignatureData('');
  };

  const reqs = assignment ? completionRequirements?.[assignment.type.toLowerCase()] : null;
  const requiresPhoto = reqs ? reqs.requiresPhoto : true; // Fallback to true if unknown
  const requiresSignature = reqs ? reqs.requiresSignature : assignment?.type !== 'inspection'; // Fallback

  const onSaveAndContinue = async () => {
    if (requiresPhoto && photoUris.length === 0) {
      Toast.show({ type: 'error', text1: 'Proof photo required', text2: 'Please take a photo before continuing.' });
      return;
    }

    if (requiresSignature && (!hasSignature || !signatureData || signatureData.trim().length < 30)) {
      Toast.show({ type: 'error', text1: 'Customer signature required', text2: 'Please provide a clearer signature.' });
      return;
    }

    try {
      await saveProof.mutateAsync({
        id: assignment.id,
        proofPhotoUris: photoUris,
        signatureUri: requiresSignature ? signatureData : undefined,
        deliveryNotes: notes,
      });

      if (assignment.type === 'inspection') {
        safeRouter.push({ pathname: '/assignment/[id]/remarks', params: { id: assignment.id } });
      } else if (reqs && !reqs.requiresPayment) {
        // If the dynamic requirements say no payment needed, skip straight to summary
        safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: assignment.id } });
      } else if (assignment.codAmount === 0 || assignment.type !== 'delivery') {
        safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: assignment.id } });
      } else {
        safeRouter.push({ pathname: '/assignment/[id]/payment', params: { id: assignment.id } });
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.error || error.response?.data?.message || 'An error occurred while saving.';

      const missingReqs = error.response?.data?.details?.missingRequirements;
      if (Array.isArray(missingReqs) && missingReqs.length > 0) {
        const missingLabels = missingReqs.map((req: string) => {
          if (req.startsWith('checklist:')) {
            const id = req.split(':')[1];
            const checklistItem = assignment.checklist?.find(c => c.id === id);
            return checklistItem ? `"${checklistItem.label}"` : 'a checklist item';
          }
          return req;
        });
        errorMessage += `\nMissing: ${missingLabels.join(', ')}`;
      }

      Toast.show({ type: 'error', text1: 'Submission Failed', text2: errorMessage });
    }
  };

  const typeLabel = assignment.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: `${assignment.code} · ${assignment.customer.name}` }} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{typeLabel} Proof</Text>
        
        {requiresPhoto && (
          <Card style={styles.photoCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={styles.label}>Photos ({photoUris.length})</Text>
              {photoUris.length > 0 && (
                <Pressable onPress={takePhoto} style={styles.addMoreButton}>
                  <MaterialIcons name="add-a-photo" size={16} color={colors.primary} />
                  <Text style={styles.addMoreText}>Add</Text>
                </Pressable>
              )}
            </View>

            {photoUris.length === 0 ? (
              <Pressable style={styles.photoBox} onPress={takePhoto}>
                <MaterialIcons name="photo-camera" size={32} color={colors.textSecondary} />
                <View style={styles.cameraButton}>
                  <MaterialIcons name="camera-alt" size={18} color={colors.textInverse} />
                </View>
              </Pressable>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                {photoUris.map((uri, index) => (
                  <View key={index} style={styles.photoThumbnailContainer}>
                    <Image source={{ uri }} style={styles.photoThumbnail} />
                    <Pressable 
                      style={styles.removePhotoButton} 
                      onPress={() => setPhotoUris(prev => prev.filter((_, i) => i !== index))}
                    >
                      <MaterialIcons name="close" size={16} color={colors.textInverse} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </Card>
        )}

        {requiresSignature && (
          <Card style={styles.signatureCard}>
            <View style={styles.signatureHeader}>
              <Text style={styles.label}>Customer Signature</Text>
              <Pressable onPress={clearSignature}>
                <Text style={styles.clearLabel}>Clear</Text>
              </Pressable>
            </View>
            <SignaturePad
              ref={signaturePadRef}
              initialValue={assignment?.signatureUri || undefined}
              onChange={(has, data) => {
                setHasSignature(has);
                setSignatureData(data);
              }}
            />
          </Card>
        )}

        <Input
          label="Notes (Optional)"
          placeholder="Write notes here..."
          multiline
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

        <ScreenFooter>
          <Button label="Save & Continue" onPress={onSaveAndContinue} loading={saveProof.isPending || completeAssignment.isPending} />
        </ScreenFooter>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
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
    color: colors.textPrimary,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  photoCard: {
    gap: spacing.sm,
  },
  photoBox: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureCard: {
    gap: spacing.sm,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 80,
    height: 'auto',
    textAlignVertical: 'top',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  photoThumbnailContainer: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
