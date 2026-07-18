import { ChecklistTemplateItem, ChecklistItem } from '@/features/assignment/types/Assignment';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function validateChecklistItem(
  template: ChecklistTemplateItem,
  item: ChecklistItem
): ValidationResult {
  const value = item.value;
  const isRequired = template.isRequired;

  // If required and empty/unchecked
  if (isRequired) {
    // Check for empty string, null, undefined
    const isEmpty = value === undefined || value === null || value === '';
    
    if (template.fieldType === 'checkbox' || !template.fieldType) {
      // For checkboxes, it must be explicitly checked (true)
      // Both item.value and item.isChecked might be used depending on where it's called
      const checked = (typeof value === 'boolean' ? value : false) || item.isChecked;
      if (!checked) {
        return { isValid: false, errorMessage: 'This field is required' };
      }
    } else if (isEmpty) {
      return { isValid: false, errorMessage: 'This field is required' };
    }
  }

  // If there's no value, but it's not required, it's valid
  if (value === undefined || value === null || value === '') {
    return { isValid: true };
  }

  // Additional rules if defined
  if (template.validationRules) {
    const rules = template.validationRules;

    if (template.fieldType === 'text' || template.fieldType === 'signature' || template.fieldType === 'image') {
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        return { isValid: false, errorMessage: `Maximum length is ${rules.maxLength}` };
      }
      if (rules.pattern && typeof value === 'string') {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          return { isValid: false, errorMessage: 'Invalid format' };
        }
      }
    }

    if (template.fieldType === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { isValid: false, errorMessage: 'Must be a number' };
      }
      if (rules.min !== undefined && numValue < rules.min) {
        return { isValid: false, errorMessage: `Minimum value is ${rules.min}` };
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return { isValid: false, errorMessage: `Maximum value is ${rules.max}` };
      }
    }

    if (template.fieldType === 'multiselect' && Array.isArray(value)) {
      // We might have min/max for array length here, using min/max rules
      if (rules.min !== undefined && value.length < rules.min) {
        return { isValid: false, errorMessage: `Select at least ${rules.min} options` };
      }
      if (rules.max !== undefined && value.length > rules.max) {
        return { isValid: false, errorMessage: `Select at most ${rules.max} options` };
      }
    }
  }

  return { isValid: true };
}
