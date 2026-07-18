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
    
    const yellow = '\x1b[33m';
    const reset = '\x1b[0m';
    const colorize = (text: string) => `${yellow}${text}${reset}`;

    console.log(colorize('\n======================================================'));
    console.log(colorize(`🚀 API REQUEST: ${method} ${url}`));
    console.log(colorize('======================================================'));
    if (config.params && Object.keys(config.params).length > 0) {
      console.log(colorize(`📝 PARAMS:\n${JSON.stringify(config.params, null, 2)}`));
    }
    if (config.data) {
      console.log(colorize(`📦 BODY:\n${JSON.stringify(config.data, null, 2)}`));
    }
    console.log(colorize('======================================================\n'));
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
      
      const blue = '\x1b[34m';
      const reset = '\x1b[0m';
      const colorize = (text: string) => `${blue}${text}${reset}`;

      console.log(colorize('\n======================================================'));
      console.log(colorize(`✅ API RESPONSE: ${method} ${url} [${response.status}]`));
      console.log(colorize('======================================================'));
      console.log(colorize(`📥 DATA:\n${JSON.stringify(response.data, null, 2)}`));
      console.log(colorize('======================================================\n'));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (__DEV__) {
      const failedUrl = `${originalRequest?.baseURL ?? ''}${originalRequest?.url ?? ''}`;
      const status = error.response?.status ?? 'NETWORK_ERROR';
      const method = (originalRequest?.method ?? 'get').toUpperCase();
      
      const red = '\x1b[31m';
      const reset = '\x1b[0m';
      const colorize = (text: string) => `${red}${text}${reset}`;

      console.log(colorize('\n======================================================'));
      console.log(colorize(`❌ API ERROR: ${method} ${failedUrl} [${status}]`));
      console.log(colorize('======================================================'));
      console.log(colorize(`📉 ERROR RESPONSE:\n${JSON.stringify(error.response?.data ?? error.message, null, 2)}`));
      console.log(colorize('======================================================\n'));
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
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
