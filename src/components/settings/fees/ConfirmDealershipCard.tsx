import type { FeeSyncDealership } from '../../../data/feeSync';
import { FeeButton } from './FeeButton';
import { FeeNotice, NoticeLink } from './FeeNotice';
import { FeeSectionCard } from './FeeSectionCard';

// Figma Flow 1 "We identified this FeeSync account" + "Connection Fails": the matched dealership
// (name · brand · ZIP), Confirm Dealership (inline spinner while confirming) and Connect With Code.
// Sizes live here.
const NAME_COL_WIDTH = 320;
const BRAND_COL_WIDTH = 160;
const ROW_HEIGHT = 48;
const CELL_PADDING = '6px 12px';
const HEADER_FONT_SIZE = 14;
const CELL_FONT_SIZE = 12;
const ACTIONS_GAP = 8;

interface ConfirmDealershipCardProps {
  dealership: FeeSyncDealership;
  confirming: boolean;
  /** Shows the "FeeSync connection failed" banner (Figma "Connection Fails"). */
  failed: boolean;
  errorCode?: number;
  onConfirm: () => void;
  onConnectWithCode: () => void;
}

export const ConfirmDealershipCard = ({ dealership, confirming, failed, errorCode = 400, onConfirm, onConnectWithCode }: ConfirmDealershipCardProps) => {
  const cell = (width?: number) => ({
    display: 'flex', alignItems: 'center', padding: CELL_PADDING, boxSizing: 'border-box' as const,
    ...(width ? { width, flexShrink: 0 } : { flex: 1, minWidth: 0 }),
  });
  const headerText = { fontSize: HEADER_FONT_SIZE, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.17px', color: '#1f1d25' };
  const cellText = { fontSize: CELL_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const };

  return (
    <FeeSectionCard
      title="We identified this FeeSync account:"
      description="Confirm this is your account. If not, you can enter your FeeSync ID to connect."
      descriptionSize="body2"
    >
      {failed && (
        <FeeNotice tone="error">
          FeeSync connection failed. Please try again in a few minutes. <NoticeLink>See details</NoticeLink> (Error code: {errorCode})
        </FeeNotice>
      )}

      <div role="table" aria-label="Identified FeeSync dealership" style={{ width: '100%', fontFamily: 'Roboto, sans-serif' }}>
        <div role="row" style={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
          <span role="columnheader" style={{ ...cell(NAME_COL_WIDTH), ...headerText }}>Dealership Name</span>
          <span role="columnheader" style={{ ...cell(BRAND_COL_WIDTH), ...headerText }}>Brand</span>
          <span role="columnheader" style={{ ...cell(), ...headerText }}>ZIP Code</span>
        </div>
        <div role="row" style={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center' }}>
          <span role="cell" style={cell(NAME_COL_WIDTH)}><span style={cellText}>{dealership.name}</span></span>
          <span role="cell" style={cell(BRAND_COL_WIDTH)}><span style={cellText}>{dealership.brand}</span></span>
          <span role="cell" style={cell()}><span style={cellText}>{dealership.zipCode}</span></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: ACTIONS_GAP, flexWrap: 'wrap' }}>
        <FeeButton onClick={onConfirm} loading={confirming}>Confirm Dealership</FeeButton>
        <FeeButton variant="text" onClick={onConnectWithCode} disabled={confirming}>Not Your Dealership? Connect With Code</FeeButton>
      </div>
    </FeeSectionCard>
  );
};
