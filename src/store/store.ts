import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/redux/authSlice';
import { assignmentReducer } from '@/features/assignment/redux/assignmentSlice';
import { notificationReducer } from '@/features/notification/redux/notificationSlice';
import { reduxLoggerMiddleware } from '@/core/utils/logger';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assignment: assignmentReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    __DEV__
      ? getDefaultMiddleware().concat(reduxLoggerMiddleware)
      : getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
