import { Redirect } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { selectDriver, selectIsLoading } from '@/features/auth/redux/authSlice';
import { ScreenLoader } from '@/components/ui/ScreenLoader';

export default function Index() {
  return null;
}
