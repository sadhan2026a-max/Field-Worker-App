import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { selectDriver, selectIsLoading } from '@/features/auth/redux/authSlice';
import { ScreenLoader } from '@/components/ui/ScreenLoader';

export default function Index() {
  const driver = useAppSelector(selectDriver);
  const isLoading = useAppSelector(selectIsLoading);

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (driver) {
    if (!driver.hasPin) {
      return <Redirect href="/pin-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
