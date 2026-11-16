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
import { getOverviewTheme, OverviewThemePalette } from './overviewTheme';

function getTypeDetails(type?: string, isDark: boolean = false): { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; color: string } {
  if (isDark) {
    switch (type) {
      case 'delivery':
        return { icon: 'local-shipping', label: 'Delivery', bg: 'rgba(59, 130, 246, 0.16)', color: '#60A5FA' };
      case 'pickup':
        return { icon: 'archive', label: 'Pickup', bg: 'rgba(245, 158, 11, 0.16)', color: '#FBBF24' };
      case 'return':
        return { icon: 'assignment-return', label: 'Return', bg: 'rgba(239, 68, 68, 0.16)', color: '#F87171' };
      case 'installation':
        return { icon: 'build', label: 'Installation', bg: 'rgba(16, 185, 129, 0.16)', color: '#34D399' };
      case 'inspection':
        return { icon: 'fact-check', label: 'Inspection', bg: 'rgba(168, 85, 247, 0.16)', color: '#C084FC' };
      case 'service_visit':
      case 'service':
        return { icon: 'engineering', label: 'Service', bg: 'rgba(99, 102, 241, 0.16)', color: '#818CF8' };
      default:
        return { icon: 'shopping-bag', label: 'Task', bg: 'rgba(148, 163, 184, 0.14)', color: '#CBD5E1' };
    }
  }

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
  const { colors, theme, isDark } = useTheme();
  const palette = React.useMemo(() => getOverviewTheme(theme, isDark), [theme, isDark]);
  const styles = React.useMemo(() => useStyles(colors, palette, isDark), [colors, palette, isDark]);
  const currentLocation = useCurrentLocation();
  const typeDetails = getTypeDetails(assignment.type, isDark);

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
        {/* ─── Header Strip: Type Chip & Order Code together ─── */}
        <View style={styles.headerStrip}>
          <View style={[styles.typeChip, { backgroundColor: typeDetails.bg }]}>
            <MaterialIcons name={typeDetails.icon} size={11} color={typeDetails.color} />
            <Text style={[styles.typeChipText, { color: typeDetails.color }]}>
              {typeDetails.label}
            </Text>
          </View>

          <View style={styles.orderIdBadge}>
            <Text style={styles.orderIdText} numberOfLines={1}>{orderCode}</Text>
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
              <View style={styles.customerNameLeft}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {assignment.customer?.name || 'Customer'}
                </Text>

                <View style={[styles.paymentInfoPill, isCod ? styles.codPaymentPill : styles.prepaidPaymentPill]}>
                  <MaterialIcons
                    name={isCod ? 'payments' : 'verified'}
                    size={10}
                    color={isCod ? (isDark ? '#FBBF24' : '#B45309') : (isDark ? '#34D399' : '#059669')}
                  />
                  <Text style={[styles.paymentInfoText, isCod ? styles.codPaymentText : styles.prepaidPaymentText]}>
                    {isCod ? `COD ₹${displayAmount}` : 'Prepaid'}
                  </Text>
                </View>
              </View>

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
        {assignment.status !== 'pending' && (
          <View style={styles.toolsRow}>
            <Pressable
              style={styles.toolButton}
              onPress={handleOpenNavigation}
              android_ripple={{ color: colors.primary + '18' }}
            >
              <MaterialIcons name="navigation" size={12} color={colors.primary} />
              <Text style={styles.toolButtonText}>Navigate</Text>
            </Pressable>

            {assignment.customer?.phone && assignment.customer.phone !== 'N/A' && (
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
          </View>
        )}

        {/* ─── Primary Action CTA Section ─── */}
        {assignment.status === 'pending' ? (
          <View style={styles.dualActionRow}>
            <Pressable
              onPress={onDecline}
              disabled={actionType === 'accept' && acceptOffer.isPending}
              style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.85 }]}
            >
              {actionType === 'decline' && declineOffer.isPending ? (
                <ActivityIndicator color="#DC2626" size="small" style={{ transform: [{ scale: 0.7 }] }} />
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
                colors={isDark ? ['#10B981', '#059669'] : [palette.headerPrimary, palette.headerPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtnGradient}
              >
                <Text style={styles.acceptBtnText}>
                  {actionType === 'accept' && acceptOffer.isPending ? 'Accepting...' : 'Accept'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onStart} style={styles.primaryCtaWrapper}>
            <LinearGradient
              colors={isDark ? ['#10B981', '#059669'] : [palette.headerPrimary, palette.headerPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryCtaGradient}
            >
              <Text style={styles.primaryCtaText}>{getActionLabel()}</Text>
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

const useStyles = (colors: any, palette: OverviewThemePalette, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#333338' : '#E2E8F0',
    padding: 13,
    marginBottom: 12,
  },
  headerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    marginBottom: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
  },
  orderIdText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: isDark ? '#FFFFFF' : '#0F172A',
    letterSpacing: 0.2,
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 10,
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
    height: 20,
    backgroundColor: isDark ? '#334155' : '#CBD5E1',
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
  customerNameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  customerName: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: isDark ? '#FFFFFF' : '#0F172A',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : (palette.viewAllBg || '#ECFDF5'),
    borderWidth: 1,
    borderColor: isDark ? 'rgba(16, 185, 129, 0.32)' : (palette.viewAllBorder || '#D1FAE5'),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: isDark ? '#34D399' : (palette.viewAllText || '#059669'),
  },
  addressText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: isDark ? '#94A3B8' : '#64748B',
    lineHeight: 15,
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
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    marginBottom: 10,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#27272A' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? '#3F3F46' : '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    gap: 4,
  },
  toolButtonText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: palette.headerPrimary || colors.primary,
  },
  paymentInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  prepaidPaymentPill: {
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#D1FAE5',
  },
  codPaymentPill: {
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FFFBEB',
    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
  },
  paymentInfoText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
  },
  prepaidPaymentText: {
    color: isDark ? '#34D399' : '#059669',
  },
  codPaymentText: {
    color: isDark ? '#FBBF24' : '#B45309',
  },
  dualActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239, 68, 68, 0.32)' : '#FECACA',
    borderRadius: 12,
    height: 38,
  },
  declineBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: isDark ? '#F87171' : '#DC2626',
  },
  acceptBtnWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  acceptBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primaryCtaWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryCtaGradient: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 6,
    paddingHorizontal: 12,
  },
  primaryCtaText: {
    fontSize: 13,
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
    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    width: '88%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: isDark ? '#333338' : '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: isDark ? '#FFFFFF' : '#0F172A',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: isDark ? '#94A3B8' : '#64748B',
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
    height: 36,
    borderRadius: 10,
    backgroundColor: isDark ? '#27272A' : '#F1F5F9',
    borderWidth: 1,
    borderColor: isDark ? '#3F3F46' : '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnPressed: {
    opacity: 0.75,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: isDark ? '#FFFFFF' : '#0F172A',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
