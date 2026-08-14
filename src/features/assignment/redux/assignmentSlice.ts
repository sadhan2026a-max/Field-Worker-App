import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Assignment, PaymentMode } from '@/domain/entities/Assignment';
import { DriverWorkspaceSummary } from '@/domain/entities/Driver';
import * as assignmentService from '@/services/assignmentService';
import { logger } from '@/core/utils/logger';
import { OrderCompletionRequirementDto } from '@/features/assignment/types/Assignment';

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
};

function upsertAssignment(state: AssignmentState, assignment: Assignment) {
  const index = state.items.findIndex((item) => item.id === assignment.id);
  if (index >= 0) {
    const currentStatus = state.items[index].status;
    
    // Prevent downgrading an active status to 'pending' if the backend returned stale offer data
    let newStatus = assignment.status;
    if (newStatus === 'pending' && currentStatus !== 'pending' && currentStatus !== 'cancelled') {
      newStatus = currentStatus;
    }
    
    // Merge (not replace) so fields the source response doesn't carry — e.g. offerId,
    // only present on the initial offers-list load — survive later partial updates.
    state.items[index] = { ...state.items[index], ...assignment, status: newStatus };
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
  (id) => assignmentService.completeAssignment(id),
);

export const updateOrderItems = createAsyncThunk<
  Assignment,
  { id: string; items: { id: string; quantity: number }[] }
>('assignment/updateOrderItems', (params) => assignmentService.updateOrderItems(params.id, params.items));

export const verifyOrderOtp = createAsyncThunk<
  Assignment,
  { id: string; otp: string }
>('assignment/verifyOrderOtp', (params) => assignmentService.verifyOrderOtp(params.id, params.otp));

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
        state.error = action.error.message || 'Failed to release assignment';
      });

    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        // Merge (not replace): the offers endpoint this is sourced from only returns
        // pending offers, so a full replace would drop items that already moved past
        // "Offered" (e.g. right after acceptOffer) until they show up again elsewhere.

        // However, if we fetched the default pending offers (status is undefined or 'pending'),
        // any offer that is locally 'pending' but missing from the payload has been
        // cancelled, withdrawn, or assigned to someone else. We must remove it.
        const requestedStatus = action.meta.arg;
        if (!requestedStatus || requestedStatus === 'pending') {
          const fetchedIds = new Set(action.payload.map((a) => a.id));
          state.items = state.items.filter((item) => {
            if (item.status === 'pending' && !fetchedIds.has(item.id)) {
              return false;
            }
            return true;
          });
        }

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
export const { addAssignment, clearError, restoreAssignments, restoreWorkspaceSummary, setHydrated } = assignmentSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────

type StateWithAssignment = { assignment: AssignmentState };

export const selectAssignments = (state: StateWithAssignment) => state.assignment.items;
export const selectCompletionRequirements = (state: StateWithAssignment) => state.assignment.completionRequirements;
export const selectWorkspaceSummary = (state: StateWithAssignment) => state.assignment.workspaceSummary;
export const selectListStatus = (state: StateWithAssignment) => state.assignment.listStatus;
export const selectSummaryStatus = (state: StateWithAssignment) => state.assignment.summaryStatus;
export const selectDetailStatus = (state: StateWithAssignment) => state.assignment.detailStatus;
export const selectIsMutating = (state: StateWithAssignment) => state.assignment.isMutating;
export const selectAssignmentById = (id: string) => (state: StateWithAssignment) =>
  state.assignment.items.find((item) => item.id === id);
