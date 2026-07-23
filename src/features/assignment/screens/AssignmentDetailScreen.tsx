import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { colors, spacing, typography, palette, FontFamily, FontSize } from '@/core/theme';
import { useAssignment, useStartAssignment, useAcceptOffer, useDeclineOffer, useStartNavigation, useMarkArrived, useCompleteAssignment } from '@/features/assignment/hooks/useAssignments';
import { externalMapsUrl } from '@/shared/services/maps';
import { useCurrentLocation } from '@/shared/utils/location';
import { DistanceDisplay } from '@/features/assignment/components';
import { useAppSelector } from '@/store/hooks';
import { selectDriver } from '@/features/auth/redux/authSlice';
export function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: assignment, isLoading, refetch } = useAssignment(id);
  const startAssignment = useStartAssignment();
  const acceptOffer = useAcceptOffer();
  const declineOffer = useDeclineOffer();
  const startNavigation = useStartNavigation();
  const markArrived = useMarkArrived();
  const completeAssignment = useCompleteAssignment();
  const currentLocation = useCurrentLocation();
  const driver = useAppSelector(selectDriver);

  const [refreshing, setRefreshing] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.customHeaderBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Assignment Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <EmptyState
            icon="error-outline"
            title="Assignment not found"
            description="This assignment may have been removed or is no longer available."
            tint={palette.red}
            tintLight={palette.redLight}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isAssignedToOther = assignment.assignedDriverId != null && assignment.assignedDriverId !== driver?.id;

  const comingSoon = () => Toast.show({ type: 'warning', text1: 'Coming soon' });

  const quickActions: { key: string; icon: ReactNode; bg: string; label: string; onPress: () => void }[] = [
    {
      key: 'call',
      icon: <MaterialIcons name="call" size={20} color={palette.green} />,
      bg: palette.greenLight,
      label: 'Call',
      onPress: () => Linking.openURL(`tel:${assignment.customer.phone}`),
    },
    {
      key: 'whatsapp',
      icon: <FontAwesome name="whatsapp" size={20} color={palette.green} />,
      bg: palette.greenLight,
      label: 'WhatsApp',
      onPress: () => Linking.openURL(`https://wa.me/${assignment.customer.phone.replace(/\D/g, '')}`),
    },
    {
      key: 'navigate',
      icon: <MaterialIcons name="near-me" size={20} color={palette.purple} />,
      bg: palette.purpleLight,
      label: 'Navigate',
      onPress: () => Linking.openURL(externalMapsUrl(assignment.customer.location, assignment.customer.name, assignment.customer.address)),
    },
    {
      key: 'photo',
      icon: <MaterialIcons name="photo-camera" size={20} color={palette.purple} />,
      bg: palette.purpleLight,
      label: 'Photo',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } }),
    },
    {
      key: 'signature',
      icon: <MaterialIcons name="edit" size={20} color={palette.orange} />,
      bg: palette.orangeLight,
      label: 'Signature',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } }),
    },
    {
      key: 'payment',
      icon: <MaterialIcons name="payments" size={20} color={palette.orange} />,
      bg: palette.orangeLight,
      label: 'Payment',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/payment', params: { id: assignment.id } }),
    },
    {
      key: 'issue',
      icon: <MaterialIcons name="report-problem" size={20} color={palette.red} />,
      bg: palette.redLight,
      label: 'Issue',
      onPress: comingSoon,
    },
    {
      key: 'more',
      icon: <MaterialIcons name="more-horiz" size={20} color={colors.textPrimary} />,
      bg: palette.grey100,
      label: 'More',
      onPress: comingSoon,
    },
  ];

  const onAccept = async () => {
    setActionType('accept');
    try {
      await acceptOffer.mutateAsync(assignment.offerId ?? assignment.id);
      Toast.show({ type: 'success', text1: 'Offer Accepted!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to accept offer' });
    } finally {
      setActionType(null);
    }
  };

  const onDecline = () => {
    Alert.alert('Decline Offer', 'Are you sure you want to decline this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          setActionType('decline');
          try {
            await declineOffer.mutateAsync(assignment.offerId ?? assignment.id);
            Toast.show({ type: 'success', text1: 'Offer Declined' });
            router.back();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to decline offer' });
          } finally {
            setActionType(null);
          }
        }
      }
    ]);
  };

  const onActionPress = async () => {
    try {
      if (assignment.status === 'accepted') {
        await startNavigation.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Navigation Started' });
        return;
      }

      if (assignment.status === 'en_route') {
        await markArrived.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Marked as Arrived' });
        return;
      }

      if (assignment.status === 'arrived') {
        await startAssignment.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Job Started' });

        // If type is 'other', just stay on this screen (now in_progress)
        if (assignment.type === 'other') {
          return;
        }
        // Otherwise, fall through to navigation
      }

      if (assignment.status === 'in_progress' && assignment.type === 'other') {
        await completeAssignment.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Job Completed' });
        safeRouter.push({ pathname: '/assignment/[id]/complete', params: { id: assignment.id } });
        return;
      }

      // If arrived (just started) or in_progress (continuing), navigate to specific screen
      switch (assignment.type) {
        case 'delivery':
          safeRouter.push({ pathname: '/assignment/[id]/deliver', params: { id: assignment.id } });
          break;
        case 'pickup':
          safeRouter.push({ pathname: '/assignment/[id]/pickup', params: { id: assignment.id } });
          break;
        case 'return':
          safeRouter.push({ pathname: '/assignment/[id]/return', params: { id: assignment.id } });
          break;
        case 'installation':
        case 'inspection':
          safeRouter.push({ pathname: '/assignment/[id]/checklist', params: { id: assignment.id } });
          break;
        case 'service_visit':
          safeRouter.push({ pathname: '/assignment/[id]/service', params: { id: assignment.id } });
          break;
        case 'sales_visit':
          safeRouter.push({ pathname: '/assignment/[id]/sales', params: { id: assignment.id } });
          break;
        default:
          safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Action failed. Please try again.' });
    }
  };

  // Determine button text and loading state
  let actionLabel = 'View Job';
  let isActionLoading = false;

  if (assignment?.status === 'accepted') {
    actionLabel = 'Start Navigation';
    isActionLoading = startNavigation.isPending;
  } else if (assignment?.status === 'en_route') {
    actionLabel = "I've Arrived";
    isActionLoading = markArrived.isPending;
  } else if (assignment?.status === 'arrived') {
    actionLabel = 'Start Job';
    isActionLoading = startAssignment.isPending;
  } else if (assignment?.status === 'in_progress') {
    actionLabel = assignment?.type === 'other' ? 'Complete Job' : 'Continue Job';
    if (assignment?.type === 'other') {
      isActionLoading = completeAssignment.isPending;
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom flat header bar without shadows */}
      <View style={styles.customHeaderBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Assignment Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.green]} tintColor={palette.green} />
        }
      >
        <View style={styles.codeHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text style={styles.codeText}>{assignment.code}</Text>
            {assignment.status !== 'pending' && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {assignment.type.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
              </View>
            )}
          </View>
          <StatusBadge status={assignment.status} />
        </View>

        {isAssignedToOther && (
          <View style={styles.warningBanner}>
            <MaterialIcons name="error-outline" size={20} color={palette.red} />
            <Text style={styles.warningText}>
              This order is currently assigned to {assignment.assignedDriverName || 'another driver'}.
            </Text>
          </View>
        )}

        {/* Customer Profile Card */}
        <Card style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <Avatar name={assignment.customer.name} size={52} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{assignment.customer.name}</Text>
              <Text style={styles.customerPhone}>{assignment.customer.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.customerActions}>
            <Pressable
              style={[styles.actionBtn, styles.callBtn]}
              onPress={() => Linking.openURL(`tel:${assignment.customer.phone}`)}
            >
              <MaterialIcons name="call" size={18} color={palette.green} />
              <Text style={styles.actionBtnText}>Call Customer</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.waBtn]}
              onPress={() => Linking.openURL(`https://wa.me/${assignment.customer.phone.replace(/\D/g, '')}`)}
            >
              <FontAwesome name="whatsapp" size={18} color={palette.green} />
              <Text style={styles.actionBtnText}>WhatsApp Chat</Text>
            </Pressable>
          </View>
        </Card>

        {/* Delivery Address Card */}
        <Card style={styles.addressCard}>
          <View style={styles.pinContainer}>
            <MaterialIcons name="place" size={24} color={colors.textPrimary} />
          </View>
          <View style={styles.addressContent}>
            <Text style={styles.addressTitle}>
              {assignment.customer.address.split(',')[0]?.trim()}
            </Text>
            <Text style={styles.addressText}>
              {assignment.customer.address.split(',').slice(1).join(',').trim()}
            </Text>
            <DistanceDisplay
              style={styles.distanceText}
              currentLocation={currentLocation}
              targetLocation={assignment.customer.location}
              targetAddress={assignment.customer.address}
              backendDistanceKm={assignment.distanceKm}
            />
          </View>
        </Card>

        {/* Order Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.orderSummary}>
            {assignment.itemCount > 0 ? `${assignment.itemCount} items` : 'No items'} • Total ₹{(assignment.totalAmount ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.codSummary}>
            COD: ₹{(assignment.codAmount ?? 0).toLocaleString()}
          </Text>
        </Card>

        {/* Delivery Instructions Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <Text style={styles.instructionsText}>
            {assignment.deliveryInstructions || 'Please call before delivery.'}
          </Text>
        </Card>

        {/* Order History / Timeline Card */}
        {assignment.timeline && assignment.timeline.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <View style={styles.timelineContainer}>
              {assignment.timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={styles.timelineDot} />
                    {index < assignment.timeline!.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{item.status}</Text>
                    <Text style={styles.timelineTime}>
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </Text>
                    {!!item.notes && <Text style={styles.timelineNotes}>{item.notes}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Quick Actions Grid */}
        {!isAssignedToOther && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <Pressable key={action.key} style={styles.quickAction} onPress={action.onPress}>
                  <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                    {action.icon}
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {!isAssignedToOther && (
        <ScreenFooter>
          {assignment.status === 'pending' ? (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Button
                label="Decline"
                variant="outline"
                onPress={onDecline}
                loading={actionType === 'decline' && declineOffer.isPending}
                disabled={actionType === 'accept' && acceptOffer.isPending}
                style={{ flex: 1, borderColor: palette.red, backgroundColor: palette.white }}
              />
              <Button
                label="Accept Offer"
                onPress={onAccept}
                loading={actionType === 'accept' && acceptOffer.isPending}
                disabled={actionType === 'decline' && declineOffer.isPending}
                style={{ flex: 1, backgroundColor: palette.green, borderColor: palette.green }}
              />
            </View>
          ) : (
            <Button
              label={actionLabel}
              onPress={onActionPress}
              loading={isActionLoading}
            />
          )}
        </ScreenFooter>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  customHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: FontSize.medium,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  codeText: {
    ...typography.h2,
  },
  typeBadge: {
    backgroundColor: palette.grey200,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.redLight,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  warningText: {
    ...typography.bodyMedium,
    color: palette.red,
    flex: 1,
  },
  customerCard: {
    padding: 12,
    gap: 12,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  customerName: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
  customerPhone: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  customerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  callBtn: {
    backgroundColor: palette.greenLight,
  },
  waBtn: {
    backgroundColor: palette.greenLight,
  },
  actionBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: palette.greenDark,
  },
  addressCard: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  pinContainer: {
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },
  addressText: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  distanceText: {
    ...typography.caption,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: palette.orange,
    marginTop: 4,
  },
  sectionCard: {
    padding: 12,
    gap: 6,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    fontSize: 12,
  },
  orderSummary: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  codSummary: {
    ...typography.caption,
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.textSecondary,
  },
  instructionsText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 14,
  },
  actionsSection: {
    gap: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  quickAction: {
    width: '22%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...typography.label,
    fontSize: 10,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  timelineContainer: {
    marginTop: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.green,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: palette.grey200,
    marginTop: 4,
    marginBottom: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineStatus: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.semiBold,
  },
  timelineTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
