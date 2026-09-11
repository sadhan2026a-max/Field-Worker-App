import React, { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View, Platform, Alert, Pressable, Linking, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { spacing, FontFamily, palette, useTheme } from '@/core/theme';

import { Assignment } from '@/domain/entities/Assignment';
import { DistanceDisplay } from '@/features/assignment/components';
import { useCurrentLocation } from '@/shared/utils/location';
import { useAcceptOffer, useDeclineOffer } from '@/features/assignment/hooks/useAssignments';

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    en_route: 'En Route',
    arrived: 'Arrived',
    in_progress: 'In Progress',
  };
  return labels[status] || status;
}

function getStatusTheme(status: string): { text: string; bg: string; border: string } {
  switch (status) {
    case 'pending':
      return { text: '#D97706', bg: '#FEF3C7', border: '#FCD34D' };
    case 'accepted':
      return { text: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE' };
    case 'en_route':
      return { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
    case 'arrived':
      return { text: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
    case 'in_progress':
      return { text: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
    default:
      return { text: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
  }
}

function getTypeIconAndLabel(type: string): { icon: keyof typeof MaterialIcons.glyphMap; label: string; bg: string; color: string } {
  switch (type) {
    case 'delivery':
      return { icon: 'local-shipping', label: 'Delivery', bg: '#DBEAFE', color: '#1E40AF' };
    case 'pickup':
      return { icon: 'archive', label: 'Pickup', bg: '#FEF3C7', color: '#92400E' };
    case 'return':
      return { icon: 'assignment-return', label: 'Return', bg: '#FEE2E2', color: '#991B1B' };
    case 'installation':
      return { icon: 'build', label: 'Installation', bg: '#DCFCE7', color: '#166534' };
    case 'inspection':
      return { icon: 'fact-check', label: 'Inspection', bg: '#F3E8FF', color: '#6B21A8' };
    case 'service_visit':
      return { icon: 'engineering', label: 'Service', bg: '#E0E7FF', color: '#3730A3' };
    default:
      return { icon: 'shopping-bag', label: 'Assignment', bg: '#F3F4F6', color: '#374151' };
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
  const typeInfo = getTypeIconAndLabel(assignment.type);

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
    if (assignment.customer.phone && assignment.customer.phone !== 'N/A') {
      Linking.openURL(`tel:${assignment.customer.phone}`).catch(() => {
        Toast.show({ type: 'error', text1: 'Could not open phone dialer' });
      });
    } else {
      Toast.show({ type: 'info', text1: 'Phone number unavailable' });
    }
  };

  return (
    <>
      <Pressable
        style={styles.cardContainer}
      onPress={() => {
        if (assignment.status !== 'pending') {
          router.push({ pathname: '/assignment/[id]', params: { id: assignment.id } });
        }
      }}
    >
      {/* Top Accent Strip removed per user request */}

      <View style={styles.content}>
        {/* Top Badges Row */}
        <View style={styles.topBadgesRow}>
          <View style={styles.typeAndCodeGroup}>
            <Text style={styles.orderCode}>#{assignment.code}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border }]}>
            <View style={[styles.statusDot, { backgroundColor: statusTheme.text }]} />
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {getStatusLabel(assignment.status)}
            </Text>
          </View>
        </View>

        {/* Customer Details Row */}
        <View style={styles.customerRow}>
          <Avatar name={assignment.customer.name} size={40} />

          <View style={styles.customerMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.customerName} numberOfLines={1}>{assignment.customer.name}</Text>
            </View>

            {assignment.customer.location.latitude !== 0 || assignment.customer.location.longitude !== 0 ? (
              <View style={styles.locationPillRow}>
                <MaterialIcons name="navigation" size={13} color={colors.primary} />
                <DistanceDisplay
                  style={styles.distanceText}
                  currentLocation={currentLocation}
                  targetLocation={assignment.customer.location}
                  targetAddress={assignment.customer.address}
                  backendDistanceKm={assignment.distanceKm}
                />
              </View>
            ) : null}

            <Text style={styles.addressText} numberOfLines={2}>
              {assignment.customer.address !== 'Address will be available after acceptance'
                ? assignment.customer.address
                : 'Address details available upon acceptance'}
            </Text>
          </View>

          {/* Quick Call Action Button */}
          {assignment.customer.phone && assignment.customer.phone !== 'N/A' && (
            <Pressable
              style={styles.callButton}
              onPress={handlePhoneCall}
              android_ripple={{ color: colors.primary + '33' }}
            >
              <MaterialIcons name="phone" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>



        {/* Action Button Section */}
        {assignment.status === 'pending' ? (
          <View style={styles.dualButtonRow}>
            <Pressable
              onPress={onDecline}
              disabled={actionType === 'accept' && acceptOffer.isPending}
              style={({ pressed }) => [
                styles.declineButton,
                pressed && { opacity: 0.85 }
              ]}
            >
              {actionType === 'decline' && declineOffer.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialIcons name="cancel" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.declineButtonText}>Decline</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={styles.acceptGradientWrapper}
            >
              <LinearGradient
                colors={colors.headerGradient as [string, string, ...string[]] || [colors.primary, colors.primaryDark]}
                style={styles.acceptButtonGradient}
              >
                <MaterialIcons name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptButtonText}>
                  {actionType === 'accept' && acceptOffer.isPending ? 'Accepting...' : 'Accept'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onStart} style={styles.actionGradientWrapper}>
            <LinearGradient
              colors={colors.headerGradient as [string, string, ...string[]] || [colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startJobGradient}
            >
              <Text style={styles.startJobText}>Start Job</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Pressable>

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
            <Text style={styles.modalTitle}>Decline Offer</Text>

            <Text style={styles.modalMessage}>
              Are you sure you want to decline this assignment?
            </Text>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  pressed && styles.modalCancelBtnPressed,
                ]}
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)', // This smooths out the jagged edges (anti-aliasing)
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 },
      android: { elevation: 2 },
    }),
  },
  topAccentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 12,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeAndCodeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.2,
  },
  orderCode: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  customerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: colors.primary,
  },
  addressText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },

  dualButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: 12,
    height: 40,
  },
  declineButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  acceptGradientWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  actionGradientWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  startJobGradient: {
    flexDirection: 'row',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
    paddingHorizontal: 16,
  },
  startJobText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '88%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnPressed: {
    opacity: 0.75,
    backgroundColor: colors.border + '30',
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});

