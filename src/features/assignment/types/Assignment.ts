export type AssignmentStatus = 'pending' | 'accepted' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export type AssignmentType =
  | 'delivery'
  | 'pickup'
  | 'return'
  | 'inspection'
  | 'installation'
  | 'sales_visit'
  | 'service_visit'
  | 'other';

export type PaymentMode = 'cash' | 'upi' | 'card';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AssignmentCustomer {
  name: string;
  phone: string;
  address: string;
  location: Coordinates;
}

export type FieldType = 'checkbox' | 'text' | 'number' | 'dropdown' | 'radio' | 'date' | 'time' | 'image' | 'signature' | 'multiselect';

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[]; // For dropdown, radio, multiselect
  maxLength?: number;
}

export type ChecklistItemType = 'Checkbox' | 'Radio' | 'Text' | 'Number' | 'Dropdown' | 'Multiselect' | 'Date' | 'Time' | 'Image' | 'Signature';

export interface ChecklistTemplateItem {
  id: string;
  orderType: string;
  label: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  itemType?: ChecklistItemType;
  options?: string[];
}

export interface ChecklistItem {
  id: string; // Refers to the template item ID
  label: string;
  isRequired: boolean;
  isChecked: boolean; // Legacy/fallback for simple checkbox
  value?: string | null; // The dynamic response value
  notes: string | null;
  sortOrder: number;
  checkedAt: string | null;
  itemType?: ChecklistItemType;
  options?: string[];
}

export interface ReturnDetail {
  returnReasonOptionId: string;
  conditionNotes?: string;
  originalInvoiceNumber?: string;
}

export interface PartUsed {
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface AssignmentItem {
  id: string;
  description: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
}

export interface ServiceDetail {
  complaintDescription?: string;
  productRef?: string;
  diagnosisNotes?: string;
  resolutionNotes?: string;
  partsUsed?: PartUsed[];
}

export type SalesOutcome = 'Interested' | 'NotInterested' | 'FollowUpNeeded' | 'Closed' | 'NoResponse';

export interface SalesDetail {
  meetingNotes: string;
  outcome: SalesOutcome;
  followUpDate?: string;
}

export interface ReturnReasonOption {
  id: string;
  label: string;
}

export interface Assignment {
  id: string;
  offerId?: string;
  code: string;
  type: AssignmentType;
  status: AssignmentStatus;
  customer: AssignmentCustomer;
  distanceKm: number;
  etaMinutes: number;
  itemCount: number;
  totalAmount: number;
  codAmount: number;
  deliveryInstructions?: string;
  createdAt: string;
  completedAt?: string;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  proofPhotoUris?: string[];
  signatureUri?: string;
  deliveryNotes?: string;
  paymentMode?: PaymentMode;
  receivedAmount?: number;
  paymentReferenceNumber?: string;
  returnDetail?: ReturnDetail;
  serviceDetail?: ServiceDetail;
  salesDetail?: SalesDetail;
  checklist?: ChecklistItem[];
  items?: AssignmentItem[];
  timeline?: { status: string; timestamp: string; notes?: string; }[];
  requiresDeliveryOtp?: boolean;
  deliveryOtpVerifiedAt?: string | null;
}

export interface AssignmentOffer {
  id: string;
  orderId: string;
  orderNumber: string;
  driverId: string;
  driverName: string;
  method: string;
  status: 'Offered' | 'Accepted' | 'Declined' | 'Completed' | string;
  offeredAt: string;
  respondedAt?: string;
  expiresAt: string;
}
// ─── Raw API shapes (GET /api/v1/orders) ──────────────────────────────────────

export type OrderStatus = 'Pending' | 'Offered' | 'Assigned' | 'EnRoute' | 'Arrived' | 'InProgress' | 'Completed' | 'Cancelled' | 'Failed';

export type OrderTypeApi = 'Delivery' | 'Pickup' | 'Return' | 'Installation' | 'Inspection' | 'SalesVisit' | 'ServiceVisit' | 'Other';
export interface OrderItemDto {
  id: string;
  description: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
}

export interface OrderChecklistItemDto {
  id: string;
  label: string;
  isRequired: boolean;
  isChecked: boolean;
  notes: string | null;
  sortOrder: number;
  checkedAt: string | null;
  itemType?: ChecklistItemType;
  options?: string[];
  value?: string | null;
}

// Same shape as returned by GET /api/v1/orders/{id}/checklist
export type ChecklistItemDto = OrderChecklistItemDto;

export interface ProofOfDeliveryDto {
  id: string;
  orderId: string;
  photoUrls: string[];
  signatureUrl: string | null;
  notes: string | null;
  capturedAt: string;
  capturedLat: number | null;
  capturedLng: number | null;
}

export interface OrderReturnDetailDto {
  id: string;
  orderId: string;
  returnReasonOptionId: string;
  returnReasonLabelSnapshot: string;
  originalInvoiceNumber: string;
  conditionNotes: string;
}

export interface OrderPartUsedDto {
  id: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderServiceVisitDetailDto {
  id: string;
  orderId: string;
  complaintDescription: string;
  productRef: string;
  diagnosisNotes: string;
  resolutionNotes: string;
  partsUsed: OrderPartUsedDto[];
}

export interface OrderSalesVisitDetailDto {
  id: string;
  orderId: string;
  meetingNotes: string;
  outcome: SalesOutcome;
  followUpDate: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  orderType: OrderTypeApi;
  status: OrderStatus;
  assignmentMethod: string;
  customerId: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  pickupAddress: string;
  deliveryAddress: string;
  instructions: string;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
  totalAmount: number;
  isCod: boolean;
  deliveryCharge: number;
  deliveryChargeDistanceKm: number;
  pickupWarehouseId: string | null;
  pickupWarehouseName: string | null;
  deliveryChargeZoneId: string | null;
  deliveryChargeZoneName: string | null;
  publicTrackingToken: string | null;
  qrToken: string | null;
  qrExpiresAt: string | null;
  createdAt: string;
  offeredAt: string | null;
  assignedAt: string | null;
  enRouteAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItemDto[];
  checklist: OrderChecklistItemDto[];
  returnDetail: OrderReturnDetailDto | null;
  serviceVisitDetail: OrderServiceVisitDetailDto | null;
  salesVisitDetail: OrderSalesVisitDetailDto | null;
  externalReferenceId: string | null;
  requiresDeliveryOtp: boolean;
  deliveryOtpVerifiedAt: string | null;
}

// ─── QR self-assign (GET /api/v1/qr/{token}, POST /api/v1/qr/{token}/accept) ──

export interface QrOrderSummaryDto {
  orderNumber: string;
  orderType: OrderTypeApi;
  status: OrderStatus;
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  totalAmount: number;
  qrExpiresAt?: string | null;
}

export interface QrAcceptResponse {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
}

export interface OrderListResponse {
  items: OrderDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OrderCompletionRequirementDto {
  orderType: string;
  requiresPhoto: boolean;
  requiresSignature: boolean;
  requiresPayment: boolean;
  requiresReturnReason: boolean;
  requiresChecklist: boolean;
  requiresServiceNotes: boolean;
  requiresSalesOutcome: boolean;
  isCustomized: boolean;
}
