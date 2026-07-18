import { ScanQrScreen } from '@/features/assignment/screens/ScanQrScreen';
import { Stack } from 'expo-router';

export default function ScanQr() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <ScanQrScreen />
    </>
  );
}
