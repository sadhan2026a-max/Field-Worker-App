import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { useRef, useState, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { SignaturePad, SignaturePadHandle } from '@/components/ui/SignaturePad';
import { radius, spacing, typography, colors, useTheme } from '@/core/theme';

import { useAssignment, useSaveDeliveryProof, useCompleteAssignment } from '@/hooks/useAssignments';

export function ProofScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading } = useAssignment(id);
  const saveProof = useSaveDeliveryProof();
  const completeAssignment = useCompleteAssignment();
  const signaturePadRef = useRef<SignaturePadHandle>(null);

  const [photoUri, setPhotoUri] = useState<string | undefined>(assignment?.proofPhotoUri);
  const [hasSignature, setHasSignature] = useState(!!assignment?.signatureUri);
  const [signatureData, setSignatureData] = useState(assignment?.signatureUri || '');
  const [notes, setNotes] = useState(assignment?.deliveryNotes || '');

  useEffect(() => {
    if (assignment) {
      if (assignment.proofPhotoUri && !photoUri) setPhotoUri(assignment.proofPhotoUri);
      if (assignment.signatureUri && !signatureData) {
        setSignatureData(assignment.signatureUri);
        setHasSignature(true);
      }
      if (assignment.deliveryNotes && !notes) setNotes(assignment.deliveryNotes);
    }
  }, [assignment]);

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
      setPhotoUri(result.assets[0].uri);
    }
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
    setSignatureData('');
  };

  const onSaveAndContinue = async () => {
    if (!photoUri) {
      Toast.show({ type: 'error', text1: 'Proof photo required', text2: 'Please take a photo before continuing.' });
      return;
    }

    const requiresSignature = assignment.type !== 'inspection';

    if (requiresSignature && (!hasSignature || !signatureData || signatureData.trim().length < 30)) {
      Toast.show({ type: 'error', text1: 'Customer signature required', text2: 'Please provide a clearer signature.' });
      return;
    }

    try {
      await saveProof.mutateAsync({
        id: assignment.id,
        proofPhotoUri: photoUri,
        signatureUri: requiresSignature ? signatureData : undefined,
        deliveryNotes: notes,
      });

      if (assignment.type === 'inspection') {
        safeRouter.push({ pathname: '/assignment/[id]/remarks', params: { id: assignment.id } });
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

  const requiresSignature = assignment.type !== 'inspection';
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
        <Card style={styles.photoCard}>
          <Text style={styles.label}>Take Photo</Text>
          <Pressable style={styles.photoBox} onPress={takePhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <MaterialIcons name="photo-camera" size={32} color={colors.textSecondary} />
            )}
            <View style={styles.cameraButton}>
               <MaterialIcons name="camera-alt" size={18} color={colors.textInverse} />
            </View>
          </Pressable>
        </Card>

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
});
