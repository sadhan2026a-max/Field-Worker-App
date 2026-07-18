import { api } from '@/shared/services/axios';
import { NotificationDto } from '../types/Notification';
import { logger } from '@/shared/services/logger';

export async function getNotifications(): Promise<NotificationDto[]> {
  logger.debug('notification', 'Fetching notifications');
  try {
    const response = await api.get<NotificationDto[]>('/api/v1/notifications');
    return Array.isArray(response.data) ? response.data : ((response.data as any)?.items || []);
  } catch (error) {
    logger.error('notification', 'Failed to fetch notifications', error);
    throw error;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  logger.info('notification', 'Marking notification as read', { id });
  try {
    await api.patch(`/api/v1/notifications/${id}/read`);
  } catch (error) {
    logger.error('notification', 'Failed to mark notification as read', error);
    throw error;
  }
}
