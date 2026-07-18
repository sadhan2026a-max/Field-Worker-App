import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';

/**
 * Typed version of `useDispatch` — use this everywhere instead of
 * the raw hook so async thunks are properly typed.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of `useSelector` — use this everywhere instead of
 * the raw hook for proper RootState inference.
 */
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector<RootState, T>(selector);
