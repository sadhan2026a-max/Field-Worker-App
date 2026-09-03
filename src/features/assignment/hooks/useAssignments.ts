import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Assignment, PaymentMode } from '@/domain/entities/Assignment';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  completeAssignment as completeAssignmentThunk,
  confirmPayment as confirmPaymentThunk,
  fetchAssignmentById,
  fetchAssignments as fetchAssignmentsThunk,
  fetchWorkspaceSummary,
  saveDeliveryProof as saveDeliveryProofThunk,
  selectAssignmentById,
  selectAssignments,
  selectDetailStatus,
  selectIsMutating,
  selectListStatus,
  selectSummaryStatus,
  selectWorkspaceSummary,
  startAssignment as startAssignmentThunk,
  acceptOffer as acceptOfferThunk,
  declineOffer as declineOfferThunk,
  startNavigation as startNavigationThunk,
  markArrived as markArrivedThunk,
  updateOrderItems as updateOrderItemsThunk,
  verifyOrderOtp as verifyOrderOtpThunk,
  cancelAssignment as cancelAssignmentThunk,
  releaseAssignment as releaseAssignmentThunk,
  restoreAssignments,
  restoreWorkspaceSummary,
  showCancelledAlert,
} from '@/features/assignment/redux/assignmentSlice';
import { markRelatedNotificationsRead, markRelatedNotificationsAsReadThunk } from '@/features/notification/redux/notificationSlice';

export function useWorkspaceSummary() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectWorkspaceSummary);
  const status = useAppSelector(selectSummaryStatus);

  const driverId = useAppSelector((state) => state.auth.driver?.id);

  useEffect(() => {
    // First restore persisted summary from AsyncStorage (so counts show instantly)
    AsyncStorage.getItem('persisted_workspace_summary')
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            dispatch(restoreWorkspaceSummary(parsed));
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        // Then try to fetch fresh from API (will silently fail on 403)
        if (driverId) {
          dispatch(fetchWorkspaceSummary(driverId));
        }
      });
  }, [dispatch, driverId]);

  const refetch = () => {
    if (driverId) {
      return dispatch(fetchWorkspaceSummary(driverId)).unwrap();
    }
    return Promise.resolve();
  };

  return { data: summary, isLoading: status === 'idle' || status === 'loading', refetch };
}

export function useAssignments(status?: Assignment['status'] | string) {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectAssignments);
  const listStatus = useAppSelector(selectListStatus);

  useEffect(() => {
    const loadData = async () => {
      // STEP 1: Restore from local cache first so screen doesn't show blank
      try {
        const cached = await AsyncStorage.getItem('persisted_assignments');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch(restoreAssignments(parsed));

            // STEP 2: For each cached active order, refresh it directly by ID
            // This is the SAME API that notification uses (fetchAssignmentById)
            // It works even when the bulk assignments API returns nothing
            const activeStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
            const activeOrders = parsed.filter((a: any) => activeStatuses.includes(a.status));
            for (const order of activeOrders) {
              if (order.id) {
                dispatch(fetchAssignmentById(order.id));
              }
            }
          }
        }
      } catch (e) {
        // ignore cache errors, continue with API
      }

      // STEP 3: Fetch from API (pending offers + other statuses)
      dispatch(fetchAssignmentsThunk(status));
      if (!status) {
        dispatch(fetchAssignmentsThunk('in_progress'));
        dispatch(fetchAssignmentsThunk('en_route'));
        dispatch(fetchAssignmentsThunk('accepted'));
        dispatch(fetchAssignmentsThunk('completed'));
        dispatch(fetchAssignmentsThunk('cancelled'));
      }
    };

    loadData();
  }, [dispatch, status]);

  const refetch = async () => {
    // On manual refresh, re-fetch each active order by ID (guaranteed to work)
    const currentItems = items;
    const activeStatuses = ['accepted', 'en_route', 'arrived', 'in_progress'];
    const activeOrders = currentItems.filter((a) => activeStatuses.includes(a.status));
    for (const order of activeOrders) {
      if (order.id) {
        dispatch(fetchAssignmentById(order.id));
      }
    }

    await dispatch(fetchAssignmentsThunk(status)).unwrap();
    if (!status) {
      dispatch(fetchAssignmentsThunk('in_progress'));
      dispatch(fetchAssignmentsThunk('en_route'));
      dispatch(fetchAssignmentsThunk('accepted'));
      dispatch(fetchAssignmentsThunk('completed'));
      dispatch(fetchAssignmentsThunk('cancelled'));
    }
  };

  const data = status ? items.filter((item) => item.status === status) : items;
  return { data, isLoading: listStatus === 'idle' || listStatus === 'loading', refetch };
}

export function useAssignment(id: string) {
  const dispatch = useAppDispatch();
  const assignment = useAppSelector(selectAssignmentById(id));
  const detailStatus = useAppSelector(selectDetailStatus);

  useEffect(() => {
    if (id) {
      dispatch(fetchAssignmentById(id));
    }
  }, [dispatch, id]);

  // Poll every 15 seconds to detect cancellation mid-process on ANY screen
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      dispatch(fetchAssignmentById(id));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch, id]);

  // Global cancellation guard — works on ALL screens (Proof, Checklist, Service, Delivery, etc.)
  // Only show the custom modal if the order TRANSITIONS to 'cancelled' while being viewed.
  const prevStatusRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;

    // Only dispatch if prevStatus was already set (not initial mount) AND wasn't cancelled, but IS cancelled now.
    if (prevStatus && prevStatus !== 'cancelled' && assignment?.status === 'cancelled') {
      dispatch(showCancelledAlert(assignment.code || ''));
    }

    // Update the ref to the current status once loaded
    if (assignment?.status) {
      prevStatusRef.current = assignment.status;
    }
  }, [assignment?.status, assignment?.code, dispatch]);

  const refetch = async () => {
    if (id) {
      await dispatch(fetchAssignmentById(id)).unwrap();
    }
  };

  return { data: assignment, isLoading: !assignment && (detailStatus === 'idle' || detailStatus === 'loading'), refetch };
}

export function useStartAssignment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(startAssignmentThunk(id)).unwrap(),
  };
}

export function useStartNavigation() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(startNavigationThunk(id)).unwrap(),
  };
}

export function useMarkArrived() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(markArrivedThunk(id)).unwrap(),
  };
}

export function useSaveDeliveryProof() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (params: { id: string; proofPhotoUris?: string[]; signatureUri?: string; deliveryNotes?: string }) =>
      dispatch(saveDeliveryProofThunk(params)).unwrap(),
  };
}

export function useConfirmPayment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (params: { id: string; paymentMode: PaymentMode; receivedAmount: number; referenceNumber?: string }) =>
      dispatch(confirmPaymentThunk(params)).unwrap(),
  };
}

export function useUpdateOrderItems() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (params: { id: string; items: { id: string; quantity: number }[] }) =>
      dispatch(updateOrderItemsThunk(params)).unwrap(),
  };
}

export function useVerifyOrderOtp() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (params: { id: string; otp: string }) =>
      dispatch(verifyOrderOtpThunk(params)).unwrap(),
  };
}

export function useCompleteAssignment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: async (id: string) => {
      const result = await dispatch(completeAssignmentThunk(id)).unwrap();
      // Clear notification badge for this order locally and on the server
      const payload = { orderId: result.id, offerId: result.offerId, orderNumber: result.code };
      dispatch(markRelatedNotificationsRead(payload));
      dispatch(markRelatedNotificationsAsReadThunk(payload));
      return result;
    },
  };
}

export function useAcceptOffer() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: async (id: string) => {
      const result = await dispatch(acceptOfferThunk(id)).unwrap();
      // Clear notification badge for this order locally and on the server
      const payload = { orderId: result.id, offerId: result.offerId, orderNumber: result.code };
      dispatch(markRelatedNotificationsRead(payload));
      dispatch(markRelatedNotificationsAsReadThunk(payload));
      return result;
    },
  };
}

export function useDeclineOffer() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: async (id: string) => {
      const result = await dispatch(declineOfferThunk(id)).unwrap();
      // Clear notification badge for this order locally and on the server
      const payload = { orderId: id, offerId: id }; // id might be the offer id
      dispatch(markRelatedNotificationsRead(payload));
      dispatch(markRelatedNotificationsAsReadThunk(payload));
      return result;
    },
  };
}

export function useCancelAssignment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: async (params: { id: string; reason: string }) => {
      const result = await dispatch(cancelAssignmentThunk(params)).unwrap();
      const payload = { orderId: result.id, offerId: result.offerId, orderNumber: result.code };
      dispatch(markRelatedNotificationsRead(payload));
      dispatch(markRelatedNotificationsAsReadThunk(payload));
      return result;
    },
  };
}

export function useReleaseAssignment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: async (params: { id: string; reason?: string }) => {
      const result = await dispatch(releaseAssignmentThunk(params)).unwrap();
      const payload = { orderId: result.id, offerId: result.offerId, orderNumber: result.code };
      dispatch(markRelatedNotificationsRead(payload));
      dispatch(markRelatedNotificationsAsReadThunk(payload));
      return result;
    },
  };
}
