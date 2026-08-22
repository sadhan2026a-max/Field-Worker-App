import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { logger } from './logger';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BASE_URL || 'http://161.97.89.175:5091',
  timeout: 30000,
  headers: {
    accept: 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('riderToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (__DEV__) {
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
    const method = (config.method ?? 'get').toUpperCase();
    (config as any).metadata = { startTime: Date.now() };

    const yellow = '\x1b[33m';
    const reset = '\x1b[0m';

    const logLines: string[] = [];
    logLines.push(`\n╔╣ Request ║ ${method}`);
    logLines.push(`║  ${url}`);
    logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);

    if (config.headers) {
      logLines.push(`╔ Headers`);
      Object.entries(config.headers).forEach(([key, value]) => {
        if (typeof value !== 'undefined') logLines.push(`╟ ${key}: ${value}`);
      });
      logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);
    }

    if (config.params && Object.keys(config.params).length > 0) {
      logLines.push(`╔ Params`);
      Object.entries(config.params).forEach(([key, value]) => {
        logLines.push(`╟ ${key}: ${value}`);
      });
      logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);
    }

    if (config.data) {
      logLines.push(`╔ Body`);
      const bodyStr = JSON.stringify(config.data, null, 4);
      bodyStr.split('\n').forEach(line => logLines.push(`║    ${line}`));
      logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);
    }

    console.log(logLines.map(line => `${yellow}${line}${reset}`).join('\n'));
  }

  return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const { config } = response;
      const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
      const method = (config.method ?? 'get').toUpperCase();
      const startTime = (config as any).metadata?.startTime;
      const timeMs = startTime ? Date.now() - startTime : '?';

      const green = '\x1b[32m';
      const reset = '\x1b[0m';

      const logLines: string[] = [];
      logLines.push(`\n╔╣ Response ║ ${method} ║ Status: ${response.status} ║ Time: ${timeMs} ms`);
      logLines.push(`║  ${url}`);
      logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);

      if (response.data) {
        logLines.push(`╔ Body`);
        const bodyStr = JSON.stringify(response.data, null, 4);
        bodyStr.split('\n').forEach(line => logLines.push(`║    ${line}`));
        logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);
      }

      console.log(logLines.map(line => `${green}${line}${reset}`).join('\n'));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _suppressLog?: boolean };

    if (__DEV__ && !originalRequest?._suppressLog) {
      const failedUrl = `${originalRequest?.baseURL ?? ''}${originalRequest?.url ?? ''}`;
      const status = error.response?.status ?? 'NETWORK_ERROR';
      const method = (originalRequest?.method ?? 'get').toUpperCase();
      const startTime = (originalRequest as any)?.metadata?.startTime;
      const timeMs = startTime ? Date.now() - startTime : '?';

      const red = '\x1b[31m';
      const reset = '\x1b[0m';

      const logLines: string[] = [];
      logLines.push(`\n╔╣ Error ║ ${method} ║ Status: ${status} ║ Time: ${timeMs} ms`);
      logLines.push(`║  ${failedUrl}`);
      logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);

      const errorData = error.response?.data ?? error.message;
      if (errorData) {
        logLines.push(`╔ Error Data`);
        const bodyStr = typeof errorData === 'string' ? errorData : JSON.stringify(errorData, null, 4);
        bodyStr.split('\n').forEach(line => logLines.push(`║    ${line}`));
        logLines.push(`╚══════════════════════════════════════════════════════════════════════════════════════════╝`);
      }

      console.log(logLines.map(line => `${red}${line}${reset}`).join('\n'));
    }

    
    const isModifyingRequest = ['post', 'put', 'patch', 'delete'].includes(originalRequest?.method?.toLowerCase() || '');
    const isReplay = (originalRequest as any)?._isReplay;
    const isNetworkError = !error.response; // No response usually means no internet or server down

    // We only want to queue assignment-related actions to avoid queuing things like login or fetch
    const isAssignmentAction = originalRequest?.url && (originalRequest.url.includes('/assignment') || originalRequest.url.includes('/order'));

    if (isNetworkError && isModifyingRequest && isAssignmentAction && !isReplay) {
      try {
        const { OfflineSyncService } = require('@/core/services/OfflineSyncService');
        const { logger } = require('@/core/utils/logger');
        
        let parsedData = originalRequest.data;
        if (typeof parsedData === 'string') {
           try { parsedData = JSON.parse(parsedData); } catch(e) {}
        }

        logger.info('network', `Network error on ${originalRequest.url}. Queuing for offline sync.`);
        
        await OfflineSyncService.enqueueAction({
          url: originalRequest.url || '',
          method: originalRequest.method || 'post',
          data: parsedData,
          headers: originalRequest.headers,
        });
        
        // Return a mock success response so Redux handles it optimistically
        return Promise.resolve({ data: { success: true, _offlineQueued: true }, status: 202, config: originalRequest, headers: {}, statusText: 'Accepted' });
      } catch (e) {
         console.error('Failed to queue offline action', e);
      }
    }

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/logout') || originalRequest?.url?.includes('/device-tokens');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('riderRefreshToken');
        if (refreshToken) {
          const res = await axios.post(`${api.defaults.baseURL?.toString().replace(/\/$/, '')}/api/v1/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.accessToken;
          const newRefreshToken = res.data.refreshToken;

          if (newAccessToken) {
            await AsyncStorage.setItem('riderToken', newAccessToken);
          }
          if (newRefreshToken) {
            await AsyncStorage.setItem('riderRefreshToken', newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);

          return api(originalRequest);
        } else {
          processQueue(new Error('No refresh token'));
          throw new Error('No refresh token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.multiRemove(['riderToken', 'riderRefreshToken', 'riderId']);
        const { store } = require('@/store');
        const { logoutThunk } = require('@/features/auth/redux/authSlice');
        store.dispatch(logoutThunk());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
