import { configureStore, Middleware } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer } from '@/features/auth/redux/authSlice';
import { assignmentReducer } from '@/features/assignment/redux/assignmentSlice';
import { notificationReducer } from '@/features/notification/redux/notificationSlice';
import { reduxLoggerMiddleware } from '@/core/utils/logger';

const persistenceMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  // Save assignments AND workspaceSummary to AsyncStorage in the background whenever the assignment slice is mutated
  if (action && typeof action === 'object' && 'type' in action && typeof action.type === 'string' && action.type.startsWith('assignment/')) {
    AsyncStorage.setItem('persisted_assignments', JSON.stringify(state.assignment.items)).catch(console.error);
    if (state.assignment.workspaceSummary) {
      AsyncStorage.setItem('persisted_workspace_summary', JSON.stringify(state.assignment.workspaceSummary)).catch(console.error);
    }
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assignment: assignmentReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    __DEV__
      ? getDefaultMiddleware().concat(persistenceMiddleware, reduxLoggerMiddleware)
      : getDefaultMiddleware().concat(persistenceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
