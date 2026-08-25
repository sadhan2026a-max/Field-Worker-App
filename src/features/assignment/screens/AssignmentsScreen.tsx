import React, { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { spacing, typography, palette, FontFamily, FontSize, useTheme } from '@/core/theme';
import { useAssignments, useWorkspaceSummary } from '@/hooks/useAssignments';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectDriver } from '@/features/auth/redux/authSlice';
import { fetchAssignments } from '@/features/assignment/redux/assignmentSlice';
import { useCurrentLocation, calculateDistanceKm } from '@/shared/utils/location';
import { DistanceDisplay } from '@/features/assignment/components';

function getCardIcon(type: string, colors: any) {
  switch (type) {
    case 'delivery':
      return { icon: 'local-shipping' as const, bg: colors.info };
    case 'pickup':
      return { icon: 'archive' as const, bg: colors.warning };
    case 'return':
      return { icon: 'assignment-return' as const, bg: colors.danger };
    case 'installation':
      return { icon: 'build' as const, bg: colors.primary };
    case 'inspection':
      return { icon: 'fact-check' as const, bg: colors.accent };
    case 'sales_visit':
      return { icon: 'handshake' as const, bg: colors.info };
    case 'service_visit':
      return { icon: 'engineering' as const, bg: colors.primary };
    default:
      return { icon: 'list-alt' as const, bg: colors.textSecondary };
  }
}

function formatAssignmentType(type: string) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AssignmentsScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const driver = useAppSelector(selectDriver);
  const dispatch = useAppDispatch();
  const { data: assignments, isLoading, refetch } = useAssignments();
  const { data: summary, refetch: refetchSummary } = useWorkspaceSummary();
  const currentLocation = useCurrentLocation();
  const params = useLocalSearchParams<{ tab?: 'all' | 'pending' | 'completed' }>();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>(params.tab || 'all');

  useEffect(() => {
    if (activeTab === 'completed') {
      dispatch(fetchAssignments('completed'));
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (params.tab && params.tab !== activeTab) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const onRefresh = async () => {
    await refetch();
    await refetchSummary();
    if (activeTab === 'completed') {
      await dispatch(fetchAssignments('completed'));
    }
  };

  const allAssignments = [...(assignments ?? [])].sort((a, b) => {
    const priority: Record<string, number> = {
      'in_progress': 1,
      'arrived': 2,
      'en_route': 3,
      'accepted': 4,
      'pending': 5,
      'completed': 6,
      'cancelled': 7,
    };

    const pA = priority[a.status] || 99;
    const pB = priority[b.status] || 99;

    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const isOnline = driver?.status === 'Available';
  const activeStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
  const pendingStatuses = isOnline ? ['pending', ...activeStatuses] : activeStatuses;

  const pendingAssignments = allAssignments.filter(
    (a) => pendingStatuses.includes(a.status)
  );
  const completedAssignments = allAssignments.filter(
    (a) => a.status === 'completed'
  );

  const displayCompletedCount = Math.max(summary?.completedCount ?? 0, completedAssignments.length);

  const displayedAssignments =
    activeTab === 'all'
      ? allAssignments
      : activeTab === 'pending'
        ? pendingAssignments
        : completedAssignments;

  // driver status already extracted above

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Assignments</Text>
      </View>

      {/* Tabs list */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabLabel, activeTab === 'all' && styles.activeTabLabel]}>
            All <Text style={styles.tabCount}>{allAssignments.length}</Text>
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabLabel, activeTab === 'pending' && styles.activeTabLabel]}>
            Pending <Text style={styles.tabCount}>{pendingAssignments.length}</Text>
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabLabel, activeTab === 'completed' && styles.activeTabLabel]}>
            Completed <Text style={styles.tabCount}>{displayCompletedCount}</Text>
          </Text>
        </Pressable>
      </View>

      {/* Assignments List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.list}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.cardIconContainer}>
                <Skeleton width={36} height={36} borderRadius={18} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Skeleton width={120} height={16} borderRadius={4} />
                  <Skeleton width={70} height={16} borderRadius={999} />
                  <View style={{ flex: 1 }} />
                  <Skeleton width={70} height={20} borderRadius={999} />
                </View>
                <Skeleton width={140} height={16} borderRadius={4} style={{ marginTop: 4 }} />
                <Skeleton width={200} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width={160} height={12} borderRadius={4} style={{ marginTop: 4 }} />

                <View style={[styles.cardBottomRow, { marginTop: 12 }]}>
                  <Skeleton width={80} height={12} borderRadius={4} />
                  <Skeleton width={70} height={20} borderRadius={6} />
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={displayedAssignments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, displayedAssignments.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
          onRefresh={onRefresh}
          refreshing={false}
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'completed' ? 'done-all' : 'assignment'}
              title={activeTab === 'completed' ? 'No Recent Completions' : 'No Assignments'}
              description={activeTab === 'completed' ? 'Your completed orders for today will appear here. Note: Historical orders are only visible in the web dashboard.' : 'You have no assignments in this category right now.'}
            />
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: item.id } })}>
              <Card style={styles.card}>
                {/* Left Side: Icon Circle */}
                <View style={styles.cardIconContainer}>
                  <View style={[styles.iconCircle, { backgroundColor: getCardIcon(item.status === 'pending' ? 'generic' : item.type, colors).bg }]}>
                    <MaterialIcons
                      name={getCardIcon(item.status === 'pending' ? 'generic' : item.type, colors).icon}
                      size={20}
                      color={palette.white}
                    />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  {/* Top Row */}
                  <View style={styles.cardTopRow}>
                    {item.code !== 'N/A' ? (
                      <Text style={styles.code} numberOfLines={1} ellipsizeMode="tail">{item.code}</Text>
                    ) : (
                      <Text style={styles.code} numberOfLines={1} ellipsizeMode="tail">Cancelled Order</Text>
                    )}
                    {item.status !== 'pending' && item.code !== 'N/A' && (
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{formatAssignmentType(item.type)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <StatusBadge status={item.status} />
                  </View>

                  {/* Customer Info */}
                  {item.customer.name !== 'N/A' && (
                    <Text style={styles.customerName}>{item.customer.name}</Text>
                  )}
                  {item.status !== 'completed' && item.status !== 'cancelled' && (
                    <DistanceDisplay
                      style={styles.distance}
                      currentLocation={currentLocation}
                      targetLocation={item.customer.location}
                      targetAddress={item.customer.address}
                      backendDistanceKm={item.distanceKm}
                    />
                  )}
                  <Text style={styles.address} numberOfLines={2}>
                    {item.customer.address}
                  </Text>

                  {/* Bottom Row (COD & Hint) */}
                  <View style={styles.cardBottomRow}>
                    {(() => {
                      let hint = null;
                      if (item.status === 'accepted') hint = 'Start Navigation';
                      else if (item.status === 'en_route') hint = "I've Arrived";
                      else if (item.status === 'arrived') hint = 'Start Job';
                      else if (item.status === 'in_progress') hint = item.type === 'other' ? 'Complete Job' : 'Continue Job';

                      if (!hint) return <View style={{ flex: 1 }} />;
                      return (
                        <Text style={styles.actionHint}>
                          {hint} →
                        </Text>
                      );
                    })()}

                    {item.code !== 'N/A' && (
                      <View style={styles.codContainer}>
                        <Text style={styles.codLabel}>
                          COD: ₹{(item.codAmount ?? 0).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  onlineBadgeOffline: {
    backgroundColor: colors.border,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  onlineDotOffline: {
    backgroundColor: colors.textSecondary,
  },
  onlineText: {
    color: colors.primary,
    fontSize: FontSize.extraSmall,
    fontFamily: FontFamily.bold,
  },
  onlineTextOffline: {
    color: colors.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primary + '20',
  },
  tabLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: FontSize.regular,
  },
  activeTabLabel: {
    color: colors.primary,
    fontFamily: FontFamily.bold,
  },
  tabCount: {
    fontSize: FontSize.extraSmall,
    opacity: 0.7,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    padding: 12,
  },
  cardIconContainer: {
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  code: {
    ...typography.caption,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  typeBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: FontSize.extraSmall,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
    color: colors.textSecondary,
  },
  customerName: {
    ...typography.bodyMedium,
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
    color: colors.textPrimary,
  },
  distance: {
    ...typography.caption,
    fontSize: FontSize.extraSmall,
    color: colors.warning,
  },
  address: {
    ...typography.caption,
    lineHeight: 16,
    marginTop: 4,
    color: colors.textSecondary,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionHint: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: FontFamily.semiBold,
    flex: 1,
  },
  codContainer: {
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codLabel: {
    ...typography.body,
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
});
