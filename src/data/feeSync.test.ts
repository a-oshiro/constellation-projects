import { describe, expect, it } from 'vitest';
import {
  FEE_SYNC_FEES, FEE_SYNC_UPDATED_FEES, FeeSyncError, buildFeeSyncUpdatedNotification, formatFeeAmount, formatRefreshTime,
  getFeeSyncDealership, mockConfirmDealership, mockConnectWithCode, mockRefreshFees,
} from './feeSync';

const dealership = getFeeSyncDealership({ id: 'acc-1', name: 'BMW of Manhattan', brand: 'BMW' });
const fast = { delayMs: 0 };

describe('FeeSync mock data', () => {
  it('matches the Figma fees', () => {
    expect(FEE_SYNC_FEES.map((f) => [f.name, formatFeeAmount(f.amount), f.offerTypes])).toEqual([
      ['Doc Fee', '$899.00', 'APR, Finance, Lease, Cash'],
      ['Electronic Filing Fee', '$50.00', 'Finance, Lease'],
      ['Tire & Battery Fee', '$5.00', 'APR, Finance, Lease, Cash'],
      ['Nitrogen Fill', '$199.00', 'APR, Finance, Lease, Cash'],
      ['Dealer Prep', '$595.00', 'APR, Finance, Cash'],
    ]);
    expect(FEE_SYNC_UPDATED_FEES.map((f) => f.treatment)).toEqual(['Standard', 'Standard', 'Standard', 'Optional', 'Standard', 'Excluded']);
    expect(FEE_SYNC_UPDATED_FEES.filter((f) => f.isNew).map((f) => f.name)).toEqual(['Doc Fee', 'Electronic Filing Fee']);
  });

  it('matches the dealership to the account', () => {
    expect(dealership).toMatchObject({ name: 'BMW of Manhattan', brand: 'BMW', zipCode: '10019' });
    expect(dealership.address).toContain('10019');
  });

  it('formats the refresh time like Figma', () => {
    expect(formatRefreshTime(new Date(2026, 10, 11, 9, 2).toISOString())).toBe('Nov 11, 2026 - 9:02 AM');
  });

  it('links the notification to the Fees tab', () => {
    const n = buildFeeSyncUpdatedNotification('acc-1', 'BMW of Manhattan');
    expect(n).toMatchObject({ source: 'Fees', title: 'Fees have been updated from FeeSync.', tags: ['Client Settings', 'BMW of Manhattan'] });
    expect(n.href).toBe('/settings/accounts/acc-1/fees?feesync=updated');
  });
});

describe('FeeSync mock requests', () => {
  it('confirms, or fails with error code 400 when simulated', async () => {
    await expect(mockConfirmDealership(dealership, fast)).resolves.toMatchObject({ dealership, fees: FEE_SYNC_FEES });
    await expect(mockConfirmDealership(dealership, { ...fast, fail: true })).rejects.toMatchObject({ code: 400 });
  });

  it('connects with any non-empty code', async () => {
    await expect(mockConnectWithCode('100100010010', dealership, fast)).resolves.toMatchObject({ fees: FEE_SYNC_FEES });
    await expect(mockConnectWithCode('  ', dealership, fast)).rejects.toBeInstanceOf(FeeSyncError);
  });

  it('refresh returns the same fees, and fails while the connection is lost', async () => {
    await expect(mockRefreshFees(FEE_SYNC_UPDATED_FEES, dealership, fast)).resolves.toMatchObject({ fees: FEE_SYNC_UPDATED_FEES });
    await expect(mockRefreshFees(FEE_SYNC_FEES, dealership, { ...fast, connectionLost: true })).rejects.toBeInstanceOf(FeeSyncError);
  });
});
