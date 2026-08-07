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
  const itemType = template.itemType || 'Checkbox';

  // If required and empty/unchecked
  if (isRequired) {
    if (itemType === 'Checkbox') {
      // For checkboxes, it must be explicitly checked (true)
      const checked = item.isChecked === true;
      if (!checked) {
        return { isValid: false, errorMessage: 'This field is required' };
      }
    } else {
      // For Text or Radio
      const isEmpty = value === undefined || value === null || String(value).trim() === '';
      if (isEmpty) {
        return { isValid: false, errorMessage: 'This field is required' };
      }
    }
  }

  // If there's no value, but it's not required, it's valid
  if (value === undefined || value === null || String(value).trim() === '') {
    return { isValid: true };
  }

  return { isValid: true };
}
