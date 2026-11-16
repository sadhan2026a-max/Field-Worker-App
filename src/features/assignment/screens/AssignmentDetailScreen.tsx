import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import type { ReactNode } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { AppStatusBar } from '@/shared/components/ui/AppStatusBar';
import { ScreenFooter } from '@/components/ui/ScreenFooter';
import { spacing, typography, palette, FontFamily, useTheme } from '@/core/theme';
import {
  useAssignment,
  useStartAssignment,
  useAcceptOffer,
  useDeclineOffer,
  useStartNavigation,
  useMarkArrived,
  useCompleteAssignment,
  useReleaseAssignment,
} from '@/features/assignment/hooks/useAssignments';
import { externalMapsUrl } from '@/shared/services/maps';
import { useCurrentLocation } from '@/shared/utils/location';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectDriver } from '@/features/auth/redux/authSlice';
import { addOrderNoteThunk } from '@/features/assignment/redux/assignmentSlice';
import { BookingCard } from '@/features/assignment/components/BookingCard';

const getFormattedTimelineStatus = (status: string, assignmentType: string) => {
  const s = status.toLowerCase();
  if (s === 'delivery_started' || s === 'delivery started') {
    if (assignmentType === 'service' || assignmentType === 'installation' || assignmentType === 'other') return 'Job Started';
    if (assignmentType === 'pickup') return 'Pickup Started';
    if (assignmentType === 'sales') return 'Sales Started';
    if (assignmentType === 'return') return 'Return Started';
    return 'Delivery Started';
  }
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getFormattedTimelineNotes = (notes: string, assignmentType: string) => {
  if (!notes) return notes;
  const n = notes.trim().toLowerCase();
  if (n === 'delivery started') {
    if (assignmentType === 'service' || assignmentType === 'installation' || assignmentType === 'other') return 'Job Started';
    if (assignmentType === 'pickup') return 'Pickup Started';
    if (assignmentType === 'sales') return 'Sales Started';
    if (assignmentType === 'return') return 'Return Started';
  }
  return notes;
};

export function AssignmentDetailScreen() {
  const { colors, isDark } = useTheme();
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
  const dispatch = useAppDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [isDeclineModalVisible, setDeclineModalVisible] = useState(false);

  const releaseAssignment = useReleaseAssignment();

  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const styles = React.useMemo(() => useStyles(colors, isDark), [colors, isDark]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppStatusBar style="light" backgroundColor={colors.primary} translucent={false} />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.headerBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textInverse || '#FFFFFF'} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Booking Details</Text>
        </View>
        <View style={styles.bodyWrapper}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={{ margin: 16 }}>
              <Skeleton width="100%" height={320} borderRadius={14} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppStatusBar style="light" backgroundColor={colors.primary} translucent={false} />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.headerBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.textInverse || '#FFFFFF'} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Booking Details</Text>
        </View>
        <View style={styles.bodyWrapper}>
          <View style={styles.content}>
            <EmptyState
              icon="error-outline"
              title="Booking not found"
              description="This booking may have been removed or is no longer available."
              tint={palette.red}
              tintLight={palette.redLight}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isAssignedToOther =
    assignment.status !== 'cancelled' &&
    assignment.assignedDriverId != null &&
    assignment.assignedDriverId !== driver?.id;

  const comingSoon = () => Toast.show({ type: 'warning', text1: 'Coming soon' });

  const allQuickActions: { key: string; icon: ReactNode; bg: string; label: string; onPress: () => void }[] = [
    {
      key: 'navigate',
      icon: <MaterialIcons name="near-me" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Navigate',
      onPress: () =>
        Linking.openURL(externalMapsUrl(assignment.customer.location, assignment.customer.name, assignment.customer.address)),
    },
    {
      key: 'photo',
      icon: <MaterialIcons name="photo-camera" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Photo',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } }),
    },
    {
      key: 'signature',
      icon: <MaterialIcons name="edit" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Signature',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/proof', params: { id: assignment.id } }),
    },
    {
      key: 'payment',
      icon: <MaterialIcons name="payments" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Payment',
      onPress: () => safeRouter.push({ pathname: '/assignment/[id]/payment', params: { id: assignment.id } }),
    },
    {
      key: 'add-note',
      icon: <MaterialIcons name="note-add" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Add Note',
      onPress: () => setNoteModalVisible(true),
    },
    {
      key: 'issue',
      icon: <MaterialIcons name="report-problem" size={22} color={colors.primary} />,
      bg: colors.primaryLight || colors.primary + '18',
      label: 'Issue',
      onPress: comingSoon,
    },
  ];

  const quickActions = allQuickActions;

  const onSaveNote = async () => {
    if (!noteText.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a note' });
      return;
    }
    setIsSavingNote(true);
    try {
      await dispatch(addOrderNoteThunk({ id: assignment.id, notes: noteText.trim() })).unwrap();
      Toast.show({ type: 'success', text1: 'Note added successfully' });
      setNoteText('');
      setNoteModalVisible(false);
      refetch();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to add note' });
    } finally {
      setIsSavingNote(false);
    }
  };

  const onAccept = async () => {
    setActionType('accept');
    try {
      await acceptOffer.mutateAsync(assignment.offerId ?? assignment.id);
      Toast.show({ type: 'success', text1: 'Offer Accepted!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'Failed to accept offer' });
    } finally {
      setActionType(null);
    }
  };

  const onDecline = () => {
    setDeclineModalVisible(true);
  };

  const handleConfirmDecline = async () => {
    setActionType('decline');
    try {
      await declineOffer.mutateAsync(assignment.offerId ?? assignment.id);
      setDeclineModalVisible(false);
      Toast.show({ type: 'success', text1: 'Offer Declined' });
      router.back();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.message || 'Failed to decline offer' });
    } finally {
      setActionType(null);
    }
  };

  const onReleaseOrder = async () => {
    if (!cancelReasonText.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a release reason' });
      return;
    }
    setIsCancelling(true);
    try {
      await releaseAssignment.mutateAsync({ id: assignment!.id, reason: cancelReasonText.trim() });
      Toast.show({ type: 'success', text1: 'Order Released successfully' });
      setCancelReasonText('');
      setCancelModalVisible(false);
      router.back();
    } catch (error: any) {
      const errMsg = String(error?.message || '');
      if (errMsg.includes('not assigned') || errMsg.includes('403')) {
        Toast.show({ type: 'info', text1: 'Order already cancelled or reassigned by admin' });
        setCancelReasonText('');
        setCancelModalVisible(false);
        router.back();
      } else {
        Toast.show({ type: 'error', text1: errMsg || 'Failed to release order' });
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const onActionPress = async () => {
    try {
      if (assignment.status === 'accepted') {
        await startNavigation.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Navigation Started' });
        Linking.openURL(externalMapsUrl(assignment.customer.location, assignment.customer.name, assignment.customer.address));
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
        if (assignment.type === 'other') return;
      }

      if (assignment.status === 'in_progress' && assignment.type === 'other') {
        if (assignment.requiresDeliveryOtp && !assignment.deliveryOtpVerifiedAt) {
          safeRouter.push({ pathname: '/assignment/[id]/summary', params: { id: assignment.id } });
          return;
        }

        await completeAssignment.mutateAsync(assignment.id);
        Toast.show({ type: 'success', text1: 'Job Completed' });
        safeRouter.push({ pathname: '/assignment/[id]/complete', params: { id: assignment.id } });
        return;
      }

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
    } catch (error: any) {
      const errMsg = String(error?.message || error?.response?.data?.error || '');
      if (errMsg.includes('not assigned') || errMsg.includes('403')) {
        Toast.show({
          type: 'error',
          text1: 'Order Cancelled',
          text2: 'This order was cancelled or reassigned by admin.',
        });
        refetch();
        return;
      }
      Toast.show({ type: 'error', text1: 'Action failed. Please try again.' });
    }
  };

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

  // Header Title matching the completed/active status
  const screenTitle =
    assignment.status === 'completed'
      ? 'Completed Bookings'
      : assignment.status === 'pending'
      ? 'Pending Bookings'
      : assignment.status === 'cancelled'
      ? 'Cancelled Booking'
      : 'Order Details';

  const timelineItems = [...(assignment.timeline || [])];
  if (assignment.status === 'cancelled' && !timelineItems.some((item) => item.status.toLowerCase().includes('cancel'))) {
    timelineItems.push({
      status: 'Cancelled',
      timestamp: assignment.cancelledAt || new Date().toISOString(),
      notes: 'Order cancelled',
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppStatusBar style="light" backgroundColor={colors.primary} translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* ─── DYNAMIC THEMED APP BAR ─── */}
      <View style={styles.headerBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textInverse || '#FFFFFF'} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {screenTitle}
        </Text>

        <TouchableOpacity onPress={onRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialIcons name="refresh" size={24} color={colors.textInverse || '#FFFFFF'} />
        </TouchableOpacity>
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {isAssignedToOther && (
            <View style={styles.warningBanner}>
              <MaterialIcons name="error-outline" size={20} color={colors.danger} />
              <Text style={styles.warningText}>
                This order is currently assigned to {assignment.assignedDriverName || 'another driver'}.
              </Text>
            </View>
          )}

          {/* ─── CLIENT BOOKING CARD (Themed) ─── */}
          <BookingCard assignment={assignment} />

          {/* ─── QUICK ACTIONS GRID (Only when order is arrived or in_progress) ─── */}
          {!isAssignedToOther && (assignment.status === 'arrived' || assignment.status === 'in_progress') && (
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

          {/* ─── ORDER TRACKING / TIMELINE ─── */}
          {timelineItems.length > 0 && (
            <View style={styles.timelineCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Order Tracking</Text>
              <View style={styles.timelineContainer}>
                {timelineItems.map((item, index) => {
                  const isLast = index === timelineItems.length - 1;

                  const getTimelineIcon = (status: string) => {
                    const s = status.toLowerCase();
                    if (s.includes('pending') || s.includes('create')) return 'schedule';
                    if (s.includes('accept') || s.includes('offer')) return 'assignment-turned-in';
                    if (s.includes('route')) return 'local-shipping';
                    if (s.includes('arriv')) return 'place';
                    if (s.includes('progress') || s.includes('start')) return 'play-arrow';
                    if (s.includes('complet') || s.includes('done')) return 'check';
                    if (s.includes('cancel') || s.includes('reject')) return 'close';
                    if (s.includes('fail')) return 'error-outline';
                    return 'adjust';
                  };

                  return (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineTimeContainer}>
                        <Text style={styles.timelineTimeLeftText}>
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text style={styles.timelineDateLeftText}>
                          {new Date(item.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.timelineIconContainer}>
                        <View
                          style={[
                            styles.timelineNode,
                            isLast ? styles.timelineNodeCurrent : styles.timelineNodeCompleted,
                            item.status.toLowerCase().includes('cancel') ? styles.timelineNodeCancelled : null,
                          ]}
                        >
                          <MaterialIcons
                            name={getTimelineIcon(item.status) as any}
                            size={14}
                            color={
                              isLast || item.status.toLowerCase().includes('cancel')
                                ? item.status.toLowerCase().includes('cancel')
                                  ? colors.danger
                                  : colors.primary
                                : colors.textInverse || '#FFFFFF'
                            }
                          />
                        </View>
                        {!isLast && <View style={styles.timelineLine} />}
                      </View>
                      <View style={[styles.timelineContent, isLast ? styles.timelineContentCurrent : null]}>
                        <View style={styles.timelineHeaderRow}>
                          <Text
                            style={[
                              styles.timelineStatus,
                              isLast ? styles.timelineStatusCurrent : styles.timelineStatusCompleted,
                              item.status.toLowerCase().includes('cancel') ? styles.timelineStatusCancelled : null,
                            ]}
                          >
                            {getFormattedTimelineStatus(item.status, assignment.type)}
                          </Text>
                        </View>
                        {!!item.notes && (
                          <Text style={styles.timelineNotes}>
                            {getFormattedTimelineNotes(item.notes, assignment.type)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ─── BOTTOM STICKY ACTION BUTTON ─── */}
        {!isAssignedToOther && assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
          <ScreenFooter>
            {assignment.status === 'pending' ? (
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Button
                  label="Decline"
                  onPress={onDecline}
                  loading={actionType === 'decline' && declineOffer.isPending}
                  disabled={actionType === 'accept' && acceptOffer.isPending}
                  style={{ flex: 1, borderColor: colors.danger, backgroundColor: colors.danger }}
                />
                <Button
                  label="Accept Offer"
                  onPress={onAccept}
                  loading={actionType === 'accept' && acceptOffer.isPending}
                  disabled={actionType === 'decline' && declineOffer.isPending}
                  style={{ flex: 1, backgroundColor: colors.primary, borderColor: colors.primary }}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                {assignment.status === 'accepted' && (
                  <Button
                    label="Release Order"
                    onPress={() => setCancelModalVisible(true)}
                    style={{ flex: 1, borderColor: colors.danger, backgroundColor: colors.danger }}
                  />
                )}
                <Button
                  label={actionLabel}
                  onPress={onActionPress}
                  loading={isActionLoading}
                  style={{ flex: 1, backgroundColor: colors.primary, borderColor: colors.primary }}
                />
              </View>
            )}
          </ScreenFooter>
        )}

        {assignment.status === 'cancelled' && (
          <ScreenFooter>
            <Button
              label="Back to Workspace"
              onPress={() => router.back()}
              style={{ width: '100%', backgroundColor: colors.primary, borderColor: colors.primary }}
            />
          </ScreenFooter>
        )}
      </View>

      {/* ─── ADD NOTE MODAL ─── */}
      <Modal visible={isNoteModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Order Note</Text>
              <Pressable onPress={() => setNoteModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Type your note here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={noteText}
                onChangeText={setNoteText}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalFooter}>
              <Button
                label="Cancel"
                onPress={() => setNoteModalVisible(false)}
                style={[styles.modalBtn, { borderColor: colors.danger, backgroundColor: colors.danger }]}
              />
              <Button
                label="Save Note"
                onPress={onSaveNote}
                loading={isSavingNote}
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── RELEASE ORDER MODAL ─── */}
      <Modal visible={isCancelModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.danger }]}>Release Order</Text>
              <Pressable onPress={() => setCancelModalVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={{ ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.sm }}>
                Please provide a reason for releasing this order.
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter release reason..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={cancelReasonText}
                onChangeText={setCancelReasonText}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.modalFooter}>
              <Button
                label="Back"
                variant="outline"
                onPress={() => setCancelModalVisible(false)}
                style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: 'transparent' }]}
                textStyle={{ color: colors.textPrimary }}
              />
              <Button
                label="Confirm Release"
                onPress={onReleaseOrder}
                loading={isCancelling}
                style={[styles.modalBtn, { backgroundColor: colors.danger, borderColor: colors.danger }]}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── DECLINE OFFER MODAL ─── */}
      {assignment && (
        <Modal
          visible={isDeclineModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (actionType !== 'decline') setDeclineModalVisible(false);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              if (actionType !== 'decline') setDeclineModalVisible(false);
            }}
          >
            <Pressable
              style={[
                styles.modalContainer,
                { padding: 24, backgroundColor: colors.surface, borderRadius: 16 },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.modalTitle, { marginBottom: 10, fontWeight: 'bold', fontSize: 18 }]}>
                Decline Offer
              </Text>

              <Text
                style={{
                  ...typography.bodyMedium,
                  fontSize: 15,
                  color: colors.textSecondary,
                  marginBottom: 24,
                  lineHeight: 22,
                }}
              >
                Are you sure you want to decline this assignment?
              </Text>

              <View style={{ flexDirection: 'row', width: '100%', gap: 14, marginTop: 8 }}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => setDeclineModalVisible(false)}
                  disabled={actionType === 'decline'}
                  style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, height: 38 }}
                  textStyle={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 13.5 }}
                />
                <Button
                  label="Decline"
                  onPress={handleConfirmDecline}
                  loading={actionType === 'decline' && declineOffer.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: colors.danger,
                    borderColor: colors.danger,
                    borderRadius: 8,
                    height: 38,
                  }}
                  textStyle={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13.5 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const useStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    bodyWrapper: {
      flex: 1,
      backgroundColor: isDark ? colors.background : '#F3F4F6',
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.primary,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      flex: 1,
      marginLeft: 12,
      fontSize: 18,
      fontWeight: '700',
      color: colors.textInverse || '#FFFFFF',
      letterSpacing: 0.3,
    },
    content: {
      paddingBottom: 32,
      backgroundColor: isDark ? colors.background : '#F3F4F6',
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.dangerLight,
      padding: spacing.md,
      margin: 14,
      borderRadius: 10,
      gap: spacing.sm,
    },
    warningText: {
      ...typography.bodyMedium,
      color: colors.danger,
      flex: 1,
    },
    cancelledBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
      padding: spacing.md,
      margin: 14,
      borderRadius: 12,
      gap: spacing.sm,
    },
    cancelledBannerTitle: {
      fontSize: 13.5,
      fontWeight: '700',
      color: isDark ? '#F87171' : '#DC2626',
    },
    cancelledBannerText: {
      fontSize: 11.5,
      color: isDark ? '#FCA5A5' : '#B91C1C',
      lineHeight: 16,
    },
    actionsSection: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      marginHorizontal: 14,
      marginTop: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 16,
    },
    quickAction: {
      width: '31%',
      alignItems: 'center',
      gap: 6,
    },
    actionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    timelineCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 14,
      marginTop: 14,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timelineContainer: {
      marginTop: 0,
    },
    timelineItem: {
      flexDirection: 'row',
    },
    timelineTimeContainer: {
      width: 50,
      alignItems: 'flex-end',
      marginRight: 8,
      height: 20,
      justifyContent: 'center',
    },
    timelineTimeLeftText: {
      fontSize: 10,
      fontFamily: FontFamily.bold,
      color: colors.textPrimary,
    },
    timelineDateLeftText: {
      fontSize: 9,
      color: colors.textSecondary,
    },
    timelineIconContainer: {
      alignItems: 'center',
      width: 20,
      marginRight: 10,
    },
    timelineNode: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    timelineNodeCompleted: {
      backgroundColor: colors.primary,
    },
    timelineNodeCurrent: {
      backgroundColor: colors.primary + '20',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    timelineNodeCancelled: {
      backgroundColor: colors.danger + '10',
      borderWidth: 2,
      borderColor: colors.danger,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: colors.primary + '30',
      marginTop: -2,
      marginBottom: -2,
      zIndex: 1,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 12,
      paddingTop: 0,
    },
    timelineContentCurrent: {
      paddingBottom: 4,
    },
    timelineHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 0,
    },
    timelineStatus: {
      fontFamily: FontFamily.bold,
      fontSize: 13,
    },
    timelineStatusCompleted: {
      color: colors.textPrimary,
    },
    timelineStatusCurrent: {
      color: colors.primary,
    },
    timelineStatusCancelled: {
      color: '#EF4444',
    },
    timelineNotes: {
      color: colors.textSecondary,
      fontStyle: 'italic',
      fontSize: 11,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 8 },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalCloseButton: {
      padding: 4,
    },
    modalBody: {
      padding: spacing.lg,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.md,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: isDark ? colors.border + '30' : '#FFFFFF',
      minHeight: 100,
    },
    modalFooter: {
      flexDirection: 'row',
      padding: spacing.lg,
      borderTopWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    modalBtn: {
      flex: 1,
    },
  });
