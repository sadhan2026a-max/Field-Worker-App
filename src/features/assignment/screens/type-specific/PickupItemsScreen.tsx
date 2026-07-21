import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { Input } from '@/components/ui/Input';
import { colors, spacing, typography, radius } from '@/core/theme';
import { useAssignment, useUpdateOrderItems } from '@/features/assignment/hooks/useAssignments';
import { MaterialIcons } from '@expo/vector-icons';
import { ToastAndroid } from 'react-native';

export function PickupItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment } = useAssignment(id as string);
  const { mutateAsync: updateOrderItems, isPending } = useUpdateOrderItems();

  // Store edited quantities keyed by item ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (assignment?.items) {
      const initialQuantities: Record<string, number> = {};
      assignment.items.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
      setQuantities(initialQuantities);
    }
  }, [assignment?.items]);

  const handleQuantityChange = (itemId: string, text: string) => {
    const val = parseInt(text, 10);
    setQuantities(prev => ({
      ...prev,
      [itemId]: isNaN(val) ? 0 : val
    }));
  };

  const handleContinue = async () => {
    try {
      const updatedItems = Object.entries(quantities).map(([itemId, quantity]) => ({
        id: itemId,
        quantity,
      }));
      
      if (updatedItems.length > 0) {
        await updateOrderItems({ id: id as string, items: updatedItems });
      }
      
      router.replace(`/assignment/${id}/proof`);
    } catch (e) {
      ToastAndroid.show('Failed to update items', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pickup Items</Text>
        <Text style={styles.subtitle}>Confirm items to collect for order #{assignment?.code}</Text>
        
        {assignment?.items && assignment.items.length > 0 ? (
          assignment.items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.description}</Text>
                <Text style={styles.itemDetail}>Expected: {item.quantity} {item.unitName}</Text>
                <Text style={styles.itemDetail}>Price: ₹{item.unitPrice}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Collected:</Text>
                <Input 
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantities[item.id]?.toString() || '0'}
                  onChangeText={(text) => handleQuantityChange(item.id, text)}
                />
              </View>
            </View>
          ))
        ) : assignment?.itemCount ? (
          <View style={styles.card}>
            <Text style={styles.itemText}>Items to pickup: {assignment.itemCount}</Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No line items recorded for this order.</Text>
          </View>
        )}
      </ScrollView>
      
      <ScreenFooter>
        <Button label="Continue" onPress={handleContinue} loading={isPending} />
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  card: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  emptyCard: { padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  itemText: { ...typography.bodyMedium },
  emptyText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  
  itemCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs
  },
  itemName: {
    ...typography.bodyMedium,
    fontWeight: '600'
  },
  itemDetail: {
    ...typography.caption,
    color: colors.textSecondary
  },
  quantityContainer: {
    width: 80,
    alignItems: 'center',
    gap: spacing.xs
  },
  quantityLabel: {
    ...typography.caption,
    color: colors.textSecondary
  },
  quantityInput: {
    textAlign: 'center',
    height: 40,
    paddingHorizontal: 0
  }
});
