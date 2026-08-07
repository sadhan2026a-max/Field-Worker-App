import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/core/utils/logger';

export interface SyncAction {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: any;
  timestamp: number;
}

const OFFLINE_SYNC_QUEUE_KEY = '@field_worker:offline_sync_queue';

export class OfflineSyncService {
  /**
   * Add a failed API request to the sync queue.
   */
  static async enqueueAction(action: Omit<SyncAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newAction: SyncAction = {
        ...action,
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        timestamp: Date.now(),
      };
      
      queue.push(newAction);
      await AsyncStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(queue));
      logger.info('offline_sync', `Action queued: ${action.method} ${action.url}`, { id: newAction.id });
    } catch (error) {
      logger.error('offline_sync', 'Failed to enqueue action', error);
    }
  }

  /**
   * Retrieve all queued actions.
   */
  static async getQueue(): Promise<SyncAction[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      logger.error('offline_sync', 'Failed to get queue', error);
      return [];
    }
  }

  /**
   * Remove an action from the queue by ID.
   */
  static async removeFromQueue(id: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(OFFLINE_SYNC_QUEUE_KEY, JSON.stringify(filtered));
      logger.debug('offline_sync', `Removed action from queue: ${id}`);
    } catch (error) {
      logger.error('offline_sync', 'Failed to remove from queue', error);
    }
  }

  /**
   * Clear the entire sync queue.
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OFFLINE_SYNC_QUEUE_KEY);
      logger.info('offline_sync', 'Queue cleared');
    } catch (error) {
      logger.error('offline_sync', 'Failed to clear queue', error);
    }
  }
}
