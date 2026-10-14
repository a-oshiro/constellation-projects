import { useState } from 'react';
import { Checkbox } from '@mui/material';
import { Search, Close, Add, FolderOutlined, Refresh, GridViewOutlined, InfoOutlined, PlayArrow, ShoppingCartOutlined } from '@mui/icons-material';

/** One thing on offer in the picker: how its card reads. */
export interface PickerItem {
  id: string;
  title: string;
  /** The dimensions and kind line, in the small secondary style. */
  subtitle: string;
  /** The picture, and the proportions of the frame it fills within the square thumbnail. */
  preview: { src: string; width: number; height: number; video?: boolean };
  tags: string[];
  folder: string;
  /** Who it reaches, when that varies. */
  note?: { text: string; partial: boolean };
  /** Which filter chip it answers to. */
  group: string;
}

const FONT = 'Roboto, sans-serif';
const PURPLE = '#473bab';

function ToolbarIconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', color: '#686576' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}>
      {children}
    </button>
  );
}

function PickerCard({ item, selected, onSelect }: { item: PickerItem; selected: boolean; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const { preview } = item;
  const wide = preview.width >= preview.height;
  return (
    <div onClick={() => onSelect(item.id)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#f6f7f8', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: selected ? `2px solid ${PURPLE}` : hovered ? `1.5px solid ${PURPLE}` : '1px solid #e0e0e0', transition: 'border 0.12s',
      }}>
        <div style={{
          position: 'relative', width: wide ? '100%' : `${(preview.width / preview.height) * 100}%`, height: wide ? `${(preview.height / preview.width) * 100}%` : '100%',
          flexShrink: 0, background: `#e8eaed url(${preview.src}) center / cover`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {preview.video && (
            <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(20,18,30,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlayArrow style={{ fontSize: 22, color: '#fff' }} />
            </span>
          )}
        </div>
        <div style={{ position: 'absolute', top: 2, left: 2, zIndex: 3 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 13, height: 13, background: 'white', borderRadius: 1 }} />
          <Checkbox checked={selected} onChange={() => onSelect(item.id)} size="small" slotProps={{ input: { 'aria-label': `Select ${item.title}` } }}
            sx={{ padding: '5px', position: 'relative', '& .MuiSvgIcon-root': { fontSize: 18, color: selected ? PURPLE : 'rgba(0,0,0,0.54)' } }} />
        </div>
      </div>
      <div style={{ paddingTop: 6, paddingBottom: 2 }}>
        <p style={{ margin: 0, fontSize: 12, fontFamily: FONT, fontWeight: 500, color: '#1f1d25', lineHeight: 1.43, letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>{item.title}</p>
        <p style={{ margin: '1px 0 0', fontSize: 11, fontFamily: FONT, color: '#686576', lineHeight: 1.5, letterSpacing: '0.4px' }}>{item.subtitle}</p>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
          {item.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, fontFamily: FONT, color: '#686576', background: '#f0f2f4', borderRadius: 4, padding: '1px 5px' }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
          <FolderOutlined style={{ fontSize: 13, color: '#686576' }} />
          <span style={{ fontSize: 11, fontFamily: FONT, color: '#686576', letterSpacing: '0.4px' }}>{item.folder}</span>
        </div>
        {item.note && (
          <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: FONT, letterSpacing: '0.4px', color: item.note.partial ? '#8a4b00' : '#1b6b3a' }}>{item.note.text}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  title: string;
  items: PickerItem[];
  /** The label of the filter chips, which narrow the list by each item's group. */
  filterLabel: string;
  info: string;
  emptyText: string;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  /** Fills the viewport, this many px from every side. */
  inset?: number;
  zIndex?: number;
}

/** The Add Templates dialog's layout, over whatever the portal has to offer. */
export function PortalPickerDialog({ title, items, filterLabel, info, emptyText, onClose, onAdd, inset = 16, zIndex = 100005 }: Props) {
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());

  const groups = [...new Set(items.map((o) => o.group))];
  const filtered = items.filter((o) => o.title.toLowerCase().includes(search.toLowerCase()) && !hidden.has(o.group));
  const toggle = (id: string) => setPicked((prev) => { const next = new Set(prev); if (!next.delete(id)) next.add(id); return next; });
  const selectVisible = () => setPicked((prev) => { const next = new Set(prev); filtered.forEach((o) => next.add(o.id)); return next; });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', inset, background: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
      }}>
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontFamily: FONT, fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontFamily: FONT, color: PURPLE, cursor: 'pointer' }}>Portal</span>
            <span style={{ fontSize: 13, color: '#9c99a9' }}>›</span>
            <span style={{ fontSize: 13, fontFamily: FONT, color: '#1f1d25' }}>Recents</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ToolbarIconBtn><FolderOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>
            <div style={{ position: 'relative' }}>
              <ToolbarIconBtn><ShoppingCartOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>
              {picked.size > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, background: PURPLE, color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, fontFamily: FONT, pointerEvents: 'none' }}>{picked.size}</span>
              )}
            </div>
            <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 5, background: PURPLE, color: 'white', border: 'none', borderRadius: 100, padding: '5px 14px', fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.46px', lineHeight: '22px' }}>
              <Add style={{ fontSize: 18 }} />New
            </button>
            <div style={{ position: 'relative', minWidth: 200, maxWidth: 320, flex: 1 }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9c99a9', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="search" aria-label={`Search ${title}`}
                style={{ width: '100%', height: 34, paddingLeft: 34, paddingRight: search ? 30 : 12, border: '1px solid #cac9cf', borderRadius: 100, fontSize: 13, fontFamily: FONT, color: '#1f1d25', outline: 'none', boxSizing: 'border-box', background: '#f9fafa' }} />
              {search && (
                <button type="button" aria-label="Clear search" onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                  <Close style={{ fontSize: 15, color: '#9c99a9' }} />
                </button>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={selectVisible} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: FONT, fontWeight: 500, color: PURPLE, letterSpacing: '0.46px' }}>Select Visible</button>
            <span style={{ fontSize: 12, fontFamily: FONT, color: '#686576', whiteSpace: 'nowrap', letterSpacing: '0.4px' }}>{filtered.length} / {items.length} Items</span>
            <ToolbarIconBtn><GridViewOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>
            <ToolbarIconBtn><Refresh style={{ fontSize: 20 }} /></ToolbarIconBtn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontFamily: FONT, color: '#686576' }}>{filterLabel}</span>
            {groups.map((group) => {
              const on = !hidden.has(group);
              return (
                <button key={group} type="button" aria-pressed={on}
                  onClick={() => setHidden((prev) => { const next = new Set(prev); if (!next.delete(group)) next.add(group); return next; })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', cursor: 'pointer', borderRadius: 100, padding: '2px 8px', fontSize: 12, fontFamily: FONT, background: on ? '#e8eaed' : '#fff', color: on ? '#1f1d25' : '#9c99a9', outline: on ? 'none' : '1px dashed #cac9cf' }}>
                  {group}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#e8f4fd', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
            <InfoOutlined style={{ fontSize: 18, color: '#0277bd', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontFamily: FONT, color: '#01579b', letterSpacing: '0.17px' }}>{info}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#686576', fontFamily: FONT, fontSize: 14 }}>{emptyText}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {filtered.map((o) => <PickerCard key={o.id} item={o} selected={picked.has(o.id)} onSelect={toggle} />)}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 24px', borderTop: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontSize: 14, fontFamily: FONT, fontWeight: 500, color: PURPLE, letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}>Cancel</button>
          <button type="button" disabled={picked.size === 0} onClick={() => onAdd([...picked])}
            style={{ background: picked.size > 0 ? PURPLE : 'rgba(0,0,0,0.12)', border: 'none', cursor: picked.size > 0 ? 'pointer' : 'default', padding: '6px 16px', fontSize: 14, fontFamily: FONT, fontWeight: 500, color: picked.size > 0 ? '#fff' : 'rgba(0,0,0,0.26)', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
