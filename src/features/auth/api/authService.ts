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

export async function updateLocation(lat: number, lng: number): Promise<void> {
  try {
    const driverId = await AsyncStorage.getItem('riderId');
    if (!driverId) return;
    
    await api.post(`/api/v1/drivers/${driverId}/location`, { lat, lng });
  } catch (error) {
    // Fail silently so it doesn't interrupt the user
    console.warn('Failed to update driver location:', error);
  }
}

export async function registerDeviceToken(token: string): Promise<void> {
  try {
    await api.post('/api/v1/drivers/me/device-tokens', { token, platform: 'android' });
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}

export async function removeDeviceToken(token: string): Promise<void> {
  try {
    await api.delete(`/api/v1/drivers/me/device-tokens?token=${encodeURIComponent(token)}`);
  } catch (error) {
    console.error('Failed to remove device token:', error);
  }
}

export async function setPin(currentPassword: string, pin: string): Promise<void> {
  await api.patch('/api/v1/drivers/me/pin', { currentPassword, pin });
}

export interface TenantInfo {
  name: string;
  logoUrl?: string;
}

export async function getTenant(): Promise<TenantInfo> {
  const res = await api.get<TenantInfo>('/api/v1/drivers/me/tenant');
  return res.data;
}

export async function requestPasswordReset(phone: string): Promise<void> {
  await api.post('/api/v1/auth/password-reset/request', { phone, subjectType: 'Driver' });
}

export async function confirmPasswordReset(phone: string, token: string, newPassword: string): Promise<void> {
  await api.post('/api/v1/auth/password-reset/confirm', { phone, otp: token, newPassword, subjectType: 'Driver' });
}
