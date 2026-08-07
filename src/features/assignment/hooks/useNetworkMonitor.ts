import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineSyncService } from '@/core/services/OfflineSyncService';
import { api } from '@/shared/services/axios';
import { logger } from '@/core/utils/logger';
import Toast from 'react-native-toast-message';

/**
 * Hook to monitor network status and automatically process the offline sync queue
 * when the device comes back online.
 */
export function useNetworkMonitor() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const isSyncing = useRef(false);

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then(state => {
      setIsOnline(!!state.isConnected);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentlyOnline = !!state.isConnected;
      
      // If we transition from offline to online, process the queue
      if (currentlyOnline && !isOnline) {
        logger.info('network', 'Network connection restored. Processing offline sync queue...');
        processSyncQueue();
      }
      
      setIsOnline(currentlyOnline);
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  const processSyncQueue = async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const queue = await OfflineSyncService.getQueue();
      
      if (queue.length === 0) {
        isSyncing.current = false;
        return;
      }

      logger.info('offline_sync', `Processing ${queue.length} items from sync queue`);
      
      let successCount = 0;
      let failCount = 0;

      for (const action of queue) {
        try {
          // Check if we are still online before processing each item
          const netState = await NetInfo.fetch();
          if (!netState.isConnected) {
            logger.warn('offline_sync', 'Connection lost during sync. Stopping.');
            break;
          }

          logger.debug('offline_sync', `Replaying action ${action.id}: ${action.method} ${action.url}`);
          
          await api.request({
            url: action.url,
            method: action.method,
            data: action.data,
            headers: action.headers,
            // Skip the offline interceptor for replay requests
            _isReplay: true,
          } as any);

          await OfflineSyncService.removeFromQueue(action.id);
          successCount++;
        } catch (error: any) {
          logger.error('offline_sync', `Failed to replay action ${action.id}`, error);
          
          // If it's a 4xx error (e.g., bad request, unauthorized), it won't succeed even if we retry.
          // We should probably remove it to avoid blocking the queue forever, unless it's a 401 we can refresh.
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
             logger.warn('offline_sync', `Client error ${error.response.status}, removing from queue.`);
             await OfflineSyncService.removeFromQueue(action.id);
          }
          
          failCount++;
        }
      }

      if (successCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Sync Complete',
          text2: `${successCount} offline actions synchronized successfully.`,
        });
      }

    } catch (err) {
      logger.error('offline_sync', 'Error during queue processing', err);
    } finally {
      isSyncing.current = false;
    }
  };

  return { isOnline, processSyncQueue };
}
