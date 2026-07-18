import AsyncStorage from '@react-native-async-storage/async-storage';
import { Driver } from '@/domain/entities/Driver';
import { api } from '@/shared/services/axios';

export async function login(phone: string, password?: string, pin?: string): Promise<Driver> {
  const payload = pin 
    ? { phone, pin, subjectType: 'Driver' } 
    : { phone, password, subjectType: 'Driver' };
  const loginRes = await api.post('/api/v1/auth/login', payload);
  
  const { accessToken, refreshToken, subjectId } = loginRes.data;
  await AsyncStorage.setItem('riderToken', accessToken);
  await AsyncStorage.setItem('riderRefreshToken', refreshToken);
  await AsyncStorage.setItem('riderId', subjectId);
  
  const meRes = await api.get<Driver>('/api/v1/drivers/me');
  return meRes.data;
}

export async function logout(): Promise<void> {
  try {
    const refreshToken = await AsyncStorage.getItem('riderRefreshToken');
    if (refreshToken) {
      await api.post('/api/v1/auth/logout', { refreshToken });
    }
  } catch (error) {
    console.error('Logout API failed:', error);
  } finally {
    await AsyncStorage.multiRemove(['riderToken', 'riderRefreshToken', 'riderId']);
  }
}

export async function getStoredDriver(): Promise<Driver | null> {
  const token = await AsyncStorage.getItem('riderToken');
  if (!token) return null;
  
  try {
    const meRes = await api.get<Driver>('/api/v1/drivers/me');
    return meRes.data;
  } catch (error) {
    return null;
  }
}

export async function updateDriverStatus(id: string, status: Driver['status']): Promise<Driver> {
  const res = await api.patch<Driver>(`/api/v1/drivers/${id}/status`, { status });
  return res.data;
}
