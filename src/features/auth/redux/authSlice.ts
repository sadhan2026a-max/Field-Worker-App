import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Driver } from '@/domain/entities/Driver';
import * as authService from '@/features/auth/api/authService';
import { logger } from '@/core/utils/logger';
import { NotificationService } from '@/core/services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  driver: Driver | null;
  tenant: authService.TenantInfo | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  driver: null,
  tenant: null,
  isLoading: true, // true on boot while we restore the session
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Restore driver session from storage on app boot */
export const initAuth = createAsyncThunk<Driver | null>(
  'auth/init',
  async () => {
    logger.info('auth', 'Restoring session from storage…');
    const driver = await authService.getStoredDriver();
    if (driver) {
      logger.info('auth', 'Session restored', { driverId: driver.id });
      // Register push token for existing session
      try {
        const token = await NotificationService.registerForPushNotificationsAsync();
        if (token) {
          await authService.registerDeviceToken(token);
        }
      } catch (tokenErr) {
        logger.warn('auth', 'Failed to register push token on boot', tokenErr);
      }
    } else {
      logger.info('auth', 'No stored session found');
    }
    return driver;
  },
);

import { AxiosError } from 'axios';

/** Login with phone + password */
export const loginThunk = createAsyncThunk<
  Driver,
  { phone: string; password?: string; pin?: string },
  { rejectValue: string }
>('auth/login', async ({ phone, password, pin }, { rejectWithValue }) => {
  logger.info('auth', 'Login attempt', { phone });
  try {
    // Force clear any previous driver's persisted assignments/summary before logging in
    await AsyncStorage.multiRemove(['persisted_assignments', 'persisted_workspace_summary']);

    const driver = await authService.login(phone, password, pin);
    logger.info('auth', 'Login successful', { driverId: driver.id, name: driver.name });
    
    // Register push token
    try {
      const token = await NotificationService.registerForPushNotificationsAsync();
      if (token) {
        await authService.registerDeviceToken(token);
      }
    } catch (tokenErr) {
      logger.warn('auth', 'Failed to register push token after login', tokenErr);
    }

    return driver;
  } catch (err: any) {
    logger.error('auth', 'Login failed', err);
    let errorMessage = 'Login failed';
    if (err instanceof AxiosError) {
      // Single-device policy: someone logged in from another device
      const errorCode = err.response?.data?.details?.code;
      if (errorCode === 'session_invalidated' || (err as any)._sessionInvalidated) {
        errorMessage = 'Your account was logged in on another device. Please login again.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Account does not exist.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Incorrect PIN or password.';
      } else {
        errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed';
        const lowerMsg = errorMessage.toLowerCase();
        if (lowerMsg.includes('not found') || lowerMsg.includes('exist') || lowerMsg.includes('no user') || lowerMsg.includes('invalid phone')) {
          errorMessage = 'Account does not exist.';
        } else if (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect') || lowerMsg.includes('wrong') || lowerMsg.includes('credentials')) {
          errorMessage = 'Incorrect PIN or password.';
        }
      }
    } else if (err instanceof Error) {
      errorMessage = err.message || 'Login failed';
    }
    return rejectWithValue(errorMessage);
  }
});

/** Logout and clear storage */
export const logoutThunk = createAsyncThunk<void>(
  'auth/logout',
  async () => {
    logger.info('auth', 'Driver logging out…');
    
    // Remove push token
    try {
      const token = await NotificationService.registerForPushNotificationsAsync();
      if (token) {
        await authService.removeDeviceToken(token);
      }
    } catch (tokenErr) {
      logger.warn('auth', 'Failed to remove push token on logout', tokenErr);
    }

    await authService.logout();
    logger.info('auth', 'Logout complete');
  },
);

export const fetchTenantThunk = createAsyncThunk<authService.TenantInfo, void, { rejectValue: string }>(
  'auth/fetchTenant',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getTenant();
    } catch (err) {
      logger.error('auth', 'Failed to fetch tenant', err);
      return rejectWithValue('Failed to fetch tenant info');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

export const toggleAvailability = createAsyncThunk<
  Driver,
  void,
  { state: { auth: AuthState }, rejectValue: string }
>('auth/toggleAvailability', async (_, { getState, rejectWithValue }) => {
  const driver = getState().auth.driver;
  if (!driver) return rejectWithValue('Driver not found');

  const newStatus = driver.status === 'Available' ? 'Offline' : 'Available';
  try {
    const updatedDriver = await authService.updateDriverStatus(driver.id, newStatus);
    logger.info('auth', `Availability toggled to: ${updatedDriver.status}`);
    return updatedDriver;
  } catch (err) {
    logger.error('auth', 'Failed to toggle availability', err);
    let errorMessage = 'Failed to update status';
    if (err instanceof AxiosError && err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    return rejectWithValue(errorMessage);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // initAuth
    builder
      .addCase(initAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.driver = action.payload;
        state.isLoading = false;
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.error = action.error.message ?? 'Failed to restore session';
        state.isLoading = false;
      });

    // loginThunk
    builder
      .addCase(loginThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.driver = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? 'Login failed';
      });

    // logoutThunk
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.driver = null;
        state.isLoading = false;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.error = action.error.message ?? 'Logout failed';
        state.isLoading = false;
      });

    // toggleAvailability
    builder
      .addCase(toggleAvailability.fulfilled, (state, action) => {
        state.driver = action.payload;
      })
      .addCase(toggleAvailability.rejected, (state, action) => {
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to update status';
      });

    // fetchTenantThunk
    builder
      .addCase(fetchTenantThunk.fulfilled, (state, action) => {
        state.tenant = action.payload;
      });
  },
});

export const authReducer = authSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────

// Use a local shape type to avoid a circular import with store/index.ts
type StateWithAuth = { auth: AuthState };

export const selectDriver = (state: StateWithAuth) => state.auth.driver;
export const selectTenant = (state: StateWithAuth) => state.auth.tenant;
export const selectIsLoading = (state: StateWithAuth) => state.auth.isLoading;
export const selectAuthError = (state: StateWithAuth) => state.auth.error;
