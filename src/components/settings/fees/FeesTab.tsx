import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '../../layout/Breadcrumbs';
import { SettingsNavPanelToggle } from '../SettingsNavPanel';
import { useSnackbar } from '../../../context/SnackbarContext';
import type { Account } from '../../../data/accounts';
import {
  FEE_SYNC_LIMITATIONS, FEE_SYNC_NOTIFICATION_PARAM, FEE_SYNC_NOTIFICATION_VALUE, getFeeSyncDealership,
  getFeeSyncDealershipOptions, mockConfirmDealership, mockRefreshFees,
} from '../../../data/feeSync';
import { ConfirmDealershipCard } from './ConfirmDealershipCard';
import { FeeButton } from './FeeButton';
import { FeeSimulationMenu } from './FeeSimulationMenu';
import { FeeSourceSelector } from './FeeSourceSelector';
import { FeeSyncConnectedCard } from './FeeSyncConnectedCard';
import { ManualFeesSection } from './ManualFeesSection';
import { SwitchSourceDialog } from './SwitchSourceDialog';
import {
  feeTabReducer, isConnectionLost, isManualDirty, loadFeeTabState, newManualFee, storeFeeTabState, visibleFeeSyncFees,
} from './feeTabState';
import type { FeeSource } from './feeTabState';

// Account Settings › Fees (CP-14705). Fee source is Manual or FeeSync; FeeSync is fully MOCKED — see
// `data/feeSync.ts`. Mount with `key={account.id}` so each account gets its own state.
// Pane layout sizes live here.
const PANE_PADDING_X = 16;
const CONTENT_GAP = 24;
const CONTENT_PADDING_BOTTOM = 24;
const TITLE_FONT_SIZE = 16;
const INTRO_FONT_SIZE = 12;
const FOOTER_PADDING = '12px 16px';
const FOOTER_GAP = 8;

interface FeesTabProps {
  account: Account;
  tabLabel: string;
}

export const FeesTab = ({ account, tabLabel }: FeesTabProps) => {
  const { showSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, dispatch] = useReducer(feeTabReducer, account, (a) => loadFeeTabState(a.id, getFeeSyncDealership(a)));
  const [switchTarget, setSwitchTarget] = useState<FeeSource | null>(null);
  const dealershipOptions = useMemo(() => getFeeSyncDealershipOptions(account), [account]);

  // Ignore mock responses that land after the tab unmounted.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { storeFeeTabState(account.id, state); }, [account.id, state]);

  // Arriving from the "Fees have been updated from FeeSync." notification: open straight into FeeSync.
  useEffect(() => {
    if (searchParams.get(FEE_SYNC_NOTIFICATION_PARAM) !== FEE_SYNC_NOTIFICATION_VALUE) return;
    dispatch({ type: 'openFromNotification', refreshedAt: new Date().toISOString() });
    const next = new URLSearchParams(searchParams);
    next.delete(FEE_SYNC_NOTIFICATION_PARAM);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const connectionLost = isConnectionLost(state);

  const confirmSwitch = (source: FeeSource) => {
    setSwitchTarget(null);
    dispatch({ type: 'switchSource', source });
  };

  const confirmDealership = async () => {
    dispatch({ type: 'confirmStart' });
    try {
      const pull = await mockConfirmDealership(state.dealership, { fail: state.simulateConfirmError });
      if (mounted.current) dispatch({ type: 'confirmSuccess', pull });
    } catch {
      if (mounted.current) dispatch({ type: 'confirmFail' });
    }
  };

  const refresh = async () => {
    dispatch({ type: 'refreshStart' });
    try {
      const pull = await mockRefreshFees(state.fees, state.dealership, { connectionLost });
      if (!mounted.current) return;
      dispatch({ type: 'refreshSuccess', pull });
      showSnackbar({ message: 'Fees updated.', duration: 4000 });
    } catch {
      if (!mounted.current) return;
      dispatch({ type: 'refreshFail' });
      showSnackbar({ message: 'Unable to pull fees from FeeSync.', duration: 4000 });
    }
  };

  const saveManual = () => {
    dispatch({ type: 'saveManual' });
    showSnackbar({ message: 'Fees saved.' });
  };

  const manualDirty = isManualDirty(state);
  const showFeeSyncConnected = state.phase === 'connected' || state.phase === 'refreshing';

  return (
    <div style={{
      flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontFamily: 'Roboto, sans-serif',
    }}>
      <div style={{ padding: `10px ${PANE_PADDING_X}px 0`, flexShrink: 0 }}>
        <Breadcrumbs items={['Settings', 'Accounts', account.name, tabLabel]} />
      </div>
      <div style={{ padding: `4px ${PANE_PADDING_X}px 8px`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SettingsNavPanelToggle />
        <h1 style={{ fontSize: TITLE_FONT_SIZE, fontWeight: 500, lineHeight: 1.5, color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
          {tabLabel}
        </h1>
        <FeeSimulationMenu
          confirmError={state.simulateConfirmError}
          connectionLost={state.simulateConnectionLost}
          rejectedUpdate={state.rejectedUpdate !== null}
          onConfirmErrorChange={(value) => dispatch({ type: 'setSimulateConfirmError', value })}
          onConnectionLostChange={(value) => dispatch({ type: 'setSimulateConnectionLost', value })}
          onRejectedUpdateChange={(value) => dispatch({ type: 'setSimulateRejectedUpdate', value, receivedAt: new Date().toISOString() })}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `0 ${PANE_PADDING_X}px ${CONTENT_PADDING_BOTTOM}px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: CONTENT_GAP }}>
          <p style={{ margin: 0, fontSize: INTRO_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: '#686576' }}>
            Configure the fees that will be used in offer pricing for this account.
          </p>

          <FeeSourceSelector value={state.source} onSelect={setSwitchTarget} />

          {state.source === 'manual' ? (
            <ManualFeesSection
              fees={state.draftManual}
              onAdd={(list) => dispatch({ type: 'addManualFee', list, fee: newManualFee() })}
              onUpdate={(list, id, patch) => dispatch({ type: 'updateManualFee', list, id, patch })}
              onRemove={(list, id) => dispatch({ type: 'removeManualFee', list, id })}
            />
          ) : showFeeSyncConnected ? (
            <FeeSyncConnectedCard
              dealership={state.dealership}
              fees={visibleFeeSyncFees(state)}
              refreshedAt={state.refreshedAt}
              refreshing={state.phase === 'refreshing'}
              connectionLost={connectionLost}
              limitations={FEE_SYNC_LIMITATIONS}
              rejectedUpdate={state.rejectedUpdate}
              onRefresh={refresh}
            />
          ) : (
            <ConfirmDealershipCard
              dealership={state.dealership}
              options={dealershipOptions}
              confirming={state.phase === 'confirming'}
              failed={state.phase === 'confirm-error'}
              onSelect={(dealership) => dispatch({ type: 'selectDealership', dealership })}
              onConfirm={confirmDealership}
            />
          )}
        </div>
      </div>

      {state.source === 'manual' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: FOOTER_GAP, padding: FOOTER_PADDING, flexShrink: 0 }}>
          <FeeButton variant="outlined" onClick={() => dispatch({ type: 'discardManual' })} disabled={!manualDirty}>Cancel</FeeButton>
          <FeeButton onClick={saveManual} disabled={!manualDirty}>Save</FeeButton>
        </div>
      )}

      <SwitchSourceDialog target={switchTarget} onCancel={() => setSwitchTarget(null)} onConfirm={confirmSwitch} />
    </div>
  );
};
