import { IconButton } from '@mui/material';
import crossSmallIcon from '../../../assets/icons/fees/cross-small-row.svg';
import { FeeTextField } from './FeeTextField';
import { FeeSelectField } from './FeeSelectField';
import { APPLIES_TO_OPTIONS } from './feeTabState';
import type { ManualFee } from './feeTabState';

// Figma "FeeSync / Fee Row": Fee name (320) · Amount (180) · Applies to (200) · remove ✕. Sizes live here.
const NAME_WIDTH = 320;
const AMOUNT_WIDTH = 180;
const APPLIES_TO_WIDTH = 200;
const GAP = 8;
const REMOVE_ICON_SIZE = 24;
const REMOVE_PADDING = 8;
/** Lines the ✕ up with the inputs, below their labels. */
const REMOVE_OFFSET_TOP = 12;

interface ManualFeeRowProps {
  fee: ManualFee;
  onChange: (patch: Partial<Omit<ManualFee, 'id'>>) => void;
  onRemove: () => void;
}

export const ManualFeeRow = ({ fee, onChange, onRemove }: ManualFeeRowProps) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: GAP, flexWrap: 'wrap' }}>
    <FeeTextField
      id={`${fee.id}-name`}
      label="Fee name"
      value={fee.name}
      onChange={(name) => onChange({ name })}
      width={NAME_WIDTH}
    />
    <FeeTextField
      id={`${fee.id}-amount`}
      label="Amount"
      value={fee.amount}
      // Digits and one decimal point only; the value stays as typed.
      onChange={(amount) => { if (/^\d*\.?\d{0,2}$/.test(amount)) onChange({ amount }); }}
      prefix="$"
      placeholder="0.00"
      inputMode="decimal"
      width={AMOUNT_WIDTH}
    />
    <FeeSelectField
      id={`${fee.id}-applies-to`}
      label="Applies to"
      value={fee.appliesTo}
      options={APPLIES_TO_OPTIONS}
      onChange={(appliesTo) => onChange({ appliesTo })}
      width={APPLIES_TO_WIDTH}
    />
    <IconButton
      aria-label={`Remove ${fee.name || 'fee'}`}
      onClick={onRemove}
      sx={{ padding: `${REMOVE_PADDING}px`, marginTop: `${REMOVE_OFFSET_TOP}px` }}
    >
      <img src={crossSmallIcon} alt="" width={REMOVE_ICON_SIZE} height={REMOVE_ICON_SIZE} />
    </IconButton>
  </div>
);
