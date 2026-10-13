import { useState } from 'react';
import { Box, Button, Checkbox, IconButton, Popover, Tooltip } from '@mui/material';
import { Add, DeleteOutlined, ExpandMore, Search } from '@mui/icons-material';
import { ProjectAvatar } from './ProjectAvatar';

/** One distinct default (a template, a background collection, a variable…) and
 *  the projects of the selection that have it. */
export interface DefaultGroup<T> {
  key: string;
  item: T;
  projectIds: string[];
}

interface ProjectRef { id: string; name: string }

const FONT = 'Roboto, sans-serif';
const PURPLE = '#473bab';
export const CARD_SIZE = 200;

/** Groups a selection's defaults by what they are, so ten projects sharing a
 *  template show it once ("10 of 10") instead of ten times. Sorted by name, so
 *  an item doesn't move when it is added to or removed from projects. */
export function groupDefaults<T>(
  projects: readonly ProjectRef[],
  itemsOf: (projectId: string) => readonly T[],
  keyOf: (item: T) => string,
  nameOf: (item: T) => string,
): DefaultGroup<T>[] {
  const groups = new Map<string, DefaultGroup<T>>();
  for (const p of projects) {
    for (const item of itemsOf(p.id)) {
      const key = keyOf(item);
      const g = groups.get(key);
      if (g) g.projectIds.push(p.id);
      else groups.set(key, { key, item, projectIds: [p.id] });
    }
  }
  return [...groups.values()].sort((a, b) => nameOf(a.item).localeCompare(nameOf(b.item), undefined, { numeric: true, sensitivity: 'base' }));
}

/** The dialog is a fixed layer at z-index 100001; MUI tooltips default to 1500 and would sit behind it. */
const tooltipSlots = { popper: { sx: { zIndex: 100002 } } };

/** Plus icon: always present when several projects are selected; disabled, with the reason, when every one already has the item. */
const AddToAllIcon = ({ blocked, total, onClick }: { blocked?: string; total: number; onClick: () => void }) => {
  if (total <= 1) return null;
  return (
    <Tooltip slotProps={tooltipSlots} title={blocked ?? 'Add to all'}>
      <span>
        <IconButton size="small" disabled={!!blocked} aria-label="Add to all projects" onClick={onClick}>
          <Add style={{ fontSize: 20, color: blocked ? undefined : '#1f1d25' }} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

const RemoveIcon = ({ total, onClick }: { total: number; onClick: () => void }) => (
  <Tooltip slotProps={tooltipSlots} title={total > 1 ? 'Remove from all' : 'Remove'}>
    <IconButton size="small" aria-label={total > 1 ? 'Remove from all projects' : 'Remove'} onClick={onClick}>
      <DeleteOutlined style={{ fontSize: 20, color: '#1f1d25' }} />
    </IconButton>
  </Tooltip>
);

const SelectBox = ({ checked, onChange, label, overlay, className }: {
  checked: boolean; onChange: () => void; label: string; overlay?: boolean; className?: string;
}) => (
  <Checkbox
    size="small" checked={checked} onChange={onChange} className={className} slotProps={{ input: { 'aria-label': label } }}
    sx={{
      color: '#686576', '&.Mui-checked': { color: PURPLE },
      ...(overlay ? { position: 'absolute', top: 6, left: 6, padding: '3px', background: 'rgba(255,255,255,0.94)', borderRadius: '6px', '&:hover': { background: '#fff' } } : { padding: '8px' }),
    }}
  />
);

/** The hover affordances of a card: revealed on hover or focus, and kept visible while a selection is under way. */
const cardSx = {
  '& .dg-reveal': { opacity: 0, transition: 'opacity .16s, transform .16s' },
  '& .dg-bar.dg-reveal': { transform: 'translateY(6px)' },
  '& .dg-thumb': { transition: 'box-shadow .16s' },
  '&:hover .dg-thumb': { boxShadow: '0 4px 14px rgba(31,29,37,0.18)' },
  '&:hover .dg-reveal, &:focus-within .dg-reveal, & .dg-reveal.dg-on': { opacity: 1, transform: 'none' },
} as const;

const roundSx = {
  width: 32, height: 32, background: '#fff', color: '#1f1d25', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  '&:hover': { background: PURPLE, color: '#fff' }, '&.Mui-disabled': { background: 'rgba(255,255,255,0.6)' },
} as const;

/** "X of Y" — how many of the selected projects have this default. Purple when all of them do. Opens a card
 *  (above the dialog, so nothing grows or shifts) listing who has it, with a trash each, and who is missing it,
 *  with a plus each. */
const Coverage = ({ projects, ids, title, right, onRemoveFrom, onAddTo, addBlockedFor }: {
  projects: readonly ProjectRef[]; ids: string[]; title: string; right?: boolean;
  onRemoveFrom: (id: string) => void; onAddTo: (id: string) => void; addBlockedFor?: (id: string) => string | undefined;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const total = projects.length;
  const full = ids.length === total;
  const matches = (p: ProjectRef) => p.name.toLowerCase().includes(query.trim().toLowerCase());
  const has = projects.filter((p) => ids.includes(p.id) && matches(p));
  const missing = projects.filter((p) => !ids.includes(p.id) && matches(p));
  const close = () => { setAnchor(null); setQuery(''); };
  const label = { fontSize: 11, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#686576', fontFamily: FONT, padding: '8px 14px 2px' } as const;
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '3px 6px 3px 14px' } as const;
  const nameStyle = { flex: 1, minWidth: 0, fontSize: 13, fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;
  return (
    <>
      <button
        type="button" onClick={(e) => setAnchor(e.currentTarget)} aria-expanded={!!anchor} aria-haspopup="dialog"
        aria-label={`${ids.length} of ${total} projects have this. Show which.`}
        style={{
          border: 'none', cursor: 'pointer', borderRadius: 100, padding: '2px 6px 2px 8px', fontSize: 12, fontFamily: FONT, fontWeight: 500, whiteSpace: 'nowrap',
          display: 'inline-flex', alignItems: 'center', gap: 2,
          background: full ? PURPLE : '#e9e6ff', color: full ? '#fff' : '#2f2688',
        }}
      >
        {ids.length} of {total}
        <ExpandMore style={{ fontSize: 14, transform: anchor ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <Popover
        open={!!anchor} anchorEl={anchor} onClose={close} disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: right ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: right ? 'right' : 'left' }}
        // Esc closes this card only, not the dialog behind it.
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}
        sx={{ zIndex: 100002 }}
        slotProps={{ paper: { sx: { width: 272, mt: 0.5, borderRadius: '12px', border: '1px solid #e1ddf0', boxShadow: '0 14px 34px rgba(31,29,37,0.24)', paddingBottom: 1 } } }}
      >
        <div role="dialog" aria-label={`Projects for ${title}`}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 6px' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <span style={{ fontSize: 12, fontFamily: FONT, color: '#686576', marginLeft: 8 }}>{ids.length} of {total}</span>
          </div>
          {total > 8 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, margin: '4px 8px', padding: '0 10px', border: '1px solid #e1ddf0', borderRadius: 8 }}>
              <Search style={{ fontSize: 16, color: '#8c8999' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project" aria-label="Find a project"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 13, fontFamily: FONT, background: 'transparent' }} />
            </div>
          )}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {has.length > 0 && <div style={label}>Has it</div>}
            {has.map((p) => (
              <div key={p.id} style={rowStyle}>
                <ProjectAvatar name={p.name} id={p.id} size={22} />
                <span style={{ ...nameStyle, color: '#1f1d25' }}>{p.name}</span>
                <IconButton size="small" aria-label={`Remove from ${p.name}`} onClick={() => onRemoveFrom(p.id)}
                  sx={{ color: '#4b4958', '&:hover': { color: '#d2323f', background: '#fdeaec' } }}>
                  <DeleteOutlined style={{ fontSize: 18 }} />
                </IconButton>
              </div>
            ))}
            {missing.length > 0 && <div style={{ ...label, borderTop: has.length ? '1px solid #f1eff7' : undefined, marginTop: has.length ? 6 : 0, paddingTop: has.length ? 10 : 8 }}>Missing</div>}
            {missing.map((p) => {
              const blocked = addBlockedFor?.(p.id);
              return (
                <div key={p.id} style={rowStyle}>
                  <ProjectAvatar name={p.name} id={p.id} size={22} ghost />
                  <span style={{ ...nameStyle, color: '#686576' }}>{p.name}</span>
                  <Tooltip slotProps={{ popper: { sx: { zIndex: 100003 } } }} title={blocked ?? `Add to ${p.name}`}>
                    <span>
                      <IconButton size="small" disabled={!!blocked} aria-label={`Add to ${p.name}`} onClick={() => onAddTo(p.id)}
                        sx={{ color: '#4b4958', '&:hover': { color: PURPLE, background: 'rgba(71,59,171,0.1)' } }}>
                        <Add style={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>
      </Popover>
    </>
  );
};

export function DefaultsGroupList<T>({
  projects, groups, layout, visual, title, subtitle, renderRow, onRemoveAll, onRemoveFrom, onApplyToAll,
  emptyText, addControl, extraRow, selected, onToggle, addBlocked, onAddTo, addBlockedFor,
}: {
  projects: readonly ProjectRef[];
  groups: DefaultGroup<T>[];
  /** "cards": a 200 x 200 thumbnail with the actions underneath. "rows": one bordered row per default.
   *  "list": plain rows separated by dividers. */
  layout: 'cards' | 'rows' | 'list';
  /** Fills the 200 x 200 thumbnail (cards only). */
  visual?: (item: T) => React.ReactNode;
  title?: (item: T) => string;
  subtitle?: (item: T) => string | undefined;
  /** The body of a row (rows only). */
  renderRow?: (item: T, group: DefaultGroup<T>) => React.ReactNode;
  onRemoveAll: (key: string) => void;
  onRemoveFrom: (key: string, projectId: string) => void;
  onApplyToAll: (key: string) => void;
  emptyText: string;
  /** The "add" affordance, shown below the list. */
  addControl?: React.ReactNode;
  /** One more row at the end of a list, e.g. an item still being added. */
  extraRow?: React.ReactNode;
  /** Keys of the selected defaults, for acting on several at once. */
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Why "Add to all" would do nothing for this default, when it isn't just that every project has it. */
  addBlocked?: (key: string) => string | undefined;
  /** Adds a default to one project that is missing it. */
  onAddTo: (key: string, projectId: string) => void;
  addBlockedFor?: (key: string, projectId: string) => string | undefined;
}) {
  const total = projects.length;
  const anySelected = selected.size > 0;
  const cov = (g: DefaultGroup<T>, name: string, right: boolean) => (
    <Coverage projects={projects} ids={g.projectIds} title={name} right={right}
      onRemoveFrom={(id) => onRemoveFrom(g.key, id)} onAddTo={(id) => onAddTo(g.key, id)} addBlockedFor={(id) => addBlockedFor?.(g.key, id)} />
  );

  const list = layout === 'cards' ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {groups.map((g) => {
        const blocked = g.projectIds.length === total ? 'Already present in all selected projects.' : addBlocked?.(g.key);
        const isSelected = selected.has(g.key);
        return (
          <Box key={g.key} sx={{ width: CARD_SIZE, display: 'flex', flexDirection: 'column', gap: 1, ...cardSx }}>
            <div className="dg-thumb" style={{ position: 'relative', width: CARD_SIZE, height: CARD_SIZE, borderRadius: 12, overflow: 'hidden', background: '#f0f2f4', border: '1px solid #e7e7e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isSelected ? `0 0 0 3px ${PURPLE}` : undefined }}>
              {visual?.(g.item)}
              <SelectBox overlay className={`dg-reveal${anySelected || isSelected ? ' dg-on' : ''}`} checked={isSelected}
                onChange={() => onToggle(g.key)} label={`Select ${title?.(g.item) ?? 'item'}`} />
              {total > 1 && (
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  {cov(g, title?.(g.item) ?? '', false)}
                </div>
              )}
              <div className="dg-reveal dg-bar" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '28px 8px 8px', background: 'linear-gradient(transparent, rgba(20,18,30,0.65))', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {total > 1 && (
                  <Tooltip slotProps={tooltipSlots} title={blocked ?? 'Add to all'}>
                    <span>
                      <IconButton disabled={!!blocked} aria-label="Add to all projects" onClick={() => onApplyToAll(g.key)} sx={roundSx}>
                        <Add style={{ fontSize: 18 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                <Tooltip slotProps={tooltipSlots} title={total > 1 ? 'Remove from all' : 'Remove'}>
                  <IconButton aria-label={total > 1 ? 'Remove from all projects' : 'Remove'} onClick={() => onRemoveAll(g.key)}
                    sx={{ ...roundSx, '&:hover': { background: '#d2323f', color: '#fff' } }}>
                    <DeleteOutlined style={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title?.(g.item)}
              </p>
              {subtitle?.(g.item) && (
                <p style={{ margin: 0, fontSize: 11, fontFamily: FONT, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>{subtitle(g.item)}</p>
              )}
            </div>
          </Box>
        );
      })}
    </div>
  ) : layout === 'list' ? (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {groups.map((g, i) => {
        const blocked = g.projectIds.length === total ? 'Already present in all selected projects.' : addBlocked?.(g.key);
        return (
          <div key={g.key} style={{ borderTop: i ? '1px solid rgba(0,0,0,0.12)' : 'none', padding: i ? '24px 0' : '0 0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', height: 40, marginLeft: -8 }}>
                <SelectBox checked={selected.has(g.key)} onChange={() => onToggle(g.key)} label="Select" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>{renderRow?.(g.item, g)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40 }}>
                {total > 1 && cov(g, title?.(g.item) ?? '', true)}
                <AddToAllIcon blocked={blocked} total={total} onClick={() => onApplyToAll(g.key)} />
                <RemoveIcon total={total} onClick={() => onRemoveAll(g.key)} />
              </div>
            </div>
          </div>
        );
      })}
      {extraRow && <div style={{ borderTop: groups.length ? '1px solid rgba(0,0,0,0.12)' : 'none', padding: groups.length ? '24px 0 0' : 0 }}>{extraRow}</div>}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map((g) => {
        const blocked = g.projectIds.length === total ? 'Already present in all selected projects.' : addBlocked?.(g.key);
        return (
          <div key={g.key} style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
              <div style={{ marginLeft: -8 }}><SelectBox checked={selected.has(g.key)} onChange={() => onToggle(g.key)} label="Select" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>{renderRow?.(g.item, g)}</div>
              {total > 1 && cov(g, title?.(g.item) ?? '', true)}
              <AddToAllIcon blocked={blocked} total={total} onClick={() => onApplyToAll(g.key)} />
              <RemoveIcon total={total} onClick={() => onRemoveAll(g.key)} />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {groups.length === 0 && (
        <p style={{ margin: 0, fontSize: 14, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.15px' }}>{emptyText}</p>
      )}
      {list}
      {addControl && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{addControl}</div>}
    </div>
  );
}

/** For the adds this prototype has not built yet — templates, backgrounds,
 *  logos and audio — kept visible so the section reads the way the live one does. */
export const ComingSoonButton = ({ label }: { label: string }) => (
  <Tooltip slotProps={tooltipSlots} title="Coming soon">
    <span>
      <Button disabled variant="outlined" size="small" startIcon={<Add style={{ fontSize: 16 }} />}
        sx={{ textTransform: 'none', borderRadius: '4px', fontSize: 13 }}>
        {label}
      </Button>
    </span>
  </Tooltip>
);
