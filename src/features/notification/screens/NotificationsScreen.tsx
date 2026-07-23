import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNotifications, markAsRead, selectNotifications, selectIsLoadingNotifications } from '../redux/notificationSlice';
import { colors, spacing, FontFamily, palette } from '@/core/theme';
import { NotificationDto } from '../types/Notification';
// import { formatDistanceToNow } from 'date-fns';

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const isLoading = useAppSelector(selectIsLoadingNotifications);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications());
    setRefreshing(false);
  }, [dispatch]);

  const handleNotificationPress = async (notification: NotificationDto) => {
    if (!notification.readAt) {
      dispatch(markAsRead(notification.id));
    }
    
    if (notification.relatedOrderId) {
      router.push({ pathname: '/assignment/[id]', params: { id: notification.relatedOrderId } });
    }
  };

  const renderItem = ({ item }: { item: NotificationDto }) => {
    const isUnread = !item.readAt;
    
    return (
      <Pressable 
        style={[styles.notificationCard, isUnread && styles.unreadCard]} 
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, isUnread ? styles.unreadIconCircle : styles.readIconCircle]}>
            <MaterialIcons name="notifications" size={20} color={isUnread ? palette.white : colors.textSecondary} />
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
          <Text style={[styles.message, isUnread && styles.unreadMessage]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        
        {isUnread && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && !refreshing && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          }
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-start',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    backgroundColor: colors.infoLight,
    borderColor: colors.border,
  },
  iconContainer: {
    paddingTop: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIconCircle: {
    backgroundColor: colors.primary,
  },
  readIconCircle: {
    backgroundColor: palette.grey100,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  unreadTitle: {
    fontFamily: FontFamily.bold,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
  },
  message: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  unreadMessage: {
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.red,
    marginTop: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
