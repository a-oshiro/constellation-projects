import { describe, expect, it } from 'vitest';
import {
  FEE_SYNC_FEES, FEE_SYNC_FEES_EXTENDED, FEE_SYNC_UPDATED_FEES, getFeeSyncDealership,
} from '../../../data/feeSync';
import type { FeeSyncPull } from '../../../data/feeSync';
import {
  feeTabReducer, initialFeeTabState, isConnectionLost, isManualDirty, loadFeeTabState, newManualFee,
  settleTransientPhase, storeFeeTabState, visibleFeeSyncFees,
} from './feeTabState';
import type { FeeTabAction, FeeTabState } from './feeTabState';

const dealership = getFeeSyncDealership({ id: 'acc-1', name: 'BMW of Manhattan', brand: 'BMW' });
const pull: FeeSyncPull = { dealership, fees: FEE_SYNC_FEES, refreshedAt: '2026-11-11T14:02:00.000Z' };
const run = (actions: FeeTabAction[], start: FeeTabState = initialFeeTabState(dealership)) => actions.reduce(feeTabReducer, start);

describe('feeTabReducer', () => {
  it('starts on Manual with the Figma Doc Fee and nothing pulled', () => {
    const s = initialFeeTabState(dealership);
    expect(s.source).toBe('manual');
    expect(s.phase).toBe('identify');
    expect(s.draftManual.dealerFees).toMatchObject([{ name: 'Doc Fee', amount: '175.00', appliesTo: 'All offer types' }]);
    expect(s.draftManual.optionalFees).toEqual([]);
  });

  it('confirms the dealership and shows the pulled fees', () => {
    const s = run([{ type: 'switchSource', source: 'feesync' }, { type: 'confirmStart' }]);
    expect(s.phase).toBe('confirming');
    const done = feeTabReducer(s, { type: 'confirmSuccess', pull });
    expect(done.phase).toBe('connected');
    expect(done.fees).toBe(FEE_SYNC_FEES);
    expect(done.refreshedAt).toBe(pull.refreshedAt);
  });

  it('lands on the error state when confirming fails, and can retry', () => {
    const failed = run([{ type: 'confirmStart' }, { type: 'confirmFail' }]);
    expect(failed.phase).toBe('confirm-error');
    expect(feeTabReducer(failed, { type: 'confirmStart' }).phase).toBe('confirming');
  });

  it('shows and clears the confirm error right away from the simulation toggle', () => {
    const on = run([{ type: 'setSimulateConfirmError', value: true }]);
    expect(on.phase).toBe('confirm-error');
    expect(feeTabReducer(on, { type: 'setSimulateConfirmError', value: false }).phase).toBe('identify');
  });

  it('the confirm error toggle drops a connected FeeSync back to the failed confirm screen', () => {
    const s = run([{ type: 'confirmSuccess', pull }, { type: 'setSimulateConfirmError', value: true }]);
    expect(s.phase).toBe('confirm-error');
  });

  it('refresh keeps the same fees and updates the time', () => {
    const connected = run([{ type: 'confirmSuccess', pull }]);
    const refreshing = feeTabReducer(connected, { type: 'refreshStart' });
    expect(refreshing.phase).toBe('refreshing');
    const later = { ...pull, refreshedAt: '2026-11-17T10:00:00.000Z' };
    const done = feeTabReducer(refreshing, { type: 'refreshSuccess', pull: later });
    expect(done.fees).toEqual(FEE_SYNC_FEES);
    expect(done.refreshedAt).toBe(later.refreshedAt);
  });

  it('only refreshes while connected', () => {
    expect(run([{ type: 'refreshStart' }]).phase).toBe('identify');
  });

  it('connection lost only applies once connected, and shows the extended fee list', () => {
    const lostBeforeConnect = run([{ type: 'setSimulateConnectionLost', value: true }]);
    expect(isConnectionLost(lostBeforeConnect)).toBe(false);
    const lost = feeTabReducer(lostBeforeConnect, { type: 'confirmSuccess', pull });
    expect(isConnectionLost(lost)).toBe(true);
    expect(visibleFeeSyncFees(lost)).toBe(FEE_SYNC_FEES_EXTENDED);
  });

  it('opening from the notification jumps to FeeSync with the updated fees', () => {
    const s = run([{ type: 'openFromNotification', refreshedAt: pull.refreshedAt }]);
    expect(s.source).toBe('feesync');
    expect(s.phase).toBe('connected');
    expect(s.fees).toBe(FEE_SYNC_UPDATED_FEES);
  });

  it('tracks manual edits as a draft until saved or discarded', () => {
    const fee = newManualFee('Title Fee', '25');
    const edited = run([{ type: 'addManualFee', list: 'optionalFees', fee }]);
    expect(isManualDirty(edited)).toBe(true);
    expect(isManualDirty(feeTabReducer(edited, { type: 'saveManual' }))).toBe(false);
    const discarded = feeTabReducer(edited, { type: 'discardManual' });
    expect(discarded.draftManual.optionalFees).toEqual([]);

    const updated = feeTabReducer(edited, { type: 'updateManualFee', list: 'optionalFees', id: fee.id, patch: { amount: '30' } });
    expect(updated.draftManual.optionalFees[0].amount).toBe('30');
    expect(feeTabReducer(updated, { type: 'removeManualFee', list: 'optionalFees', id: fee.id }).draftManual.optionalFees).toEqual([]);
  });
});

describe('session store', () => {
  it('restores per account and settles in-flight phases', () => {
    const confirming = run([{ type: 'switchSource', source: 'feesync' }, { type: 'confirmStart' }]);
    storeFeeTabState('acc-test', confirming);
    const restored = loadFeeTabState('acc-test', dealership);
    expect(restored.source).toBe('feesync');
    expect(restored.phase).toBe('identify');
    expect(loadFeeTabState('acc-other', dealership).source).toBe('manual');
  });

  it('settles a refresh back to connected', () => {
    const refreshing = run([{ type: 'confirmSuccess', pull }, { type: 'refreshStart' }]);
    expect(settleTransientPhase(refreshing).phase).toBe('connected');
  });
});

describe('rejected FeeSync update', () => {
  it('is set and cleared by the simulation toggle', () => {
    const on = run([{ type: 'setSimulateRejectedUpdate', value: true, receivedAt: '2026-11-11T14:02:00.000Z' }]);
    expect(on.rejectedUpdate).toMatchObject({ feeName: 'Doc Fee', receivedAt: '2026-11-11T14:02:00.000Z' });
    expect(feeTabReducer(on, { type: 'setSimulateRejectedUpdate', value: false, receivedAt: '' }).rejectedUpdate).toBeNull();
  });

  it('comes with the "fees updated" notification', () => {
    const s = run([{ type: 'openFromNotification', refreshedAt: '2026-11-11T14:02:00.000Z' }]);
    expect(s.rejectedUpdate?.receivedAt).toBe('2026-11-11T14:02:00.000Z');
  });
});
