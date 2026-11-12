import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Assignment, PaymentMode } from '@/domain/entities/Assignment';
import { DriverWorkspaceSummary } from '@/domain/entities/Driver';
import * as assignmentService from '@/services/assignmentService';
import { logger } from '@/core/utils/logger';
import { OrderCompletionRequirementDto } from '@/features/assignment/types/Assignment';
import * as notificationService from '@/features/notification/api/notificationService';

// ─── State ────────────────────────────────────────────────────────────────────

type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AssignmentState {
  items: Assignment[];
  workspaceSummary: DriverWorkspaceSummary | null;
  listStatus: LoadStatus;
  summaryStatus: LoadStatus;
  detailStatus: LoadStatus;
  isMutating: boolean;
  error: string | null;
  completionRequirements: Record<string, OrderCompletionRequirementDto> | null;
  isHydrated: boolean;
  cancelledAlert: { visible: boolean; orderCode: string | null };
  dismissedCancelledAlerts: string[];
}

const initialState: AssignmentState = {
  items: [],
  workspaceSummary: null,
  listStatus: 'idle',
  summaryStatus: 'idle',
  detailStatus: 'idle',
  isMutating: false,
  error: null,
  completionRequirements: null,
  isHydrated: false,
  cancelledAlert: { visible: false, orderCode: null },
  dismissedCancelledAlerts: [],
};

function upsertAssignment(state: AssignmentState, assignment: Assignment) {
  // If incoming assignment is a dummy object from a 403 response, ignore it completely
  if (assignment.code === 'N/A') {
    return;
  }

  const index = state.items.findIndex(
    (item) => item.id === assignment.id || (item.offerId && item.offerId === assignment.id) || (assignment.offerId && item.id === assignment.offerId)
  );

  if (index >= 0) {
    const currentItem = state.items[index];
    const currentStatus = currentItem.status;
    const incomingStatus = assignment.status;

    // ── RULE 1: If we locally already know this order is cancelled,
    //   NEVER let any API response (pending/accepted/en_route etc.) revive it.
    //   This prevents the "re-appearing cancelled order" bug when app comes to foreground.
    if (currentStatus === 'cancelled') {
      return;
    }

    // ── RULE 2: If the API says the order is cancelled/completed,
    //   always honour that (ground truth from server).
    if (incomingStatus === 'cancelled' || incomingStatus === 'completed') {
      state.items[index] = { ...currentItem, ...assignment, status: incomingStatus };
      return;
    }

    // ── RULE 3: Prevent downgrading an active status to 'pending'
    //   (stale offer data from bulk API endpoint).
    let newStatus: Assignment['status'] = incomingStatus;
    if (newStatus === 'pending' && currentStatus !== 'pending') {
      newStatus = currentStatus;
    }

    // Normal merge (not replace) — keep more-specific type
    let newType = assignment.type;
    const isSpecificType = (t?: string) => Boolean(t && !['delivery', 'other'].includes(t.toLowerCase()));
    if (isSpecificType(currentItem.type) && !isSpecificType(assignment.type)) {
      newType = currentItem.type;
    }

    state.items[index] = { ...currentItem, ...assignment, status: newStatus, type: newType };
  } else {
    // ── RULE 4: Don't add a new item if it's already cancelled — no point showing it.
    if (assignment.status === 'cancelled') {
      return;
    }
    state.items.push(assignment);
  }
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchWorkspaceSummary = createAsyncThunk<DriverWorkspaceSummary, string>(
  'assignment/fetchWorkspaceSummary',
  (driverId) => assignmentService.getWorkspaceSummary(driverId),
);

export const fetchAssignments = createAsyncThunk<Assignment[], string | undefined>(
  'assignment/fetchAssignments',
  async (status, { getState }) => {
    const apiAssignments = await assignmentService.getAssignments(status);

    // Attempt to merge with lifetime local history if driver is logged in
    const state = getState() as any;
    const driverId = state.auth.driver?.id;

    if (driverId) {
      // Save only terminal-state (completed/cancelled) orders to device lifetime storage
      // NEVER save pending/active orders to lifetime — they can change status at any time
      await assignmentService.saveLifetimeHistory(driverId, apiAssignments);

      // Load lifetime history (only completed/cancelled are stored here)
      const lifetime = await assignmentService.getLifetimeHistory(driverId);

      // Build a set of IDs that the API returned with ACTIVE/PENDING status
      // These must NOT be overridden by stale lifetime data
      const activeApiIds = new Set(
        apiAssignments
          .filter(a => ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status))
          .map(a => a.id)
      );
      // Also build a set of all API-returned IDs
      const allApiIds = new Set(apiAssignments.map(a => a.id));

      // Merge: start with lifetime (completed/cancelled history)
      const map = new Map<string, Assignment>();
      lifetime.forEach(a => {
        // Only add lifetime entry if it's NOT currently active in the live API
        if (!activeApiIds.has(a.id)) {
          map.set(a.id, a);
        }
      });
      // API data always wins — it's the freshest truth
      apiAssignments.forEach(a => map.set(a.id, a));

      let merged = Array.from(map.values());
      // Apply status filter locally if requested
      if (status) {
        merged = merged.filter(a => a.status === status);
      }
      return merged;
    }

    return apiAssignments;
  },
);

export const syncHistoryFromNotificationsThunk = createAsyncThunk<void, { onlyToday?: boolean } | void>(
  'assignment/syncHistoryFromNotifications',
  async (args, { getState, dispatch }) => {
    const onlyToday = (args as any)?.onlyToday ?? false;
    try {
      const state = getState() as any;
      const driverId = state.auth.driver?.id;
      if (!driverId) return;

      // Fetch all notifications directly
      const notifications = await notificationService.getNotifications();

      // Filter notifications to today only if onlyToday flag is set
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const filteredNotifications = onlyToday
        ? notifications.filter(n => new Date(n.createdAt) >= todayStart)
        : notifications;

      // Extract unique related order IDs and detect cancellations
      const orderTypeByNotification = new Map<string, any>();
      const uniqueOrderIds = new Set<string>();
      const cancelledOrderIds = new Set<string>();

      filteredNotifications.forEach(n => {
        const orderId = n.relatedOrderId || (n as any).orderId || (n as any).assignmentId;
        const msg = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        const isCancel = msg.includes('cancel') || String(n.type || '').toLowerCase().includes('cancel');

        if (isCancel) {
          if (orderId) cancelledOrderIds.add(String(orderId));
          const match = (n.message || '').match(/ORD-[\w-]+/i);
          if (match && match[0]) cancelledOrderIds.add(match[0]);
        }

        let detected: string | null = null;
        if (msg.includes('inspect')) detected = 'inspection';
        else if (msg.includes('install')) detected = 'installation';
        else if (msg.includes('pickup')) detected = 'pickup';
        else if (msg.includes('return')) detected = 'return';
        else if (msg.includes('service')) detected = 'service_visit';
        else if (msg.includes('sales')) detected = 'sales_visit';

        if (detected) {
          if (orderId) orderTypeByNotification.set(orderId, detected);
          const match = (n.message || '').match(/ORD-[\w-]+/i);
          if (match && match[0]) orderTypeByNotification.set(match[0], detected);
        }
      });

      // Mark all detected cancellations in Redux state immediately
      cancelledOrderIds.forEach(idOrCode => {
        dispatch(markOrderCancelled(idOrCode));
      });

      filteredNotifications.forEach(n => {
        const orderId = n.relatedOrderId || (n as any).orderId || (n as any).assignmentId;
        if (orderId && typeof orderId === 'string') {
          uniqueOrderIds.add(orderId);
        }
      });

      if (uniqueOrderIds.size === 0) return;

      // Read current local lifetime history to avoid fetching what we already have
      const existingHistory = await assignmentService.getLifetimeHistory(driverId);
      const existingIds = new Set(existingHistory.map(a => a.id));

      // For today sync: always re-fetch today's orders to get latest status (pending/active)
      // For full sync: skip already-saved ones
      const idsToFetch = onlyToday
        ? Array.from(uniqueOrderIds) // Always re-fetch today's
        : Array.from(uniqueOrderIds).filter(id => !existingIds.has(id));

      if (idsToFetch.length === 0) return;

      logger.info('assignment', `Syncing ${idsToFetch.length} ${onlyToday ? "today's" : 'missing'} orders from notification history`);

      // Fetch orders directly by ID
      const fetchedAssignments: Assignment[] = [];
      const results = await Promise.allSettled(
        idsToFetch.map(id => assignmentService.getAssignmentById(id))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          let a = result.value;
          const notifType = orderTypeByNotification.get(a.id) || (a.code ? orderTypeByNotification.get(a.code) : undefined);
          if (notifType && (!a.type || a.type === 'delivery' || a.type === 'other')) {
            a = { ...a, type: notifType };
          }
          fetchedAssignments.push(a);
        }
      });

      if (fetchedAssignments.length > 0) {
        // Save completed/cancelled to local lifetime history
        await assignmentService.saveLifetimeHistory(driverId, fetchedAssignments);

        // ── CRITICAL FIX ─────────────────────────────────────────────────────
        // Upsert every fetched order (including pending/active ones) directly
        // into Redux state via fetchAssignmentById — the same individual-order
        // API that the foreground notification handler uses. This is safe even
        // for pending offers and does NOT race with the bulk list endpoint.
        // Without this, pending orders fetched by ID were silently discarded
        // (saveLifetimeHistory only persists terminal states), so logging out
        // and back in would show an empty "Active Orders" card.
        const activeOrNonTerminal = fetchedAssignments.filter(a =>
          !cancelledOrderIds.has(a.id) &&
          !cancelledOrderIds.has(a.code ?? '') &&
          a.status !== 'cancelled' &&
          ['pending', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(a.status)
        );
        for (const order of activeOrNonTerminal) {
          await dispatch(fetchAssignmentById(order.id));
        }
      }
    } catch (e) {
      logger.error('assignment', 'Failed to sync history from notifications', e);
    }
  }
);

// Auto-sync only today's orders — called on login and app boot
export const autoSyncTodayOrdersThunk = createAsyncThunk<void, string>(
  'assignment/autoSyncTodayOrders',
  async (driverId, { dispatch }) => {
    logger.info('assignment', 'Auto-syncing today\'s orders for driver', { driverId });
    dispatch(syncHistoryFromNotificationsThunk({ onlyToday: true }));
  }
);

export const fetchAssignmentById = createAsyncThunk<Assignment | undefined, string>(
  'assignment/fetchAssignmentById',
  (id) => assignmentService.getAssignmentById(id),
);

export const addOrderNoteThunk = createAsyncThunk<void, { id: string; notes: string }>(
  'assignment/addOrderNote',
  (params) => assignmentService.addOrderNote(params.id, params.notes),
);

export const startAssignment = createAsyncThunk<Assignment, string>(
  'assignment/startAssignment',
  (id) => assignmentService.startAssignment(id),
);

export const saveDeliveryProof = createAsyncThunk<
  Assignment,
  { id: string; proofPhotoUris?: string[]; signatureUri?: string; deliveryNotes?: string }
>('assignment/saveDeliveryProof', async (params) => {
  const result = await assignmentService.saveDeliveryProof(params.id, params);
  return {
    ...result,
    proofPhotoUris: params.proofPhotoUris,
    signatureUri: params.signatureUri,
    deliveryNotes: params.deliveryNotes,
  };
});

export const confirmPayment = createAsyncThunk(
  'assignment/confirmPayment',
  async (
    params: { id: string; paymentMode: PaymentMode; receivedAmount: number; referenceNumber?: string },
    { rejectWithValue }
  ) => {
    try {
      const assignment = await assignmentService.confirmPayment(params.id, params);
      // Manually attach payment info because backend OrderDto might not include it yet
      return {
        ...assignment,
        paymentMode: params.paymentMode,
        receivedAmount: params.receivedAmount,
        paymentReferenceNumber: params.referenceNumber,
      } as Assignment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm payment');
    }
  },
);

export const completeAssignment = createAsyncThunk<Assignment, string>(
  'assignment/completeAssignment',
  async (id, { rejectWithValue }) => {
    try {
      return await assignmentService.completeAssignment(id);
    } catch (error: any) {
      const data = error.response?.data;
      const message = data?.message || data?.error || error.message || 'Failed to complete assignment';
      const missingRequirements = data?.missingRequirements || data?.details?.missingRequirements;
      return rejectWithValue({ message, missingRequirements, status: error.response?.status });
    }
  },
);

export const updateOrderItems = createAsyncThunk<
  Assignment,
  { id: string; items: { id: string; quantity: number }[] }
>('assignment/updateOrderItems', (params) => assignmentService.updateOrderItems(params.id, params.items));

export const verifyOrderOtp = createAsyncThunk<
  Assignment,
  { id: string; otp: string }
>('assignment/verifyOrderOtp', async (params, { rejectWithValue }) => {
  try {
    return await assignmentService.verifyOrderOtp(params.id, params.otp);
  } catch (error: any) {
    const data = error.response?.data;
    const message = data?.message || data?.error || error.message || 'Failed to verify OTP';
    const remainingAttempts = data?.remainingAttempts ?? data?.details?.remainingAttempts;
    return rejectWithValue({ message, remainingAttempts, status: error.response?.status });
  }
});

export const acceptOffer = createAsyncThunk<Assignment, string>(
  'assignment/acceptOffer',
  async (offerId, { rejectWithValue }) => {
    try {
      return await assignmentService.acceptOffer(offerId);
    } catch (error: any) {
      const data = error.response?.data;
      const status = error.response?.status;
      const message =
        status === 409
          ? 'This offer is no longer available or was already assigned.'
          : data?.message || data?.error || error.message || 'Failed to accept offer';
      const code = data?.code || data?.details?.code;
      return rejectWithValue({ message, status, code });
    }
  },
);

export const declineOffer = createAsyncThunk<string, string>(
  'assignment/declineOffer',
  async (id) => {
    await assignmentService.declineOffer(id);
    return id;
  }
);

export const startNavigation = createAsyncThunk<Assignment, string>(
  'assignment/startNavigation',
  async (id) => {
    return await assignmentService.startNavigation(id);
  }
);

export const markArrived = createAsyncThunk<Assignment, string>(
  'assignment/markArrived',
  async (id) => {
    return await assignmentService.markArrived(id);
  }
);

export const cancelAssignment = createAsyncThunk<Assignment, { id: string; reason: string }>(
  'assignment/cancelAssignment',
  async (params) => {
    return await assignmentService.cancelAssignment(params.id, params.reason);
  }
);

export const releaseAssignment = createAsyncThunk<Assignment, { id: string; reason?: string }>(
  'assignment/releaseAssignment',
  async (params) => {
    return await assignmentService.releaseAssignment(params.id, params.reason);
  }
);

export const fetchOrderCompletionRequirements = createAsyncThunk<OrderCompletionRequirementDto[]>(
  'assignment/fetchOrderCompletionRequirements',
  async () => {
    return await assignmentService.fetchOrderCompletionRequirements();
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const assignmentSlice = createSlice({
  name: 'assignment',
  initialState,
  reducers: {
    addAssignment: (state, action: PayloadAction<Assignment>) => {
      upsertAssignment(state, action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    restoreAssignments: (state, action: PayloadAction<Assignment[]>) => {
      // Restore assignments from AsyncStorage, merging with existing
      action.payload.forEach((a) => upsertAssignment(state, a));
    },
    restoreWorkspaceSummary: (state, action: PayloadAction<DriverWorkspaceSummary>) => {
      // Only restore if we don't have a fresh summary loaded already
      if (!state.workspaceSummary) {
        state.workspaceSummary = action.payload;
        state.summaryStatus = 'succeeded';
      }
    },
    setHydrated: (state) => {
      state.isHydrated = true;
    },
    clearAssignments: (state) => {
      state.items = [];
      state.workspaceSummary = null;
    },
    showCancelledAlert: (state, action: PayloadAction<string>) => {
      const code = action.payload;
      if (!code) return;
      if (state.dismissedCancelledAlerts?.includes(code)) {
        return;
      }
      if (state.cancelledAlert.visible && state.cancelledAlert.orderCode === code) {
        return;
      }
      state.cancelledAlert = { visible: true, orderCode: code };
    },
    hideCancelledAlert: (state) => {
      const currentCode = state.cancelledAlert.orderCode;
      if (currentCode) {
        if (!state.dismissedCancelledAlerts) {
          state.dismissedCancelledAlerts = [];
        }
        if (!state.dismissedCancelledAlerts.includes(currentCode)) {
          state.dismissedCancelledAlerts.push(currentCode);
        }
      }
      state.cancelledAlert = { visible: false, orderCode: null };
    },
    // Immediately mark an order as cancelled in Redux (used when cancel notification arrives
    // so the card disappears instantly without waiting for API round-trip).
    markOrderCancelled: (state, action: PayloadAction<string>) => {
      const idOrCode = action.payload;
      const idx = state.items.findIndex(
        (item) =>
          item.id === idOrCode ||
          item.offerId === idOrCode ||
          item.code === idOrCode
      );
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], status: 'cancelled' };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceSummary.pending, (state) => {
        state.summaryStatus = 'loading';
      })
      .addCase(fetchWorkspaceSummary.fulfilled, (state, action) => {
        const fresh = action.payload;
        const existing = state.workspaceSummary;
        // Merge: always take the higher count between API and local
        // This prevents 403 errors from wiping out locally tracked completions
        state.workspaceSummary = {
          ...fresh,
          completedCount: Math.max(fresh.completedCount ?? 0, existing?.completedCount ?? 0),
          codCollection: Math.max(fresh.codCollection ?? 0, existing?.codCollection ?? 0),
          totalEarnings: Math.max(fresh.totalEarnings ?? 0, existing?.totalEarnings ?? 0),
        };
        state.summaryStatus = 'succeeded';
      })
      .addCase(fetchWorkspaceSummary.rejected, (state) => {
        // Don't wipe existing data on API failure (e.g. 403 from earnings API)
        // Just mark status and keep whatever data we have
        state.summaryStatus = state.workspaceSummary ? 'succeeded' : 'failed';
      })
      .addCase(startNavigation.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(startNavigation.fulfilled, (state, action) => {
        state.isMutating = false;
        upsertAssignment(state, action.payload);
      })
      .addCase(startNavigation.rejected, (state, action) => {
        state.isMutating = false;
        const targetId = action.meta.arg;
        const errMsg = String(action.error.message || '');
        if (targetId && (errMsg.includes('403') || errMsg.includes('not assigned'))) {
          const idx = state.items.findIndex((i) => i.id === targetId || i.offerId === targetId);
          if (idx >= 0) state.items[idx] = { ...state.items[idx], status: 'cancelled' };
        }
        state.error = action.error.message || 'Failed to start navigation';
      })
      .addCase(markArrived.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(markArrived.fulfilled, (state, action) => {
        state.isMutating = false;
        upsertAssignment(state, action.payload);
      })
      .addCase(markArrived.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.error.message || 'Failed to mark as arrived';
      })
      .addCase(cancelAssignment.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(cancelAssignment.fulfilled, (state, action) => {
        state.isMutating = false;
        upsertAssignment(state, action.payload);
      })
      .addCase(cancelAssignment.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.error.message || 'Failed to cancel assignment';
      })
      // releaseAssignment
      .addCase(releaseAssignment.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(releaseAssignment.fulfilled, (state, action) => {
        state.isMutating = false;
        state.items = state.items.filter((i) => i.id !== action.payload.id);
      })
      .addCase(releaseAssignment.rejected, (state, action) => {
        state.isMutating = false;
        const targetId = (action.meta.arg as any)?.id;
        if (targetId) {
          state.items = state.items.filter((i) => i.id !== targetId && i.offerId !== targetId);
        }
        state.error = action.error.message || 'Failed to release assignment';
      });

    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        // Upsert all assignments returned by API (upsertAssignment now has
        // cancellation-protection built in, so cancelled items won't re-appear).
        for (const item of action.payload) {
          upsertAssignment(state, item);
        }

        // ── STALE PENDING OFFER CLEANUP ────────────────────────────────────────
        // If we have a locally-tracked PENDING order that the API did NOT return
        // at all, it means the offer was cancelled/expired on the server.
        // Remove it so it doesn't keep showing on the home screen.
        const apiIds = new Set(action.payload.map((a) => a.id));
        state.items = state.items.filter((item) => {
          if (item.status === 'pending') {
            // Keep it only if the API explicitly returned it (still a live offer)
            return apiIds.has(item.id) || apiIds.has(item.offerId ?? '');
          }
          return true; // Keep all non-pending items (active/completed/cancelled history)
        });

        state.listStatus = 'succeeded';
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error.message ?? 'Failed to load assignments';
      });

    builder
      .addCase(fetchAssignmentById.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchAssignmentById.fulfilled, (state, action) => {
        if (action.payload) {
          upsertAssignment(state, action.payload);
        } else {
          logger.warn('assignment', `fetchAssignmentById: not found ${action.meta.arg}`);
          const targetId = action.meta.arg;
          const existingIndex = state.items.findIndex((item) => item.id === targetId || item.offerId === targetId);
          if (existingIndex >= 0) {
            const existing = state.items[existingIndex];
            if (['accepted', 'en_route', 'arrived', 'in_progress', 'pending'].includes(existing.status)) {
              state.items[existingIndex] = { ...existing, status: 'cancelled' };
            }
          }
        }
        state.detailStatus = 'succeeded';
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        const targetId = action.meta.arg;
        const existingIndex = state.items.findIndex((item) => item.id === targetId || item.offerId === targetId);
        if (existingIndex >= 0) {
          const existing = state.items[existingIndex];
          if (['accepted', 'en_route', 'arrived', 'in_progress'].includes(existing.status)) {
            state.items[existingIndex] = { ...existing, status: 'cancelled' };
          }
        }
        state.error = action.error.message ?? 'Failed to load assignment';
      });

    for (const thunk of [startAssignment, saveDeliveryProof, confirmPayment, completeAssignment, updateOrderItems, verifyOrderOtp]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.isMutating = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          if (action.payload) {
            let payload = action.payload as Assignment;
            // Force status to completed if this was the completeAssignment thunk
            // in case the backend hasn't updated its status or returns "Delivered"
            if (thunk.typePrefix === completeAssignment.typePrefix) {
              payload = { ...payload, status: 'completed' };
            }

            upsertAssignment(state, payload);

            // Immediately reflect completion in the dashboard summary
            if (thunk.typePrefix === completeAssignment.typePrefix && state.workspaceSummary) {
              state.workspaceSummary.completedCount = (state.workspaceSummary.completedCount || 0) + 1;
            }
          }
          state.isMutating = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isMutating = false;
          state.error = (action.payload as any)?.message ?? action.error.message ?? 'Failed to update assignment';
        });
    }

    // acceptOffer/declineOffer update state locally from their own result instead of
    // refetching the offers list — that endpoint only returns pending offers, so a
    // refetch right after accepting would wipe the now-accepted item out of state.
    builder
      .addCase(acceptOffer.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(acceptOffer.fulfilled, (state, action) => {
        state.isMutating = false;
        // Full enriched assignment (real customer/address/type), keyed by order id.
        upsertAssignment(state, action.payload);
      })
      .addCase(acceptOffer.rejected, (state, action) => {
        state.isMutating = false;
        state.error = (action.payload as any)?.message ?? action.error.message ?? 'Failed to accept offer';
        if (state.error?.includes('processed or expired') || (action.payload as any)?.status === 409 || state.error?.includes('no longer available')) {
          const offerId = action.meta.arg;
          state.items = state.items.filter((i) => i.offerId !== offerId && i.id !== offerId);
        }
      })
      .addCase(declineOffer.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(declineOffer.fulfilled, (state, action) => {
        state.isMutating = false;
        const targetId = action.payload;
        state.items = state.items.filter((i) => i.offerId !== targetId && i.id !== targetId);
      })
      .addCase(declineOffer.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.error.message ?? 'Failed to decline offer';
        if (state.error?.includes('processed or expired') || (action.payload as any)?.status === 409 || state.error?.includes('no longer available')) {
          const targetId = action.meta.arg;
          state.items = state.items.filter((i) => i.offerId !== targetId && i.id !== targetId);
        }
      })
      .addCase(fetchOrderCompletionRequirements.fulfilled, (state, action) => {
        const reqMap: Record<string, OrderCompletionRequirementDto> = {};
        action.payload.forEach((req) => {
          reqMap[req.orderType.toLowerCase()] = req;
        });
        state.completionRequirements = reqMap;
      });
  },
});

export const assignmentReducer = assignmentSlice.reducer;
export const { addAssignment, clearError, restoreAssignments, restoreWorkspaceSummary, setHydrated, clearAssignments, showCancelledAlert, hideCancelledAlert, markOrderCancelled } = assignmentSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

type StateWithAssignment = { assignment: AssignmentState };

export const selectAssignments = (state: StateWithAssignment) => state.assignment.items;
export const selectCompletionRequirements = (state: StateWithAssignment) => state.assignment.completionRequirements;
export const selectWorkspaceSummary = (state: StateWithAssignment) => state.assignment.workspaceSummary;
export const selectCancelledAlert = (state: StateWithAssignment) => state.assignment.cancelledAlert;
export const selectListStatus = (state: StateWithAssignment) => state.assignment.listStatus;
export const selectSummaryStatus = (state: StateWithAssignment) => state.assignment.summaryStatus;
export const selectDetailStatus = (state: StateWithAssignment) => state.assignment.detailStatus;
export const selectIsMutating = (state: StateWithAssignment) => state.assignment.isMutating;
export const selectAssignmentById = (id: string) => (state: StateWithAssignment) =>
  state.assignment.items.find((item) => item.id === id);
