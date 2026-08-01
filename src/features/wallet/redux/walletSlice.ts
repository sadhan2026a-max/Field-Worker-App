import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { LedgerEntryDto } from '../types/Wallet';
import * as walletService from '../api/walletService';

interface WalletState {
  cashSettlements: LedgerEntryDto[];
  payouts: LedgerEntryDto[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  cashSettlements: [],
  payouts: [],
  isLoading: false,
  error: null,
};

export const fetchCashSettlements = createAsyncThunk<LedgerEntryDto[], string>(
  'wallet/fetchCashSettlements',
  async (driverId) => {
    return await walletService.getCashSettlements(driverId);
  }
);

export const fetchPayouts = createAsyncThunk<LedgerEntryDto[], string>(
  'wallet/fetchPayouts',
  async (driverId) => {
    return await walletService.getPayouts(driverId);
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cash Settlements
      .addCase(fetchCashSettlements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCashSettlements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cashSettlements = action.payload.sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
      })
      .addCase(fetchCashSettlements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch cash settlements';
      })
      // Payouts
      .addCase(fetchPayouts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payouts = action.payload.sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
      })
      .addCase(fetchPayouts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch payouts';
      });
  },
});

export const walletReducer = walletSlice.reducer;

// Selectors
type StateWithWallet = { wallet: WalletState };
export const selectCashSettlements = (state: StateWithWallet) => state.wallet.cashSettlements;
export const selectPayouts = (state: StateWithWallet) => state.wallet.payouts;
export const selectWalletLoading = (state: StateWithWallet) => state.wallet.isLoading;
export const selectWalletError = (state: StateWithWallet) => state.wallet.error;
