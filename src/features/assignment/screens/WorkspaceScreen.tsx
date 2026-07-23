import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardHeader, NextDeliveryCard, QuickActionButton, StatCard } from '@/features/assignment/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDriver, toggleAvailability } from '@/features/auth/redux/authSlice';
import { colors, spacing, FontFamily, typography } from '@/core/theme';
import { useAssignments, useWorkspaceSummary } from '@/hooks/useAssignments';
import { fetchNotifications, selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { useEffect } from 'react';

const QUICK_ACTIONS: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tint: string;
  tintLight: string;
  onPress: () => void;
}[] = [
    { icon: 'qr-code-scanner', label: 'Scan QR', tint: colors.info, tintLight: colors.infoLight, onPress: () => safeRouter.push('/scan-qr') },
    { icon: 'assignment', label: 'My Assignments', tint: colors.info, tintLight: colors.infoLight, onPress: () => safeRouter.push('/(tabs)/assignments') },
    { icon: 'campaign', label: 'Broadcast Jobs', tint: colors.accent, tintLight: colors.accentLight, onPress: () => { } },
    { icon: 'notifications', label: 'Notifications', tint: colors.accent, tintLight: colors.accentLight, onPress: () => safeRouter.push('/notifications') },
  ];

export function WorkspaceScreen() {
  const driver = useAppSelector(selectDriver);
  const dispatch = useAppDispatch();
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useWorkspaceSummary();
  const { data: allAssignments, isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useAssignments();
  const unreadCount = useAppSelector(selectUnreadCount);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const [refreshing, setRefreshing] = useState(false);

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

  const nextDelivery = allAssignments?.find(a =>
    ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status)
  );
  const pendingCount = allAssignments?.filter(a =>
    ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status)
  ).length ?? 0;

  const isAvailable = driver?.status === 'Available';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <DashboardHeader
          name={driver?.name ?? 'Rider'}
          isAvailable={isAvailable}
          onToggleAvailability={() => dispatch(toggleAvailability())}
        />

        {((isSummaryLoading || isAssignmentsLoading) && !refreshing) ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.bodyMedium, { marginTop: spacing.md, color: colors.textSecondary }]}>
              Loading workspace...
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Today's Workspace</Text>
            <View style={styles.workspaceGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  value={String(pendingCount)}
                  label="Pending"
                  tintLight={colors.accentLight}
                  valueColor={colors.textPrimary}
                  variant="dashboard"
                />
                <StatCard
                  value={String(summary?.completedCount ?? 0)}
                  label="Completed"
                  tintLight={colors.primaryLight}
                  valueColor={colors.primary}
                  variant="dashboard"
                />
                <StatCard
                  value={`₹${(summary?.codCollection ?? 0).toString()}`}
                  label="COD Collection"
                  tintLight={colors.primaryLight}
                  valueColor={colors.primary}
                  variant="dashboard"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  value={`₹${(summary?.totalEarnings ?? 0).toLocaleString('en-IN')}`}
                  label="Total Earnings"
                  tintLight={colors.infoLight}
                  valueColor={colors.textPrimary}
                  variant="dashboard"
                />
                <StatCard
                  value={`₹${(summary?.commissionEarned ?? 0).toLocaleString('en-IN')}`}
                  label="Commission Earned"
                  tintLight={colors.infoLight}
                  valueColor={colors.textPrimary}
                  variant="dashboard"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Next Delivery</Text>
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

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={action.label}
              {...action}
              badgeCount={action.label === 'Notifications' ? unreadCount : undefined}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
    paddingBottom: 24,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  workspaceGrid: {
    gap: 12,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
