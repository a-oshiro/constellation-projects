import { useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { ReactNode } from 'react';
import { ClickAwayListener, Grow, Paper, Popper, MenuList, MenuItem, Checkbox } from '@mui/material';
import { ChevronRight, KeyboardArrowDown } from '@mui/icons-material';
import type { AlertFilterFieldKey } from '../../utils/alertFilters';
import { ACTIVE_PURPLE, CountBadge, FIELD_HEIGHT, FIELD_WIDTH } from './CompactFilterSelect';

/**
 * Same shape CompactFilterSelect's props reduce to — built once per field in AlertsFilterRow and
 * reused here so the "hidden" fields' options/selection/onChange logic isn't duplicated.
 */
export interface MoreFilterFieldDescriptor {
  key: AlertFilterFieldKey;
  label: string;
  count: number;
  multiple: boolean;
  options: unknown[];
  value: unknown[];
  getOptionKey: (v: unknown) => string;
  getOptionLabel: (v: unknown) => string;
  renderOptionIcon?: (v: unknown) => ReactNode;
  onChange: (v: unknown[]) => void;
}

interface MoreFiltersMenuProps {
  /** "More Filters" normally, or "Filters" when this is the row's only visible filter field. */
  label: string;
  /** Sum of the hidden fields' own counts — shown as this field's own badge. */
  totalCount: number;
  fields: MoreFilterFieldDescriptor[];
}

const SUBMENU_CLOSE_DELAY = 150;

export function MoreFiltersMenu({ label, totalCount, fields }: MoreFiltersMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredKey, setHoveredKey] = useState<AlertFilterFieldKey | null>(null);
  // Captured straight from the triggering event rather than read from a ref during render — anchoring
  // the submenu popper to whichever top-level item is currently hovered/focused.
  const [subAnchorEl, setSubAnchorEl] = useState<HTMLElement | null>(null);
  const closeTimer = useRef<number | null>(null);

  const open = Boolean(anchorEl);
  const active = totalCount > 0;
  const hoveredField = fields.find((f) => f.key === hoveredKey) ?? null;

  const closeAll = () => {
    setAnchorEl(null);
    setHoveredKey(null);
    setSubAnchorEl(null);
  };

  // Hovering off one submenu item and onto its own submenu (or another item) shouldn't flicker the
  // submenu closed and reopened — a short delay lets the pointer cross the gap between them.
  const scheduleSubmenu = (key: AlertFilterFieldKey | null, anchor?: HTMLElement) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (key === null) {
      closeTimer.current = window.setTimeout(() => { setHoveredKey(null); setSubAnchorEl(null); }, SUBMENU_CLOSE_DELAY);
    } else {
      setHoveredKey(key);
      if (anchor) setSubAnchorEl(anchor);
    }
  };

  const toggleOption = (field: MoreFilterFieldDescriptor, option: unknown) => {
    const optionKey = field.getOptionKey(option);
    const selected = field.value.some((v) => field.getOptionKey(v) === optionKey);
    if (!field.multiple) {
      field.onChange([option]);
      return;
    }
    field.onChange(selected ? field.value.filter((v) => field.getOptionKey(v) !== optionKey) : [...field.value, option]);
  };

  return (
    <ClickAwayListener onClickAway={closeAll}>
      <div style={{ position: 'relative', display: 'inline-flex' }} onKeyDown={(e) => { if (e.key === 'Escape') closeAll(); }}>
        <button
          onClick={(e) => setAnchorEl((prev) => (prev ? null : e.currentTarget))}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
            width: FIELD_WIDTH, flexShrink: 0, height: FIELD_HEIGHT, padding: '6px 8px', boxSizing: 'border-box',
            borderRadius: 4, cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 13,
            background: active ? '#f0eeff' : '#f9fafa',
            border: `1px solid ${active || open ? ACTIVE_PURPLE : '#cac9cf'}`,
            color: active ? ACTIVE_PURPLE : '#1f1d25',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {active && <CountBadge count={totalCount} />}
            <KeyboardArrowDown style={{ fontSize: 18, color: active ? ACTIVE_PURPLE : '#686576' }} />
          </span>
        </button>

        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
          <Grow in={open}>
            <Paper elevation={4} sx={{ minWidth: FIELD_WIDTH, marginTop: '4px', py: 0.5 }}>
              <MenuList dense>
                {fields.map((f) => (
                  <MenuItem
                    key={f.key}
                    onMouseEnter={(e: ReactMouseEvent<HTMLLIElement>) => scheduleSubmenu(f.key, e.currentTarget)}
                    onMouseLeave={() => scheduleSubmenu(null)}
                    selected={hoveredKey === f.key}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, fontSize: 13, fontFamily: 'Roboto, sans-serif', minWidth: FIELD_WIDTH }}
                  >
                    <span style={{ color: f.count > 0 ? ACTIVE_PURPLE : '#1f1d25' }}>{f.label}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {f.count > 0 && <CountBadge count={f.count} />}
                      <ChevronRight style={{ fontSize: 16, color: '#9c99a9' }} />
                    </span>
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Grow>
        </Popper>

        {hoveredField && (
          <Popper
            open
            anchorEl={subAnchorEl}
            placement="right-start"
            style={{ zIndex: 1301 }}
            modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
          >
            <Paper
              elevation={4}
              onMouseEnter={() => scheduleSubmenu(hoveredField.key)}
              onMouseLeave={() => scheduleSubmenu(null)}
              sx={{ minWidth: 180, maxHeight: 320, overflowY: 'auto', py: 0.5 }}
            >
              <MenuList dense>
                {hoveredField.options.map((option) => {
                  const optionKey = hoveredField.getOptionKey(option);
                  const selected = hoveredField.value.some((v) => hoveredField.getOptionKey(v) === optionKey);
                  return (
                    <MenuItem
                      key={optionKey}
                      onClick={() => toggleOption(hoveredField, option)}
                      // Date Range (and any other single-select field) can only hold one value at a
                      // time, so its options read like a plain select — highlighted when selected,
                      // no checkbox — instead of the multi-select checkbox list.
                      selected={!hoveredField.multiple && selected}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', whiteSpace: 'nowrap' }}
                    >
                      {hoveredField.multiple && <Checkbox size="small" checked={selected} sx={{ padding: 0 }} />}
                      {hoveredField.renderOptionIcon?.(option)}
                      {hoveredField.getOptionLabel(option)}
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Paper>
          </Popper>
        )}
      </div>
    </ClickAwayListener>
  );
}
