import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { safeRouter } from '@/shared/utils/navigation';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardHeader, NextDeliveryCard, QuickActionButton, StatCard } from '@/features/assignment/components';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDriver, toggleAvailability } from '@/features/auth/redux/authSlice';
import { colors, spacing, FontFamily, typography } from '@/core/theme';
import { useAssignments, useWorkspaceSummary } from '@/hooks/useAssignments';
import { fetchNotifications, selectUnreadCount } from '@/features/notification/redux/notificationSlice';
import { useIsFocused } from '@react-navigation/native';
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

function SectionTitle({ icon, title }: { icon: keyof typeof MaterialIcons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <MaterialIcons name={icon} size={15} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function WorkspaceScreen() {
  const driver = useAppSelector(selectDriver);
  const dispatch = useAppDispatch();
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useWorkspaceSummary();
  const { data: allAssignments, isLoading: isAssignmentsLoading, refetch: refetchAssignments } = useAssignments();
  const unreadCount = useAppSelector(selectUnreadCount);
  const isFocused = useIsFocused();

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
  
  const localCompletedCount = allAssignments?.filter(a => a.status === 'completed').length ?? 0;
  const completedCount = Math.max(summary?.completedCount ?? 0, localCompletedCount);

  const localCodCollection = allAssignments?.reduce((total, a) => {
    if (a.status === 'completed' && a.paymentMode === 'cash') {
      return total + (a.receivedAmount ?? a.codAmount ?? 0);
    }
    return total;
  }, 0) ?? 0;
  const codCollection = Math.max(summary?.codCollection ?? 0, localCodCollection);

  const isAvailable = driver?.status === 'Available';

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
          name={driver?.name ?? 'Rider'}
          isAvailable={isAvailable}
          onToggleAvailability={() => dispatch(toggleAvailability())}
        />

        {((isSummaryLoading || isAssignmentsLoading) && !refreshing) ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Loading workspace...</Text>
          </View>
        ) : (
          <>
            <SectionTitle icon="dashboard" title="Today's Overview" />
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

            <SectionTitle icon="local-shipping" title="Next Delivery" />
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

        <SectionTitle icon="flash-on" title="Quick Actions" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
