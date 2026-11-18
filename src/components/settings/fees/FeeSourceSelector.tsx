import { Radio } from '@mui/material';
import type { FeeSource } from './feeTabState';

// Figma "FeeSync V2 / Fee Source Selector": two 256px radio cards. Selected = 2px primary border;
// unselected = 1px divider border (its padding grows by 1px so the content doesn't shift). Sizes live here.
const CARD_WIDTH = 256;
const CARD_GAP = 12;
const CARD_RADIUS = 8;
const CARD_PADDING = { top: 7, right: 16, bottom: 16, left: 7 };
const LABEL_FONT_SIZE = 14;
const DESCRIPTION_FONT_SIZE = 11;
const TEXT_PADDING_TOP = 8;

const OPTIONS: { value: FeeSource; label: string; description: string[] }[] = [
  { value: 'manual', label: 'Manual', description: ['Use fees entered manually in', 'Constellation Platform.'] },
  { value: 'feesync', label: 'FeeSync', description: ['Use fees from FeeSync.'] },
];

interface FeeSourceSelectorProps {
  value: FeeSource;
  /** Called with the option the user picked; the parent confirms before actually switching. */
  onSelect: (source: FeeSource) => void;
}

export const FeeSourceSelector = ({ value, onSelect }: FeeSourceSelectorProps) => (
  <div role="radiogroup" aria-label="Fee source" style={{ display: 'flex', gap: CARD_GAP, flexWrap: 'wrap' }}>
    {OPTIONS.map((o) => (
      <FeeSourceOption key={o.value} {...o} selected={o.value === value} onSelect={() => o.value !== value && onSelect(o.value)} />
    ))}
  </div>
);

interface FeeSourceOptionProps {
  value: FeeSource;
  label: string;
  description: string[];
  selected: boolean;
  onSelect: () => void;
}

const FeeSourceOption = ({ value, label, description, selected, onSelect }: FeeSourceOptionProps) => {
  const border = selected ? 2 : 1;
  const extra = 2 - border;
  // The whole card is the <label>, wrapping the radio input, so clicking anywhere on it selects it.
  return (
    <label
      className={selected ? '' : 'hover:bg-[#f4f5f6]'}
      style={{
        display: 'flex', alignItems: 'flex-start', width: CARD_WIDTH, boxSizing: 'border-box', cursor: 'pointer',
        borderRadius: CARD_RADIUS, border: `${border}px solid ${selected ? '#473bab' : 'rgba(0,0,0,0.12)'}`,
        padding: `${CARD_PADDING.top + extra}px ${CARD_PADDING.right + extra}px ${CARD_PADDING.bottom + extra}px ${CARD_PADDING.left + extra}px`,
      }}
    >
      <Radio size="small" checked={selected} onChange={onSelect} value={value} name="fee-source" slotProps={{ input: { 'aria-label': label } }} />
      <span style={{ display: 'flex', flexDirection: 'column', paddingTop: TEXT_PADDING_TOP, fontFamily: 'Roboto, sans-serif' }}>
        <span style={{ fontSize: LABEL_FONT_SIZE, lineHeight: 1.5, letterSpacing: '0.15px', color: '#1f1d25' }}>{label}</span>
        {description.map((line) => (
          <span key={line} style={{ fontSize: DESCRIPTION_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: '#686576' }}>{line}</span>
        ))}
      </span>
    </label>
  );
};
