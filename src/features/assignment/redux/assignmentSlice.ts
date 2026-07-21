import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Assignment, PaymentMode } from '@/domain/entities/Assignment';
import { DriverWorkspaceSummary } from '@/domain/entities/Driver';
import * as assignmentService from '@/services/assignmentService';
import { logger } from '@/core/utils/logger';

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
}

const initialState: AssignmentState = {
  items: [],
  workspaceSummary: null,
  listStatus: 'idle',
  summaryStatus: 'idle',
  detailStatus: 'idle',
  isMutating: false,
  error: null,
};

function upsertAssignment(state: AssignmentState, assignment: Assignment) {
  const index = state.items.findIndex((item) => item.id === assignment.id);
  if (index >= 0) {
    // Merge (not replace) so fields the source response doesn't carry — e.g. offerId,
    // only present on the initial offers-list load — survive later partial updates.
    state.items[index] = { ...state.items[index], ...assignment };
  } else {
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
  async (status) => assignmentService.getAssignments(status),
);

export const fetchAssignmentById = createAsyncThunk<Assignment | undefined, string>(
  'assignment/fetchAssignmentById',
  (id) => assignmentService.getAssignmentById(id),
);

export const startAssignment = createAsyncThunk<Assignment, string>(
  'assignment/startAssignment',
  (id) => assignmentService.startAssignment(id),
);

export const saveDeliveryProof = createAsyncThunk<
  Assignment,
  { id: string; proofPhotoUri?: string; signatureUri?: string; deliveryNotes?: string }
>('assignment/saveDeliveryProof', (params) => assignmentService.saveDeliveryProof(params.id, params));

export const confirmPayment = createAsyncThunk(
  'assignment/confirmPayment',
  async (
    params: { id: string; paymentMode: PaymentMode; receivedAmount: number; referenceNumber?: string },
    { rejectWithValue }
  ) => {
    try {
      return await assignmentService.confirmPayment(params.id, params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to confirm payment');
    }
  },
);

export const completeAssignment = createAsyncThunk<Assignment, string>(
  'assignment/completeAssignment',
  (id) => assignmentService.completeAssignment(id),
);

export const updateOrderItems = createAsyncThunk<
  Assignment,
  { id: string; items: { id: string; quantity: number }[] }
>('assignment/updateOrderItems', (params) => assignmentService.updateOrderItems(params.id, params.items));

export const acceptOffer = createAsyncThunk<Assignment, string>(
  'assignment/acceptOffer',
  (offerId) => assignmentService.acceptOffer(offerId),
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceSummary.pending, (state) => {
        state.summaryStatus = 'loading';
      })
      .addCase(fetchWorkspaceSummary.fulfilled, (state, action) => {
        state.workspaceSummary = action.payload;
        state.summaryStatus = 'succeeded';
      })
      .addCase(fetchWorkspaceSummary.rejected, (state, action) => {
        state.summaryStatus = 'failed';
        state.error = action.error.message ?? 'Failed to load workspace summary';
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
      });

    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        // Merge (not replace): the offers endpoint this is sourced from only returns
        // pending offers, so a full replace would drop items that already moved past
        // "Offered" (e.g. right after acceptOffer) until they show up again elsewhere.
        for (const item of action.payload) {
          upsertAssignment(state, item);
        }
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
        }
        state.detailStatus = 'succeeded';
      })
      .addCase(fetchAssignmentById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.error.message ?? 'Failed to load assignment';
      });

    for (const thunk of [startAssignment, saveDeliveryProof, confirmPayment, completeAssignment, updateOrderItems]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.isMutating = true;
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          if (action.payload) {
            upsertAssignment(state, action.payload as Assignment);
          }
          state.isMutating = false;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isMutating = false;
          state.error = action.error.message ?? 'Failed to update assignment';
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
        state.error = action.error.message ?? 'Failed to accept offer';
      })
      .addCase(declineOffer.pending, (state) => {
        state.isMutating = true;
        state.error = null;
      })
      .addCase(declineOffer.fulfilled, (state, action) => {
        state.isMutating = false;
        state.items = state.items.filter((i) => i.offerId !== action.payload);
      })
      .addCase(declineOffer.rejected, (state, action) => {
        state.isMutating = false;
        state.error = action.error.message ?? 'Failed to decline offer';
      });
  },
});

export const assignmentReducer = assignmentSlice.reducer;
export const { addAssignment, clearError, restoreAssignments } = assignmentSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

type StateWithAssignment = { assignment: AssignmentState };

export const selectAssignments = (state: StateWithAssignment) => state.assignment.items;
export const selectWorkspaceSummary = (state: StateWithAssignment) => state.assignment.workspaceSummary;
export const selectListStatus = (state: StateWithAssignment) => state.assignment.listStatus;
export const selectSummaryStatus = (state: StateWithAssignment) => state.assignment.summaryStatus;
export const selectDetailStatus = (state: StateWithAssignment) => state.assignment.detailStatus;
export const selectIsMutating = (state: StateWithAssignment) => state.assignment.isMutating;
export const selectAssignmentById = (id: string) => (state: StateWithAssignment) =>
  state.assignment.items.find((item) => item.id === id);
