import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, typography, palette, FontFamily, colors, useTheme } from '@/core/theme';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDriver } from '@/features/auth/redux/authSlice';
import {
  fetchCashSettlements,
  fetchPayouts,
  selectCashSettlements,
  selectPayouts,
  selectWalletLoading,
  selectWalletError
} from '../redux/walletSlice';
import { LedgerItem } from '../components/LedgerItem';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router, useLocalSearchParams } from 'expo-router';

type Tab = 'cash' | 'payout';

export default function WalletScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => useStyles(colors), [colors]);
  const dispatch = useAppDispatch();
  const driver = useAppSelector(selectDriver);
  const cashSettlements = useAppSelector(selectCashSettlements);
  const payouts = useAppSelector(selectPayouts);
  const isLoading = useAppSelector(selectWalletLoading);
  const error = useAppSelector(selectWalletError);

  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [activeTab, setActiveTab] = useState<Tab>(params.tab || 'cash');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.tab && params.tab !== activeTab) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const loadData = async (showRefreshIndicator = false) => {
    if (driver?.id) {
      if (showRefreshIndicator) setRefreshing(true);
      await Promise.all([
        dispatch(fetchCashSettlements(driver.id)),
        dispatch(fetchPayouts(driver.id))
      ]);
      if (showRefreshIndicator) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [driver]);

  const onRefresh = () => {
    loadData(true);
  };

  const currentData = activeTab === 'cash' ? cashSettlements : payouts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings & Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cash' && styles.activeTab]}
          onPress={() => setActiveTab('cash')}
        >
          <MaterialIcons
            name="account-balance-wallet"
            size={16}
            color={activeTab === 'cash' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'cash' && styles.activeTabText]}>
            Cash Settled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payout' && styles.activeTab]}
          onPress={() => setActiveTab('payout')}
        >
          <MaterialIcons
            name="account-balance"
            size={16}
            color={activeTab === 'payout' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'payout' && styles.activeTabText]}>
            Payouts
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {error ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="cloud-off" size={64} color={palette.grey300 || colors.textSecondary} />
            <Text style={styles.errorText}>
              Unable to load your earnings data. Please check your connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(true)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LedgerItem item={item} type={activeTab} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={() => (
              !isLoading ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name={activeTab === 'cash' ? 'account-balance-wallet' : 'account-balance'}
                    size={64}
                    color={palette.grey300}
                  />
                  <Text style={styles.emptyTitle}>No History Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {activeTab === 'cash'
                      ? 'You have not settled any cash yet.'
                      : 'You have not received any payouts yet.'}
                  </Text>
                </View>
              ) : null
            )}
            ListFooterComponent={isLoading && !refreshing ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}
          />
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary + '15',
  },
  tabText: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.medium,
    color: colors.textSecondary,
    marginLeft: 6,
    fontSize: 13,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: FontFamily.bold,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    ...typography.bodyMedium,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  }
});
