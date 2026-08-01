import { api } from '@/shared/services/axios';
import { LedgerEntryDto } from '../types/Wallet';

export const getCashSettlements = async (driverId: string): Promise<LedgerEntryDto[]> => {
  const response = await api.get<LedgerEntryDto[]>(`/api/v1/drivers/${driverId}/cash-settlements`);
  return response.data;
};

export const getPayouts = async (driverId: string): Promise<LedgerEntryDto[]> => {
  const response = await api.get<LedgerEntryDto[]>(`/api/v1/drivers/${driverId}/payouts`);
  return response.data;
};
