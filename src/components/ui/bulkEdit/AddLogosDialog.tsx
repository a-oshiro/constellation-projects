import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, Checkbox, IconButton } from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import type { LogoSlot, ProjectLogo } from '../../../data/projectDefaults';

const FONT = 'Roboto, sans-serif';
const PURPLE = '#473bab';

const TYPE_BADGE: Record<LogoSlot, { label: string; bg: string; color: string }> = {
  'Primary Logo': { label: 'Primary', bg: '#e3f0fd', color: '#1565c0' },
  'Secondary Logo': { label: 'Secondary', bg: '#ede7f6', color: '#5e35b1' },
  'Event Logo': { label: 'Event', bg: '#fff0e0', color: '#c45500' },
};

const Tag = ({ children }: { children: string }) => (
  <span style={{ fontSize: 12, fontFamily: FONT, color: '#4b4958', background: '#f0f2f4', borderRadius: 8, padding: '2px 10px' }}>{children}</span>
);

interface Props {
  /** The logos on offer: those the selection does not carry yet. */
  logos: ProjectLogo[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}

/** Full-screen picker over the logo library, 16px from every edge of the viewport. */
export const AddLogosDialog = ({ logos, onClose, onAdd }: Props) => {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const visible = useMemo(() => logos.filter((l) => l.name.toLowerCase().includes(query.trim().toLowerCase())), [logos, query]);
  const allVisiblePicked = visible.length > 0 && visible.every((l) => picked.has(l.id));
  const toggle = (id: string) => setPicked((prev) => {
    const next = new Set(prev);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const toggleVisible = () => setPicked((prev) => {
    const next = new Set(prev);
    visible.forEach((l) => (allVisiblePicked ? next.delete(l.id) : next.add(l.id)));
    return next;
  });

  return ReactDOM.createPortal(
    <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100004, background: 'rgba(0,0,0,0.4)' }} />
    <div role="dialog" aria-label="Add Logos" style={{
      position: 'fixed', inset: 16, zIndex: 100005, background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 4px 20px' }}>
        <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>Add Logos</h2>
        <IconButton size="small" aria-label="Close" onClick={onClose}><Close style={{ fontSize: 20 }} /></IconButton>
      </div>

      <div style={{ flex: 1, minHeight: 0, margin: '0 12px', border: '1px solid #e7e7e9', borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px 0', fontSize: 12, fontFamily: FONT, color: '#686576' }}>
          Portal <span style={{ margin: '0 6px' }}>›</span> Brand Kits <span style={{ margin: '0 6px' }}>›</span> <span style={{ color: '#1f1d25' }}>BMW</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 480, maxWidth: '50%', height: 36, padding: '0 14px', border: '1px solid #cfcbd9', borderRadius: 100 }}>
            <Search style={{ fontSize: 20, color: '#686576' }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search" aria-label="Search logos"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, fontFamily: FONT, background: 'transparent' }} />
          </div>
          <div style={{ flex: 1 }} />
          <Button size="small" onClick={toggleVisible} disabled={visible.length === 0}
            sx={{ textTransform: 'none', fontSize: 13, fontWeight: 500, color: PURPLE }}>
            {allVisiblePicked ? 'Clear Visible' : 'Select Visible'}
          </Button>
          <span style={{ fontSize: 12, fontFamily: FONT, color: '#686576', whiteSpace: 'nowrap' }}>{visible.length} / {logos.length} Items</span>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 16px' }}>
          {logos.length === 0 ? (
            <p style={{ margin: '24px 0', fontSize: 14, fontFamily: FONT, color: '#1f1d25' }}>Every logo is already on the list.</p>
          ) : visible.length === 0 ? (
            <p style={{ margin: '24px 0', fontSize: 14, fontFamily: FONT, color: '#1f1d25' }}>No logos match this search.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {visible.map((l) => {
                const on = picked.has(l.id);
                const badge = TYPE_BADGE[l.slot];
                return (
                  <div key={l.id} style={{ minWidth: 0 }}>
                    <div onClick={() => toggle(l.id)} style={{
                      position: 'relative', height: 220, borderRadius: 8, background: '#f0f2f4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: on ? `2px solid ${PURPLE}` : '1px solid #e7e7e9', boxSizing: 'border-box', overflow: 'hidden',
                    }}>
                      {l.src && <img src={l.src} alt="" style={{ maxWidth: '78%', maxHeight: '78%', objectFit: 'contain' }} />}
                      <Checkbox size="small" checked={on} onChange={() => toggle(l.id)} onClick={(e) => e.stopPropagation()}
                        slotProps={{ input: { 'aria-label': `Select ${l.name}` } }}
                        sx={{ position: 'absolute', top: 2, left: 2, color: '#686576', '&.Mui-checked': { color: PURPLE } }} />
                      <span style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 11, fontFamily: FONT, fontWeight: 500, color: badge.color, background: badge.bg, borderRadius: 100, padding: '1px 8px' }}>{badge.label}</span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 14, fontFamily: FONT, color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.name}>{l.name}</div>
                    <div style={{ fontSize: 12, fontFamily: FONT, color: '#686576' }}>{l.format} <span style={{ margin: '0 4px' }}>|</span> {l.width} x {l.height}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><Tag>logo</Tag><Tag>BMW</Tag></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: '12px 20px' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 500, color: PURPLE }}>Cancel</Button>
        <Button variant="contained" disableElevation disabled={picked.size === 0} onClick={() => onAdd([...picked])}
          sx={{ borderRadius: '100px', textTransform: 'none', background: PURPLE, '&:hover': { background: '#3d3396' }, px: 3 }}>
          {picked.size > 0 ? `Add ${picked.size}` : 'Add'}
        </Button>
      </div>
    </div>
    </>,
    document.body,
  );
};
