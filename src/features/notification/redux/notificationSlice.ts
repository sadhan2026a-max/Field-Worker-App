import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { NotificationDto } from '../types/Notification';
import * as notificationService from '../api/notificationService';

interface NotificationState {
  items: NotificationDto[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk<NotificationDto[]>(
  'notification/fetchNotifications',
  async () => {
    return await notificationService.getNotifications();
  }
);

export const markAsRead = createAsyncThunk<string, string>(
  'notification/markAsRead',
  async (id) => {
    await notificationService.markNotificationRead(id);
    return id;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        // Sort by created at descending
        state.items = action.payload.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.items.findIndex(n => n.id === id);
        if (index !== -1) {
          state.items[index].readAt = new Date().toISOString();
        }
      });
  },
});

export const notificationReducer = notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) => state.notification.items;
export const selectUnreadCount = (state: { notification: NotificationState }) => 
  state.notification.items.filter(n => !n.readAt).length;
export const selectIsLoadingNotifications = (state: { notification: NotificationState }) => state.notification.isLoading;
