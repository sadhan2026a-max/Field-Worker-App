import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, palette } from '@/core/theme';
import { ChecklistTemplateItem, ChecklistItem } from '@/features/assignment/types/Assignment';
import { ValidationResult, validateChecklistItem } from '@/features/assignment/utils/validation';

interface DynamicFieldProps {
  template: ChecklistTemplateItem;
  item: ChecklistItem;
  onChange: (value: any) => void;
  onNotesChange: (notes: string) => void;
}

export function DynamicField({ template, item, onChange, onNotesChange }: DynamicFieldProps) {
  // Determine if it's the legacy simple checkbox or something else
  const fieldType = template.fieldType || 'checkbox';

  const validation: ValidationResult = validateChecklistItem(template, item);

  const renderField = () => {
    switch (fieldType) {
      case 'checkbox':
        // Checkbox is handled entirely in the headerRow now
        return null;
      
      case 'text':
      case 'number':
        return (
          <TextInput
            style={[styles.input, !validation.isValid && validation.errorMessage ? styles.inputError : null]}
            placeholder={`Enter ${template.label}`}
            value={item.value?.toString() || ''}
            keyboardType={fieldType === 'number' ? 'numeric' : 'default'}
            onChangeText={onChange}
          />
        );

      case 'dropdown':
      case 'radio':
        // A simple placeholder for dropdown/radio for now - ideally use a BottomSheet or Picker
        return (
          <View style={styles.optionsContainer}>
            {template.validationRules?.options?.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.optionChip, item.value === opt && styles.optionChipSelected]}
                onPress={() => onChange(opt)}
              >
                <Text style={[styles.optionText, item.value === opt && styles.optionTextSelected]}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        );

      // Fallback for image, signature, date, time etc. that would require specific libraries
      default:
        return (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Unsupported field type: {fieldType}</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, fieldType === 'checkbox' && item.isChecked && styles.containerChecked]}>
      {fieldType === 'checkbox' ? (
        <Pressable 
          style={styles.headerRow} 
          onPress={() => onChange(!item.isChecked)}
        >
          <Text style={[styles.label, item.isChecked && styles.labelChecked]}>
            {template.label} {template.isRequired && <Text style={styles.required}>*</Text>}
          </Text>
          <MaterialIcons 
            name={item.isChecked ? "check-circle" : "radio-button-unchecked"} 
            size={28} 
            color={item.isChecked ? palette.green : colors.textSecondary} 
          />
        </Pressable>
      ) : (
        <View style={styles.headerRow}>
          <Text style={styles.label}>
            {template.label} {template.isRequired && <Text style={styles.required}>*</Text>}
          </Text>
        </View>
      )}

      {/* For non-checkbox fields, render them below the label */}
      {fieldType !== 'checkbox' && (
        <View style={styles.fieldWrapper}>
          {renderField()}
        </View>
      )}

      {!validation.isValid && validation.errorMessage && (
        <Text style={styles.errorText}>{validation.errorMessage}</Text>
      )}

      <TextInput
        style={styles.notesInput}
        placeholder="Add note (optional)"
        value={item.notes || ''}
        onChangeText={onNotesChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  containerChecked: {
    backgroundColor: palette.greenLight,
    borderColor: palette.green,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    flex: 1,
    marginRight: spacing.sm,
  },
  labelChecked: {
    color: palette.greenDark,
    fontWeight: '500',
  },
  required: {
    color: palette.red,
  },
  fieldWrapper: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.md,
    ...typography.body,
  },
  inputError: {
    borderColor: palette.red,
  },
  errorText: {
    ...typography.caption,
    color: palette.red,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.sm,
    ...typography.caption,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: palette.greenLight,
    borderColor: palette.green,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: palette.greenDark,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    padding: spacing.md,
    backgroundColor: palette.grey100,
    borderRadius: 6,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }
});
