import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
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

export const markRelatedNotificationsAsReadThunk = createAsyncThunk<void, { orderId: string; offerId?: string; orderNumber?: string }, { state: { notification: NotificationState } }>(
  'notification/markRelatedNotificationsAsReadThunk',
  async ({ orderId, offerId, orderNumber }, { getState, dispatch }) => {
    const state = getState().notification;
    const relatedUnread = state.items.filter((n) => {
      if (n.readAt) return false;
      const matchesRelatedId = n.relatedOrderId === orderId || (offerId && n.relatedOrderId === offerId);
      const matchesMessage = orderNumber && n.message?.includes(orderNumber);
      return matchesRelatedId || matchesMessage;
    });
    
    // Call backend API for each related unread notification
    for (const n of relatedUnread) {
      dispatch(markAsRead(n.id));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Mark all unread notifications related to a specific order as read
    // Called when an order is accepted, completed, or declined so badge count stays accurate
    markRelatedNotificationsRead: (state, action: PayloadAction<{ orderId: string; offerId?: string; orderNumber?: string }>) => {
      const { orderId, offerId, orderNumber } = action.payload;
      state.items.forEach((n) => {
        if (!n.readAt) {
          const matchesRelatedId = n.relatedOrderId === orderId || (offerId && n.relatedOrderId === offerId);
          const matchesMessage = orderNumber && n.message?.includes(orderNumber);
          if (matchesRelatedId || matchesMessage) {
            n.readAt = new Date().toISOString();
          }
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        // Merge incoming notifications with local read state:
        // If we locally marked a notification as read (e.g. after completing an order)
        // but the backend hasn't committed it yet, preserve our local readAt so the
        // badge count doesn't flicker back to unread on the next refresh.
        const localReadMap = new Map<string, string>();
        state.items.forEach((n) => {
          if (n.readAt) localReadMap.set(n.id, n.readAt);
        });

        const merged = action.payload.map((n) => ({
          ...n,
          // Use local readAt if it exists and backend hasn't set one yet
          readAt: n.readAt || localReadMap.get(n.id) || null,
        }));

        state.items = merged.sort((a, b) =>
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
export const { markRelatedNotificationsRead } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) => state.notification.items;
export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.items.filter(n => !n.readAt).length;
export const selectIsLoadingNotifications = (state: { notification: NotificationState }) => state.notification.isLoading;
