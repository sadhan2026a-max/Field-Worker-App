import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, palette, colors, useTheme } from '@/core/theme';

import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { saveServiceDetail } from '@/features/assignment/api/assignmentService';
import { PartUsed } from '@/features/assignment/types/Assignment';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addAssignment, selectCompletionRequirements } from '@/features/assignment/redux/assignmentSlice';

export function ServiceDetailScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  const dispatch = useAppDispatch();
  const completionRequirements = useAppSelector(selectCompletionRequirements);
  const reqs = assignment ? completionRequirements?.[assignment.type.toLowerCase()] : null;
  const requiresServiceNotes = reqs ? reqs.requiresServiceNotes : true; // Fallback to true

  const [diagnosisNotes, setDiagnosisNotes] = useState(assignment?.serviceDetail?.diagnosisNotes || '');
  const [resolutionNotes, setResolutionNotes] = useState(assignment?.serviceDetail?.resolutionNotes || '');
  const [parts, setParts] = useState<PartUsed[]>(assignment?.serviceDetail?.partsUsed || []);

  React.useEffect(() => {
    if (assignment?.serviceDetail) {
      if (!diagnosisNotes) setDiagnosisNotes(assignment.serviceDetail.diagnosisNotes || '');
      if (!resolutionNotes) setResolutionNotes(assignment.serviceDetail.resolutionNotes || '');
      if (parts.length === 0 && assignment.serviceDetail.partsUsed) {
        setParts(assignment.serviceDetail.partsUsed);
      }
    }
  }, [assignment]);

  React.useEffect(() => {
    if (!assignment) return;
    const timeout = setTimeout(() => {
      dispatch({
        type: 'assignment/addAssignment',
        payload: {
          ...assignment,
          serviceDetail: {
            ...assignment.serviceDetail,
            diagnosisNotes,
            resolutionNotes,
            partsUsed: parts.length > 0 ? parts : undefined,
          }
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [diagnosisNotes, resolutionNotes, parts]);

  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const addPart = () => {
    if (!newPartName || !newPartQty || !newPartPrice) return;
    const qty = parseInt(newPartQty, 10);
    const price = parseFloat(newPartPrice);
    if (qty > 0 && price > 0) {
      setParts([...parts, { partName: newPartName, quantity: qty, unitPrice: price }]);
      setNewPartName('');
      setNewPartQty('');
      setNewPartPrice('');
    }
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (!diagnosisNotes || !resolutionNotes) return;
    await saveServiceDetail(id as string, {
      complaintDescription: assignment?.serviceDetail?.complaintDescription || '',
      productRef: assignment?.serviceDetail?.productRef || '',
      diagnosisNotes,
      resolutionNotes,
      partsUsed: parts.length > 0 ? parts : undefined,
    });

    if (assignment) {
      dispatch(addAssignment({
        ...assignment,
        serviceDetail: {
          ...assignment.serviceDetail,
          complaintDescription: assignment.serviceDetail?.complaintDescription || '',
          productRef: assignment.serviceDetail?.productRef || '',
          diagnosisNotes,
          resolutionNotes,
          partsUsed: parts.length > 0 ? parts : undefined,
        }
      }));
    }

    safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: id as string } });
  };

  const isFormValid = requiresServiceNotes ? (diagnosisNotes.length > 0 && resolutionNotes.length > 0) : true;
  const partsTotal = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: isKeyboardVisible ? spacing.lg : 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm, marginLeft: -8, padding: spacing.xs }}>
              <MaterialIcons name="arrow-back" size={28} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.title, { marginBottom: 0 }]}>Service Visit</Text>
          </View>
          <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

          <Text style={styles.sectionTitle}>1. Diagnosis</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Complaint</Text>
            <Text style={styles.infoValue}>{assignment?.serviceDetail?.complaintDescription || 'Not specified'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Product</Text>
            <Text style={styles.infoValue}>{assignment?.serviceDetail?.productRef || 'Not specified'}</Text>
          </View>

          <TextInput
            style={[styles.textArea, { marginTop: spacing.md }]}
            placeholder="Diagnosis Notes *"
            placeholderTextColor={colors.textSecondary}
            value={diagnosisNotes}
            onChangeText={setDiagnosisNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>2. Resolution</Text>
          <TextInput style={styles.textArea} placeholder="Resolution Notes *" placeholderTextColor={colors.textSecondary} value={resolutionNotes} onChangeText={setResolutionNotes} multiline numberOfLines={3} textAlignVertical="top" />

          <Text style={styles.sectionTitle}>3. Parts Used</Text>
          {parts.map((p, i) => (
            <View key={i} style={styles.partItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.partName}>{p.partName}</Text>
                <Text style={styles.partDetail}>{p.quantity} x ₹{p.unitPrice}</Text>
              </View>
              <Text style={styles.partTotal}>₹{p.quantity * p.unitPrice}</Text>
              <MaterialIcons name="delete" size={24} color={palette.red} onPress={() => removePart(i)} style={{ marginLeft: spacing.sm }} />
            </View>
          ))}

          <View style={styles.addPartCard}>
            <TextInput style={styles.input} placeholder="Part Name" placeholderTextColor={colors.textSecondary} value={newPartName} onChangeText={setNewPartName} />
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Qty" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={newPartQty} onChangeText={setNewPartQty} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: spacing.sm }]} placeholder="Price" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={newPartPrice} onChangeText={setNewPartPrice} />
            </View>
            <Button label="Add Part" variant="outline" onPress={addPart} style={{ marginTop: spacing.sm }} />
          </View>

          {parts.length > 0 && (
            <Text style={styles.totalText}>Total Parts Cost: ₹{partsTotal}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenFooter style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <Button label="Continue to Photos" onPress={handleContinue} disabled={!isFormValid} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: {
    ...typography.h2,
    color: colors.textPrimary, marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary, marginBottom: spacing.lg
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 80,
    marginBottom: spacing.sm,
  },
  partItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  partName: { ...typography.bodyMedium, color: colors.textPrimary },
  partDetail: {
    ...typography.caption,
    color: colors.textSecondary
  },
  partTotal: {
    ...typography.bodyMedium,
    color: colors.textPrimary, fontFamily: typography.h1.fontFamily
  },
  addPartCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row' },
  totalText: {
    ...typography.h3,
    color: colors.textPrimary, textAlign: 'right', marginTop: spacing.md
  },
});
