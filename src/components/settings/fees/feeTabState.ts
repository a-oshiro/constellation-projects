import {
  FEE_SYNC_FEES, FEE_SYNC_FEES_EXTENDED, FEE_SYNC_UPDATED_FEES,
} from '../../../data/feeSync';
import { buildRejectedUpdate } from '../../../data/feeSync';
import type { FeeSyncDealership, FeeSyncFee, FeeSyncPull, FeeSyncRejectedUpdate } from '../../../data/feeSync';

// State for the Account Settings › Fees tab: which fee source is active, the manual fees, and where the
// (mocked) FeeSync flow is. A plain reducer so the flow can be unit-tested without rendering anything.

export type FeeSource = 'manual' | 'feesync';

/**
 * FeeSync flow, in Figma order: `identify` (we identified this account; another from the group can be picked) → `confirming` (button spinner)
 * → `connected`, or → `confirm-error` (connection failed). `refreshing` is a manual refresh while connected.
 */
export type FeeSyncPhase = 'identify' | 'confirming' | 'confirm-error' | 'connected' | 'refreshing';

export interface ManualFee {
  id: string;
  name: string;
  /** Kept as typed, so a half-typed amount ("12.") isn't reformatted under the cursor. */
  amount: string;
  appliesTo: string;
}

export interface ManualFees {
  dealerFees: ManualFee[];
  optionalFees: ManualFee[];
}

export interface FeeTabState {
  source: FeeSource;
  phase: FeeSyncPhase;
  dealership: FeeSyncDealership;
  fees: FeeSyncFee[];
  /** ISO time of the last successful pull; null until the first one. */
  refreshedAt: string | null;
  /** Simulation menu: "Confirm dealership" fails. */
  simulateConfirmError: boolean;
  /** Simulation menu: a connected FeeSync loses its connection. */
  simulateConnectionLost: boolean;
  /** A FeeSync update that wasn't applied (simulation menu, or the "fees updated" notification); null when none. */
  rejectedUpdate: FeeSyncRejectedUpdate | null;
  savedManual: ManualFees;
  draftManual: ManualFees;
}

export const APPLIES_TO_OPTIONS = ['All offer types', 'APR', 'Finance', 'Lease', 'Cash'] as const;

export const newManualFee = (name = '', amount = ''): ManualFee => ({
  id: `fee-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
  amount,
  appliesTo: APPLIES_TO_OPTIONS[0],
});

/** Figma Flow 1, first frame: one Doc Fee of $175.00 on all offer types, no optional fees. */
export const defaultManualFees = (): ManualFees => ({
  dealerFees: [{ ...newManualFee('Doc Fee', '175.00'), id: 'manual-doc-fee' }],
  optionalFees: [],
});

export const initialFeeTabState = (dealership: FeeSyncDealership): FeeTabState => {
  const manual = defaultManualFees();
  return {
    source: 'manual',
    phase: 'identify',
    dealership,
    fees: [],
    refreshedAt: null,
    simulateConfirmError: false,
    simulateConnectionLost: false,
    rejectedUpdate: null,
    savedManual: manual,
    draftManual: manual,
  };
};

export type ManualList = keyof ManualFees;

export type FeeTabAction =
  | { type: 'switchSource'; source: FeeSource }
  | { type: 'confirmStart' }
  | { type: 'confirmSuccess'; pull: FeeSyncPull }
  | { type: 'confirmFail' }
  | { type: 'selectDealership'; dealership: FeeSyncDealership }
  | { type: 'refreshStart' }
  | { type: 'refreshSuccess'; pull: FeeSyncPull }
  | { type: 'refreshFail' }
  | { type: 'openFromNotification'; refreshedAt: string }
  | { type: 'setSimulateConfirmError'; value: boolean }
  | { type: 'setSimulateConnectionLost'; value: boolean }
  | { type: 'setSimulateRejectedUpdate'; value: boolean; receivedAt: string }
  | { type: 'addManualFee'; list: ManualList; fee: ManualFee }
  | { type: 'updateManualFee'; list: ManualList; id: string; patch: Partial<Omit<ManualFee, 'id'>> }
  | { type: 'removeManualFee'; list: ManualList; id: string }
  | { type: 'saveManual' }
  | { type: 'discardManual' };

export function feeTabReducer(state: FeeTabState, action: FeeTabAction): FeeTabState {
  switch (action.type) {
    case 'switchSource':
      return { ...state, source: action.source };

    case 'confirmStart':
      return state.phase === 'identify' || state.phase === 'confirm-error' ? { ...state, phase: 'confirming' } : state;
    case 'selectDealership':
      // Only before connecting; the confirm button sends whichever dealership is selected.
      return state.phase === 'identify' || state.phase === 'confirm-error' ? { ...state, dealership: action.dealership } : state;
    case 'confirmSuccess':
      return {
        ...state, phase: 'connected', dealership: action.pull.dealership,
        fees: action.pull.fees, refreshedAt: action.pull.refreshedAt,
      };
    case 'confirmFail':
      return { ...state, phase: 'confirm-error' };

    case 'refreshStart':
      return state.phase === 'connected' ? { ...state, phase: 'refreshing' } : state;
    case 'refreshSuccess':
      return { ...state, phase: 'connected', fees: action.pull.fees, refreshedAt: action.pull.refreshedAt };
    case 'refreshFail':
      return { ...state, phase: 'connected' };

    case 'openFromNotification':
      return {
        ...state, source: 'feesync', phase: 'connected', fees: FEE_SYNC_UPDATED_FEES,
        refreshedAt: action.refreshedAt, simulateConfirmError: false, simulateConnectionLost: false,
        rejectedUpdate: buildRejectedUpdate(action.refreshedAt),
      };

    case 'setSimulateConfirmError': {
      // Turning it on shows the failed confirm screen right away, even from a connected FeeSync (the
      // simulated failure drops the connection); turning it off returns to the plain confirm screen.
      const phase = action.value && state.phase !== 'confirming' ? 'confirm-error'
        : !action.value && state.phase === 'confirm-error' ? 'identify'
          : state.phase;
      return { ...state, simulateConfirmError: action.value, phase };
    }
    case 'setSimulateConnectionLost':
      return { ...state, simulateConnectionLost: action.value };
    case 'setSimulateRejectedUpdate':
      return { ...state, rejectedUpdate: action.value ? buildRejectedUpdate(action.receivedAt) : null };

    case 'addManualFee':
      return withDraft(state, action.list, (fees) => [...fees, action.fee]);
    case 'updateManualFee':
      return withDraft(state, action.list, (fees) => fees.map((f) => (f.id === action.id ? { ...f, ...action.patch } : f)));
    case 'removeManualFee':
      return withDraft(state, action.list, (fees) => fees.filter((f) => f.id !== action.id));
    case 'saveManual':
      return { ...state, savedManual: state.draftManual };
    case 'discardManual':
      return { ...state, draftManual: state.savedManual };
  }
}

function withDraft(state: FeeTabState, list: ManualList, update: (fees: ManualFee[]) => ManualFee[]): FeeTabState {
  return { ...state, draftManual: { ...state.draftManual, [list]: update(state.draftManual[list]) } };
}

export const isManualDirty = (state: FeeTabState) => state.draftManual !== state.savedManual;

/** True while FeeSync is connected (or refreshing) and the simulation menu says the connection was lost. */
export const isConnectionLost = (state: FeeTabState) =>
  state.simulateConnectionLost && (state.phase === 'connected' || state.phase === 'refreshing');

/**
 * The fees the connected table shows. Figma's "Connection is lost afterwards" frame lists the CPO
 * Inspection Fee too, so a lost connection shows the extended list in place of the first-pull list.
 */
export function visibleFeeSyncFees(state: FeeTabState): FeeSyncFee[] {
  return isConnectionLost(state) && state.fees === FEE_SYNC_FEES ? FEE_SYNC_FEES_EXTENDED : state.fees;
}

/** In-flight phases aren't worth restoring: a request that was running when the tab unmounted is gone. */
export function settleTransientPhase(state: FeeTabState): FeeTabState {
  if (state.phase === 'confirming') return { ...state, phase: state.simulateConfirmError ? 'confirm-error' : 'identify' };
  if (state.phase === 'refreshing') return { ...state, phase: 'connected' };
  return state;
}

// ── Session store ──────────────────────────────────────────────────────────────
// Module-level, per account, for the browser session only — so leaving the Fees tab and coming back
// (or switching accounts and back) keeps each account's source, fees and connection.

const store = new Map<string, FeeTabState>();

export function loadFeeTabState(accountId: string, dealership: FeeSyncDealership): FeeTabState {
  const saved = store.get(accountId);
  return saved ? settleTransientPhase(saved) : initialFeeTabState(dealership);
}

export function storeFeeTabState(accountId: string, state: FeeTabState) {
  store.set(accountId, state);
}
