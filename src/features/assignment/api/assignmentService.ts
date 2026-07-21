import {
  Assignment,
  AssignmentType,
  PaymentMode,
  ReturnDetail,
  ServiceDetail,
  SalesDetail,
  ChecklistItem,
  ChecklistTemplateItem,
  ReturnReasonOption,
  OrderDto,
  OrderStatus,
  ProofOfDeliveryDto,
  ChecklistItemDto,
  QrOrderSummaryDto,
  QrAcceptResponse,
} from '@/features/assignment/types/Assignment';
import { DriverWorkspaceSummary } from '@/domain/entities/Driver';
import { logger } from '@/core/utils/logger';
import { api } from '@/shared/services/axios';
import * as FileSystem from 'expo-file-system';

const ORDER_TYPE_MAP: Record<string, AssignmentType> = {
  Delivery: 'delivery',
  Pickup: 'pickup',
  Return: 'return',
  Installation: 'installation',
  Inspection: 'inspection',
  SalesVisit: 'sales_visit',
  ServiceVisit: 'service_visit',
  Other: 'other',
};

const PAYMENT_MODE_MAP: Record<PaymentMode, 'Cash' | 'Upi' | 'Card'> = {
  cash: 'Cash',
  upi: 'Upi',
  card: 'Card',
};

function mapOrderStatus(status: string): Assignment['status'] {
  const s = status?.toLowerCase();
  switch (s) {
    case 'assigned': return 'accepted';
    case 'enroute':
    case 'en_route': return 'en_route';
    case 'arrived': return 'arrived';
    case 'inprogress':
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'cancelled':
    case 'failed': return 'cancelled';
    default: return 'pending'; // Pending / Offered
  }
}

function extractCustomerName(order: OrderDto): string {
  let name = order.customerNameSnapshot || 'Unknown customer';
  const address = order.deliveryAddress || order.pickupAddress || '';
  
  // If the backend returned a generic walk-in name, try to parse it from the address string
  if (name === 'Walk-in Customer' && address) {
    const match = address.match(/Name:\s*(.+?)Address Line 1:/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return name;
}

function mapOrderDtoToAssignment(order: OrderDto, offerId?: string): Assignment {
  return {
    id: order.id,
    offerId,
    code: order.orderNumber,
    type: ORDER_TYPE_MAP[order.orderType] ?? 'other',
    status: mapOrderStatus(order.status),
    customer: {
      name: extractCustomerName(order),
      phone: order.customerPhoneSnapshot || 'N/A',
      address: order.deliveryAddress || order.pickupAddress || 'Address not available',
      location: { 
        latitude: (order as any).deliveryLatitude || (order as any).pickupLatitude || (order as any).latitude || 0, 
        longitude: (order as any).deliveryLongitude || (order as any).pickupLongitude || (order as any).longitude || 0 
      },
    },
    distanceKm: order.deliveryChargeDistanceKm || 0,
    etaMinutes: 0,
    itemCount: order.items?.length || 0,
    totalAmount: order.totalAmount || 0,
    codAmount: order.isCod ? order.totalAmount || 0 : 0,
    deliveryInstructions: order.instructions || undefined,
    createdAt: order.createdAt,
    completedAt: order.completedAt || undefined,
    assignedDriverId: order.assignedDriverId,
    assignedDriverName: order.assignedDriverName,
    checklist: order.checklist?.map((item) => ({
      id: item.id,
      label: item.label,
      isRequired: item.isRequired,
      isChecked: item.isChecked,
      notes: item.notes,
      sortOrder: item.sortOrder,
      checkedAt: item.checkedAt,
    })),
    items: order.items?.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitName: item.unitName,
      unitPrice: item.unitPrice,
    })),
    returnDetail: order.returnDetail
      ? { returnReasonOptionId: order.returnDetail.returnReasonOptionId, conditionNotes: order.returnDetail.conditionNotes }
      : undefined,
    serviceDetail: order.serviceVisitDetail
      ? {
          complaintDescription: order.serviceVisitDetail.complaintDescription,
          productRef: order.serviceVisitDetail.productRef,
          diagnosisNotes: order.serviceVisitDetail.diagnosisNotes,
          resolutionNotes: order.serviceVisitDetail.resolutionNotes,
          partsUsed: order.serviceVisitDetail.partsUsed?.map((p) => ({
            partName: p.partName,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
          })),
        }
      : undefined,
    salesDetail: order.salesVisitDetail
      ? {
          meetingNotes: order.salesVisitDetail.meetingNotes,
          outcome: order.salesVisitDetail.outcome,
          followUpDate: order.salesVisitDetail.followUpDate,
        }
      : undefined,
  };
}

async function fetchOrderAsAssignment(id: string, offerId?: string): Promise<Assignment> {
  const [orderResponse, historyResponse] = await Promise.all([
    api.get<OrderDto>(`/api/v1/orders/${id}`),
    api.get<any[]>(`/api/v1/orders/${id}/history`).catch((e) => {
      logger.warn('assignment', `Failed to fetch history for order ${id}`, e);
      return { data: [] };
    })
  ]);
  
  const assignment = mapOrderDtoToAssignment(orderResponse.data, offerId);
  
  assignment.timeline = (historyResponse.data || []).map((h) => ({
    status: h.toStatus || h.fromStatus || 'Pending',
    timestamp: h.createdAt,
    notes: h.notes,
  }));
  
  return assignment;
}

export async function getWorkspaceSummary(driverId: string): Promise<DriverWorkspaceSummary> {
  logger.debug('assignment', 'Fetching workspace summary via API');

  let earnings = {
    completedOrderCount: 0,
    totalOrderValue: 0,
    totalEarnings: 0,
    commissionEarned: 0
  };

  try {
    const earningsRes = await api.get(`/api/v1/dashboard/driver-earnings?driverId=${driverId}`);
    // earningsRes.data is an array, we take the first one or default
    if (earningsRes.data?.[0]) {
      earnings = earningsRes.data[0];
    }
  } catch (e) {
    logger.warn('assignment', 'Failed to fetch driver earnings', e);
  }

  const summary: DriverWorkspaceSummary = {
    pendingCount: 0, // Calculated dynamically in the UI
    completedCount: earnings.completedOrderCount || 0,
    codCollection: earnings.totalOrderValue || 0, // Mapped from totalOrderValue
    totalEarnings: earnings.totalEarnings || 0,
    commissionEarned: earnings.commissionEarned || 0,
  };

  logger.debug('assignment', 'Workspace summary loaded', summary);
  return summary;
}

export async function getAssignments(status?: Assignment['status'] | string): Promise<Assignment[]> {
  logger.debug('assignment', 'Fetching assignments via API', { status });

  let offers: any[] = [];

  try {
    const backendStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : undefined;
    
    // If asking for completed, let's try the generic orders endpoint just in case it works!
    let url = backendStatus ? `/api/v1/driver/assignments?status=${backendStatus}` : '/api/v1/driver/assignments';
    if (status === 'completed') {
      url = '/api/v1/orders?status=Completed';
    }
    
    const response = await api.get(url);
    offers = Array.isArray(response.data) ? response.data : (response.data?.items || []);
    logger.debug('assignment', `RAW OFFERS FROM API (${backendStatus || 'all'}):`, JSON.stringify(offers.slice(0, 2)));
  } catch (e: any) {
    logger.warn('assignment', `Failed to fetch driver assignments. Status code: ${e?.response?.status}`, e);
  }

  const validOffers = Array.isArray(offers) ? offers.filter((i) => i && i.id && (i.orderId || i.orderNumber)) : [];

  // Dedupe by orderId — the same order can have more than one offer in its history
  // (e.g. re-offered after expiry), and only the underlying order is what we display.
  const uniqueOffers = Array.from(new Map(validOffers.map((o) => {
    const underlyingOrderId = o.orderId || o.id;
    return [underlyingOrderId, o];
  })).values());

  // GET /api/v1/orders (bulk list) is admin/dispatcher-only and 403s for a driver, so
  // each order is enriched individually via GET /api/v1/orders/{id} (self-service read),
  // which carries the real customer/type/checklist data the offers endpoint doesn't have.
  // We only enrich if the offer is already accepted, otherwise the backend will return a 403.
  const enriched = await Promise.allSettled(
    uniqueOffers.map((offer) => {
      const orderId = offer.orderId || offer.id;
      const os = offer.status?.toLowerCase();
      // If it's merely offered, don't try to fetch the order detail, it will 403.
      if (os === 'offered' || os === 'pending') {
        return Promise.reject(new Error('Skip fetch for pending offer to avoid 403'));
      }
      return api.get<OrderDto>(`/api/v1/orders/${orderId}`);
    })
  );

  const mapped = uniqueOffers.map((offer, index) => {
    const result = enriched[index];
    const orderId = offer.orderId || offer.id;

    if (result.status === 'fulfilled') {
      return mapOrderDtoToAssignment(result.value.data, offer.orderId ? offer.id : undefined);
    }

    // Only log warning if it was a real network error, not our deliberate skip
    if (result.reason?.message !== 'Skip fetch for pending offer to avoid 403') {
      logger.warn('assignment', `Failed to enrich order ${orderId} from offer`, result.reason);
    }

    // Fallback: bare offer data only (no customer/type detail available)
    let mappedStatus: Assignment['status'] = 'pending';
    const os = offer.status?.toLowerCase();
    if (os === 'accepted' || os === 'assigned') mappedStatus = 'accepted';
    if (os === 'declined' || os === 'expired' || os === 'cancelled' || os === 'failed') mappedStatus = 'cancelled';
    if (os === 'completed') mappedStatus = 'completed';
    if (os === 'inprogress' || os === 'in_progress') mappedStatus = 'in_progress';
    if (os === 'enroute' || os === 'en_route') mappedStatus = 'en_route';
    if (os === 'arrived') mappedStatus = 'arrived';

    const rawOrderType = offer.orderType || offer.type || 'Delivery';
    const mappedType = ORDER_TYPE_MAP[rawOrderType] ?? 'other';

    return {
      id: orderId,
      offerId: offer.orderId ? offer.id : undefined,
      code: offer.orderNumber,
      type: mappedType,
      status: mappedStatus,
      customer: {
        name: 'Customer',
        phone: 'N/A',
        address: 'Address will be available after acceptance',
        location: { latitude: 0, longitude: 0 }
      },
      distanceKm: 0,
      etaMinutes: 0,
      itemCount: 1,
      totalAmount: 0,
      codAmount: 0,
      createdAt: offer.offeredAt,
    };
  });

  const result = status ? mapped.filter((a) => a.status === status) : mapped;
  logger.debug('assignment', `Loaded ${result.length} assignment(s)`, { status });
  return result;
}

export async function acceptOffer(offerId: string): Promise<Assignment> {
  logger.info('assignment', 'Accepting assignment offer', { offerId });
  const response = await api.post(`/api/v1/assignment-offers/${offerId}/accept`, {});
  const orderId: string | undefined = response.data?.orderId;

  if (!orderId) {
    throw new Error('Accept response did not include an order id');
  }

  try {
    // Fetch the full order right away so the UI has real customer/address data
    // immediately, instead of the offer's placeholder text until the next refresh.
    return await fetchOrderAsAssignment(orderId, offerId);
  } catch (e) {
    logger.warn('assignment', `Accepted order ${orderId} but failed to enrich it immediately`, e);
    
    const rawOrderType = response.data?.orderType || response.data?.type || 'Delivery';
    const mappedType = ORDER_TYPE_MAP[rawOrderType] ?? 'other';

    return {
      id: orderId,
      offerId,
      code: response.data.orderNumber,
      type: mappedType,
      status: 'accepted',
      customer: {
        name: 'Customer',
        phone: 'N/A',
        address: 'Address will be available shortly',
        location: { latitude: 0, longitude: 0 },
      },
      distanceKm: 0,
      etaMinutes: 0,
      itemCount: 1,
      totalAmount: 0,
      codAmount: 0,
      createdAt: response.data.offeredAt || new Date().toISOString(),
    };
  }
}

export async function declineOffer(offerId: string): Promise<void> {
  logger.info('assignment', 'Declining assignment offer', { offerId });
  await api.post(`/api/v1/assignment-offers/${offerId}/decline`, {});
}

export async function getAssignmentById(id: string): Promise<Assignment | undefined> {
  logger.debug('assignment', 'Fetching assignment by id', { id });
  try {
    return await fetchOrderAsAssignment(id);
  } catch (e) {
    logger.warn('assignment', `Failed to fetch order ${id} (may be unaccepted offer), falling back to offers list`, e);
    try {
      const allAssignments = await getAssignments();
      return allAssignments.find((a) => a.id === id);
    } catch (fallbackError) {
      logger.warn('assignment', `Fallback to getAssignments failed`, fallbackError);
      return undefined;
    }
  }
}

export async function startNavigation(id: string): Promise<Assignment> {
  logger.info('assignment', 'Starting navigation', { id });
  const response = await api.post<OrderDto>(`/api/v1/orders/${id}/en-route`, {});
  logger.info('assignment', 'Navigation started', { id, status: response.data.status });
  return mapOrderDtoToAssignment(response.data);
}

export async function markArrived(id: string): Promise<Assignment> {
  logger.info('assignment', 'Marking as arrived', { id });
  const response = await api.post<OrderDto>(`/api/v1/orders/${id}/arrived`, {});
  logger.info('assignment', 'Arrived at destination', { id, status: response.data.status });
  return mapOrderDtoToAssignment(response.data);
}

export async function startAssignment(id: string): Promise<Assignment> {
  logger.info('assignment', 'Starting assignment', { id });
  const response = await api.post<OrderDto>(`/api/v1/orders/${id}/start`, {});
  logger.info('assignment', 'Assignment started', { id, status: response.data.status });
  return mapOrderDtoToAssignment(response.data);
}

export async function saveDeliveryProof(
  id: string,
  proof: { proofPhotoUri?: string; signatureUri?: string; deliveryNotes?: string },
): Promise<Assignment> {
  logger.info('assignment', 'Saving delivery proof', { id, hasPhoto: !!proof.proofPhotoUri, hasSignature: !!proof.signatureUri });

  const formData = new FormData();
  if (proof.proofPhotoUri) {
    formData.append('Photos', { uri: proof.proofPhotoUri, name: 'photo.jpg', type: 'image/jpeg' } as any);
  }
  
  if (proof.signatureUri) {
    // proof.signatureUri contains raw SVG path data. We must save it to a file first.
    const svgContent = `<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg"><path d="${proof.signatureUri}" stroke="black" stroke-width="2.5" fill="none" /></svg>`;
    const signatureFileUri = FileSystem.cacheDirectory + `signature_${id}.svg`;
    await FileSystem.writeAsStringAsync(signatureFileUri, svgContent, { encoding: FileSystem.EncodingType.UTF8 });
    
    formData.append('Signature', { uri: signatureFileUri, name: 'signature.svg', type: 'image/svg+xml' } as any);
  }
  
  if (proof.deliveryNotes) {
    formData.append('Notes', proof.deliveryNotes);
  }
  formData.append('Lat', '0');
  formData.append('Lng', '0');

  await api.post<ProofOfDeliveryDto>(`/api/v1/orders/${id}/proof`, formData, {
    headers: {
      'Accept': 'application/json',
      // DO NOT manually set Content-Type to multipart/form-data here, 
      // as it overrides the boundary generated by React Native.
    },
  });

  logger.info('assignment', 'Delivery proof saved', { id });
  return fetchOrderAsAssignment(id);
}

export async function confirmPayment(
  id: string,
  payment: { paymentMode: PaymentMode; receivedAmount: number; referenceNumber?: string },
): Promise<Assignment> {
  logger.info('assignment', 'Confirming payment', { id, ...payment });
  await api.post(`/api/v1/orders/${id}/payment`, {
    mode: PAYMENT_MODE_MAP[payment.paymentMode],
    collectedAmount: payment.receivedAmount,
    tipAmount: 0,
    referenceNumber: payment.referenceNumber,
  });
  logger.info('assignment', 'Payment confirmed', { id, mode: payment.paymentMode, amount: payment.receivedAmount });
  return fetchOrderAsAssignment(id);
}

export async function saveReturnDetail(
  id: string,
  detail: ReturnDetail
): Promise<Assignment> {
  logger.info('assignment', 'Saving return detail', { id, ...detail });
  await api.put(`/api/v1/orders/${id}/return-detail`, {
    returnReasonOptionId: detail.returnReasonOptionId,
    conditionNotes: detail.conditionNotes,
  });
  return fetchOrderAsAssignment(id);
}

export async function saveServiceDetail(
  id: string,
  detail: ServiceDetail
): Promise<Assignment> {
  logger.info('assignment', 'Saving service detail', { id, ...detail });
  await api.put(`/api/v1/orders/${id}/service-detail`, {
    complaintDescription: detail.complaintDescription,
    productRef: detail.productRef,
    diagnosisNotes: detail.diagnosisNotes,
    resolutionNotes: detail.resolutionNotes,
    partsUsed: detail.partsUsed,
  });
  return fetchOrderAsAssignment(id);
}

export async function saveSalesDetail(
  id: string,
  detail: SalesDetail
): Promise<Assignment> {
  logger.info('assignment', 'Saving sales detail', { id, ...detail });
  await api.put(`/api/v1/orders/${id}/sales-detail`, {
    meetingNotes: detail.meetingNotes,
    outcome: detail.outcome,
    followUpDate: detail.followUpDate,
  });
  return fetchOrderAsAssignment(id);
}

export async function getChecklistTemplates(orderType: string): Promise<ChecklistTemplateItem[]> {
  logger.info('assignment', 'Fetching checklist templates', { orderType });
  try {
    const response = await api.get<ChecklistTemplateItem[]>(`/api/v1/checklist-templates?orderType=${orderType}&activeOnly=true`);
    return response.data || [];
  } catch (e) {
    logger.warn('assignment', `API fetch failed for checklist-templates: ${e}`);
    throw e;
  }
}

export async function getChecklist(id: string): Promise<ChecklistItem[]> {
  logger.info('assignment', 'Fetching checklist', { id });
  const response = await api.get<ChecklistItemDto[]>(`/api/v1/orders/${id}/checklist`);
  return (response.data || []).map((item) => ({
    id: item.id,
    label: item.label,
    isRequired: item.isRequired,
    isChecked: item.isChecked,
    notes: item.notes,
    sortOrder: item.sortOrder,
    checkedAt: item.checkedAt,
  }));
}

export async function saveChecklist(
  id: string,
  items: ChecklistItem[]
): Promise<Assignment> {
  logger.info('assignment', 'Saving checklist', { id });
  await api.put(`/api/v1/orders/${id}/checklist`, {
    items: items.map((item) => ({ id: item.id, isChecked: item.isChecked, notes: item.notes ?? undefined })),
  });
  return fetchOrderAsAssignment(id);
}

export async function getReturnReasons(): Promise<ReturnReasonOption[]> {
  logger.info('assignment', 'Fetching return reasons');
  const response = await api.get<{ id: string; label: string }[]>('/api/v1/return-reasons?activeOnly=true');
  return (response.data || []).map((r) => ({ id: r.id, label: r.label }));
}

export async function completeAssignment(id: string): Promise<Assignment> {
  logger.info('assignment', 'Completing assignment', { id });
  const response = await api.post<OrderDto>(`/api/v1/orders/${id}/complete`, {});
  logger.info('assignment', 'Assignment completed', { id, completedAt: response.data.completedAt });
  return mapOrderDtoToAssignment(response.data);
}

export async function previewOrderByQrToken(token: string): Promise<QrOrderSummaryDto> {
  logger.info('assignment', 'Previewing order by QR token');
  const response = await api.get<QrOrderSummaryDto>(`/api/v1/qr/${encodeURIComponent(token)}`);
  return response.data;
}

export async function acceptOrderByQrToken(token: string): Promise<QrAcceptResponse> {
  logger.info('assignment', 'Accepting order by QR token');
  const response = await api.post<QrAcceptResponse>(`/api/v1/qr/${encodeURIComponent(token)}/accept`, {});
  return response.data;
}

export async function updateOrderItems(
  id: string,
  items: { id: string; quantity: number }[]
): Promise<Assignment> {
  logger.info('assignment', 'Updating order items', { id, itemCount: items.length });
  const response = await api.patch<OrderDto>(`/api/v1/orders/${id}`, {
    items: items,
  });
  return mapOrderDtoToAssignment(response.data);
}
