import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { DashboardHeader, NextDeliveryCard, QuickActionButton, StatCard } from '@/features/assignment/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDriver, selectTenant, toggleAvailability, fetchTenantThunk } from '@/features/auth/redux/authSlice';
import { spacing, FontFamily, typography, useTheme } from '@/core/theme';
import { useAssignments, useWorkspaceSummary } from '@/hooks/useAssignments';
import { fetchNotifications, selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useEffect } from 'react';
import { Assignment } from '@/features/assignment/types/Assignment';

const getQuickActions = (colors: any): {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
}[] => [
    { icon: 'qr-code-scanner', label: 'Scan QR', subtitle: 'Instant Order Check', tint: colors.primary, tintLight: colors.primary + '15', onPress: () => safeRouter.push('/scan-qr') },
    { icon: 'assignment', label: 'My Assignments', subtitle: 'View All Tasks', tint: colors.primaryDark || colors.primary, tintLight: (colors.primaryDark || colors.primary) + '15', onPress: () => safeRouter.push('/(tabs)/assignments') },
    { icon: 'campaign', label: 'Broadcast Jobs', subtitle: 'Open Marketplace', tint: colors.warning, tintLight: colors.warning + '15', onPress: () => safeRouter.push('/(tabs)/assignments?tab=pending') },
    { icon: 'notifications', label: 'Notifications', subtitle: 'System Alerts', tint: colors.danger, tintLight: colors.danger + '15', onPress: () => safeRouter.push('/notifications') },
  ];

function SectionTitle({ icon, title, count, colors, styles }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; count?: number; colors: any; styles: any; }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIconChip, { backgroundColor: colors.primary + '15' }]}>
        <MaterialIcons name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function DashboardSkeleton({ colors, styles }: any) {
  const StatCardSkeleton = () => (
    <View style={{ flexBasis: '48%', height: 72, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={22} height={22} borderRadius={6} />
        <Skeleton width={36} height={14} borderRadius={4} />
      </View>
      <View style={{ gap: 4, marginTop: 4 }}>
        <Skeleton width={50} height={16} borderRadius={4} />
        <Skeleton width={35} height={10} borderRadius={3} />
      </View>
    </View>
  );

  const NextDeliverySkeleton = () => (
    <View style={{ borderRadius: 16, backgroundColor: colors.surface, padding: 12, borderWidth: 1, borderColor: colors.border, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15 }, android: { elevation: 2 } }) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Skeleton width={50} height={16} borderRadius={4} />
        <Skeleton width={65} height={20} borderRadius={8} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ gap: 6, flex: 1, marginTop: 2 }}>
          <Skeleton width="50%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} />
          <Skeleton width="80%" height={12} borderRadius={4} />
        </View>
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
      <Skeleton width="100%" height={42} borderRadius={12} />
    </View>
  );

  const QuickActionSkeleton = () => (
    <View style={{ flexBasis: '47%', borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Skeleton width={32} height={32} borderRadius={10} />
      <View style={{ gap: 4, flex: 1 }}>
        <Skeleton width="70%" height={12} borderRadius={4} />
        <Skeleton width="50%" height={10} borderRadius={4} />
      </View>
      <Skeleton width={14} height={14} borderRadius={7} />
    </View>
  );

  return (
    <View style={{ gap: 24, paddingTop: 16 }}>
      <View>
        <SectionTitle icon="dashboard" title="Today Overview" colors={colors} styles={styles} />
        <View style={styles.workspaceGrid}>
          <View style={styles.statsRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
          <View style={styles.statsRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </View>
        </View>
      </View>

      <View>
        <SectionTitle icon="local-shipping" title="Active Orders" colors={colors} styles={styles} />
        <NextDeliverySkeleton />
      </View>

      <View>
        <SectionTitle icon="flash-on" title="Quick Actions" colors={colors} styles={styles} />
        <View style={styles.quickActionsGrid}>
          <QuickActionSkeleton />
          <QuickActionSkeleton />
          <QuickActionSkeleton />
          <QuickActionSkeleton />
        </View>
      </View>
    </View>
  );
}

export function WorkspaceScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const driver = useAppSelector(selectDriver);
  const dispatch = useAppDispatch();
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useWorkspaceSummary();
  const { data: allAssignments, isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useAssignments();
  const unreadCount = useAppSelector(selectUnreadCount);
  const tenant = useAppSelector(selectTenant);
  const isFocused = useIsFocused();

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchTenantThunk());
  }, [dispatch]);



  const [refreshing, setRefreshing] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const previousPendingIds = React.useRef<string[]>([]);
  const previousActiveIds = React.useRef<string[]>([]);

  useEffect(() => {
    if (allAssignments) {
      const currentPendingIds = allAssignments
        .filter(a => a.status === 'pending')
        .map(a => a.id);

      if (previousPendingIds.current.length > 0) {
        const allCurrentIds = new Set(allAssignments.map(a => a.id));
        const missedIds = previousPendingIds.current.filter(id => !allCurrentIds.has(id));

        if (missedIds.length > 0) {
          Toast.show({
            type: 'error',
            text1: 'Sorry! You missed this order',
          });
        }
      }

      previousPendingIds.current = currentPendingIds;

      const currentActiveIds = allAssignments
        .filter(a => ['accepted', 'en_route', 'in_progress'].includes(a.status))
        .map(a => a.id);

      if (previousActiveIds.current.length > 0) {
        const allCurrentIds = new Set(allAssignments.map(a => a.id));
        const cancelledIds = previousActiveIds.current.filter(id => !allCurrentIds.has(id));

        if (cancelledIds.length > 0) {
          Toast.show({
            type: 'error',
            text1: 'Order Cancelled',
            text2: 'An active order was removed or cancelled.',
          });
        }
      }

      previousActiveIds.current = currentActiveIds;
    }
  }, [allAssignments]);

  useEffect(() => {
    if (!isSummaryLoading && !isAssignmentsLoading) {
      setIsInitialLoad(false);
    }
  }, [isSummaryLoading, isAssignmentsLoading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchSummary(),
        refetchAssignments(),
        dispatch(fetchNotifications())
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSummary, refetchAssignments]);

  const isAvailable = driver?.status === 'Available';

  const activeStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
  const displayStatuses = isAvailable ? ['pending', ...activeStatuses] : activeStatuses;

  const nextDelivery = allAssignments?.find(a => displayStatuses.includes(a.status));

  const pendingCount = allAssignments?.filter(a => displayStatuses.includes(a.status)).length ?? 0;

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const completedCount = allAssignments?.filter(a => a.status === 'completed' && isToday(a.createdAt)).length ?? 0;

  const codCollection = allAssignments?.reduce((total, a) => {
    if (a.status === 'completed' && a.paymentMode === 'cash' && isToday(a.createdAt)) {
      return total + (a.receivedAmount ?? a.codAmount ?? 0);
    }
    return total;
  }, 0) ?? 0;

  return (
    <View style={styles.container}>
      {isFocused && <StatusBar style="light" />}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <DashboardHeader
          driverName={driver?.name || 'Field Partner'}
          isAvailable={isAvailable}
          isTogglingAvailability={isTogglingAvailability}
          tenant={tenant}
          unreadCount={unreadCount}
          onToggleAvailability={() => {
            const hasActiveOrders = allAssignments?.some(a => activeStatuses.includes(a.status));

            if (isAvailable && hasActiveOrders) {
              Toast.show({
                type: 'error',
                text1: 'Cannot go offline',
                text2: 'You must complete or release your active orders first.'
              });
              return;
            }

            setIsTogglingAvailability(true);
            dispatch(toggleAvailability())
              .unwrap()
              .then((updatedDriver) => {
                const newStatus = updatedDriver.status;
                Toast.show({
                  type: 'success',
                  text1: `You are now ${newStatus}`,
                  text2: newStatus === 'Available' ? 'Ready to accept incoming delivery assignments' : 'Your status is set to offline',
                });
              })
              .catch((err) => {
                Toast.show({ type: 'error', text1: 'Failed to update status', text2: String(err) });
              })
              .finally(() => setIsTogglingAvailability(false));
          }}
        />

        {isInitialLoad ? (
          <DashboardSkeleton colors={colors} styles={styles} />
        ) : (
          <>
            <SectionTitle icon="dashboard" title="Today Overview" colors={colors} styles={styles} />
            <View style={styles.workspaceGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  icon="pending-actions"
                  value={String(pendingCount)}
                  label="Pending"
                  tint={colors.status.pending.text}
                  tintLight={colors.status.pending.bg}
                  valueColor={colors.status.pending.text}
                  trend="⏱️ Active"
                  variant="dashboard"
                  onPress={() => safeRouter.push('/(tabs)/assignments?tab=pending')}
                />
                <StatCard
                  icon="check-circle"
                  value={String(completedCount)}
                  label="Completed"
                  tint={colors.status.completed.text}
                  tintLight={colors.status.completed.bg}
                  valueColor={colors.status.completed.text}
                  trend="✓ Done"
                  variant="dashboard"
                  onPress={() => safeRouter.push('/(tabs)/assignments?tab=completed')}
                />
                <StatCard
                  icon="account-balance-wallet"
                  value={`₹${codCollection.toLocaleString('en-IN')}`}
                  label="COD Cash"
                  tint={colors.info}
                  tintLight={colors.infoLight}
                  valueColor={colors.info}
                  trend="₹ Cash"
                  variant="dashboard"
                  onPress={() => safeRouter.push('/wallet?tab=cash')}
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  icon="trending-up"
                  value={`₹${(summary?.totalEarnings ?? 0).toLocaleString('en-IN')}`}
                  label="Earnings"
                  tint={colors.primary}
                  tintLight={colors.primary + '20'}
                  valueColor={colors.textPrimary}
                  trend="↗ Today"
                  variant="dashboard"
                  onPress={() => safeRouter.push('/wallet')}
                />
                <StatCard
                  icon="star"
                  value={`₹${(summary?.commissionEarned ?? 0).toLocaleString('en-IN')}`}
                  label="Commission"
                  tint={colors.accent}
                  tintLight={colors.accentLight}
                  valueColor={colors.textPrimary}
                  trend="★ Bonus"
                  variant="dashboard"
                  onPress={() => safeRouter.push('/wallet?tab=payout')}
                />
              </View>
            </View>

            <SectionTitle
              icon="local-shipping"
              title={nextDelivery ? "Current order" : "Active Orders"}
              count={nextDelivery ? 1 : 0}
              colors={colors}
              styles={styles}
            />

            {nextDelivery ? (
              <View style={{ position: 'relative' }}>
                <NextDeliveryCard
                  assignment={nextDelivery}
                  onStart={() => {
                    safeRouter.push({ pathname: '/assignment/[id]', params: { id: nextDelivery.id } });
                  }}
                />
              </View>
            ) : (
              <View style={styles.emptyCardContainer}>
                <EmptyState
                  icon="done-all"
                  title="All caught up!"
                  description="You have no pending deliveries right now. Go Online to receive new jobs."
                  style={styles.emptyState}
                />
              </View>
            )}
          </>
        )}

        <SectionTitle icon="flash-on" title="Quick Actions" colors={colors} styles={styles} />
        <View style={styles.quickActionsGrid}>
          {getQuickActions(colors).map((action) => (
            <QuickActionButton
              key={action.label}
              {...action}
              badgeCount={action.label === 'Notifications' && isAvailable ? unreadCount : undefined}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 32,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loaderText: {
    ...typography.bodyMedium,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionIconChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  sectionCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  sectionCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  workspaceGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBadgeBanner: {
    backgroundColor: colors.warning + '15',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.warning + '30',
    alignItems: 'center',
  },
  demoBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  emptyCardContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyState: {
    marginBottom: 8,
  },
  toggleDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginTop: -4,
  },
  toggleDemoText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
