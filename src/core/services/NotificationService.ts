import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { logger } from '@/core/utils/logger';

// Set up the notification handler to decide what happens when a notification is received while the app is in foreground
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
   * Request permissions and get the Expo Push Token (which uses FCM under the hood on Android)
   */
  static async registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        logger.warn('notification', 'Failed to get push token for push notification!');
        return null;
      }

      try {
        // We use getDevicePushTokenAsync() because backend directly requires FCM token.
        const token = await Notifications.getDevicePushTokenAsync();
        logger.info('notification', `FCM Push Token generated: ${token.data}`);
        return token.data;
      } catch (error) {
        logger.error('notification', `Error fetching push token: ${error}`);
        return null;
      }
    } else {
      logger.warn('notification', 'Must use physical device for Push Notifications');
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
