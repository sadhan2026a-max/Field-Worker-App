import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCancelledAlert, hideCancelledAlert } from '@/features/assignment/redux/assignmentSlice';
import { useTheme, spacing, radius, typography } from '@/core/theme';
import { router } from 'expo-router';

export function CancellationModal() {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { visible, orderCode } = useAppSelector(selectCancelledAlert);
  const styles = React.useMemo(() => useStyles(colors), [colors]);

  const handleClose = () => {
    dispatch(hideCancelledAlert());
    // Auto navigate back when dismissing the cancellation modal
    router.back();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="cancel" size={48} color={colors.danger} />
          </View>
          <Text style={styles.title}>Order Cancelled</Text>
          <Text style={styles.message}>
            Order <Text style={{ fontWeight: 'bold' }}>{orderCode}</Text> has been cancelled
          </Text>
          <Pressable style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    backgroundColor: colors.danger + '15',
    padding: spacing.md,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  button: {
    backgroundColor: colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
