import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/core/utils/logger';

// ── Notification Channel IDs ─────────────────────────────────────────────────
// Use fresh channel IDs so Android creates them with MAX importance (Heads-Up banner,
// audible custom sound, status bar icon). Android never allows modifying importance
// or sound on an existing/deleted channel.
export const CHANNEL_NEW_ORDER = 'order_alerts_v5';
export const CHANNEL_CANCELLED = 'order_cancelled_v5';

// Set up the notification handler for foreground reception:
// Display heads-up banner on top of the screen, play sound, and show status bar icon!
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const notifType = String(data?.type || '').toLowerCase();
    const title = String(notification.request.content.title || '').toLowerCase();
    const isRemoteCancel = !data?._isLocal && (notifType.includes('cancel') || title.includes('cancel'));

    // If it's a raw remote cancellation, suppress the generic remote push so our specialized
    // cancellation notification with order_cancelled.wav sound and modal triggers cleanly
    if (isRemoteCancel) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true, // Crucial for floating heads-up pop-up on screen!
      shouldShowList: true,
    };
  },
});

export class NotificationService {
  /**
   * Register Android notification channels safely.
   */
  static async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // ── Primary Channel: order_alerts_v5 (New Orders - Heads-up Pop-up) ───
      await Notifications.setNotificationChannelAsync(CHANNEL_NEW_ORDER, {
        name: 'New Orders',
        description: 'New orders and delivery assignment notifications',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'new_order.wav',
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION_EVENT,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
        vibrationPattern: [0, 300],
        lightColor: '#10B981',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // ── Secondary Channel: order_cancelled_v5 (Order Cancellations - Heads-up Pop-up) ─
      await Notifications.setNotificationChannelAsync(CHANNEL_CANCELLED, {
        name: 'Order Cancellation Alerts',
        description: 'Alerts when an order has been cancelled',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'order_cancelled.wav',
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION_EVENT,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
        vibrationPattern: [0, 400],
        lightColor: '#EF4444',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // Also ensure 'default' channel is configured as MAX just in case
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Order Alerts',
        description: 'General system order alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'new_order.wav',
        enableVibrate: true,
        vibrationPattern: [0, 300],
        lightColor: '#10B981',
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      logger.info('notification', 'Android notification channels initialized successfully with MAX importance');
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
    } catch { }

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
