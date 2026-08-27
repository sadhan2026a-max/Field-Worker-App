import React from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Alert, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Avatar } from '@/shared/components/ui/Avatar';
import { StatTile } from '@/shared/components/ui/StatTile';
import { colors, spacing, typography, palette, FontFamily, useTheme } from '@/core/theme';
import { logoutThunk, selectDriver } from '@/features/auth/redux/authSlice';
import { selectWorkspaceSummary, fetchWorkspaceSummary, selectAssignments } from '@/features/assignment/redux/assignmentSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useIsFocused } from '@react-navigation/native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { theme, colors, isDark, setTheme } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const driver = useAppSelector(selectDriver);
  const workspaceSummary = useAppSelector(selectWorkspaceSummary);
  const assignments = useAppSelector(selectAssignments);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showThemeModal, setShowThemeModal] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const isFocused = useIsFocused();

  const localCompletedCount = assignments?.filter(a => a.status === 'completed').length ?? 0;
  const completedCount = Math.max(workspaceSummary?.completedCount ?? 0, localCompletedCount);

  const pendingCount = assignments?.filter(a =>
    ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status)
  ).length ?? (workspaceSummary?.pendingCount ?? 0);

  const localCodCollection = assignments?.reduce((total, a) => {
    if (a.status === 'completed' && a.paymentMode === 'cash') {
      return total + (a.receivedAmount ?? a.codAmount ?? 0);
    }
    return total;
  }, 0) ?? 0;
  const codCollection = Math.max(workspaceSummary?.codCollection ?? 0, localCodCollection);

  const logout = () => {
    setShowLogoutModal(true);
  };

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
      {isFocused && <StatusBar style={isDark ? "light" : "dark"} />}
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
              <Avatar name={driver.name} size={64} />
              <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.driverName, { marginBottom: 0, flexShrink: 1 }]} numberOfLines={1}>
                    {driver.name}
                  </Text>
                  <View style={{ flex: 1 }} />
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) + '20', marginLeft: 0 }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(driver.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(driver.status) }]}>{driver.status}</Text>
                  </View>
                </View>
                <Text style={styles.driverPhone}>{driver.phone}</Text>
              </View>
            </View>
            <Card style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
              <Text style={styles.sectionTitle}>Today's Performance</Text>
              <View style={styles.statsGrid}>
                <StatTile
                  value={completedCount.toString()}
                  label="Completed"
                  color={palette.green}
                  icon={<MaterialIcons name="check-circle" size={16} color={palette.green} />}
                />
                <StatTile
                  value={pendingCount.toString()}
                  label="Pending"
                  color={palette.orange}
                  icon={<MaterialIcons name="pending-actions" size={16} color={palette.orange} />}
                />
                <StatTile
                  value={`₹${codCollection.toLocaleString()}`}
                  label="COD"
                  color={palette.blue}
                  icon={<MaterialIcons name="payments" size={16} color={palette.blue} />}
                />
              </View>
            </Card>
            <Card style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
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
        
        <Card style={[styles.sectionCard, { backgroundColor: colors.surface, padding: 0, overflow: 'hidden' }]}>
          <Pressable style={styles.settingsItem} onPress={() => router.push('/wallet')} android_ripple={{ color: colors.border }}>
            <View style={[styles.settingsIconWrapper, { backgroundColor: palette.orange + '15' }]}>
              <MaterialIcons name="account-balance-wallet" size={20} color={palette.orange} />
            </View>
            <View style={styles.settingsItemContent}>
              <Text style={styles.settingsItemTitle}>My Wallet & Earnings</Text>
              <Text style={styles.settingsItemSubtitle}>View your earnings and payouts</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.settingsDivider} />

          <Pressable style={styles.settingsItem} onPress={() => router.push('/pin-setup')} android_ripple={{ color: colors.border }}>
            <View style={[styles.settingsIconWrapper, { backgroundColor: palette.blue + '15' }]}>
              <MaterialIcons name="lock" size={20} color={palette.blue} />
            </View>
            <View style={styles.settingsItemContent}>
              <Text style={styles.settingsItemTitle}>Change / Set PIN</Text>
              <Text style={styles.settingsItemSubtitle}>Manage your security PIN</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.settingsDivider} />

          <Pressable style={styles.settingsItem} onPress={() => setShowThemeModal(true)} android_ripple={{ color: colors.border }}>
            <View style={[styles.settingsIconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="palette" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingsItemContent}>
              <Text style={styles.settingsItemTitle}>App Theme</Text>
              <Text style={styles.settingsItemSubtitle}>
                {theme.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).replace('Indigo Orange', 'Indigo + Orange')}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.settingsDivider} />

          <Pressable style={styles.settingsItem} onPress={logout} android_ripple={{ color: palette.red + '20' }}>
            <View style={[styles.settingsIconWrapper, { backgroundColor: palette.red + '15' }]}>
              <MaterialIcons name="logout" size={20} color={palette.red} />
            </View>
            <View style={styles.settingsItemContent}>
              <Text style={[styles.settingsItemTitle, { color: palette.red }]}>Log Out</Text>
              <Text style={styles.settingsItemSubtitle}>Sign out of your account</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </Pressable>
        </Card>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <Modal visible={showThemeModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowThemeModal(false)}>
          <View style={[styles.themeModalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.themeModalTitle}>Select Theme</Text>
            {['royalPurple', 'navyBlue', 'indigoOrange', 'darkTheme', 'tealLogistics'].map((t) => {
              const label = t.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
              const themeColorMap: Record<string, string> = {
                royalPurple: '#6D28D9',
                navyBlue: '#1D4ED8',
                indigoOrange: '#4338CA',
                darkTheme: '#121212',
                tealLogistics: '#0F766E',
              };
              const circleColor = themeColorMap[t] || colors.primary;

              return (
                <Pressable
                  key={t}
                  style={[styles.themeOptionRow, theme === t && { backgroundColor: colors.primary + '15' }]}
                  onPress={() => {
                    setTheme(t as any);
                    setShowThemeModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, marginRight: 12, borderWidth: t === 'darkTheme' ? 1 : 0, borderColor: '#555', overflow: 'hidden' }}>
                      {t === 'indigoOrange' ? (
                        <LinearGradient colors={['#4338CA', '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
                      ) : (
                        <View style={{ flex: 1, backgroundColor: circleColor }} />
                      )}
                    </View>
                    <Text style={[styles.themeOptionText, theme === t && { color: colors.primary, fontWeight: 'bold' }]}>
                      {label.replace('Indigo Orange', 'Indigo + Orange')}
                    </Text>
                  </View>
                  {theme === t && <MaterialIcons name="check" size={20} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showLogoutModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <View style={[styles.themeModalContent, { backgroundColor: colors.surface }]}>
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.red + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialIcons name="logout" size={22} color={palette.red} />
                </View>
                <Text style={[styles.themeModalTitle, { marginBottom: 0, fontWeight: 'bold', fontSize: 18 }]}>Log Out</Text>
              </View>
              <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 22 }}>
                Are you sure you want to log out of your account?
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setShowLogoutModal(false)}
                style={{ flex: 1, borderColor: colors.border, borderWidth: 1 }}
                textStyle={{ color: colors.textPrimary }}
              />
              <Button
                label="Log Out"
                onPress={() => {
                  setShowLogoutModal(false);
                  dispatch(logoutThunk());
                }}
                style={{ flex: 1, backgroundColor: palette.red, borderColor: palette.red }}
                textStyle={{ color: '#FFFFFF' }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
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
    position: 'relative',
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
    justifyContent: 'center',
  },
  driverName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  driverPhone: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  detailIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 4,
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
    gap: 4,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.label,
    fontSize: 11,
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
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  settingsIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  settingsItemTitle: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.medium,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 70,
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeModalContent: {
    width: '80%',
    borderRadius: 16,
    padding: spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  themeModalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  themeOptionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
});
