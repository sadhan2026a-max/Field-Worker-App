import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, palette, useTheme } from '@/core/theme';
import { useAssignment } from '@/features/assignment/hooks/useAssignments';
import { getChecklistTemplates, saveChecklist } from '@/features/assignment/api/assignmentService';
import { ChecklistItem, ChecklistTemplateItem } from '@/features/assignment/types/Assignment';
import { DynamicField } from '@/features/assignment/components/DynamicField';
import { validateChecklistItem } from '@/features/assignment/utils/validation';
import { useAppDispatch } from '@/store/hooks';

export function ChecklistScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading: isAssignmentLoading } = useAssignment(id as string);

  const [templates, setTemplates] = useState<ChecklistTemplateItem[]>([]);
  const [items, setItems] = useState<Record<string, ChecklistItem>>({});
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!assignment || Object.keys(items).length === 0) return;
    const timeout = setTimeout(() => {
      dispatch({
        type: 'assignment/addAssignment',
        payload: {
          ...assignment,
          checklist: Object.values(items)
        }
      });
    }, 500);
    return () => clearTimeout(timeout);
  }, [items]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = async () => {
    if (!assignment?.type) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch templates based on assignment type (e.g., 'delivery' -> 'Delivery')
      // Ensure the first letter is capitalized to match backend enums
      const typeStr = assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1);

      let data: ChecklistTemplateItem[] = [];
      try {
        data = await getChecklistTemplates(typeStr);
      } catch (templateErr) {
        // Fallback: If 403 Forbidden or other error, use the checklist already attached to the order
        if (assignment.checklist && assignment.checklist.length > 0) {
          data = assignment.checklist.map(item => ({
            id: item.id,
            orderType: typeStr,
            label: item.label,
            isRequired: item.isRequired,
            isActive: true,
            sortOrder: item.sortOrder,
            itemType: item.itemType || 'Checkbox', // Default to basic checkbox
            options: item.options || [],
          }));
        } else {
          throw templateErr;
        }
      }

      setTemplates(data);

      // Initialize items state
      const initialItems: Record<string, ChecklistItem> = {};
      data.forEach(t => {
        const existingVal = assignment.checklist?.find(c => c.id === t.id);
        initialItems[t.id] = {
          id: t.id,
          label: t.label,
          isRequired: t.isRequired,
          isChecked: existingVal?.isChecked || false,
          value: existingVal?.value !== undefined && existingVal?.value !== null ? existingVal.value : (existingVal?.isChecked ? "true" : null),
          notes: existingVal?.notes || null,
          sortOrder: t.sortOrder,
          checkedAt: existingVal?.checkedAt || null,
          itemType: t.itemType,
          options: t.options,
        };
      });
      setItems(initialItems);

    } catch (err) {
      setError('Failed to load checklist. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAssignmentLoading && assignment && Object.keys(items).length === 0) {
      fetchTemplates();
    }
  }, [isAssignmentLoading, assignment?.id]);

  const updateItemValue = (templateId: string, val: any) => {
    setItems((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        value: val,
        isChecked: typeof val === 'boolean' ? val : !!val, // fallback for legacy
        checkedAt: (val !== null && val !== undefined && val !== '') ? new Date().toISOString() : null,
      }
    }));
  };

  const updateNotes = (templateId: string, val: string) => {
    setItems((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        notes: val,
      }
    }));
  };

  const handleContinue = async () => {
    // Validate all items before continuing
    let allValid = true;
    for (const t of templates) {
      const item = items[t.id];
      const result = validateChecklistItem(t, item);
      if (!result.isValid) {
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      Alert.alert('Validation Error', 'Please complete all required fields correctly before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsArray = Object.values(items);
      await saveChecklist(id as string, itemsArray);

      Toast.show({ type: 'success', text1: 'Checklist saved successfully' });

      // Navigate to the next logical step based on assignment type
      safeRouter.push(`/assignment/${id}/proof`);

    } catch (err) {
      Alert.alert('Error', 'Failed to save checklist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAssignmentLoading || isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading checklist...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Try Again" onPress={fetchTemplates} variant="outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: spacing.sm, marginLeft: -8, padding: spacing.xs }}>
            <MaterialIcons name="arrow-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { marginBottom: 0 }]}>Checklist</Text>
        </View>
        <Text style={styles.subtitle}>Order #{assignment?.code}</Text>

        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No checklist required for this assignment.</Text>
          </View>
        ) : (
          templates
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((template) => (
              <DynamicField
                key={template.id}
                template={template}
                item={items[template.id]}
                onChange={(val) => updateItemValue(template.id, val)}
                onNotesChange={(val) => updateNotes(template.id, val)}
              />
            ))
        )}
      </ScrollView>

      <ScreenFooter>
        <Button
          label={templates.length === 0 ? "Continue" : "Submit Checklist"}
          onPress={handleContinue}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: palette.red,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
  }
});
