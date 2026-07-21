import { useEffect } from 'react';
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
  restoreAssignments,
} from '@/features/assignment/redux/assignmentSlice';

export function useWorkspaceSummary() {
  const dispatch = useAppDispatch();
  const summary = useAppSelector(selectWorkspaceSummary);
  const status = useAppSelector(selectSummaryStatus);

  const driverId = useAppSelector((state) => state.auth.driver?.id);

  useEffect(() => {
    if (driverId) {
      dispatch(fetchWorkspaceSummary(driverId));
    }
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
    // Load persisted assignments
    AsyncStorage.getItem('persisted_assignments')
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            dispatch(restoreAssignments(parsed));
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        dispatch(fetchAssignmentsThunk(status));
      });
  }, [dispatch, status]);

  const refetch = () => dispatch(fetchAssignmentsThunk(status)).unwrap();

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
    mutateAsync: (params: { id: string; proofPhotoUri?: string; signatureUri?: string; deliveryNotes?: string }) =>
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

export function useCompleteAssignment() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(completeAssignmentThunk(id)).unwrap(),
  };
}

export function useAcceptOffer() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(acceptOfferThunk(id)).unwrap(),
  };
}

export function useDeclineOffer() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(selectIsMutating);

  return {
    isPending,
    mutateAsync: (id: string) => dispatch(declineOfferThunk(id)).unwrap(),
  };
}
