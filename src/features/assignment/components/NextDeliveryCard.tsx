import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Pressable, Linking, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { FontFamily, useTheme } from '@/core/theme';
import { Assignment } from '@/domain/entities/Assignment';
import { DistanceDisplay } from '@/features/assignment/components';
import { useCurrentLocation } from '@/shared/utils/location';
import { useAcceptOffer, useDeclineOffer } from '@/features/assignment/hooks/useAssignments';
import { externalMapsUrl } from '@/shared/services/maps';

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending Acceptance',
    accepted: 'Accepted',
    en_route: 'En Route',
    arrived: 'At Location',
    in_progress: 'In Progress',
  };
  return labels[status] || status.replace(/_/g, ' ');
}

function getStatusTheme(status: string): { text: string; bg: string; border: string; dot: string } {
  switch (status) {
    case 'pending':
      return { text: '#D97706', bg: '#FEF3C7', border: '#FDE68A', dot: '#F59E0B' };
    case 'accepted':
      return { text: '#7C3AED', bg: '#F3E8FF', border: '#E9D5FF', dot: '#8B5CF6' };
    case 'en_route':
      return { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' };
    case 'arrived':
      return { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#10B981' };
    case 'in_progress':
      return { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6' };
    default:
      return { text: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', dot: '#6B7280' };
  }
}

function getTypeDetails(type?: string): { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; color: string } {
  switch (type) {
    case 'delivery':
      return { icon: 'local-shipping', label: 'Delivery', bg: '#EFF6FF', color: '#1D4ED8' };
    case 'pickup':
      return { icon: 'archive', label: 'Pickup', bg: '#FEF3C7', color: '#B45309' };
    case 'return':
      return { icon: 'assignment-return', label: 'Return', bg: '#FEE2E2', color: '#B91C1C' };
    case 'installation':
      return { icon: 'build', label: 'Installation', bg: '#DCFCE7', color: '#15803D' };
    case 'inspection':
      return { icon: 'fact-check', label: 'Inspection', bg: '#F3E8FF', color: '#7E22CE' };
    case 'service_visit':
    case 'service':
      return { icon: 'engineering', label: 'Service', bg: '#E0E7FF', color: '#4338CA' };
    default:
      return { icon: 'shopping-bag', label: 'Task', bg: '#F1F5F9', color: '#334155' };
  }
}

interface NextDeliveryCardProps {
  assignment: Assignment;
  onStart: () => void;
}

export function NextDeliveryCard({ assignment, onStart }: NextDeliveryCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const currentLocation = useCurrentLocation();
  const statusTheme = getStatusTheme(assignment.status);
  const typeDetails = getTypeDetails(assignment.type);

  const acceptOffer = useAcceptOffer();
  const declineOffer = useDeclineOffer();
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const onAccept = async () => {
    setActionType('accept');
    try {
      await acceptOffer.mutateAsync(assignment.offerId ?? assignment.id);
      Toast.show({ type: 'success', text1: 'Offer Accepted' });
    } catch (error: any) {
      Toast.show({ type: 'info', text1: error?.message || 'Failed to accept offer' });
    } finally {
      setActionType(null);
    }
  };

  const onDecline = () => {
    setShowDeclineModal(true);
  };

  const handleConfirmDecline = async () => {
    setActionType('decline');
    try {
      await declineOffer.mutateAsync(assignment.offerId ?? assignment.id);
      setShowDeclineModal(false);
      Toast.show({ type: 'success', text1: 'Offer Declined' });
    } catch (error: any) {
      Toast.show({ type: 'info', text1: error?.message || 'Failed to decline offer' });
    } finally {
      setActionType(null);
    }
  };

  const handlePhoneCall = () => {
    if (assignment.customer?.phone && assignment.customer.phone !== 'N/A') {
      Linking.openURL(`tel:${assignment.customer.phone}`).catch(() => {
        Toast.show({ type: 'error', text1: 'Could not open phone dialer' });
      });
    } else {
      Toast.show({ type: 'info', text1: 'Phone number unavailable' });
    }
  };

  const handleWhatsApp = () => {
    if (assignment.customer?.phone && assignment.customer.phone !== 'N/A') {
      const clean = assignment.customer.phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${clean}`).catch(() => {
        Toast.show({ type: 'info', text1: 'WhatsApp not available' });
      });
    }
  };

  const handleOpenNavigation = () => {
    if (assignment.customer?.location) {
      const url = externalMapsUrl(
        assignment.customer.location,
        assignment.customer.name,
        assignment.customer.address
      );
      Linking.openURL(url).catch(() => {
        Toast.show({ type: 'error', text1: 'Could not open map app' });
      });
    }
  };

  const orderCode = assignment.code && assignment.code !== 'N/A'
    ? assignment.code
    : assignment.id?.slice(0, 8) || 'N/A';

  const itemCount = assignment.items?.length || assignment.itemCount || 0;
  const isCod =
    Boolean((assignment as any).isCod) ||
    (assignment.codAmount ?? 0) > 0 ||
    String(assignment.paymentMode || (assignment as any).paymentMethod || (assignment as any).paymentType || '').toLowerCase().includes('cash') ||
    String(assignment.paymentMode || (assignment as any).paymentMethod || (assignment as any).paymentType || '').toLowerCase().includes('cod');
  const displayAmount =
    (assignment.codAmount && assignment.codAmount > 0 ? assignment.codAmount : null) ??
    (assignment.totalAmount && assignment.totalAmount > 0 ? assignment.totalAmount : null) ??
    (assignment as any).amount ??
    assignment.receivedAmount ??
    0;

  const rawLandmark =
    assignment.landmark ||
    assignment.deliveryInstructions?.match(/landmark[:\s]*(.+)/i)?.[1]?.trim() ||
    (assignment.customer?.address?.toLowerCase().includes('near')
      ? 'Near ' + assignment.customer.address.split(/near/i)[1].split(',')[0].trim()
      : null);

  const getActionLabel = () => {
    switch (assignment.status) {
      case 'accepted':
        return 'Start Trip';
      case 'en_route':
        return 'Continue Navigation';
      case 'arrived':
        return 'Proceed with Job';
      case 'in_progress':
        return 'Complete Order';
      default:
        return 'Start Job';
    }
  };

  return (
    <>
      <Pressable
        style={styles.container}
        onPress={() => {
          if (assignment.status !== 'pending') {
            router.push({ pathname: '/assignment/[id]', params: { id: assignment.id } });
          }
        }}
      >
        {/* ─── Header Strip: Order ID & Status ─── */}
        <View style={styles.headerStrip}>
          <View style={styles.headerLeft}>
            <View style={[styles.typeChip, { backgroundColor: typeDetails.bg }]}>
              <MaterialIcons name={typeDetails.icon} size={11} color={typeDetails.color} />
              <Text style={[styles.typeChipText, { color: typeDetails.color }]}>
                {typeDetails.label}
              </Text>
            </View>
            <Text style={styles.orderIdText}>#{orderCode}</Text>
          </View>

          <View style={[styles.statusChip, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border }]}>
            <View style={[styles.statusDot, { backgroundColor: statusTheme.dot }]} />
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {getStatusLabel(assignment.status)}
            </Text>
          </View>
        </View>

        {/* ─── Waypoint & Destination Section ─── */}
        <View style={styles.routeSection}>
          <View style={styles.waypointColumn}>
            <View style={styles.pinDot} />
            <View style={styles.pinLine} />
            <MaterialIcons name="location-on" size={14} color={colors.primary} />
          </View>

          <View style={styles.destinationDetails}>
            <View style={styles.customerNameRow}>
              <Text style={styles.customerName} numberOfLines={1}>
                {assignment.customer?.name || 'Customer'}
              </Text>

              {assignment.customer?.location?.latitude !== 0 || assignment.customer?.location?.longitude !== 0 ? (
                <View style={styles.distanceBadge}>
                  <MaterialIcons name="near-me" size={10} color={colors.primary} />
                  <DistanceDisplay
                    style={styles.distanceText}
                    currentLocation={currentLocation}
                    targetLocation={assignment.customer?.location}
                    targetAddress={assignment.customer?.address}
                    backendDistanceKm={assignment.distanceKm}
                  />
                </View>
              ) : null}
            </View>

            <Text style={styles.addressText} numberOfLines={2}>
              {assignment.customer?.address && assignment.customer.address !== 'Address will be available after acceptance'
                ? assignment.customer.address
                : 'Address details available upon acceptance'}
            </Text>

            {rawLandmark ? (
              <View style={styles.landmarkPill}>
                <MaterialIcons name="store" size={10} color={colors.textSecondary} />
                <Text style={styles.landmarkText} numberOfLines={1}>{rawLandmark}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── One-Tap Action Tools: Maps, Call, WhatsApp (Available after Acceptance) ─── */}
        <View style={styles.toolsRow}>
          {assignment.status !== 'pending' && (
            <Pressable
              style={styles.toolButton}
              onPress={handleOpenNavigation}
              android_ripple={{ color: colors.primary + '18' }}
            >
              <MaterialIcons name="navigation" size={12} color={colors.primary} />
              <Text style={styles.toolButtonText}>Navigate</Text>
            </Pressable>
          )}

          {assignment.status !== 'pending' && assignment.customer?.phone && assignment.customer.phone !== 'N/A' && (
            <>
              <Pressable
                style={styles.toolButton}
                onPress={handlePhoneCall}
                android_ripple={{ color: colors.primary + '18' }}
              >
                <MaterialIcons name="phone" size={12} color={colors.primary} />
                <Text style={styles.toolButtonText}>Call</Text>
              </Pressable>

              <Pressable
                style={styles.toolButton}
                onPress={handleWhatsApp}
                android_ripple={{ color: '#16A34A18' }}
              >
                <MaterialIcons name="chat" size={12} color="#16A34A" />
                <Text style={[styles.toolButtonText, { color: '#16A34A' }]}>WhatsApp</Text>
              </Pressable>
            </>
          )}

          {/* Quick Package & Payment Pill */}
          <View style={styles.paymentInfoPill}>
            <Text style={[styles.paymentInfoText, isCod && { color: '#B45309' }]}>
              {isCod ? `COD ₹${displayAmount}` : 'Prepaid'}
            </Text>
          </View>
        </View>

        {/* ─── Primary Action CTA Section ─── */}
        {assignment.status === 'pending' ? (
          <View style={styles.dualActionRow}>
            <Pressable
              onPress={onDecline}
              disabled={actionType === 'accept' && acceptOffer.isPending}
              style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.85 }]}
            >
              {actionType === 'decline' && declineOffer.isPending ? (
                <ActivityIndicator color="#EF4444" size="small" style={{ transform: [{ scale: 0.7 }] }} />
              ) : (
                <Text style={styles.declineBtnText}>Decline</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onAccept}
              disabled={actionType === 'decline' && declineOffer.isPending}
              style={styles.acceptBtnWrapper}
            >
              <LinearGradient
                colors={colors.headerGradient as [string, string, ...string[]] || [colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtnGradient}
              >
                <Text style={styles.acceptBtnText}>
                  {actionType === 'accept' && acceptOffer.isPending ? 'Accepting...' : 'Accept Job'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onStart} style={styles.primaryCtaWrapper}>
            <LinearGradient
              colors={colors.headerGradient as [string, string, ...string[]] || [colors.primaryDark || '#047857', colors.primary || '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCtaGradient}
            >
              <Text style={styles.primaryCtaText}>{getActionLabel()}</Text>
              <MaterialIcons name="arrow-forward" size={15} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}
      </Pressable>

      {/* Decline Confirmation Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (actionType !== 'decline') setShowDeclineModal(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (actionType !== 'decline') setShowDeclineModal(false);
          }}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Decline Assignment</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to decline this job? It will be reallocated to another partner.
            </Text>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.modalCancelBtnPressed]}
                onPress={() => setShowDeclineModal(false)}
                disabled={actionType === 'decline'}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  pressed && { opacity: 0.85 },
                  actionType === 'decline' && { opacity: 0.7 },
                ]}
                onPress={handleConfirmDecline}
                disabled={actionType === 'decline'}
              >
                {actionType === 'decline' && declineOffer.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.75 }] }} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Decline</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '60',
    marginBottom: 9,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 3,
  },
  typeChipText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
  },
  orderIdText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 0.8,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.1,
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 9,
  },
  waypointColumn: {
    alignItems: 'center',
    paddingTop: 3,
    width: 14,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  pinLine: {
    width: 1.5,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  destinationDetails: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  addressText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
  },
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  landmarkText: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    opacity: 0.85,
  },
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border + '50',
    marginBottom: 9,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 0.8,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    gap: 3.5,
  },
  toolButtonText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  paymentInfoPill: {
    marginLeft: 'auto',
    backgroundColor: colors.background,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  paymentInfoText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9,
    height: 36,
  },
  declineBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#EF4444',
  },
  acceptBtnWrapper: {
    flex: 1,
    borderRadius: 9,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  acceptBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primaryCtaWrapper: {
    borderRadius: 9,
    overflow: 'hidden',
  },
  primaryCtaGradient: {
    flexDirection: 'row',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    gap: 6,
    paddingHorizontal: 12,
  },
  primaryCtaText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    width: '88%',
    maxWidth: 320,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 35,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnPressed: {
    opacity: 0.75,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
