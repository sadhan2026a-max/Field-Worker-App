import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { logger } from '@/core/utils/logger';

// ── Notification Channel IDs ─────────────────────────────────────────────────
// 'default' matches the Firebase default channel expected by backend FCM payloads
export const CHANNEL_NEW_ORDER = 'default';
export const CHANNEL_CANCELLED = 'order_cancelled';

// Set up the notification handler for foreground reception
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Register Android notification channels safely.
   */
  static async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // ── Primary Channel: default (used by FCM push notifications) ─────────
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Order Alerts',
        description: 'New orders and delivery assignment notifications',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'new_order.wav',
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#10B981',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });

      // ── Secondary Channel: order_cancelled (distinct warning sound) ───────
      await Notifications.setNotificationChannelAsync('order_cancelled', {
        name: 'Order Cancellation Alerts',
        description: 'Alerts when an order has been cancelled',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'order_cancelled.wav',
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        lightColor: '#EF4444',
        enableLights: true,
        enableVibrate: true,
        showBadge: false,
      });

      logger.info('notification', 'Android notification channels initialized successfully');
    } catch (channelError) {
      logger.warn('notification', 'Failed to setup notification channels', channelError);
    }
  }

  /**
   * Request permissions and retrieve native FCM device push token.
   */
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    // Attempt channel setup, but never let it block token registration
    try {
      await NotificationService.setupAndroidChannels();
    } catch {}

    if (!Device.isDevice) {
      logger.warn('notification', 'Must use physical device for Push Notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('notification', 'Notification permission not granted by user');
        return null;
      }

      // 1. Primary: native FCM push token
      try {
        const token = await Notifications.getDevicePushTokenAsync();
        logger.info('notification', `FCM Push Token generated: ${token.data}`);
        return token.data;
      } catch (fcmError) {
        logger.warn('notification', 'getDevicePushTokenAsync failed, attempting getExpoPushTokenAsync fallback', fcmError);
      }

      // 2. Fallback: Expo push token
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync();
        logger.info('notification', `Expo Push Token generated: ${expoToken.data}`);
        return expoToken.data;
      } catch (expoError) {
        logger.error('notification', 'Both FCM and Expo push token generation failed', expoError);
        return null;
      }
    } catch (err) {
      logger.error('notification', 'Error registering for push notifications', err);
      return null;
    }
  }

  static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}
