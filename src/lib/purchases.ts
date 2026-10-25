/**
 * The store side of the one-time unlock: Apple's StoreKit and Google Play Billing through expo-iap, which
 * talks to the stores' own native libraries and nothing else. No billing service of ours and no third-party
 * purchase SDK: a purchase is the store's record, and the app keeps only a flag.
 *
 * Products (set up in App Store Connect and the Play Console, see docs/RELEASE.md):
 *   full_unlock  non-consumable, the one-time purchase that keeps the app going after the trial
 *   trial_30     iOS only, a non-consumable at price tier 0 named "30-day Trial": Apple's way of recording a
 *                time-based trial, so its purchase date survives a reinstall. Optional: when it is not set up
 *                or the person declines the sheet, the trial simply runs on the local dates.
 */
import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  requestPurchase,
  restorePurchases,
  type Product,
  type Purchase,
} from 'expo-iap';
import { toDateString } from './dates';

export const PRODUCT_UNLOCK = 'full_unlock';
export const PRODUCT_TRIAL = 'trial_30';

export type StoreState = {
  unlocked: boolean;
  /** The day the iOS trial product was taken, when the store knows one. */
  trialStartedOn: string | null;
};

let connected: Promise<boolean> | null = null;

/** One connection per app run; every call below waits for it. */
async function connect(): Promise<boolean> {
  if (!connected) {
    connected = initConnection().catch(() => {
      connected = null;
      return false;
    });
  }
  return connected;
}

export async function disconnect(): Promise<void> {
  if (!connected) return;
  connected = null;
  await endConnection().catch(() => {});
}

function owned(purchases: Purchase[], productId: string): Purchase | undefined {
  return purchases.find((p) => (p.productId === productId || p.ids?.includes(productId)) && p.purchaseState !== 'pending');
}

function stateFrom(purchases: Purchase[]): StoreState {
  const trial = Platform.OS === 'ios' ? owned(purchases, PRODUCT_TRIAL) : undefined;
  return {
    unlocked: owned(purchases, PRODUCT_UNLOCK) != null,
    trialStartedOn: trial?.transactionDate ? toDateString(new Date(trial.transactionDate)) : null,
  };
}

/** What the store already knows for this account, read quietly at start. Any failure reads as nothing. */
export async function readStore(): Promise<StoreState | null> {
  if (!(await connect())) return null;
  try {
    const purchases = await getAvailablePurchases();
    // A purchase the store still holds open (an interrupted buy, a family share) is acknowledged here.
    for (const p of purchases) if (p.purchaseState === 'purchased') await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
    return stateFrom(purchases);
  } catch {
    return null;
  }
}

/** The unlock's price in the store's own words ("$4.99"), or null while the store has not answered. */
export async function unlockPrice(): Promise<string | null> {
  if (!(await connect())) return null;
  try {
    const products = (await fetchProducts({ skus: [PRODUCT_UNLOCK], type: 'in-app' })) as Product[] | null;
    return products?.find((p) => p.id === PRODUCT_UNLOCK)?.displayPrice ?? null;
  } catch {
    return null;
  }
}

export type BuyResult = 'bought' | 'cancelled' | 'failed';

/** Opens the store's own purchase sheet. */
export async function buyUnlock(): Promise<BuyResult> {
  if (!(await connect())) return 'failed';
  try {
    const result = await requestPurchase({ type: 'in-app', request: { apple: { sku: PRODUCT_UNLOCK }, google: { skus: [PRODUCT_UNLOCK] } } });
    const purchases = result == null ? [] : Array.isArray(result) ? result : [result];
    const done = owned(purchases, PRODUCT_UNLOCK);
    if (!done) return 'failed';
    await finishTransaction({ purchase: done, isConsumable: false }).catch(() => {});
    return 'bought';
  } catch (e) {
    return isUserCancelledError(e) ? 'cancelled' : 'failed';
  }
}

/** Asks the store for everything this account owns, for a new phone or a reinstall. */
export async function restore(): Promise<StoreState | null> {
  if (!(await connect())) return null;
  try {
    await restorePurchases();
    return stateFrom(await getAvailablePurchases());
  } catch {
    return null;
  }
}

/**
 * Records the start of the trial with Apple as a free product, once, so a reinstall keeps the same dates.
 * The sheet may be declined or the product may not exist; neither matters, the local dates still rule.
 */
export async function recordTrialStart(): Promise<void> {
  if (Platform.OS !== 'ios' || !(await connect())) return;
  try {
    const result = await requestPurchase({ type: 'in-app', request: { apple: { sku: PRODUCT_TRIAL }, google: { skus: [PRODUCT_TRIAL] } } });
    const purchases = result == null ? [] : Array.isArray(result) ? result : [result];
    const p = owned(purchases, PRODUCT_TRIAL);
    if (p) await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
  } catch {
    // Declined, offline, or not set up: nothing to do.
  }
}
