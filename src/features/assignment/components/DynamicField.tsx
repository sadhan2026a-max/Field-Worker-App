import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, Modal, ScrollView, Image } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { spacing, typography, palette, useTheme, radius } from '@/core/theme';
import { ChecklistTemplateItem, ChecklistItem } from '@/features/assignment/types/Assignment';
import { ValidationResult, validateChecklistItem } from '@/features/assignment/utils/validation';
import { SignaturePad, SignaturePadHandle } from '@/components/ui/SignaturePad';

interface DynamicFieldProps {
  template: ChecklistTemplateItem;
  item: ChecklistItem;
  onChange: (value: any) => void;
  onNotesChange: (notes: string) => void;
}

export function DynamicField({ template, item, onChange, onNotesChange }: DynamicFieldProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);

  const itemType = template.itemType || 'Checkbox';
  const validation: ValidationResult = validateChecklistItem(template, item);

  // States for modals and pickers
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMultiselect, setShowMultiselect] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const signaturePadRef = useRef<SignaturePadHandle>(null);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]); // YYYY-MM-DD
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      onChange(selectedTime.toISOString().split('T')[1].substring(0, 5)); // HH:mm
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      onChange(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleMultiselect = (opt: string) => {
    let currentValues: string[] = [];
    try {
      currentValues = item.value ? JSON.parse(item.value) : [];
      if (!Array.isArray(currentValues)) currentValues = [];
    } catch {
      currentValues = item.value ? item.value.split(',').map(s => s.trim()) : [];
    }

    if (currentValues.includes(opt)) {
      onChange(JSON.stringify(currentValues.filter(v => v !== opt)));
    } else {
      onChange(JSON.stringify([...currentValues, opt]));
    }
  };

  const getMultiselectValues = (): string[] => {
    try {
      const parsed = item.value ? JSON.parse(item.value) : [];
      return Array.isArray(parsed) ? parsed : (item.value ? item.value.split(',').map(s => s.trim()) : []);
    } catch {
      return item.value ? item.value.split(',').map(s => s.trim()) : [];
    }
  };

  const renderField = () => {
    switch (itemType) {
      case 'Checkbox':
        return null;

      case 'Text':
        return (
          <TextInput
            style={[styles.input, !validation.isValid && validation.errorMessage ? styles.inputError : null]}
            placeholder={`Enter ${template.label}`}
            placeholderTextColor={colors.textSecondary}
            value={item.value?.toString() || ''}
            onChangeText={onChange}
          />
        );

      case 'Number':
        return (
          <TextInput
            style={[styles.input, !validation.isValid && validation.errorMessage ? styles.inputError : null]}
            placeholder={`Enter ${template.label}`}
            placeholderTextColor={colors.textSecondary}
            value={item.value?.toString() || ''}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        );

      case 'Radio':
        return (
          <View style={styles.radioGroup}>
            {template.options?.map((opt) => (
              <Pressable key={opt} style={styles.radioRow} onPress={() => onChange(opt)}>
                <MaterialIcons
                  name={item.value === opt ? "radio-button-checked" : "radio-button-unchecked"}
                  size={24}
                  color={item.value === opt ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.radioText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        );

      case 'Dropdown':
        return (
          <>
            <Pressable style={styles.dropdownSelector} onPress={() => setShowDropdown(true)}>
              <Text style={[styles.dropdownText, !item.value && { color: colors.textSecondary }]}>
                {item.value || `Select ${template.label}`}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
            <Modal visible={showDropdown} transparent animationType="slide">
              <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select {template.label}</Text>
                  <ScrollView>
                    {template.options?.map((opt) => (
                      <Pressable
                        key={opt}
                        style={styles.modalOption}
                        onPress={() => {
                          onChange(opt);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={[styles.modalOptionText, item.value === opt && { color: colors.primary, fontWeight: 'bold' }]}>{opt}</Text>
                        {item.value === opt && <MaterialIcons name="check" size={20} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          </>
        );

      case 'Multiselect':
        const selectedValues = getMultiselectValues();
        return (
          <>
            <Pressable style={styles.dropdownSelector} onPress={() => setShowMultiselect(true)}>
              <Text style={[styles.dropdownText, selectedValues.length === 0 && { color: colors.textSecondary }]} numberOfLines={1}>
                {selectedValues.length > 0 ? selectedValues.join(', ') : `Select ${template.label}`}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
            <Modal visible={showMultiselect} transparent animationType="slide">
              <Pressable style={styles.modalOverlay} onPress={() => setShowMultiselect(false)}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.modalTitle}>Select {template.label}</Text>
                  <ScrollView>
                    {template.options?.map((opt) => {
                      const isSelected = selectedValues.includes(opt);
                      return (
                        <Pressable key={opt} style={styles.modalOption} onPress={() => handleMultiselect(opt)}>
                          <MaterialIcons name={isSelected ? "check-box" : "check-box-outline-blank"} size={24} color={isSelected ? colors.primary : colors.textSecondary} />
                          <Text style={[styles.modalOptionText, { marginLeft: spacing.sm }]}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <Pressable style={styles.modalDoneButton} onPress={() => setShowMultiselect(false)}>
                    <Text style={styles.modalDoneText}>Done</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>
          </>
        );

      case 'Date':
        return (
          <View>
            <Pressable style={styles.dropdownSelector} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.dropdownText, !item.value && { color: colors.textSecondary }]}>
                {item.value || `Select Date`}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={item.value ? new Date(item.value) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        );

      case 'Time':
        return (
          <View>
            <Pressable style={styles.dropdownSelector} onPress={() => setShowTimePicker(true)}>
              <Text style={[styles.dropdownText, !item.value && { color: colors.textSecondary }]}>
                {item.value || `Select Time`}
              </Text>
              <MaterialIcons name="access-time" size={20} color={colors.textSecondary} />
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={item.value ? new Date(`1970-01-01T${item.value}:00Z`) : new Date()}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        );

      case 'Image':
        return (
          <View style={styles.imageBox}>
            {item.value ? (
              <Image source={{ uri: item.value }} style={styles.capturedImage} />
            ) : (
              <MaterialIcons name="photo-camera" size={32} color={colors.textSecondary} />
            )}
            <Pressable style={styles.cameraButton} onPress={takePhoto}>
              <MaterialIcons name="camera-alt" size={18} color={colors.textInverse} />
            </Pressable>
          </View>
        );

      case 'Signature':
        return (
          <View style={styles.signatureBox}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureLabel}>Customer Signature</Text>
              <Pressable onPress={() => { signaturePadRef.current?.clear(); onChange(''); }}>
                <Text style={styles.clearLabel}>Clear</Text>
              </Pressable>
            </View>
            <SignaturePad
              ref={signaturePadRef}
              onChange={(has, data) => onChange(has ? data : '')}
            />
          </View>
        );

      default:
        return (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Unsupported field type: {itemType}</Text>
          </View>
        );
    }
  };

  const isChecked = item.isChecked;

  return (
    <View style={[styles.container, isChecked && styles.containerChecked]}>
      {itemType === 'Checkbox' ? (
        <Pressable style={styles.headerRow} onPress={() => onChange(!item.isChecked)}>
          <Text style={[styles.label, isChecked && styles.labelChecked]}>
            {template.label}{template.isRequired && <Text style={styles.required}> *</Text>}
          </Text>
          {isChecked ? (
            <View style={styles.checkCircleFilled}>
              <MaterialIcons name="check" size={18} color="#fff" />
            </View>
          ) : (
            <View style={styles.checkCircleEmpty} />
          )}
        </Pressable>
      ) : (
        <View style={styles.headerRow}>
          <Text style={styles.label}>
            {template.label}{template.isRequired && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {itemType !== 'Checkbox' && (
        <View style={styles.fieldWrapper}>
          {renderField()}
        </View>
      )}

      {!validation.isValid && validation.errorMessage && (
        <Text style={styles.errorText}>{validation.errorMessage}</Text>
      )}

    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  containerChecked: {
    borderColor: palette.green,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
    fontSize: 15,
  },
  labelChecked: {
    color: palette.green,
  },
  required: { color: palette.red },
  checkCircleFilled: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleEmpty: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C0C0C0', // A slightly darker grey for better visibility
    backgroundColor: 'transparent',
  },
  fieldWrapper: { marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputError: { borderColor: palette.red },
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
    color: colors.textPrimary,
  },
  radioGroup: { gap: spacing.sm },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  radioText: { ...typography.body, color: colors.textPrimary },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: spacing.md,
  },
  dropdownText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: { ...typography.body, color: colors.textPrimary },
  modalDoneButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalDoneText: { color: colors.textInverse, fontWeight: 'bold' },
  imageBox: {
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  capturedImage: { width: '100%', height: '100%' },
  cameraButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureBox: { gap: spacing.sm },
  signatureHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  signatureLabel: { ...typography.caption, color: colors.textSecondary },
  clearLabel: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  fallbackContainer: { padding: spacing.md, backgroundColor: palette.grey100, borderRadius: 6 },
  fallbackText: { ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }
});
