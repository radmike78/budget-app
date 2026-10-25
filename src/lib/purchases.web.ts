/** The web build has no store: it is the free demo and is never gated, so every call answers "unlocked". */
import type { BuyResult, StoreState } from './purchases';

export const PRODUCT_UNLOCK = 'full_unlock';
export const PRODUCT_TRIAL = 'trial_30';
export type { BuyResult, StoreState };

export async function disconnect(): Promise<void> {}
export async function readStore(): Promise<StoreState | null> {
  return { unlocked: true, trialStartedOn: null };
}
export async function unlockPrice(): Promise<string | null> {
  return null;
}
export async function buyUnlock(): Promise<BuyResult> {
  return 'failed';
}
export async function restore(): Promise<StoreState | null> {
  return { unlocked: true, trialStartedOn: null };
}
export async function recordTrialStart(): Promise<void> {}
