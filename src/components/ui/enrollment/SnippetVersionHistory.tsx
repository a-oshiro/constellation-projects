import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { Add, ExpandLess, ExpandMore, Search } from '@mui/icons-material';
import type { DisclosureSnippetVersion } from '../../../data/enrollmentSettings';

/**
 * The snippet dialog's "History" side tab (Figma: "Version History"): every saved version, newest first,
 * grouped by day. Clicking one views it in the editor; the newest is tagged "Current" and the one being
 * viewed "Viewing". The + button saves the dialog's unsaved edits as a new version (same as Save).
 */

interface SnippetVersionHistoryProps {
  versions: DisclosureSnippetVersion[];
  currentVersionId: string | undefined;
  /** The previous version shown in the editor, if any — null while the current one is shown. */
  viewingVersionId: string | null;
  onSelect: (versionId: string) => void;
  canSaveVersion: boolean;
  onSaveVersion: () => void;
  /** Same z-index bump the dialog gives its other tooltips. */
  popperSlotProps: { popper: { sx: { zIndex: number } } };
}

const FONT = 'Roboto, sans-serif';

const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    background: '#ffffff', fontSize: 13, fontFamily: FONT, borderRadius: 100,
    '& fieldset': { borderColor: '#cac9cf' },
    '&:hover fieldset': { borderColor: '#9b96b0' },
    '&.Mui-focused fieldset': { borderColor: '#473bab' },
  },
};

const META_TEXT_STYLE: CSSProperties = { fontSize: 11, fontFamily: FONT, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

function dayLabel(date: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

/** "Just now" / "12:43 PM" today, "Jan 13th, 12:43 PM" on earlier days — the Figma list's timestamps. */
function timeLabel(date: Date, now: Date): string {
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (startOfDay(date) !== startOfDay(now)) {
    return `${date.toLocaleDateString('en-US', { month: 'short' })} ${ordinal(date.getDate())}, ${time}`;
  }
  return now.getTime() - date.getTime() < 60_000 ? 'Just now' : time;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/** Tiny page-shaped preview, standing in for Figma's version thumbnail. */
const VersionThumbnail = () => (
  <div style={{
    width: 40, height: 48, flexShrink: 0, boxSizing: 'border-box', padding: '7px 5px', borderRadius: 4,
    border: '1px solid rgba(0,0,0,0.12)', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 3,
  }}>
    {[100, 85, 100, 60, 90, 70].map((w, i) => (
      <span key={i} style={{ display: 'block', height: 2, width: `${w}%`, background: '#d9d8de', borderRadius: 1 }} />
    ))}
  </div>
);

const Badge = ({ label, filled }: { label: string; filled: boolean }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 6,
    fontSize: 10, fontFamily: FONT, letterSpacing: '0.16px',
    background: filled ? '#6356e1' : 'rgba(17,16,20,0.08)', color: filled ? '#ffffff' : '#1f1d25',
  }}>
    {label}
  </span>
);

export function SnippetVersionHistory({
  versions, currentVersionId, viewingVersionId, onSelect, canSaveVersion, onSaveVersion, popperSlotProps,
}: SnippetVersionHistoryProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const now = new Date();

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result: Array<{ label: string; items: DisclosureSnippetVersion[] }> = [];
    for (const version of [...versions].reverse()) {
      const date = new Date(version.createdAt);
      const searchable = `${version.name} ${version.createdBy} ${timeLabel(date, now)} ${dayLabel(date, now)}`.toLowerCase();
      if (term && !searchable.includes(term)) continue;
      const label = dayLabel(date, now);
      const group = result.find((g) => g.label === label);
      if (group) group.items.push(version);
      else result.push({ label, items: [version] });
    }
    return result;
  // `now` changes every render; the labels only need refreshing when the list or search does.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versions, search]);

  const toggleGroup = (label: string) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    return next;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>Version History</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={FIELD_SX}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#686576' }} /></InputAdornment> } }}
        />
        <Tooltip title={canSaveVersion ? 'Save changes as a new version' : 'No unsaved changes'} slotProps={popperSlotProps}>
          <span>
            <IconButton
              aria-label="Save changes as a new version"
              size="small"
              disabled={!canSaveVersion}
              onClick={onSaveVersion}
              sx={{
                padding: '4px', background: '#473bab', color: '#ffffff', '&:hover': { background: '#3d3396' },
                '&.Mui-disabled': { background: 'rgba(17,16,20,0.08)', color: 'rgba(17,16,20,0.38)' },
              }}
            >
              <Add style={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {groups.length === 0 && (
        <span style={{ fontSize: 13, fontFamily: FONT, color: '#9c99a9' }}>
          {versions.length === 0 ? 'No versions saved yet.' : 'No versions match your search.'}
        </span>
      )}

      {groups.map(({ label, items }) => {
        const open = !collapsed.has(label);
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => toggleGroup(label)}
              aria-expanded={open}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.1px',
              }}
            >
              {label}
              {open ? <ExpandLess style={{ fontSize: 18 }} /> : <ExpandMore style={{ fontSize: 18 }} />}
            </button>
            {open && items.map((version) => {
              const isCurrent = version.id === currentVersionId;
              const isViewing = version.id === viewingVersionId;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => onSelect(version.id)}
                  aria-current={isViewing || (isCurrent && !viewingVersionId) ? 'true' : undefined}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 10, borderRadius: 8, textAlign: 'left',
                    cursor: 'pointer', fontFamily: FONT, width: '100%', boxSizing: 'border-box',
                    border: isViewing ? '1px solid #6356e1' : '1px solid transparent',
                    background: isViewing ? 'rgba(99,86,225,0.08)' : 'transparent',
                  }}
                >
                  <VersionThumbnail />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={META_TEXT_STYLE}>{timeLabel(new Date(version.createdAt), now)}</span>
                      {isCurrent && <Badge label="Current" filled />}
                      {isViewing && <Badge label="Viewing" filled={false} />}
                    </div>
                    <span style={{ fontSize: 13, color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {version.name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...META_TEXT_STYLE }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: '50%', background: '#d9d8de', color: '#1f1d25',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 500,
                      }}>
                        {initials(version.createdBy)}
                      </span>
                      {version.createdBy}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
