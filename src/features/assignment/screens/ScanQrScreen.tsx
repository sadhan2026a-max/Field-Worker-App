import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, palette, FontFamily, FontSize } from '@/core/theme';
import { useAssignments } from '@/hooks/useAssignments';
import { previewOrderByQrToken, acceptOrderByQrToken } from '@/features/assignment/api/assignmentService';
import { QrOrderSummaryDto, Assignment } from '@/features/assignment/types/Assignment';
import { useAppDispatch } from '@/store/hooks';
import { addAssignment } from '@/features/assignment/redux/assignmentSlice';

/** Extracts the QR token whether the code encodes the raw token or a URL ending in it. */
function extractToken(scanned: string): string {
  const trimmed = scanned.trim();
  if (!trimmed.includes('/')) return trimmed;
  const segments = trimmed.split('/').filter(Boolean);
  return segments[segments.length - 1];
}

export function ScanQrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { refetch: refetchAssignments } = useAssignments();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<'scanning' | 'loading' | 'previewing' | 'accepting'>('scanning');
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<QrOrderSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  const resetToScanning = useCallback(() => {
    hasScannedRef.current = false;
    setToken(null);
    setPreview(null);
    setError(null);
    setStatus('scanning');
  }, []);

  const onBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    const scannedToken = extractToken(result.data);
    setToken(scannedToken);
    setStatus('loading');
    setError(null);

    try {
      const summary = await previewOrderByQrToken(scannedToken);
      setPreview(summary);
      setStatus('previewing');
    } catch (e: any) {
      const message = e?.response?.status === 404
        ? 'This QR code is invalid or has expired.'
        : 'Could not read this order. Please try again.';
      setError(message);
      setStatus('scanning');
      hasScannedRef.current = false;
    }
  }, []);

  const onConfirm = async () => {
    if (!token) return;
    setStatus('accepting');
    try {
      const result = await acceptOrderByQrToken(token);
      
      const newAssignment = {
        id: result.orderId,
        code: result.orderNumber,
        type: preview?.orderType?.toLowerCase() === 'pickup' ? 'pickup' : 'delivery',
        status: 'accepted',
        customer: {
          name: 'Customer',
          phone: 'N/A',
          address: preview?.pickupAddress || preview?.deliveryAddress || 'Address will be available shortly',
          location: { latitude: 0, longitude: 0 },
        },
        date: new Date().toISOString(),
        distanceKm: 0,
        amount: preview?.totalAmount,
        codAmount: 0,
        checklistTemplate: [],
        items: [],
        timeline: [],
        createdAt: new Date().toISOString(),
      } as unknown as Assignment;
      
      dispatch(addAssignment(newAssignment));

      Toast.show({ type: 'success', text1: 'Order assigned to you', text2: result.orderNumber });
      // Don't rely purely on refetchAssignments because the endpoint only returns pending offers
      refetchAssignments();
      router.replace({ pathname: '/assignment/[id]', params: { id: result.orderId } });
    } catch (e: any) {
      const message = e?.response?.status === 409
        ? 'This order has already been assigned to another driver.'
        : 'Failed to assign this order. Please try again.';
      Toast.show({ type: 'error', text1: message });
      resetToScanning();
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <MaterialIcons name="qr-code-scanner" size={48} color={colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>Allow camera access to scan an order's QR code and assign it to yourself.</Text>
        <Button label="Grant Permission" onPress={requestPermission} style={{ marginTop: spacing.lg }} />
        <Button label="Cancel" variant="outline" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={status === 'scanning' ? onBarcodeScanned : undefined}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <Text style={styles.headerTitle} pointerEvents="none">Scan Order QR</Text>
          <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={colors.textInverse} />
          </Pressable>
        </View>

        {status === 'scanning' && (
          <View style={styles.scanFrame} pointerEvents="none">
            <Text style={styles.hint}>Point the camera at the order's QR code</Text>
          </View>
        )}

        {status === 'loading' && (
          <View style={styles.centerOverlay}>
            <ActivityIndicator color={colors.textInverse} size="large" />
          </View>
        )}

        {(status === 'previewing' || status === 'accepting') && preview && (
          <View style={styles.previewWrap}>
            <Card style={styles.previewCard}>
              <Text style={styles.previewOrderNumber}>{preview.orderNumber}</Text>
              <Text style={styles.previewType}>{preview.orderType} • {preview.status}</Text>
              {(preview.deliveryAddress || preview.pickupAddress) && (
                <Text style={styles.previewAddress}>{preview.deliveryAddress || preview.pickupAddress}</Text>
              )}
              <Text style={styles.previewAmount}>₹{(preview.totalAmount ?? 0).toLocaleString('en-IN')}</Text>

              <View style={styles.previewActions}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={resetToScanning}
                  disabled={status === 'accepting'}
                  style={{ flex: 1 }}
                />
                <Button
                  label="Assign to Me"
                  onPress={onConfirm}
                  loading={status === 'accepting'}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        )}

        {error && status === 'scanning' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textPrimary,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerTitle: {
    color: colors.textInverse,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.medium,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scanFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xxl,
  },
  hint: {
    color: colors.textInverse,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.small,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  centerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewWrap: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  previewCard: {
    gap: spacing.xs,
  },
  previewOrderNumber: {
    ...typography.h3,
  },
  previewType: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  previewAddress: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  previewAmount: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.bold,
    color: palette.green,
    marginTop: spacing.xs,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  errorBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    backgroundColor: palette.redLight,
    borderRadius: 12,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: palette.red,
    textAlign: 'center',
  },
});
