export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedOrderId?: string | null;
  readAt?: string | null;
  createdAt: string;
}
