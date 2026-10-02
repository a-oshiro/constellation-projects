import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { CreativeQcResult, DealQcResult, Offer, QcFinding } from '../../data/types';
import { creativeQcHasWarning, QC_FLASH_MS, type QcFocusRequest, type QcTab } from '../../utils/alertQc';
import { scrollElementIntoViewCentered } from '../../utils/smoothScroll';
import { CreativeQcTabContent } from './CreativeQcTabContent';
import { DealQcTabContent } from './DealQcTabContent';
import { PanelResizeHandle } from './PanelResizeHandle';

/**
 * Right panel showing this alert's automated, advisory-only QC results — two tabs, Creative QC (template
 * rendering checks, one container per asset) and Deal QC (structured findings + offer-vs-baseline checks,
 * one container per offer). Opened via the warning-triangle icon in the icon cluster, or by clicking a QC
 * tag on an asset or an Offer Card — which lands on that tag's tab and scrolls to (and flashes) its warning.
 */

interface AlertQcPanelProps {
  creativeQc?: CreativeQcResult[];
  dealQc?: DealQcResult;
  qcFindings: QcFinding[];
  offers: Offer[];
  /** Timestamp shown on synthesized all-passed Creative QC results. */
  fallbackCheckedAt: number;
  focusRequest?: QcFocusRequest | null;
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

export const AlertQcPanel = ({ creativeQc, dealQc, qcFindings, offers, fallbackCheckedAt, focusRequest, onClose, panelWidth, onResizeHandleMouseDown }: AlertQcPanelProps) => {
  // Opens on the tab a focus request asks for; otherwise on whichever tab has something to review.
  const [tab, setTab] = useState<QcTab>(() => {
    if (focusRequest) return focusRequest.tab;
    if ((creativeQc ?? []).some(creativeQcHasWarning)) return 'creative';
    if (qcFindings.length > 0 || dealQc?.offers.some((o) => o.mismatchedFields.length > 0)) return 'deal';
    return 'creative';
  });
  const [flashKey, setFlashKey] = useState<string | null>(focusRequest?.key ?? null);
  const [seenToken, setSeenToken] = useState(focusRequest?.token);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A new focus request (even for the same tag) switches to its tab and flashes its warning — adjusted
  // during render rather than in an effect, so the right tab is what mounts.
  if (focusRequest && focusRequest.token !== seenToken) {
    setSeenToken(focusRequest.token);
    setTab(focusRequest.tab);
    setFlashKey(focusRequest.key);
  }

  // Once the requested tab is mounted, scroll its warning into view — once per request, so switching tabs
  // by hand afterwards doesn't yank the scroll back. The highlight clears after 2s.
  const scrolledTokenRef = useRef<number | null>(null);
  useEffect(() => {
    if (!focusRequest || tab !== focusRequest.tab || scrolledTokenRef.current === focusRequest.token) return;
    scrolledTokenRef.current = focusRequest.token;
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>(`[data-qc-key="${focusRequest.key}"]`);
    if (container && target) scrollElementIntoViewCentered(container, target);
  }, [focusRequest, tab]);

  useEffect(() => {
    if (!flashKey) return;
    const t = setTimeout(() => setFlashKey(null), QC_FLASH_MS);
    return () => clearTimeout(t);
  }, [flashKey, seenToken]);

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

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
        {tab === 'creative'
          ? <CreativeQcTabContent results={creativeQc ?? []} offers={offers} fallbackCheckedAt={fallbackCheckedAt} flashKey={flashKey} />
          : <DealQcTabContent dealQc={dealQc} findings={qcFindings} offers={offers} flashKey={flashKey} />}
      </div>
    </div>
  );
};
