import { api } from '@/shared/services/axios';
import { LedgerEntryDto } from '../types/Wallet';

export const getCashSettlements = async (driverId: string): Promise<LedgerEntryDto[]> => {
  try {
    const response = await api.get<LedgerEntryDto[]>(`/api/v1/drivers/${driverId}/cash-settlements`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      console.warn('Backend returned 403 for cash-settlements (requires backend role update)');
      return [];
    }
    throw err;
  }
};

export const getPayouts = async (driverId: string): Promise<LedgerEntryDto[]> => {
  try {
    const response = await api.get<LedgerEntryDto[]>(`/api/v1/drivers/${driverId}/payouts`);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      console.warn('Backend returned 403 for payouts (requires backend role update)');
      return [];
    }
    throw err;
  }
};
