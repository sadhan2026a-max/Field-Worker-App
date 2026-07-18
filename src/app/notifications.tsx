import { NotificationsScreen } from '@/features/notification/screens/NotificationsScreen';
import { Stack } from 'expo-router';

export default function Notifications() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <NotificationsScreen />
    </>
  );
}
