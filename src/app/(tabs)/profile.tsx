import React from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Avatar } from '@/shared/components/ui/Avatar';
import { StatTile } from '@/shared/components/ui/StatTile';
import { colors, spacing, typography, palette, FontFamily } from '@/core/theme';
import { logoutThunk, selectDriver } from '@/features/auth/redux/authSlice';
import { selectWorkspaceSummary, fetchWorkspaceSummary } from '@/features/assignment/redux/assignmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);
  const workspaceSummary = useAppSelector(selectWorkspaceSummary);
  const [refreshing, setRefreshing] = React.useState(false);

  const logout = () => dispatch(logoutThunk());

  const onRefresh = React.useCallback(async () => {
    if (driver?.id) {
      setRefreshing(true);
      await dispatch(fetchWorkspaceSummary(driver.id));
      setRefreshing(false);
    }
  }, [dispatch, driver]);

  React.useEffect(() => {
    if (driver?.id && !workspaceSummary) {
      dispatch(fetchWorkspaceSummary(driver.id));
    }
  }, [dispatch, driver, workspaceSummary]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return palette.green;
      case 'busy': return palette.orange;
      case 'offline': return palette.grey500;
      default: return palette.grey500;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.green]} tintColor={palette.green} />}
      >
        {driver ? (
          <>
            <View style={styles.profileHeader}>
              <Avatar name={driver.name} size={84} />
              <View style={styles.profileInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverPhone}>{driver.phone}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(driver.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(driver.status) }]}>{driver.status}</Text>
                </View>
              </View>
            </View>

            {/* Performance Stats */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Today's Performance</Text>
              <View style={styles.statsGrid}>
                <StatTile 
                  value={workspaceSummary?.completedCount?.toString() || '0'} 
                  label="Completed" 
                  color={palette.green} 
                  icon={<MaterialIcons name="check-circle" size={24} color={palette.green} />}
                />
                <StatTile 
                  value={workspaceSummary?.pendingCount?.toString() || '0'} 
                  label="Pending" 
                  color={palette.orange} 
                  icon={<MaterialIcons name="pending-actions" size={24} color={palette.orange} />}
                />
                <StatTile 
                  value={`₹${(workspaceSummary?.codCollection || 0).toLocaleString()}`} 
                  label="COD Collected" 
                  color={palette.blue} 
                  icon={<MaterialIcons name="payments" size={24} color={palette.blue} />}
                />
              </View>
            </Card>

            {/* Account Details */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Driver ID</Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{driver.id.split('-')[0].toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="local-shipping" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Assignable Orders</Text>
                  <View style={styles.badgeContainer}>
                    {driver.assignableOrderTypes?.length ? (
                      driver.assignableOrderTypes.map((t) => (
                        <View key={t} style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>All Types</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="business" size={20} color={colors.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Tenant ID</Text>
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{driver.tenantId}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Profile details not found.</Text>
          </View>
        )}

        <View style={styles.spacer} />

        <Button 
          label="Log Out" 
          variant="outline" 
          onPress={logout} 
          style={styles.logoutBtn}
          textStyle={styles.logoutLabel}
          icon={<MaterialIcons name="logout" size={18} color={palette.red} />}
        />
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  driverName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  driverPhone: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...typography.label,
    fontSize: 12,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: palette.grey50,
    borderRadius: 12,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.grey50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.medium,
    color: colors.textPrimary,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  badge: {
    backgroundColor: palette.grey100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.grey200,
  },
  badgeText: {
    ...typography.label,
    fontSize: 12,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
  },
  logoutBtn: {
    borderColor: palette.red,
    marginTop: spacing.xl,
  },
  logoutLabel: {
    color: palette.red,
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
