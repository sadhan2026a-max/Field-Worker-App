import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, spacing, typography, palette } from '@/core/theme';
import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { saveServiceDetail } from '@/features/assignment/api/assignmentService';
import { PartUsed } from '@/features/assignment/types/Assignment';
import { MaterialIcons } from '@expo/vector-icons';

export function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [parts, setParts] = useState<PartUsed[]>([]);
  
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('');
  const [newPartPrice, setNewPartPrice] = useState('');

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
    safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: id as string } });
  };

  const isFormValid = diagnosisNotes.length > 0 && resolutionNotes.length > 0;
  const partsTotal = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Service Visit</Text>
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
          value={diagnosisNotes} 
          onChangeText={setDiagnosisNotes} 
          multiline 
          numberOfLines={3} 
          textAlignVertical="top" 
        />

        <Text style={styles.sectionTitle}>2. Resolution</Text>
        <TextInput style={styles.textArea} placeholder="Resolution Notes *" value={resolutionNotes} onChangeText={setResolutionNotes} multiline numberOfLines={3} textAlignVertical="top" />

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
          <TextInput style={styles.input} placeholder="Part Name" value={newPartName} onChangeText={setNewPartName} />
          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Qty" keyboardType="numeric" value={newPartQty} onChangeText={setNewPartQty} />
            <TextInput style={[styles.input, { flex: 1, marginLeft: spacing.sm }]} placeholder="Price" keyboardType="numeric" value={newPartPrice} onChangeText={setNewPartPrice} />
          </View>
          <Button label="Add Part" variant="outline" onPress={addPart} style={{ marginTop: spacing.sm }} />
        </View>

        {parts.length > 0 && (
          <Text style={styles.totalText}>Total Parts Cost: ₹{partsTotal}</Text>
        )}
      </ScrollView>
      
      <ScreenFooter>
        <Button label="Continue to Photos" onPress={handleContinue} disabled={!isFormValid} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.sm },
  infoBox: {
    backgroundColor: palette.grey50,
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
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
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
  partName: { ...typography.bodyMedium },
  partDetail: { ...typography.caption, color: colors.textSecondary },
  partTotal: { ...typography.bodyMedium, fontFamily: typography.h1.fontFamily },
  addPartCard: {
    backgroundColor: palette.grey50,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row' },
  totalText: { ...typography.h3, textAlign: 'right', marginTop: spacing.md },
});
