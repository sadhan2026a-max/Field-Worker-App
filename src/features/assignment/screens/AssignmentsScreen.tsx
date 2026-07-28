import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors, spacing, typography, palette, FontFamily, FontSize } from '@/core/theme';
import { useAssignments } from '@/hooks/useAssignments';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectDriver } from '@/features/auth/redux/authSlice';
import { fetchAssignments } from '@/features/assignment/redux/assignmentSlice';
import { useCurrentLocation, calculateDistanceKm } from '@/shared/utils/location';
import { DistanceDisplay } from '@/features/assignment/components';

function getCardIcon(type: string) {
  switch (type) {
    case 'delivery':
      return { icon: 'local-shipping' as const, bg: palette.blue };
    case 'pickup':
      return { icon: 'archive' as const, bg: palette.orange };
    case 'return':
      return { icon: 'assignment-return' as const, bg: palette.red };
    case 'installation':
      return { icon: 'build' as const, bg: palette.green };
    case 'inspection':
      return { icon: 'fact-check' as const, bg: '#9c27b0' };
    case 'sales_visit':
      return { icon: 'handshake' as const, bg: palette.blue };
    case 'service_visit':
      return { icon: 'engineering' as const, bg: palette.green };
    default:
      return { icon: 'list-alt' as const, bg: palette.grey500 };
  }
}

function formatAssignmentType(type: string) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AssignmentsScreen() {
  const driver = useAppSelector(selectDriver);
  const dispatch = useAppDispatch();
  const { data: assignments, isLoading, refetch } = useAssignments();
  const currentLocation = useCurrentLocation();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (activeTab === 'completed') {
      dispatch(fetchAssignments('completed'));
    }
  }, [activeTab, dispatch]);

  const allAssignments = assignments ?? [];
  const pendingAssignments = allAssignments.filter(
    (a) => ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status)
  );
  const completedAssignments = allAssignments.filter(
    (a) => a.status === 'completed'
  );

  const displayedAssignments =
    activeTab === 'all'
      ? allAssignments
      : activeTab === 'pending'
      ? pendingAssignments
      : completedAssignments;

  const isOnline = driver?.status === 'Available';

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
            Completed <Text style={styles.tabCount}>{completedAssignments.length}</Text>
          </Text>
        </Pressable>
      </View>

      {/* Assignments List */}
      <FlatList
        data={displayedAssignments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/assignment/[id]', params: { id: item.id } })}>
            <Card style={styles.card}>
              {/* Left Side: Icon Circle */}
              <View style={styles.cardIconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: getCardIcon(item.status === 'pending' ? 'generic' : item.type).bg }]}>
                  <MaterialIcons
                    name={getCardIcon(item.status === 'pending' ? 'generic' : item.type).icon}
                    size={20}
                    color={palette.white}
                  />
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                {/* Top Row */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.code}>{item.code}</Text>
                  {item.status !== 'pending' && (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{formatAssignmentType(item.type)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  <StatusBadge status={item.status} />
                </View>

                {/* Customer Info */}
                <Text style={styles.customerName}>{item.customer.name}</Text>
                <DistanceDisplay
                  style={styles.distance}
                  currentLocation={currentLocation}
                  targetLocation={item.customer.location}
                  targetAddress={item.customer.address}
                  backendDistanceKm={item.distanceKm}
                />
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
                  
                  <View style={styles.codContainer}>
                    <Text style={styles.codLabel}>
                      COD: ₹{(item.codAmount ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: palette.greenLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  onlineBadgeOffline: {
    backgroundColor: palette.grey200,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.green,
  },
  onlineDotOffline: {
    backgroundColor: colors.textSecondary,
  },
  onlineText: {
    color: palette.greenDark,
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
    backgroundColor: palette.grey100,
  },
  activeTab: {
    backgroundColor: colors.primaryLight,
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
  },
  code: {
    ...typography.caption,
    fontFamily: FontFamily.bold,
  },
  typeBadge: {
    backgroundColor: palette.grey200,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
  },
  customerName: {
    ...typography.bodyMedium,
    fontSize: FontSize.small,
    fontFamily: FontFamily.semiBold,
  },
  distance: {
    ...typography.caption,
    fontSize: FontSize.extraSmall,
  },
  address: {
    ...typography.caption,
    lineHeight: 16,
    marginTop: 4,
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
    backgroundColor: palette.grey100,
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
