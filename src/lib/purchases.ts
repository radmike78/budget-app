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
  purchaseErrorListener,
  purchaseUpdatedListener,
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
let listeners: { remove: () => void }[] = [];
let unlockHandler: (() => void) | null = null;
/** What the store last reported, so a trial-start sheet is never shown for a trial it already holds. */
let lastKnown: StoreState | null = null;

/** The store never holds the app up: a slow or absent store reads as "no answer" after this long. */
const STORE_TIMEOUT_MS = 8000;
function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), STORE_TIMEOUT_MS);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, () => { clearTimeout(timer); resolve(fallback); });
  });
}

/** Called once the store confirms the unlock, however the purchase was started (the sheet, Ask to Buy, a retry). */
export function onUnlocked(handler: () => void): void {
  unlockHandler = handler;
}

/**
 * One connection per app run; every call below waits for it. The outcome of a purchase arrives through the
 * store's own events, not the return value of the request, so the listeners are the source of truth.
 */
async function connect(): Promise<boolean> {
  if (!connected) {
    connected = withTimeout(initConnection(), false).then((ok) => {
      if (!ok) { connected = null; return false; }
      if (listeners.length === 0) {
        listeners = [
          purchaseUpdatedListener((purchase) => {
            if (owned([purchase], PRODUCT_UNLOCK)) {
              finishTransaction({ purchase, isConsumable: false }).catch(() => {});
              unlockHandler?.();
            } else if (owned([purchase], PRODUCT_TRIAL)) {
              finishTransaction({ purchase, isConsumable: false }).catch(() => {});
            }
          }),
          purchaseErrorListener(() => {}),
        ];
      }
      return true;
    });
  }
  return connected;
}

export async function disconnect(): Promise<void> {
  if (!connected) return;
  connected = null;
  for (const l of listeners) l.remove();
  listeners = [];
  await endConnection().catch(() => {});
}

function owned(purchases: Purchase[], productId: string): Purchase | undefined {
  return purchases.find((p) => (p.productId === productId || p.ids?.includes(productId)) && p.purchaseState === 'purchased');
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
    const purchases = await withTimeout(getAvailablePurchases(), null as Purchase[] | null);
    if (!purchases) return null;
    // A purchase the store still holds open (an interrupted buy, a family share) is acknowledged here.
    for (const p of purchases) if (p.purchaseState === 'purchased') await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
    lastKnown = stateFrom(purchases);
    return lastKnown;
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

export type BuyResult = 'bought' | 'pending' | 'cancelled' | 'failed';

/**
 * Opens the store's own purchase sheet. 'bought' when the request itself came back purchased; 'pending' when it
 * came back without a final state (a slow payment method, Ask to Buy): the listener in `connect` unlocks the app
 * the moment the store confirms, on this launch or the next.
 */
export async function buyUnlock(): Promise<BuyResult> {
  if (!(await connect())) return 'failed';
  try {
    const result = await requestPurchase({ type: 'in-app', request: { apple: { sku: PRODUCT_UNLOCK }, google: { skus: [PRODUCT_UNLOCK] } } });
    const purchases = result == null ? [] : Array.isArray(result) ? result : [result];
    const done = owned(purchases, PRODUCT_UNLOCK);
    if (!done) return 'pending';
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
    // A store that does not answer (offline, a stalled StoreKit) gives up like `readStore`, never a spinner for ever.
    const restored = await withTimeout(restorePurchases().then(() => true), false);
    if (!restored) return null;
    const purchases = await withTimeout(getAvailablePurchases().then((p) => ({ p })), null);
    if (!purchases) return null;
    lastKnown = stateFrom(purchases.p);
    return lastKnown;
  } catch {
    return null;
  }
}

/**
 * Records the start of the trial with Apple as a free product, once, so a reinstall keeps the same dates.
 * The sheet may be declined or the product may not exist; neither matters, the local dates still rule.
 */
export async function recordTrialStart(): Promise<void> {
  // A reinstall already owns the trial product; asking again would only show "already purchased".
  if (Platform.OS !== 'ios') return;
  // What the store already knows (a reinstall mid-trial) is read first, so the sheet is not shown twice.
  if (!lastKnown) await readStore().catch(() => null);
  if (lastKnown?.trialStartedOn || !(await connect())) return;
  try {
    const result = await requestPurchase({ type: 'in-app', request: { apple: { sku: PRODUCT_TRIAL }, google: { skus: [PRODUCT_TRIAL] } } });
    const purchases = result == null ? [] : Array.isArray(result) ? result : [result];
    const p = owned(purchases, PRODUCT_TRIAL);
    if (p) await finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
  } catch {
    // Declined, offline, or not set up: nothing to do.
  }
}
