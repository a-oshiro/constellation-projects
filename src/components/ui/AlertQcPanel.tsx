import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { CreativeQcResult, DealQcResult, Offer } from '../../data/types';
import { CreativeQcTabContent } from './CreativeQcTabContent';
import { DealQcTabContent } from './DealQcTabContent';
import { PanelResizeHandle } from './PanelResizeHandle';

/**
 * Right panel showing this alert's automated, advisory-only QC results — two tabs, Creative QC (template
 * rendering checks) and Deal QC (offer-vs-baseline consistency checks). Opened via the warning-triangle
 * icon in the icon cluster, which is tinted amber whenever either tab has something to show.
 */

interface AlertQcPanelProps {
  creativeQc?: CreativeQcResult[];
  dealQc?: DealQcResult;
  offers: Offer[];
  onClose: () => void;
  panelWidth: number;
  onResizeHandleMouseDown: (e: React.MouseEvent) => void;
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '10px 8px',
  fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: active ? '#473bab' : '#686576',
  borderBottom: active ? '2px solid #473bab' : '2px solid transparent',
});

export const AlertQcPanel = ({ creativeQc, dealQc, offers, onClose, panelWidth, onResizeHandleMouseDown }: AlertQcPanelProps) => {
  const [tab, setTab] = useState<'creative' | 'deal'>('creative');

  return (
    <div style={{ position: 'relative', width: panelWidth, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PanelResizeHandle onMouseDown={onResizeHandleMouseDown} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>QC warnings</span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <button style={tabButtonStyle(tab === 'creative')} onClick={() => setTab('creative')}>Creative QC</button>
        <button style={tabButtonStyle(tab === 'deal')} onClick={() => setTab('deal')}>Deal QC</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        {tab === 'creative'
          ? <CreativeQcTabContent results={creativeQc ?? []} offers={offers} />
          : <DealQcTabContent dealQc={dealQc} offers={offers} />}
      </div>
    </div>
  );
};
