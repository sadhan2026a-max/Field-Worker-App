import { MaterialIcons } from '@expo/vector-icons';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import {
  DashboardHeader,
  NextDeliveryCard,
  QuickActionButton,
  ShiftOverviewCard,
  SearchingOrderRadar,
} from '@/features/assignment/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectDriver,
  selectIsLoading,
  selectTenant,
  toggleAvailability,
  fetchTenantThunk,
} from '@/features/auth/redux/authSlice';
import { FontFamily, useTheme } from '@/core/theme';
import { useAssignments, useWorkspaceSummary } from '@/hooks/useAssignments';
import { fetchNotifications, selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { syncHistoryFromNotificationsThunk } from '@/features/assignment/redux/assignmentSlice';
import { useIsFocused } from '@react-navigation/native';

const getQuickActions = (colors: any): {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
}[] => [
    {
      icon: 'qr-code-scanner',
      label: 'Scan Order QR',
      subtitle: 'Instant Delivery Check',
      tint: colors.primary,
      tintLight: colors.primary + '15',
      onPress: () => safeRouter.push('/scan-qr'),
    },
    {
      icon: 'assignment',
      label: 'All Assignments',
      subtitle: 'View Active Tasks',
      tint: colors.primaryDark || colors.primary,
      tintLight: (colors.primaryDark || colors.primary) + '15',
      onPress: () => safeRouter.push('/all-assignments'),
    },
    {
      icon: 'campaign',
      label: 'Broadcast Jobs',
      subtitle: 'Claim Extra Deliveries',
      tint: colors.warning,
      tintLight: colors.warning + '15',
      onPress: () => safeRouter.push('/(tabs)/assignments?tab=pending'),
    },
    {
      icon: 'notifications',
      label: 'Notifications',
      subtitle: 'Hub Alerts & Updates',
      tint: colors.danger,
      tintLight: colors.danger + '15',
      onPress: () => safeRouter.push('/notifications'),
    },
  ];











function SectionTitle({
  icon,
  title,
  count,
  isSearching,
  colors,
  styles,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  count?: number;
  isSearching?: boolean;
  colors: any;
  styles: any;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIconChip, { backgroundColor: colors.primary + '14' }]}>
        <MaterialIcons name={icon} size={12} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCountText}>{count} Active</Text>
        </View>
      )}
      {isSearching && (
        <View style={styles.searchingPill}>
          <View style={styles.searchingDot} />
          <Text style={styles.searchingText}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

function DashboardSkeleton({ colors, styles }: any) {
  return (
    <View style={{ gap: 12, paddingTop: 4 }}>
      {/* 1. Today Overview Skeleton */}
      <View style={{ borderRadius: 14, backgroundColor: colors.surface, padding: 11, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={110} height={14} borderRadius={4} />
          <Skeleton width={70} height={12} borderRadius={4} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width="48%" height={52} borderRadius={11} />
          <Skeleton width="48%" height={52} borderRadius={11} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width="48%" height={26} borderRadius={6} />
          <Skeleton width="48%" height={26} borderRadius={6} />
        </View>
      </View>

      {/* 2. Section Header Skeleton (Current Live Order) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: -4 }}>
        <Skeleton width={20} height={20} borderRadius={5} />
        <Skeleton width={120} height={13} borderRadius={4} />
      </View>

      {/* 3. Live Order Card Skeleton (Exact shape of NextDeliveryCard) */}
      <View style={{ borderRadius: 14, backgroundColor: colors.surface, padding: 12, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
        {/* Top Header: Delivery Type + Order Code + Status Badge */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Skeleton width={60} height={20} borderRadius={6} />
            <Skeleton width={90} height={14} borderRadius={4} />
          </View>
          <Skeleton width={110} height={20} borderRadius={10} />
        </View>

        {/* Customer & Route Details */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 2 }}>
          <View style={{ alignItems: 'center', gap: 3, paddingTop: 3 }}>
            <Skeleton width={7} height={7} borderRadius={3.5} />
            <Skeleton width={1.5} height={24} borderRadius={1} />
            <Skeleton width={10} height={10} borderRadius={5} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="50%" height={14} borderRadius={4} />
            <Skeleton width="85%" height={12} borderRadius={4} />
          </View>
        </View>

        {/* Tools & Payment Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border + '40' }}>
          <Skeleton width={55} height={18} borderRadius={5} />
        </View>

        {/* Action Buttons: 2 Equal Buttons (Decline & Accept) */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width="48%" height={36} borderRadius={9} />
          <Skeleton width="48%" height={36} borderRadius={9} />
        </View>
      </View>
    </View>
  );
}

export function WorkspaceScreen() {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const driver = useAppSelector(selectDriver);
  const isAuthLoading = useAppSelector(selectIsLoading);
  const dispatch = useAppDispatch();
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useWorkspaceSummary();
  const { data: allAssignments, isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useAssignments();
  const unreadCount = useAppSelector(selectUnreadCount);
  const tenant = useAppSelector(selectTenant);
  const isFocused = useIsFocused();

  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchTenantThunk());
    dispatch(syncHistoryFromNotificationsThunk({ onlyToday: true }));
  }, [dispatch]);

  const [refreshing, setRefreshing] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const previousPendingIds = useRef<string[]>([]);
  const previousActiveIds = useRef<string[]>([]);

  useEffect(() => {
    if (!driver || isAuthLoading || !allAssignments) {
      previousPendingIds.current = [];
      previousActiveIds.current = [];
      return;
    }

    const currentPendingIds = allAssignments
      .filter((a) => a.status === 'pending')
      .map((a) => a.id);

    if (previousPendingIds.current.length > 0) {
      const allCurrentIds = new Set(allAssignments.map((a) => a.id));
      const missedIds = previousPendingIds.current.filter((id) => !allCurrentIds.has(id));

      if (missedIds.length > 0) {
        Toast.show({
          type: 'error',
          text1: 'Sorry! You missed this order',
        });
      }
    }

    previousPendingIds.current = currentPendingIds;

    const currentActiveIds = allAssignments
      .filter((a) => ['accepted', 'en_route', 'in_progress', 'arrived'].includes(a.status))
      .map((a) => a.id);

    if (previousActiveIds.current.length > 0) {
      const allCurrentIds = new Set(allAssignments.map((a) => a.id));
      const cancelledIds = previousActiveIds.current.filter((id) => !allCurrentIds.has(id));

      if (cancelledIds.length > 0) {
        Toast.show({
          type: 'error',
          text1: 'Order Cancelled',
          text2: 'An active order was removed or cancelled.',
        });
      }
    }

    previousActiveIds.current = currentActiveIds;
  }, [driver, isAuthLoading, allAssignments]);

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
        dispatch(fetchNotifications()),
        dispatch(syncHistoryFromNotificationsThunk({ onlyToday: true })),
      ]);
    } catch (error) {
      console.error('Failed to refresh dashboard', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchSummary, refetchAssignments, dispatch]);

  const isAvailable = driver?.status === 'Available';
  const activeStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
  const nonTerminalStatuses = ['in_progress', 'arrived', 'en_route', 'accepted', 'pending'];

  const activeOrders = (allAssignments || [])
    .filter((a) => nonTerminalStatuses.includes(a.status))
    .sort((a, b) => {
      const priority: Record<string, number> = {
        in_progress: 5,
        arrived: 4,
        en_route: 3,
        accepted: 2,
        pending: 1,
      };
      const pDiff = (priority[b.status] || 0) - (priority[a.status] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  const nextDelivery = activeOrders[0];
  const pendingCount = activeOrders.length;

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const completedCount =
    allAssignments?.filter((a) => a.status === 'completed' && isToday(a.createdAt)).length ?? 0;

  const codCollection =
    allAssignments?.reduce((total, a) => {
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* App Bar (Preserved as requested) */}
        <DashboardHeader
          driverName={driver?.name || 'Field Partner'}
          isAvailable={isAvailable}
          isTogglingAvailability={isTogglingAvailability}
          tenant={tenant}
          unreadCount={unreadCount}
          onToggleAvailability={() => {
            const hasActiveOrders = allAssignments?.some((a) => activeStatuses.includes(a.status));

            if (isAvailable && hasActiveOrders) {
              Toast.show({
                type: 'error',
                text1: 'Cannot go offline',
                text2: 'You must complete or release your active orders first.',
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
                  text2:
                    newStatus === 'Available'
                      ? 'Ready to accept incoming delivery assignments'
                      : 'Your status is set to offline',
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
            {/* ─── 1. Shift Performance Hub (Cleaned without progress bar & bonus) ─── */}
            <ShiftOverviewCard
              totalEarnings={summary?.totalEarnings ?? 0}
              codCollection={codCollection}
              pendingCount={pendingCount}
              completedCount={completedCount}
            />

            {/* ─── 2. Current Order Section (Live Order OR Searching for Orders) ─── */}
            <SectionTitle
              icon={nextDelivery ? 'local-shipping' : 'search'}
              title={nextDelivery ? 'Current Live Order' : (isAvailable ? 'Searching for Orders...' : 'Offline')}
              count={nextDelivery ? 1 : 0}
              isSearching={!nextDelivery && isAvailable}
              colors={colors}
              styles={styles}
            />

            {nextDelivery ? (
              <NextDeliveryCard
                assignment={nextDelivery}
                onStart={() => {
                  safeRouter.push({ pathname: '/assignment/[id]', params: { id: nextDelivery.id } });
                }}
              />
            ) : (
              /* ─── Animated Searching for Orders State ─── */
              <SearchingOrderRadar isAvailable={isAvailable} />
            )}
          </>
        )}

        {/* ─── 3. Quick Operations Toolbox ─── */}
        <SectionTitle icon="bolt" title="Quick Operations" colors={colors} styles={styles} />
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
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  sectionIconChip: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: 0.1,
  },
  sectionCountBadge: {
    backgroundColor: colors.primary + '16',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  sectionCountText: {
    color: colors.primary,
    fontSize: 9,
    fontFamily: FontFamily.bold,
  },
  searchingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '16',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 3,
    gap: 3.5,
  },
  searchingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  searchingText: {
    color: colors.primary,
    fontSize: 8.5,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
