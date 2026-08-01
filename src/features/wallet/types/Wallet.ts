export interface LedgerEntryDto {
  id: string;
  amount: number;
  notes: string | null;
  recordedByName: string;
  recordedAt: string;
}
