export type DriverAvailability = 'Available' | 'Busy' | 'Offline';

export interface DriverWorkspaceSummary {
  pendingCount: number;
  completedCount: number;
  codCollection: number;
  totalEarnings: number;
  commissionEarned: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatarUri?: string;
  status: DriverAvailability;
  tenantId: string;
  tenantName?: string;
  companyName?: string;
  hasPin: boolean;
  assignableOrderTypes: string[];
}
