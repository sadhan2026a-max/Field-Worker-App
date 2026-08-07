import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
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
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';
const getQuickActions = (colors: any): {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
}[] => [
    { icon: 'qr-code-scanner', label: 'Scan QR', tint: colors.info, tintLight: colors.infoLight, onPress: () => safeRouter.push('/scan-qr') },
    { icon: 'assignment', label: 'My Assignments', tint: colors.info, tintLight: colors.infoLight, onPress: () => safeRouter.push('/(tabs)/assignments') },
    { icon: 'campaign', label: 'Broadcast Jobs', tint: colors.accent, tintLight: colors.accentLight, onPress: () => { } },
    { icon: 'notifications', label: 'Notifications', tint: colors.accent, tintLight: colors.accentLight, onPress: () => safeRouter.push('/notifications') },
  ];

function SectionTitle({ icon, title, colors, styles }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; colors: any; styles: any; }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialIcons name={icon} size={15} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
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
  const hasActiveAssignment = allAssignments?.some(a => activeStatuses.includes(a.status));

  const pendingCount = allAssignments?.filter(a => displayStatuses.includes(a.status)).length ?? 0;

  const localCompletedCount = allAssignments?.filter(a => a.status === 'completed').length ?? 0;
  const completedCount = Math.max(summary?.completedCount ?? 0, localCompletedCount);

  const localCodCollection = allAssignments?.reduce((total, a) => {
    if (a.status === 'completed' && a.paymentMode === 'cash') {
      return total + (a.receivedAmount ?? a.codAmount ?? 0);
    }
    return total;
  }, 0) ?? 0;
  const codCollection = Math.max(summary?.codCollection ?? 0, localCodCollection);

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
          tenant={tenant}
          driverName={driver?.name || 'Driver'}
          isAvailable={isAvailable}
          isTogglingAvailability={isTogglingAvailability}
          unreadCount={unreadCount}
          onToggleAvailability={async () => {
            if (isAvailable && hasActiveAssignment) {
              Toast.show({ type: 'error', text1: 'Cannot go offline', text2: 'Please complete or cancel active jobs first.' });
              return;
            }
            setIsTogglingAvailability(true);
            try {
              await dispatch(toggleAvailability()).unwrap();
              Toast.show({ type: 'success', text1: isAvailable ? 'You are now Offline' : 'You are now Online' });
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Failed to update status', text2: error as string });
            } finally {
              setIsTogglingAvailability(false);
            }
          }}
        />

        {((isSummaryLoading || isAssignmentsLoading) && !refreshing) ? (
          <View style={{ gap: spacing.md, paddingVertical: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginBottom: spacing.xs }}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={120} height={20} />
            </View>
            <View style={styles.workspaceGrid}>
              <View style={styles.statsRow}>
                <Skeleton style={{ flex: 1 }} height={80} borderRadius={16} />
                <Skeleton style={{ flex: 1 }} height={80} borderRadius={16} />
                <Skeleton style={{ flex: 1 }} height={80} borderRadius={16} />
              </View>
              <View style={styles.statsRow}>
                <Skeleton style={{ flex: 1 }} height={80} borderRadius={16} />
                <Skeleton style={{ flex: 1 }} height={80} borderRadius={16} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xs }}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={120} height={20} />
            </View>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Skeleton width="100%" height={160} borderRadius={16} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xs }}>
              <Skeleton width={24} height={24} borderRadius={12} />
              <Skeleton width={120} height={20} />
            </View>
            <View style={[styles.workspaceGrid, { marginTop: 0 }]}>
              <View style={styles.statsRow}>
                <Skeleton style={{ flex: 1 }} height={64} borderRadius={12} />
                <Skeleton style={{ flex: 1 }} height={64} borderRadius={12} />
              </View>
              <View style={styles.statsRow}>
                <Skeleton style={{ flex: 1 }} height={64} borderRadius={12} />
                <Skeleton style={{ flex: 1 }} height={64} borderRadius={12} />
              </View>
            </View>
          </View>
        ) : (
          <>
            <SectionTitle icon="dashboard" title="Today's Overview" colors={colors} styles={styles} />
            <View style={styles.workspaceGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  icon="pending-actions"
                  value={String(pendingCount)}
                  label="Pending"
                  tint={colors.warning}
                  tintLight={colors.warningLight}
                  valueColor={colors.warning}
                  variant="dashboard"
                />
                <StatCard
                  icon="check-circle"
                  value={String(completedCount)}
                  label="Completed"
                  tint={colors.primary}
                  tintLight={colors.primaryLight}
                  valueColor={colors.primary}
                  variant="dashboard"
                />
                <StatCard
                  icon="account-balance-wallet"
                  value={`₹${codCollection.toLocaleString()}`}
                  label="COD"
                  tint={colors.info}
                  tintLight={colors.infoLight}
                  valueColor={colors.info}
                  variant="dashboard"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  icon="trending-up"
                  value={`₹${(summary?.totalEarnings ?? 0).toLocaleString('en-IN')}`}
                  label="Earnings"
                  tint={colors.primary}
                  tintLight={colors.primaryLight}
                  valueColor={colors.textPrimary}
                  variant="dashboard"
                />
                <StatCard
                  icon="star"
                  value={`₹${(summary?.commissionEarned ?? 0).toLocaleString('en-IN')}`}
                  label="Commission"
                  tint={colors.accent}
                  tintLight={colors.accentLight}
                  valueColor={colors.textPrimary}
                  variant="dashboard"
                />
              </View>
            </View>

            <SectionTitle icon="local-shipping" title="Next Delivery" colors={colors} styles={styles} />
            {nextDelivery ? (
              <NextDeliveryCard
                assignment={nextDelivery}
                onStart={() => safeRouter.push({ pathname: '/assignment/[id]', params: { id: nextDelivery.id } })}
              />
            ) : (
              <EmptyState
                icon="done-all"
                title="All caught up!"
                description="You have no pending deliveries right now."
                style={styles.emptyState}
              />
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
    gap: 6,
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  workspaceGrid: {
    gap: 10,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyState: {
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
