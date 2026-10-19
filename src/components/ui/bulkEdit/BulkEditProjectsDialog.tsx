import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton, MenuItem, Popover, Switch, TextField, Tooltip } from '@mui/material';
import {
  Add, AddCircleOutlined, AutoAwesome, CalendarMonthOutlined, ChangeCircleOutlined, Check, CheckCircle, ChevronLeft, ChevronRight, CheckCircleOutlined, Close, DeleteOutlined, EditNoteOutlined, EventBusyOutlined, ExpandMore,
  HourglassEmptyOutlined, Inventory2Outlined, PendingOutlined, PermMediaOutlined, PlayArrow, RemoveCircleOutlined, Search, Undo, WarningAmber,
} from '@mui/icons-material';
import { PROJECTS } from '../../../data/projects';
import type { Project } from '../../../data/projects';
import type { Background, Template } from '../../../data/types';
import { MOCK_TEAMMATES, TEMPLATES } from '../../../data/mockData';
import { LIFESTYLE_LIBRARY } from '../../../data/lifestyle';
import type { IgnoreProduct, LifestyleItem } from '../../../data/lifestyle';
import { getProjectExtras, saveProjectExtras, LOGO_LIBRARY } from '../../../data/projectDefaults';
import type { CustomVariable, LogoSlot, ProjectAudio, ProjectLogo } from '../../../data/projectDefaults';
import { BACKGROUND_COLLECTIONS, collectionBackgrounds, collectionName, generatedBackground } from '../../../data/backgroundCollections';
import { STATUS_CONFIG } from '../ProjectStatusBadge';
import type { ProjectWorkflowStatus } from '../ProjectStatusBadge';
import { AddTemplatesDialog } from '../AddTemplatesDialog';
import { generateBackgroundSize } from '../../../utils/generateBackgroundSize';
import { useSnackbar } from '../../../context/SnackbarContext';
import bmwLogoSrc from '../../../assets/bmw-logo.png';
import { TEMPLATE_REGISTRY } from '../../../templates';
import { AudioPlayerRow } from './AudioPlayerRow';
import { ProjectAvatar } from './ProjectAvatar';
import { AddLogosDialog } from './AddLogosDialog';
import { AddCollectionBar } from './AddCollectionBar';
import { AddBackgroundsDialog } from '../AddBackgroundsDialog';
import { AddLifestyleDialog } from '../AddLifestyleDialog';
import type { BackgroundOption } from '../AddBackgroundsDialog';
import { CARD_SIZE, DefaultsGroupList, groupDefaults } from './DefaultsGroupList';

// ── The draft ────────────────────────────────────────────────────────────────
// One draft per selected project. A field's value is read off all of them: when
// they agree it is that value, otherwise it is "Multiple values" and the control
// shows the placeholder. Typing writes the same value to every draft. Nothing
// touches the real projects until Apply.

interface Draft {
  accountName: string;
  accountUrl: string;
  brandTag: string;
  projectName: string;
  creator: string;
  creatorAvatar: string;
  startDate: string;
  endDate: string;
  isEvergreen: boolean;
  workflowStatus: ProjectWorkflowStatus;
  tags: string[];
  templates: Template[];
  backgrounds: Background[];
  customVariables: CustomVariable[];
  logos: ProjectLogo[];
  audio: ProjectAudio[];
  lifestyle: LifestyleItem[];
  ignoreProduct: IgnoreProduct;
}

/** Lifestyle is a list of its own, but sits in the Backgrounds section rather than having one. */
type ListKey = 'templates' | 'backgrounds' | 'customVariables' | 'logos' | 'audio' | 'lifestyle';
type Section = 'info' | 'alerts' | Exclude<ListKey, 'lifestyle'>;

const FONT = 'Roboto, sans-serif';

/** The circled mark that leads each line of the Changes popover. */
const CHANGE_KINDS = {
  added: { Icon: AddCircleOutlined, color: '#2e7d32', label: 'Added' },
  removed: { Icon: RemoveCircleOutlined, color: '#d2323f', label: 'Removed' },
  changed: { Icon: ChangeCircleOutlined, color: '#c45500', label: 'Changed' },
};
const PURPLE = '#473bab';

/** The statuses a bulk edit can set, in the order the status menu lists them. */
const STATUS_OPTIONS: { label: string; value: ProjectWorkflowStatus }[] = [
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Awaiting Approval', value: 'awaiting_approval' },
  { label: 'Needs Edits', value: 'needs_edits' },
  { label: 'Approved', value: 'assets_generated' },
  { label: 'Assets Created', value: 'assets_generated_no_approval' },
  { label: 'Changes Made', value: 'pending_changes' },
  { label: 'Done', value: 'done' },
  { label: 'Expired', value: 'expired' },
  { label: 'Archived', value: 'archived' },
];
const statusLabel = (v: ProjectWorkflowStatus) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? STATUS_CONFIG[v].label;

/** How each status reads in the status menu: a tinted pill with its icon. */
const STATUS_PILLS: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  'In Progress': { bg: '#e5f1fb', color: '#1f78c9', Icon: PendingOutlined },
  'Awaiting Approval': { bg: '#fff1e0', color: '#d4600e', Icon: HourglassEmptyOutlined },
  'Needs Edits': { bg: '#fff1e0', color: '#d4600e', Icon: EditNoteOutlined },
  Approved: { bg: '#e8f5e9', color: '#2e7d32', Icon: CheckCircleOutlined },
  'Assets Created': { bg: '#efe3f7', color: '#6a3fd1', Icon: PermMediaOutlined },
  'Changes Made': { bg: '#fff1e0', color: '#d4600e', Icon: WarningAmber },
  Done: { bg: '#e8f5e9', color: '#2e7d32', Icon: CheckCircle },
  Expired: { bg: '#f0f0f2', color: '#686576', Icon: EventBusyOutlined },
  Archived: { bg: '#f0f0f2', color: '#686576', Icon: Inventory2Outlined },
};

const StatusPill = ({ label }: { label: string }) => {
  const style = STATUS_PILLS[label] ?? { bg: '#f0f0f2', color: '#686576', Icon: PendingOutlined };
  const { Icon } = style;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '2px 8px 2px 6px', background: style.bg, color: style.color, fontSize: 12, fontFamily: FONT, lineHeight: 1.66, letterSpacing: '0.4px' }}>
      <Icon style={{ fontSize: 14 }} />{label}
    </span>
  );
};

const draftOf = (p: Project): Draft => {
  const x = getProjectExtras(p);
  return {
    accountName: p.accountName, accountUrl: p.accountUrl, brandTag: p.brandTag, projectName: p.projectName,
    creator: p.creator, creatorAvatar: p.creatorAvatar, startDate: p.startDate, endDate: p.endDate, isEvergreen: !!p.isEvergreen, workflowStatus: p.workflowStatus,
    tags: [...x.tags], templates: [...p.templates], backgrounds: [...p.backgrounds],
    customVariables: [...x.customVariables], logos: [...x.logos], audio: [...x.audio],
    lifestyle: [...x.lifestyle], ignoreProduct: { ...x.ignoreProduct },
  };
};

/** The shared value, or undefined when the selection disagrees. */
const common = (values: string[]): string | undefined =>
  values.length > 0 && values.every((v) => v === values[0]) ? values[0] : undefined;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ── Controls ─────────────────────────────────────────────────────────────────

const MIXED = 'Multiple';

const fieldSx = () => ({
  '& .MuiOutlinedInput-root': { fontFamily: FONT, fontSize: 15, background: '#fff' },
  // "Multiple values": the selection disagrees — light grey and italic, so it
  // reads as an absence of a value rather than as a value.
  '& input::placeholder': { fontStyle: 'italic', color: '#8c8999', opacity: 1 },
});

/** Whether a field was edited, and whether the selection disagrees on it: what the change count reads. */
interface FieldMeta { changed: boolean; mixed: boolean }

/** A label above a control, with an optional hint under it. */
const Field = ({ label, hint, span, children }: {
  label: string; hint?: React.ReactNode; span?: number; children: React.ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 500, color: '#4b4958', fontFamily: FONT }}>{label}</div>}
    {children}
    {hint && <div style={{ fontSize: 12, color: '#686576', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{hint}</div>}
  </div>
);

const MixedSelect = ({ label, options, value, onChange, renderOption }: {
  label: string; options: string[]; value: string | undefined; onChange: (v: string) => void;
  /** Draws an option in the menu, in place of its plain text. */
  renderOption?: (option: string) => React.ReactNode;
}) => (
  <Autocomplete
    size="small" fullWidth disableClearable options={options}
    value={(value ?? null) as unknown as string}
    onChange={(_, v) => v && onChange(v)}
    // The dialog is a fixed layer at z-index 100001; the menu would otherwise open behind it.
    slotProps={{ popper: { sx: { zIndex: 100002 } } }}
    renderOption={renderOption ? (props, option) => {
      const { key, ...rest } = props;
      return <li key={key} {...rest} style={{ ...rest.style, padding: '3px 12px' }}>{renderOption(option)}</li>;
    } : undefined}
    renderInput={(params) => (
      <TextField {...params} placeholder={value === undefined ? MIXED : undefined}
        slotProps={{
          ...params.slotProps,
          // With a drawn option, the chosen one is drawn in the field too; the plain text behind it is hidden.
          input: renderOption && value !== undefined ? { ...params.slotProps?.input, startAdornment: renderOption(value) } : params.slotProps?.input,
          htmlInput: { ...params.slotProps?.htmlInput, 'aria-label': label, ...(renderOption && value !== undefined ? { readOnly: true } : {}) },
        }}
        sx={{ ...fieldSx(), ...(renderOption && value !== undefined ? { '& input': { color: 'transparent', caretColor: 'transparent', cursor: 'pointer', minWidth: 0, width: 0, flexGrow: 1 } } : {}) }} />
    )}
  />
);

// ── Date range ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();
const parseDay = (text: string | undefined) => {
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
};
/** How a date reads in the field, and how it is kept (the same "Mon D, YYYY" the project dates use). */
const showDay = (d: Date) => d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
const keepDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

interface Range { start: Date | null; end: Date | null }

const MonthGrid = ({ month, range, hover, onPick, onHover }: {
  month: Date; range: Range; hover: Date | null; onPick: (d: Date) => void; onHover: (d: Date | null) => void;
}) => {
  const first = month.getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];
  while (cells.length < 42) cells.push(null);
  // While the end is still to be picked, the band follows the pointer.
  const lo = range.start;
  const hi = range.end ?? (lo && hover && hover > lo ? hover : null);
  return (
    <div style={{ width: 7 * 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => <span key={i} style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: FONT, color: '#686576' }}>{w}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 40px)', gridAutoRows: 38 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const isLo = sameDay(d, lo);
          const isHi = sameDay(d, hi);
          const inBand = !!lo && !!hi && d >= lo && d <= hi;
          return (
            <span key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: inBand ? '#e9e6ff' : undefined,
              borderRadius: `${isLo || (inBand && d.getDay() === 0) ? 19 : 0}px ${isHi || (inBand && d.getDay() === 6) ? 19 : 0}px ${isHi || (inBand && d.getDay() === 6) ? 19 : 0}px ${isLo || (inBand && d.getDay() === 0) ? 19 : 0}px`,
            }}>
              <button type="button" onClick={() => onPick(d)} onMouseEnter={() => onHover(d)} onMouseLeave={() => onHover(null)}
                aria-label={d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                aria-pressed={isLo || isHi}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: FONT,
                  background: isLo || isHi ? PURPLE : 'transparent', color: isLo || isHi ? '#fff' : '#1f1d25',
                }}>{d.getDate()}</button>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** One field for a start and an end date. Clicking it opens a two-month range calendar: the first click
 *  sets the start, the second sets the end and closes. */
const MixedDateRange = ({ label, start, end, onChange }: {
  label: string; start: string | undefined; end: string | undefined; onChange: (start: string, end: string) => void;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [range, setRange] = useState<Range>({ start: null, end: null });
  const [hover, setHover] = useState<Date | null>(null);
  const mixed = start === undefined || end === undefined;
  const from = parseDay(start);
  const to = parseDay(end);

  const close = () => { setAnchor(null); setHover(null); };
  const pick = (d: Date) => {
    if (!range.start || range.end || d < range.start) {
      setRange({ start: d, end: null });
      onChange(keepDay(d), '');
      return;
    }
    setRange({ start: range.start, end: d });
    onChange(keepDay(range.start), keepDay(d));
    close();
  };
  const arrow = { padding: 4, color: '#1f1d25' } as const;

  return (
    <>
      <Box component="button" type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={!!anchor}
        onClick={(e: React.MouseEvent<HTMLElement>) => { setRange({ start: from, end: to }); setView(startOfMonth(from ?? new Date())); setAnchor(e.currentTarget); }}
        sx={{
          display: 'flex', alignItems: 'center', gap: '6px', width: '100%', height: 40, padding: '0 10px', boxSizing: 'border-box', background: '#fff', cursor: 'pointer',
          border: '1px solid rgba(0,0,0,0.23)', borderRadius: '4px', fontFamily: FONT, fontSize: 12, textAlign: 'left', color: '#1f1d25',
          '&:hover': { borderColor: 'rgba(0,0,0,0.87)' },
          '&:focus-visible, &[aria-expanded="true"]': { outline: 'none', borderColor: PURPLE, boxShadow: `0 0 0 1px ${PURPLE}` },
        }}>
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', ...(mixed ? { fontStyle: 'italic', color: '#8c8999' } : !from && !to ? { color: '#8c8999' } : {}) }}>
          {mixed ? MIXED : !from && !to ? 'Select dates' : `${from ? showDay(from) : '\u2026'} \u2013 ${to ? showDay(to) : '\u2026'}`}
        </span>
        <CalendarMonthOutlined style={{ fontSize: 18, color: '#4b4958' }} />
      </Box>
      <Popover
        open={!!anchor} anchorEl={anchor} onClose={close} disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}
        sx={{ zIndex: 100002 }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: '8px', boxShadow: '0 14px 34px rgba(31,29,37,0.24)' } } }}
      >
        <div role="dialog" aria-label={`${label}, choose dates`} style={{ padding: '12px 16px 8px' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {[0, 1].map((n) => {
              const month = addMonths(view, n);
              return (
                <div key={n}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40 }}>
                    {n === 0 ? <IconButton size="small" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))} sx={arrow}><ChevronLeft /></IconButton> : <span style={{ width: 32 }} />}
                    <span style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>
                      {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    {n === 1 ? <IconButton size="small" aria-label="Next month" onClick={() => setView(addMonths(view, 1))} sx={arrow}><ChevronRight /></IconButton> : <span style={{ width: 32 }} />}
                  </div>
                  <MonthGrid month={month} range={range} hover={hover} onPick={pick} onHover={setHover} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button size="small" onClick={() => { onChange('', ''); close(); }} sx={{ textTransform: 'none', fontSize: 13, color: PURPLE }}>Clear</Button>
          </div>
        </div>
      </Popover>
    </>
  );
};

// ── Dialog ───────────────────────────────────────────────────────────────────

const NAV: { id: Exclude<ListKey, 'lifestyle'>; label: string; description: string }[] = [
  { id: 'customVariables', label: 'Custom Variables', description: 'Values passed into every entry\u2019s templates unless the entry overrides them.' },
  { id: 'templates', label: 'Templates', description: 'What every entry renders from \u2014 and what decides the background sizes and logo slots.' },
  { id: 'backgrounds', label: 'Backgrounds', description: 'The pool entries draw their backgrounds from. Each collection brings a size for every template of the project.' },
  { id: 'logos', label: 'Logos', description: 'The logo pool each placeholder may draw from, matched per entry by vehicle model.' },
  { id: 'audio', label: 'Audio', description: 'Template defaults and vehicle-matched Lifestyle audio for each audio placeholder.' },
];

/** How long an AI size is expected to take, in seconds, for the countdown. */
const GENERATION_ESTIMATE_S = 48;

const LOGO_SLOTS: ProjectLogo['slot'][] = ['Primary Logo', 'Secondary Logo', 'Event Logo'];

/** Backgrounds named "<size> Background N" are one creative at different sizes:
 *  they are added and removed together, as a collection. */
const collectionKey = (name: string) => {
  const m = name.match(/Background\s*(\d+)$/i);
  return m ? `Background ${m[1]}` : name;
};
interface BgCollection { key: string; url: string; sizes: number; width: number; height: number }
const collectionsOf = (bgs: Background[]): BgCollection[] => {
  const m = new Map<string, BgCollection>();
  bgs.forEach((b) => {
    const key = collectionKey(b.name);
    const e = m.get(key);
    if (e) { e.sizes += 1; return; }
    // The picture is shown at the proportions of the size it is for.
    const t = TEMPLATES.find((x) => x.id === b.templateId);
    m.set(key, { key, url: b.url, sizes: 1, width: t?.width ?? 1, height: t?.height ?? 1 });
  });
  return [...m.values()];
};

/** The pane title (H1, 16px), the pane's primary action 16px to its right, and an optional description. */
const SectionHeading = ({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 32 }}>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>{title}</h1>
      {action}
    </div>
    {description && <p style={{ margin: '8px 0 0', fontSize: 12, fontFamily: FONT, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>{description}</p>}
  </div>
);

/** A small confirmation dialog layered above the editor. */
const ConfirmModal = ({ id, title, body, confirmLabel, destructive, onConfirm, onCancel }: {
  id: string; title: string; body: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void; onCancel: () => void;
}) => (
  <>
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 100003, background: 'rgba(0,0,0,0.4)' }} />
    <div role="alertdialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`}
      style={{
        position: 'fixed', zIndex: 100004, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 440, maxWidth: 'calc(100vw - 32px)',
        background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
      }}>
      <h2 id={`${id}-title`} style={{ margin: 0, fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.15px' }}>{title}</h2>
      <p id={`${id}-body`} style={{ margin: '12px 0 0', fontSize: 14, fontFamily: FONT, color: '#686576', lineHeight: 1.5 }}>{body}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
        <Button variant="outlined" onClick={onCancel} sx={{ borderRadius: '100px', textTransform: 'none', color: PURPLE, borderColor: 'rgba(99,86,225,0.5)' }}>Cancel</Button>
        <Button variant="contained" disableElevation onClick={onConfirm}
          sx={{ borderRadius: '100px', textTransform: 'none', background: destructive ? '#d2323f' : PURPLE, '&:hover': { background: destructive ? '#b32833' : '#3d3396' } }}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </>
);

/** Outlined primary button, small — the design system's treatment for every "add". */
const AddButton = ({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) => (
  <Button variant="outlined" size="small" startIcon={<Add style={{ fontSize: 16 }} />} onClick={onClick} disabled={disabled}
    sx={{ textTransform: 'none', fontSize: 13, borderRadius: '100px', color: PURPLE, borderColor: 'rgba(99,86,225,0.5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
    {label}
  </Button>
);

/** A field with its label above it, outside the outline. */
const Labeled = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
    <span style={{ fontSize: 12, fontWeight: 500, color: '#4b4958', fontFamily: FONT }}>{label}</span>
    {children}
  </div>
);

/** One shared grid so every variable row has the same column widths. */
const VAR_GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 160px minmax(0, 2fr)', gap: 16 };

/** The multi-select holder, as on the Projects page: clear, the count and the actions for the whole selection. */
const SelectionBar = ({ count, bulk, canAdd, onClear, onAdd, onRemove }: {
  count: number; bulk: boolean; canAdd: boolean; onClear: () => void; onAdd: () => void; onRemove: () => void;
}) => {
  const actionSx = {
    color: PURPLE, borderColor: 'rgba(99,86,225,0.5)', borderRadius: '100px', padding: '4px 10px',
    fontSize: 13, fontFamily: FONT, fontWeight: 500, letterSpacing: '0.46px', textTransform: 'none', whiteSpace: 'nowrap', lineHeight: '22px',
    '&:hover': { borderColor: PURPLE, background: 'rgba(99,86,225,0.04)' },
  } as const;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f4f5f6', borderRadius: 40, padding: '3px 8px 3px 4px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconButton size="small" onClick={onClear} aria-label="Clear selection" sx={{ padding: '5px', color: '#686576' }}>
          <Close style={{ fontSize: 20 }} />
        </IconButton>
        <span style={{ fontSize: 11, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>{count} selected</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {bulk && (
          <Button variant="outlined" size="small" startIcon={<Add style={{ fontSize: 16 }} />} onClick={onAdd} disabled={!canAdd} sx={actionSx}>Add to all</Button>
        )}
        <Button variant="outlined" size="small" startIcon={<DeleteOutlined style={{ fontSize: 16 }} />} onClick={onRemove} sx={actionSx}>
          {bulk ? 'Remove from all' : 'Remove'}
        </Button>
      </div>
    </div>
  );
};

const NavItem = ({ label, active, count, changes, onClick }: {
  label: string; active: boolean; count?: number; changes: number; onClick: () => void;
}) => (
  <button
    type="button" onClick={onClick} aria-current={active ? 'page' : undefined}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
      borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: FONT,
      background: active ? '#e9e6ff' : 'transparent', color: active ? '#2f2688' : '#1f1d25', fontWeight: active ? 500 : 400,
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label}
      {changes > 0 && <span role="img" aria-label="Edited" style={{ width: 4, height: 4, borderRadius: '50%', background: PURPLE, flexShrink: 0 }} />}
    </span>
    {count !== undefined && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#686576', fontWeight: 400 }}>{count}</span>}
  </button>
);

/** What makes two defaults "the same one" when grouping and removing. A
 *  variable is one per name; a background is one per collection. */
const keyOf = (list: ListKey, item: unknown): string => {
  if (list === 'customVariables') return (item as CustomVariable).name;
  if (list === 'backgrounds') return collectionKey((item as Background).name);
  return (item as { id: string }).id;
};

/** What the review compares: unlike keyOf, a variable whose value changed is a different one. */
const diffKeyOf = (list: ListKey, item: unknown): string => {
  if (list === 'customVariables') { const v = item as CustomVariable; return `${v.name}=${v.value}`; }
  if (list === 'backgrounds') return (item as BgCollection).key;
  return (item as { id: string }).id;
};

const labelOf = (list: ListKey, item: unknown): string => {
  if (list === 'customVariables') { const v = item as CustomVariable; return `${v.name} = ${v.value}`; }
  if (list === 'backgrounds') return collectionName((item as BgCollection).key);
  return (item as { name: string }).name;
};

const itemsIn = (list: ListKey, d: Draft): unknown[] => (list === 'backgrounds' ? collectionsOf(d.backgrounds) : d[list]);

interface Change { label: string; n: number }
interface ChangeLine { prefix: string; name: string; struck?: boolean; isNew?: boolean; undo: () => void }

interface Props {
  projects: Project[];
  onClose: () => void;
  /** Called after Apply has written to the projects, so the page can re-read them. */
  onSaved: () => void;
}

export const BulkEditProjectsDialog = ({ projects: allProjects, onClose, onSaved }: Props) => {
  const { showSnackbar } = useSnackbar();
  const initial = useMemo(
    () => Object.fromEntries(allProjects.map((p) => [p.id, draftOf(p)])) as Record<string, Draft>,
    [allProjects],
  );
  // Projects taken out of the selection from the header; they are left out of everything below.
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [pendingRemoval, setPendingRemoval] = useState<Project | null>(null);
  const projects = allProjects.filter((p) => !removedIds.includes(p.id));
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initial);
  const [section, setSection] = useState<Section>('info');
  const [showProjects, setShowProjects] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [addingTemplates, setAddingTemplates] = useState(false);
  const [addingLogos, setAddingLogos] = useState<LogoSlot | null>(null);
  const [addingBackgrounds, setAddingBackgrounds] = useState(false);
  const [addingCollection, setAddingCollection] = useState(false);
  /** Collection sizes being generated ("<collection key>|<template id>"), and the size open in the preview. */
  const [generating, setGenerating] = useState<ReadonlyMap<string, number>>(new Map());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!generating.size) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [generating.size]);
  const [previewSize, setPreviewSize] = useState<{ key: string; templateId: string } | null>(null);
  const [addingLifestyle, setAddingLifestyle] = useState(false);
  // Alert settings are a layout for now: they start on their defaults and hold what is picked while the dialog is open, nothing more.
  const [alertSettings, setAlertSettings] = useState<{ alerts: boolean; autoSend: boolean; brand: string | null; bodyQc: string | null; creativeQc: string | null }>(
    { alerts: true, autoSend: true, brand: 'BMW', bodyQc: 'Alert Body QC Group', creativeQc: 'Creative QC' },
  );
  const [showChanges, setShowChanges] = useState(false);
  const [changesQuery, setChangesQuery] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [addingVar, setAddingVar] = useState(false);
  const [varName, setVarName] = useState('');
  const [varValue, setVarValue] = useState('');

  const ids = projects.map((p) => p.id);
  const all = ids.map((id) => drafts[id]);
  const dirty = removedIds.length > 0 || ids.some((id) => !same(drafts[id], initial[id]));

  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (previewSize) setPreviewSize(null); else if (confirmDiscard) setConfirmDiscard(false); else if (pendingRemoval) setPendingRemoval(null); else if (addingBackgrounds) setAddingBackgrounds(false); else if (addingLifestyle) setAddingLifestyle(false); else if (addingTemplates) setAddingTemplates(false); else if (addingLogos) setAddingLogos(null); else if (showChanges) setShowChanges(false); else if (showProjects) setShowProjects(false); else requestClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const patchAll = (patch: Partial<Draft>) =>
    setDrafts((prev) => Object.fromEntries(ids.map((id) => [id, { ...prev[id], ...patch }])));
  const patchEach = (fn: (d: Draft, id: string) => Partial<Draft>) =>
    setDrafts((prev) => Object.fromEntries(ids.map((id) => [id, { ...prev[id], ...fn(prev[id], id) }])));
  // ── Fields ────────────────────────────────────────────────────────────────
  const owners = useMemo(() => {
    const byName = new Map<string, string>();
    MOCK_TEAMMATES.forEach((t) => byName.set(t.name, t.avatarUrl));
    PROJECTS.forEach((p) => { if (!byName.has(p.creator)) byName.set(p.creator, p.creatorAvatar); });
    return byName;
  }, []);

  const changedKeys = (keys: (keyof Draft)[]) =>
    ids.some((id) => keys.some((k) => !same(drafts[id][k], initial[id][k])));
  const fmt = (v: unknown) => String(v || '\u2014');
  /** What a field's value reads as: a status by its label. */
  const shown = (key: keyof Draft, v: unknown) => (key === 'workflowStatus' ? statusLabel(v as ProjectWorkflowStatus) : fmt(v));
  const metaOf = (key: 'creator' | 'workflowStatus'): FieldMeta => {
    return {
      changed: changedKeys([key]), mixed: common(ids.map((id) => shown(key, drafts[id][key]))) === undefined,
    };
  };

  /** The status menu: the statuses a bulk edit can set, plus any status the selection already has that is not among them. */
  const statusOptions = [...new Set([...STATUS_OPTIONS.map((o) => o.label), ...all.map((d) => statusLabel(d.workflowStatus))])];

  // ── Defaults ──────────────────────────────────────────────────────────────
  const refs = projects.map((p) => ({ id: p.id, name: p.projectName }));

  /** A project's background sizes follow its templates: a template brings its size of every collection the project has. */
  const sizesFor = (d: Draft, added: Template[]): Background[] => {
    const keys = [...new Set(d.backgrounds.map((b) => collectionKey(b.name)))];
    return keys.flatMap((k) => collectionBackgrounds(k, added)).filter((b) => !d.backgrounds.some((x) => x.id === b.id));
  };

  const removeFrom = (list: ListKey, key: string, only?: string) =>
    patchEach((d, id) => {
      if (only && id !== only) return {};
      const kept = { [list]: (d[list] as unknown[]).filter((i) => keyOf(list, i) !== key) };
      // Taking a template away takes its background size with it.
      return list === 'templates' ? { ...kept, backgrounds: d.backgrounds.filter((b) => b.templateId !== key) } : kept;
    });
  const applyToAll = (list: ListKey, key: string, only?: string) => {
    if (list === 'backgrounds') {
      // The whole collection comes along, in the sizes of each project's own templates.
      patchEach((d, id) => {
        if (only && id !== only) return {};
        const add = collectionBackgrounds(key, d.templates).filter((b) => !d.backgrounds.some((x) => x.id === b.id));
        return { backgrounds: [...d.backgrounds, ...add] };
      });
      return;
    }
    if (list === 'templates') {
      const template = [...all, ...ids.map((id) => initial[id])].flatMap((d) => d.templates).find((t) => t.id === key);
      if (!template) return;
      patchEach((d, id) => ((only && id !== only) || d.templates.some((t) => t.id === key)
        ? {}
        : { templates: [...d.templates, template], backgrounds: [...d.backgrounds, ...sizesFor(d, [template])] }));
      return;
    }
    const item = [...all, ...ids.map((id) => initial[id])].flatMap((d) => d[list] as unknown[]).find((i) => keyOf(list, i) === key);
    patchEach((d, id) => ((only && id !== only) || (d[list] as unknown[]).some((i) => keyOf(list, i) === key)
      ? {}
      : { [list]: [...(d[list] as unknown[]), item] }));
  };

  const setVariableValue = (name: string, value: string) =>
    patchEach((d) => ({ customVariables: d.customVariables.map((v) => (v.name === name ? { ...v, value } : v)) }));
  const variableValue = (name: string) =>
    common(all.flatMap((d) => d.customVariables.filter((v) => v.name === name).map((v) => v.value)));

  const addVariable = () => {
    const name = varName.trim();
    if (!name) return;
    const v: CustomVariable = { id: `var-${Date.now()}`, name, value: varValue };
    // A variable has one value per name: adding over an existing name replaces it.
    patchEach((d) => ({ customVariables: [...d.customVariables.filter((x) => x.name !== name), v] }));
    setVarName(''); setVarValue(''); setAddingVar(false);
  };
  const cancelVariable = () => { setVarName(''); setVarValue(''); setAddingVar(false); };

  // Templates: everything the library has that no selected project carries yet.
  const templatesToAdd = TEMPLATES.filter((t) => !all.some((d) => d.templates.some((x) => x.id === t.id)));
  const addTemplates = (templateIds: string[]) => {
    const picked = TEMPLATES.filter((t) => templateIds.includes(t.id));
    patchEach((d) => {
      const added = picked.filter((t) => !d.templates.some((x) => x.id === t.id));
      return { templates: [...d.templates, ...added], backgrounds: [...d.backgrounds, ...sizesFor(d, added)] };
    });
  };

  // Logos: a library logo is added to a type ("slot"), under an id that remembers which one.
  const libraryIdOf = (id: string) => id.split('@')[0];
  const logosToAdd = (slot: LogoSlot) => LOGO_LIBRARY.filter((l) => !all.some((d) => d.logos.some((x) => x.slot === slot && libraryIdOf(x.id) === l.id)));
  const addLogos = (slot: LogoSlot, libraryIds: string[]) => {
    const picked = LOGO_LIBRARY.filter((l) => libraryIds.includes(l.id)).map((l) => ({ ...l, id: `${l.id}@${slot}`, slot }));
    patchEach((d) => ({ logos: [...d.logos, ...picked.filter((l) => !d.logos.some((x) => x.id === l.id))] }));
  };
  const logoDate = (id: string, k: 'startDate' | 'endDate') =>
    common(all.flatMap((d) => d.logos.filter((l) => l.id === id).map((l) => l[k] ?? '')));
  const setLogoDates = (id: string, startDate: string, endDate: string) =>
    patchEach((d) => ({ logos: d.logos.map((l) => (l.id === id ? { ...l, startDate, endDate } : l)) }));

  // Backgrounds: collections the list does not have yet, added at every size of each project's templates.
  const addCollection = (key: string) => {
    patchEach((d) => ({ backgrounds: [...d.backgrounds, ...collectionBackgrounds(key, d.templates).filter((b) => !d.backgrounds.some((x) => x.id === b.id))] }));
    setAddingCollection(false);
  };

  /** The sizes a collection has across the selected projects, in template order. */
  const sizesOf = (key: string): Template[] =>
    TEMPLATES.filter((t) => all.some((d) => d.backgrounds.some((b) => b.templateId === t.id && collectionKey(b.name) === key)));
  /** Templates a collection has no size for, with the projects that have both the collection and the template. */
  const missingSizes = (key: string): { template: Template; projects: number }[] =>
    TEMPLATES.map((t) => ({
      template: t,
      projects: all.filter((d) => d.backgrounds.some((b) => collectionKey(b.name) === key)
        && d.templates.some((x) => x.id === t.id) && !d.backgrounds.some((b) => b.templateId === t.id && collectionKey(b.name) === key)).length,
    })).filter((m) => m.projects > 0);
  const generateSize = async (key: string, template: Template) => {
    const busy = `${key}|${template.id}`;
    if (generating.has(busy)) return;
    setNow(Date.now());
    setGenerating((prev) => new Map(prev).set(busy, Date.now()));
    try {
      // Recompose the collection's size closest in proportions to the one being made.
      const ratio = template.width / template.height;
      const sources = all.flatMap((d) => d.backgrounds).filter((b) => collectionKey(b.name) === key && b.url);
      const closest = (b: Background) => {
        const t = TEMPLATES.find((x) => x.id === b.templateId);
        return t ? Math.abs(Math.log(t.width / t.height / ratio)) : Infinity;
      };
      const source = [...sources].sort((x, y) => closest(x) - closest(y))[0];
      const made = generatedBackground(key, template);
      if (!source || !made) throw new Error('This collection has no size to generate from.');
      const url = await generateBackgroundSize(source.url, template.width, template.height, collectionName(key));
      const generated = { ...made, url };
      patchEach((d) => (d.backgrounds.some((b) => collectionKey(b.name) === key) && d.templates.some((t) => t.id === template.id)
        && !d.backgrounds.some((b) => b.templateId === template.id && collectionKey(b.name) === key)
        ? { backgrounds: [...d.backgrounds, generated] } : {}));
    } catch {
      showSnackbar({ message: 'Generation failed. Please try again.', duration: 3000 });
    } finally {
      setGenerating((prev) => { const next = new Map(prev); next.delete(busy); return next; });
    }
  };
  const previewBackground = previewSize
    ? all.flatMap((d) => d.backgrounds).find((b) => b.templateId === previewSize.templateId && collectionKey(b.name) === previewSize.key)
    : undefined;
  const previewTemplate = previewSize ? TEMPLATES.find((t) => t.id === previewSize.templateId) : undefined;

  // Individual backgrounds from the portal: only sizes some selected project has a template for, and only
  // projects with that template receive them — there is no way to push one onto a project without its size.
  const backgroundOptions = (): BackgroundOption[] =>
    BACKGROUND_COLLECTIONS.flatMap((c) => collectionBackgrounds(c.key, TEMPLATES).map((bg) => {
      const withSize = all.filter((d) => d.templates.some((t) => t.id === bg.templateId));
      return {
        background: bg, name: c.name, template: TEMPLATES.find((t) => t.id === bg.templateId)!,
        withSize: withSize.length, reaches: withSize.filter((d) => !d.backgrounds.some((x) => x.id === bg.id)).length, projectCount: n,
      };
    })).filter((o) => o.reaches > 0);
  const addBackgrounds = (backgroundIds: string[]) => {
    const picked = BACKGROUND_COLLECTIONS.flatMap((c) => collectionBackgrounds(c.key, TEMPLATES)).filter((b) => backgroundIds.includes(b.id));
    patchEach((d) => ({
      backgrounds: [...d.backgrounds, ...picked.filter((b) => d.templates.some((t) => t.id === b.templateId) && !d.backgrounds.some((x) => x.id === b.id))],
    }));
  };

  // Lifestyle: media of a specific vehicle, from the portal, that no selected project carries yet.
  const lifestyleToAdd = LIFESTYLE_LIBRARY.filter((l) => !all.some((d) => d.lifestyle.some((x) => x.id === l.id)));
  const addLifestyle = (lifestyleIds: string[]) => {
    const picked = LIFESTYLE_LIBRARY.filter((l) => lifestyleIds.includes(l.id));
    patchEach((d) => ({ lifestyle: [...d.lifestyle, ...picked.filter((l) => !d.lifestyle.some((x) => x.id === l.id))] }));
  };
  const setIgnoreProduct = (key: keyof IgnoreProduct, value: boolean) =>
    patchEach((d) => ({ ignoreProduct: { ...d.ignoreProduct, [key]: value } }));

  const group = <T,>(list: ListKey) =>
    groupDefaults<T>(refs, (id) => itemsIn(list, drafts[id]) as T[], (i) => (list === 'customVariables' ? keyOf(list, i) : diffKeyOf(list, i)),
      (i) => (list === 'customVariables' ? (i as CustomVariable).name : labelOf(list, i)),
      (id) => itemsIn(list, initial[id]) as T[]);
  const g = {
    customVariables: group<CustomVariable>('customVariables'),
    templates: group<Template>('templates'),
    backgrounds: group<BgCollection>('backgrounds'),
    logos: group<ProjectLogo>('logos'),
    audio: group<ProjectAudio>('audio'),
    lifestyle: group<LifestyleItem>('lifestyle'),
  };

  /** Why adding would change nothing: a collection already has every size of the project. */
  const addBlocked = (list: ListKey, key: string, only?: string): string | undefined => {
    if (list !== 'backgrounds') return undefined;
    const lacks = (d: Draft) => collectionBackgrounds(key, d.templates).some((b) => !d.backgrounds.some((x) => x.id === b.id));
    if (only) return lacks(drafts[only]) ? undefined : 'This project already has it.';
    return all.some(lacks) ? undefined : 'Already present in all selected projects.';
  };

  const handlers = (list: ListKey) => ({
    projects: refs,
    addBlocked: (key: string) => addBlocked(list, key),
    onRemoveAll: (key: string) => removeFrom(list, key),
    onRemoveFrom: (key: string, id: string) => removeFrom(list, key, id),
    onApplyToAll: (key: string) => applyToAll(list, key),
    onAddTo: (key: string, id: string) => applyToAll(list, key, id),
    addBlockedFor: (key: string, id: string) => addBlocked(list, key, id),
  });

  // ── Selection ─────────────────────────────────────────────────────────────
  const goTo = (next: Section) => { setSection(next); setSelected(new Set()); setAddingBackgrounds(false); setAddingCollection(false); setAddingLifestyle(false); };
  const toggleSelected = (key: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (!next.delete(key)) next.add(key);
    return next;
  });
  /** Lifestyle shares the Backgrounds section, so a selected key may belong to either list. */
  const listOfKey = (key: string): ListKey | null => {
    if (section === 'info' || section === 'alerts') return null;
    return section === 'backgrounds' && g.lifestyle.some((x) => x.key === key) ? 'lifestyle' : section;
  };
  const selectable: { list: ListKey; key: string; count: number }[] = section === 'info' || section === 'alerts' ? [] : [
    ...g[section].map((x) => ({ list: section as ListKey, key: x.key, count: x.projectIds.length })),
    ...(section === 'backgrounds' ? g.lifestyle.map((x) => ({ list: 'lifestyle' as ListKey, key: x.key, count: x.projectIds.length })) : []),
  ];
  const canAddSelected = selectable.some((x) => selected.has(x.key) && x.count < projects.length && !addBlocked(x.list, x.key));
  const addSelectedToAll = () => {
    selected.forEach((key) => { const list = listOfKey(key); if (list) applyToAll(list, key); });
    setSelected(new Set());
  };
  const removeSelectedFromAll = () => {
    selected.forEach((key) => { const list = listOfKey(key); if (list) removeFrom(list, key); });
    setSelected(new Set());
  };

  // ── What changed ──────────────────────────────────────────────────────────
  /** Per item, how many more or fewer projects have it now than when opened. */
  const diffOf = (get: (d: Draft) => unknown[], key: (i: unknown) => string, label: (i: unknown) => string) => {
    const count = (src: Record<string, Draft>) => {
      const m = new Map<string, Change>();
      ids.forEach((id) => get(src[id]).forEach((i) => {
        const k = key(i);
        const e = m.get(k);
        if (e) e.n += 1; else m.set(k, { label: label(i), n: 1 });
      }));
      return m;
    };
    const before = count(initial);
    const now = count(drafts);
    const added: Change[] = [];
    const removed: Change[] = [];
    now.forEach((v, k) => { const was = before.get(k)?.n ?? 0; if (v.n > was) added.push({ label: v.label, n: v.n - was }); });
    before.forEach((v, k) => { const is = now.get(k)?.n ?? 0; if (v.n > is) removed.push({ label: v.label, n: v.n - is }); });
    return { added, removed };
  };

  const diffs = {
    customVariables: diffOf((d) => itemsIn('customVariables', d), (i) => diffKeyOf('customVariables', i), (i) => labelOf('customVariables', i)),
    templates: diffOf((d) => itemsIn('templates', d), (i) => diffKeyOf('templates', i), (i) => labelOf('templates', i)),
    backgrounds: diffOf((d) => itemsIn('backgrounds', d), (i) => diffKeyOf('backgrounds', i), (i) => labelOf('backgrounds', i)),
    logos: diffOf((d) => itemsIn('logos', d), (i) => diffKeyOf('logos', i), (i) => labelOf('logos', i)),
    audio: diffOf((d) => itemsIn('audio', d), (i) => diffKeyOf('audio', i), (i) => labelOf('audio', i)),
    lifestyle: diffOf((d) => itemsIn('lifestyle', d), (i) => diffKeyOf('lifestyle', i), (i) => labelOf('lifestyle', i)),
  };
  const countOf = (d: { added: Change[]; removed: Change[] }) => d.added.length + d.removed.length;

  const INFO_FIELDS: { label: string; keys: (keyof Draft)[]; meta: FieldMeta }[] = [
    { label: 'Owner', keys: ['creator', 'creatorAvatar'], meta: metaOf('creator') },
    { label: 'Status', keys: ['workflowStatus'], meta: metaOf('workflowStatus') },
  ];
  const infoChanges = INFO_FIELDS.filter((f) => f.meta.changed).length;
  const dateRange = (l: ProjectLogo) => (l.startDate || l.endDate ? `${l.startDate || '\u2026'} \u2013 ${l.endDate || '\u2026'}` : 'no dates');
  const datesChanged = (was: ProjectLogo | undefined, l: ProjectLogo) =>
    !!was && ((was.startDate ?? '') !== (l.startDate ?? '') || (was.endDate ?? '') !== (l.endDate ?? ''));
  /** Logos whose run dates were edited, on any project: one change each. */
  const logoDateIds = new Set(ids.flatMap((id) => drafts[id].logos.filter((l) => datesChanged(initial[id].logos.find((x) => x.id === l.id), l)).map((l) => l.id)));
  /** Which of "ignore the product placeholder" for images and for videos were switched, on any project: one change each. */
  const IGNORE_FIELDS: { key: keyof IgnoreProduct; label: string }[] = [
    { key: 'images', label: 'Lifestyle images' },
    { key: 'videos', label: 'Lifestyle videos' },
  ];
  const ignoreChanged = IGNORE_FIELDS.filter((f) => ids.some((id) => drafts[id].ignoreProduct[f.key] !== initial[id].ignoreProduct[f.key]));
  /** Lifestyle sits in the Backgrounds section, so its changes count there. */
  const lifestyleChanges = countOf(diffs.lifestyle) + ignoreChanged.length;
  const sectionChanges = (s: Section) => (s === 'info' ? infoChanges : s === 'alerts' ? 0
    : countOf(diffs[s]) + (s === 'logos' ? logoDateIds.size : 0) + (s === 'backgrounds' ? lifestyleChanges : 0));
  const totalChanges = infoChanges + logoDateIds.size + lifestyleChanges + NAV.reduce((sum, s) => sum + countOf(diffs[s.id]), 0);

  /** Undoes one change on one project, leaving everything else as edited. */
  const patchOne = (id: string, fn: (d: Draft) => Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...fn(prev[id]) } }));
  const idOf = (i: unknown) => (i as { id: string }).id;

  /** What will change on one project, as lines for the review card. */
  const projectChanges = (id: string): ChangeLine[] => {
    const lines: ChangeLine[] = [];
    INFO_FIELDS.forEach((f) => {
      if (f.keys.some((k) => !same(drafts[id][k], initial[id][k]))) {
        lines.push({
          prefix: `${f.label}: `, name: `${shown(f.keys[0], initial[id][f.keys[0]])} \u2192 ${shown(f.keys[0], drafts[id][f.keys[0]])}`,
          undo: () => patchOne(id, () => Object.fromEntries(f.keys.map((k) => [k, initial[id][k]]))),
        });
      }
    });

    ([...NAV, { id: 'lifestyle' as const, label: 'Lifestyle' }] as { id: ListKey; label: string }[]).forEach(({ id: list, label }) => {
      if (list === 'customVariables') {
        // One line per variable: a changed value reads "old → new" instead of a removal plus an addition.
        const was = initial[id].customVariables;
        const now = drafts[id].customVariables;
        const names = [...new Set([...was, ...now].map((v) => v.name))];
        names.forEach((name) => {
          const before = was.find((v) => v.name === name);
          const after = now.find((v) => v.name === name);
          if (before && after && before.value === after.value) return;
          const restore = () => patchOne(id, (d) => ({
            customVariables: [...d.customVariables.filter((v) => v.name !== name), ...(before ? [before] : [])],
          }));
          if (before && after) lines.push({ prefix: `${label}: `, name: `${name}: ${before.value} \u2192 ${after.value}`, undo: restore });
          else if (after) lines.push({ prefix: `${label}: `, name: `${name} = ${after.value}`, isNew: true, undo: restore });
          else if (before) lines.push({ prefix: `${label}: `, name: `${name} = ${before.value}`, struck: true, undo: restore });
        });
        return;
      }
      const before = itemsIn(list, initial[id]);
      const now = itemsIn(list, drafts[id]);
      const was = new Set(before.map((i) => diffKeyOf(list, i)));
      const is = new Set(now.map((i) => diffKeyOf(list, i)));
      now.filter((i) => !was.has(diffKeyOf(list, i))).forEach((i) => lines.push({
        prefix: `${label}: `, name: labelOf(list, i), isNew: true,
        undo: () => patchOne(id, (d) => ({ [list]: (d[list] as unknown[]).filter((x) => keyOf(list, x) !== diffKeyOf(list, i)) })),
      }));
      before.filter((i) => !is.has(diffKeyOf(list, i))).forEach((i) => lines.push({
        prefix: `${label}: `, name: labelOf(list, i), struck: true,
        // Put back every item of it (a background collection has one per size).
        undo: () => patchOne(id, (d) => {
          const have = new Set((d[list] as unknown[]).map(idOf));
          const back = (initial[id][list] as unknown[]).filter((x) => keyOf(list, x) === diffKeyOf(list, i) && !have.has(idOf(x)));
          return { [list]: [...(d[list] as unknown[]), ...back] };
        }),
      }));
    });
    IGNORE_FIELDS.forEach((f) => {
      const was = initial[id].ignoreProduct[f.key];
      const now = drafts[id].ignoreProduct[f.key];
      if (was === now) return;
      lines.push({
        prefix: 'Lifestyle: ', name: `Ignore product placeholder for ${f.label.toLowerCase().replace('lifestyle ', '')}: ${was ? 'Yes' : 'No'} \u2192 ${now ? 'Yes' : 'No'}`,
        undo: () => patchOne(id, (d) => ({ ignoreProduct: { ...d.ignoreProduct, [f.key]: was } })),
      });
    });
    drafts[id].logos.forEach((l) => {
      const was = initial[id].logos.find((x) => x.id === l.id);
      if (!was || !datesChanged(was, l)) return;
      lines.push({
        prefix: 'Logos: ', name: `${l.name} dates ${dateRange(was)} \u2192 ${dateRange(l)}`,
        undo: () => patchOne(id, (d) => ({ logos: d.logos.map((x) => (x.id === l.id ? { ...x, startDate: was.startDate, endDate: was.endDate } : x)) })),
      });
    });
    return lines;
  };
  const changedProjects = projects.map((p) => ({ p, lines: projectChanges(p.id) })).filter((x) => x.lines.length > 0);
  /** The Changes popover after its search: a project that matches shows all its lines, otherwise only the lines that match. */
  const visibleChanges = (() => {
    const q = changesQuery.trim().toLowerCase();
    if (!q) return changedProjects;
    return changedProjects.flatMap(({ p, lines }) => {
      if (p.projectName.toLowerCase().includes(q)) return [{ p, lines }];
      const hits = lines.filter((l) => `${l.prefix}${l.name}`.toLowerCase().includes(q));
      return hits.length ? [{ p, lines: hits }] : [];
    });
  })();

  const save = () => {
    projects.forEach((p) => {
      const d = drafts[p.id];
      Object.assign(p, {
        accountName: d.accountName, accountUrl: d.accountUrl, brandTag: d.brandTag, projectName: d.projectName,
        creator: d.creator, creatorAvatar: d.creatorAvatar, startDate: d.startDate, endDate: d.endDate, isEvergreen: d.isEvergreen,
        workflowStatus: d.workflowStatus,
        templates: d.templates, backgrounds: d.backgrounds, lastUpdated: 'Just now',
      });
      saveProjectExtras(p.id, { tags: d.tags, customVariables: d.customVariables, logos: d.logos, audio: d.audio, lifestyle: d.lifestyle, ignoreProduct: d.ignoreProduct });
    });
    showSnackbar({ message: `${projects.length} project${projects.length === 1 ? '' : 's'} updated` });
    onSaved();
    onClose();
  };

  const n = projects.length;
  const plural = n === 1 ? '' : 's';

  const button = (primary: boolean) => ({
    borderRadius: '100px', textTransform: 'none' as const,
    ...(primary ? { background: PURPLE, '&:hover': { background: '#3d3396' } } : { color: PURPLE, borderColor: 'rgba(99,86,225,0.5)' }),
  });

  // ── Views ─────────────────────────────────────────────────────────────────
  const infoView = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
        <Field label="Owner">
          <MixedSelect label="Owner" options={[...owners.keys()]}
            renderOption={(name) => (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 14, fontFamily: FONT, color: '#1f1d25' }}>
                {owners.get(name)
                  ? <img src={owners.get(name)} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <ProjectAvatar name={name} id={name} size={24} />}
                {name}
              </span>
            )}
            value={common(all.map((d) => d.creator))}
            onChange={(v) => patchAll({ creator: v, creatorAvatar: owners.get(v) ?? '' })} />
        </Field>
        <Field label="Status">
          <MixedSelect label="Status" options={statusOptions} renderOption={(label) => <StatusPill label={label} />}
            value={common(all.map((d) => statusLabel(d.workflowStatus)))}
            onChange={(v) => {
              const next = STATUS_OPTIONS.find((o) => o.label === v)?.value;
              if (next) patchAll({ workflowStatus: next });
            }} />
        </Field>
      </div>
    </div>
  );

  /** A picture at its own proportions, as wide as the thumbnail (or as tall, when it is the taller of the two), on its light grey. */
  const ratioImg = (src: string, width: number, height: number) => (
    <div style={{ width: '100%', height: '100%', background: '#f0f2f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={src} alt="" style={{
        aspectRatio: `${width} / ${height}`, objectFit: 'cover', display: 'block',
        ...(width >= height ? { width: '100%', height: 'auto' } : { height: '100%', width: 'auto' }),
      }} />
    </div>
  );
  const alertField = (label: string, options: string[], key: 'brand' | 'bodyQc' | 'creativeQc', hint: string) => (
    <Field label={label} hint={hint}>
      <MixedSelect label={label} options={options} value={alertSettings[key] ?? undefined}
        onChange={(v) => setAlertSettings((prev) => ({ ...prev, [key]: v }))} />
    </Field>
  );
  const alertSwitch = (label: string, key: 'alerts' | 'autoSend', hint: string) => (
    <div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <Switch size="small" checked={alertSettings[key]} onChange={(e) => setAlertSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: PURPLE }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: PURPLE } }} />
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>{label}</span>
      </label>
      {/* 40px switch + 8px gap: the description lines up with the label. */}
      <div style={{ margin: '2px 0 0 48px', fontSize: 12, fontFamily: FONT, color: '#686576', lineHeight: 1.5 }}>{hint}</div>
    </div>
  );
  const alertsView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '50%', minWidth: 480 }}>
      {alertSwitch('Alerts enabled', 'alerts', 'Signal and New Offers alerts generate for this project. Turn it off to pause generation without losing the brand or QC groups.')}
      {alertSwitch('Auto-send enabled', 'autoSend', 'Approved alerts queue for sending automatically once both QC groups approve them. Turning this off cancels queued sends that have not gone out yet.')}
      {alertField('Brand', ['BMW'], 'brand', 'Only this brand\u2019s signals are written to this project. Leave blank to make it the account\u2019s catch-all alert project.')}
      {alertField('Alert Body QC group', ['Alert Body QC Group'], 'bodyQc', 'Platform group that reviews the alert body of this project\'s alerts.')}
      {alertField('Creative QC group', ['Creative QC'], 'creativeQc', 'Platform group that reviews the assets of this project\'s alerts.')}
    </div>
  );

  const thumbImg = (src: string, contain?: boolean) => (
    <img src={src} alt="" style={{ width: contain ? '70%' : '100%', height: contain ? '70%' : '100%', objectFit: contain ? 'contain' : 'cover' }} />
  );
  const Overline = ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: 0, fontSize: 12, fontFamily: FONT, color: '#1f1d25', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 2.66 }}>{children}</p>
  );

  const logoGroups = (slot: ProjectLogo['slot']) => g.logos.filter((x) => x.item.slot === slot);

  /** The template as a scaled-down, aspect-correct preview — the same one the template cards use. */
  const templateThumb = (t: Template) => {
    const wide = t.width >= t.height;
    const Preview = TEMPLATE_REGISTRY[t.id]?.Preview;
    return (
      <div style={{ width: CARD_SIZE, height: CARD_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', flexShrink: 0, width: wide ? '100%' : `${(t.width / t.height) * 100}%`, height: wide ? `${(t.height / t.width) * 100}%` : '100%' }}>
          {Preview ? <Preview /> : <div style={{ width: '100%', height: '100%', background: '#e8eaed' }} />}
        </div>
      </div>
    );
  };

  const variableFields = (
    f: { name: string; type: string; value: string },
    on: { name?: (v: string) => void; value: (v: string) => void },
    placeholder?: string,
    locked?: boolean,
  ) => (
    <div style={VAR_GRID}>
      <Labeled label="Name">
        <TextField size="small" fullWidth value={f.name} disabled={!on.name} onChange={(e) => on.name?.(e.target.value)}
          slotProps={{ htmlInput: { 'aria-label': 'Name' } }} sx={fieldSx()} />
      </Labeled>
      <Labeled label="Type">
        <TextField size="small" select fullWidth value={f.type} slotProps={{ htmlInput: { 'aria-label': 'Type' } }} sx={fieldSx()}>
          <MenuItem value="Text">Text</MenuItem>
        </TextField>
      </Labeled>
      <Labeled label="Default value">
        <TextField size="small" fullWidth value={f.value} placeholder={placeholder} disabled={locked}
          onChange={(e) => on.value(e.target.value)}
          slotProps={{ htmlInput: { 'aria-label': 'Default value' } }} sx={fieldSx()} />
      </Labeled>
    </div>
  );

  const listView = (
    <>
      {section === 'customVariables' && (
        <DefaultsGroupList<CustomVariable> {...handlers('customVariables')} selected={selected} onToggle={toggleSelected} layout="list" groups={g.customVariables}
          title={(v) => v.name}
          emptyText={addingVar ? '' : 'No custom variables on the selected projects.'}
          renderRow={(v, grp) => variableFields(
            { name: v.name, type: 'Text', value: grp.projectIds.length ? variableValue(v.name) ?? '' : v.value },
            { value: (val) => setVariableValue(v.name, val) },
            grp.projectIds.length && variableValue(v.name) === undefined ? MIXED : undefined,
            grp.projectIds.length === 0,
          )}
          extraRow={addingVar && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {variableFields({ name: varName, type: 'Text', value: varValue }, { name: setVarName, value: setVarValue })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40 }}>
                <Button size="small" variant="contained" disableElevation startIcon={<Check style={{ fontSize: 16 }} />}
                  disabled={!varName.trim()} onClick={addVariable}
                  sx={{ textTransform: 'none', fontSize: 13, borderRadius: '100px', background: PURPLE, '&:hover': { background: '#3d3396' } }}>
                  {n > 1 ? `Add to ${n} projects` : 'Add'}
                </Button>
                <IconButton size="small" aria-label="Cancel new variable" onClick={cancelVariable}><Close style={{ fontSize: 20, color: '#1f1d25' }} /></IconButton>
              </div>
            </div>
          )} />
      )}
      {section === 'templates' && (
        <DefaultsGroupList<Template> {...handlers('templates')} selected={selected} onToggle={toggleSelected} layout="cards" groups={g.templates}
          visual={templateThumb}
          title={(t) => t.name} subtitle={(t) => `${t.width} x ${t.height}`}
          emptyText="No templates on the selected projects." />
      )}
      {section === 'backgrounds' && (
        <>
          {addingCollection && (
            <AddCollectionBar available={BACKGROUND_COLLECTIONS.filter((c) => !g.backgrounds.some((x) => x.key === c.key))}
              projectCount={n} onAdd={addCollection} onCancel={() => setAddingCollection(false)} />
          )}
          <Overline>Collections ({g.backgrounds.length})</Overline>
          <DefaultsGroupList<BgCollection> {...handlers('backgrounds')} selected={selected} onToggle={toggleSelected} layout="cards" groups={g.backgrounds}
            visual={(c) => ratioImg(c.url, c.width, c.height)}
            title={(c) => collectionName(c.key)}
            subtitle={(c) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {sizesOf(c.key).map((t) => (
                  <button key={t.id} type="button" aria-label={`Preview ${collectionName(c.key)} at ${t.width} x ${t.height}`}
                    onClick={() => setPreviewSize({ key: c.key, templateId: t.id })}
                    style={{ border: 'none', cursor: 'pointer', background: '#eceaf0', color: '#4b4958', borderRadius: 100, padding: '1px 8px', fontSize: 11, fontFamily: FONT, lineHeight: 1.6 }}>
                    {t.width} x {t.height}
                  </button>
                ))}
              </div>
            )}
            footer={(c) => {
              const missing = missingSizes(c.key);
              if (!missing.length) return null;
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {missing.map(({ template: t, projects: count }) => {
                    const busy = generating.has(`${c.key}|${t.id}`);
                    return (
                      <Tooltip key={t.id} title={`No ${t.width} x ${t.height} size${n > 1 ? ` in ${count} project${count === 1 ? '' : 's'}` : ''}. Generate it with AI.`}>
                        <Chip variant="outlined" size="small" disabled={busy} onClick={() => generateSize(c.key, t)}
                          label={(
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              {t.width} x {t.height}
                              <IconButton size="small" aria-label={`Generate ${t.width} x ${t.height} with AI`} disabled={busy} sx={{ p: 0.25, color: 'inherit' }}>
                                {busy ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome style={{ fontSize: 14 }} />}
                              </IconButton>
                            </span>
                          )}
                          sx={{ fontFamily: FONT, fontSize: 11, color: '#686576', borderColor: '#c9c6d3', borderStyle: 'dashed', '& .MuiChip-label': { pr: 0.5 } }} />
                      </Tooltip>
                    );
                  })}
                </div>
              );
            }}
            emptyText="No backgrounds on the selected projects." />

          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
              <Overline>Lifestyle ({g.lifestyle.length})</Overline>
              <AddButton label="Add lifestyle" onClick={() => setAddingLifestyle(true)} />
            </div>
            <div style={{ margin: '4px 0 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>Ignore product placeholder</div>
              <div style={{ display: 'flex', gap: 24, marginTop: 2 }}>
                {IGNORE_FIELDS.map((f) => {
                  const every = all.every((d) => d.ignoreProduct[f.key]);
                  const some = all.some((d) => d.ignoreProduct[f.key]);
                  return (
                    <FormControlLabel key={f.key} sx={{ ml: -1, '& .MuiFormControlLabel-label': { fontFamily: FONT, fontSize: 14 } }} label={f.label}
                      control={(
                        <Checkbox size="small" checked={every} indeterminate={some && !every} onChange={() => setIgnoreProduct(f.key, !every)}
                          sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PURPLE } }} />
                      )} />
                  );
                })}
              </div>
            </div>
            <DefaultsGroupList<LifestyleItem> {...handlers('lifestyle')} selected={selected} onToggle={toggleSelected} layout="cards" groups={g.lifestyle}
              visual={(l) => (
                <>
                  {ratioImg(l.poster, l.width, l.height)}
                  {l.kind === 'video' && (
                    <span aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,18,30,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlayArrow style={{ fontSize: 26, color: '#fff' }} />
                    </span>
                  )}
                </>
              )}
              title={(l) => l.name} subtitle={(l) => `${l.width} x ${l.height} | ${l.kind === 'video' ? 'Video' : 'Image'}`}
              emptyText="No lifestyle yet on the selected projects." />
          </div>
        </>
      )}
      {section === 'logos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {LOGO_SLOTS.map((slot) => (
            <div key={slot}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <Overline>{slot} ({logoGroups(slot).length})</Overline>
                <AddButton label="Add logos" onClick={() => setAddingLogos(slot)} />
              </div>
              <DefaultsGroupList<ProjectLogo> {...handlers('logos')} selected={selected} onToggle={toggleSelected} layout="cards" groups={logoGroups(slot)}
                visual={(l) => thumbImg(l.src ?? bmwLogoSrc, true)}
                title={(l) => l.name} subtitle={(l) => l.scope}
                emptyText="No logos yet for this type."
                footer={slot === 'Event Logo' ? (l) => (
                  <div style={{ marginTop: 4 }}>
                    <Labeled label="Active Dates">
                      <MixedDateRange label={`${l.name} active dates`}
                        start={logoDate(l.id, 'startDate')} end={logoDate(l.id, 'endDate')}
                        onChange={(from, to) => setLogoDates(l.id, from, to)} />
                    </Labeled>
                  </div>
                ) : undefined} />
            </div>
          ))}
        </div>
      )}
      {section === 'audio' && (
        <DefaultsGroupList<ProjectAudio> {...handlers('audio')} selected={selected} onToggle={toggleSelected} layout="rows" groups={g.audio}
          title={(a) => a.name}
          renderRow={(a) => <AudioPlayerRow label={a.placeholder} name={a.name} seconds={a.seconds} />}
          emptyText="No audio on the selected projects." />
      )}
    </>
  );

  return ReactDOM.createPortal(
    <>
      <div onClick={requestClose} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }} />
      <div
        role="dialog" aria-label="Edit projects"
        style={{
          position: 'fixed', inset: 16, zIndex: 100001, background: '#ffffff', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16, fontFamily: FONT, fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', whiteSpace: 'nowrap' }}>
              Edit {n} project{plural}
            </span>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => { setShowProjects((v) => !v); setProjectQuery(''); }} aria-expanded={showProjects} aria-haspopup="dialog"
                aria-label={`Selected projects, ${n}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, height: 32, padding: '0 8px 0 5px', border: '1px solid #d8d5e6', borderRadius: 100,
                  background: showProjects ? '#f4f2ff' : '#fff', cursor: 'pointer', color: '#1f1d25', fontSize: 13, fontWeight: 500, fontFamily: FONT,
                }}>
                <span style={{ display: 'inline-flex' }}>
                  {projects.slice(0, 2).map((p, i) => (
                    <span key={p.id} style={{ marginLeft: i ? -8 : 0, display: 'inline-flex' }}><ProjectAvatar name={p.projectName} id={p.id} size={22} ring /></span>
                  ))}
                  {n > 2 && (
                    <span aria-hidden="true" style={{ marginLeft: -8, width: 22, height: 22, borderRadius: '50%', background: '#e9e6ff', color: '#2f2688', fontSize: 10, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxSizing: 'border-box' }}>+{n - 2}</span>
                  )}
                </span>
                {n}
                <ExpandMore style={{ fontSize: 18, transform: showProjects ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
              </button>
              {showProjects && <div onClick={() => setShowProjects(false)} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />}
              <div role="dialog" aria-label="Selected projects" style={{
                position: 'absolute', zIndex: 6, left: 0, top: 'calc(100% + 8px)', width: 300, background: '#fff', borderRadius: 12, border: '1px solid #e1ddf0', padding: 8,
                boxShadow: '0 14px 34px rgba(31,29,37,0.22)',
                opacity: showProjects ? 1 : 0, transform: showProjects ? 'none' : 'translateY(6px)', visibility: showProjects ? 'visible' : 'hidden',
                transition: 'opacity .18s, transform .18s, visibility .18s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 10px', border: '1px solid #e1ddf0', borderRadius: 8 }}>
                  <Search style={{ fontSize: 16, color: '#8c8999' }} />
                  <input value={projectQuery} onChange={(e) => setProjectQuery(e.target.value)} placeholder="Find a project" aria-label="Find a project"
                    style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 13, fontFamily: FONT, color: '#1f1d25', background: 'transparent' }} />
                </div>
                <div style={{ marginTop: 6, maxHeight: 230, overflowY: 'auto' }}>
                  {projects.filter((p) => p.projectName.toLowerCase().includes(projectQuery.trim().toLowerCase())).map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 4px 4px 8px', borderRadius: 8 }}>
                      <ProjectAvatar name={p.projectName} id={p.id} size={22} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontFamily: FONT, color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.projectName}</span>
                      {n > 1 && (
                        <IconButton size="small" aria-label={`Remove ${p.projectName} from this edit`} onClick={() => setPendingRemoval(p)}
                          sx={{ '&:hover': { color: '#d2323f', background: '#fdeaec' } }}>
                          <DeleteOutlined style={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <Button variant="outlined" size="small" disabled={totalChanges === 0} aria-expanded={showChanges} aria-haspopup="dialog"
                onClick={() => { setShowChanges((v) => !v); setChangesQuery(''); }}
                sx={{
                  color: PURPLE, borderColor: 'rgba(99,86,225,0.5)', borderRadius: '100px', padding: '3px 6px 3px 12px', gap: '8px',
                  fontSize: 13, fontFamily: FONT, fontWeight: 500, letterSpacing: '0.46px', textTransform: 'none', whiteSpace: 'nowrap', lineHeight: '22px',
                  '&:hover': { borderColor: PURPLE, background: 'rgba(99,86,225,0.04)' },
                }}>
                Changes
                <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: PURPLE, color: '#fff', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', boxSizing: 'border-box' }}>{totalChanges}</span>
              </Button>
              {showChanges && totalChanges > 0 && (
                <>
                  <div onClick={() => { setShowChanges(false); setChangesQuery(''); }} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />
                  <div role="dialog" aria-label="Changes to apply" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 6, width: 420, background: '#fff', borderRadius: 12, border: '1px solid #e1ddf0', overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(31,29,37,0.22)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ece9f3' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>{totalChanges} change{totalChanges === 1 ? '' : 's'} to apply</span>
                      <span style={{ flex: 1 }} />
                      <Button size="small" onClick={() => { setDrafts(initial); setShowChanges(false); }} sx={{ textTransform: 'none', fontSize: 13, color: PURPLE, minWidth: 0 }}>Undo all</Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, margin: '10px 16px 0', padding: '0 10px', border: '1px solid #e1ddf0', borderRadius: 8 }}>
                      <Search style={{ fontSize: 16, color: '#8c8999' }} />
                      <input value={changesQuery} onChange={(e) => setChangesQuery(e.target.value)} placeholder="Search projects or items" aria-label="Search changes"
                        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 13, fontFamily: FONT, color: '#1f1d25', background: 'transparent' }} />
                      {changesQuery && (
                        <IconButton size="small" aria-label="Clear search" onClick={() => setChangesQuery('')} sx={{ padding: '2px' }}>
                          <Close style={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {visibleChanges.length === 0 && (
                        <p style={{ margin: 0, fontSize: 13, fontFamily: FONT, color: '#686576' }}>No changes match this search.</p>
                      )}
                      {visibleChanges.map(({ p, lines }) => (
                        <div key={p.id}>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, color: '#1f1d25' }}>{p.projectName}</div>
                          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {lines.map((l, i) => {
                              const kind = l.struck ? CHANGE_KINDS.removed : l.isNew ? CHANGE_KINDS.added : CHANGE_KINDS.changed;
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontFamily: FONT, color: '#686576', lineHeight: 1.5, padding: '2px 0' }}>
                                  <kind.Icon aria-label={kind.label} role="img" style={{ fontSize: 20, color: kind.color, flexShrink: 0 }} />
                                  <span style={{ flex: 1, minWidth: 0 }}>
                                    {l.prefix.replace(/:\s*$/, '')} {'\u00b7'}{' '}
                                    <b style={{ fontWeight: 700, color: '#1f1d25', textDecoration: l.struck ? 'line-through' : undefined }}>{l.name}</b>
                                  </span>
                                  <IconButton size="small" aria-label={`Undo ${l.prefix}${l.name}`} onClick={l.undo} sx={{ padding: '4px', flexShrink: 0, color: '#686576', '&:hover': { color: PURPLE, background: 'rgba(71,59,171,0.1)' } }}>
                                    <Undo style={{ fontSize: 16 }} />
                                  </IconButton>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <IconButton size="small" aria-label="Close" onClick={requestClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
              <Close style={{ fontSize: 18, color: '#1f1d25' }} />
            </IconButton>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <nav aria-label="Sections" style={{ width: 240, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
            <NavItem label="Project Info" active={section === 'info'} changes={infoChanges} onClick={() => goTo('info')} />
            <NavItem label="Alert Settings" active={section === 'alerts'} changes={0} onClick={() => goTo('alerts')} />
            {NAV.map((s) => (
              <NavItem key={s.id} label={s.label} active={section === s.id} count={g[s.id].length}
                changes={sectionChanges(s.id)} onClick={() => goTo(s.id)} />
            ))}
          </nav>

          <section style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16 }}>
            <SectionHeading
              title={section === 'info' ? 'Project Info' : section === 'alerts' ? 'Alert Settings' : NAV.find((x) => x.id === section)!.label}
              description={section === 'info' || section === 'alerts' ? undefined
                : `${NAV.find((x) => x.id === section)!.description}${n > 1 ? ' Each default is listed once, with how many of the selected projects have it.' : ''}`}
              action={
                selected.size > 0 ? <SelectionBar count={selected.size} bulk={n > 1} canAdd={canAddSelected} onClear={() => setSelected(new Set())} onAdd={addSelectedToAll} onRemove={removeSelectedFromAll} />
                  : section === 'customVariables' ? <AddButton label="Add variable" disabled={addingVar} onClick={() => setAddingVar(true)} />
                  : section === 'templates' ? <AddButton label="Add templates" onClick={() => setAddingTemplates(true)} />
                  : section === 'backgrounds' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <AddButton label="Add backgrounds" onClick={() => setAddingBackgrounds(true)} />
                      <AddButton label="Add collection" disabled={addingCollection} onClick={() => setAddingCollection(true)} />
                    </div>
                  )
                  : section === 'audio' ? <AddButton label="Add audio" />
                  : undefined
              } />
            {section === 'info' ? infoView : section === 'alerts' ? alertsView : listView}
          </section>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <div style={{ flex: 1 }} />
          <Button variant="outlined" onClick={requestClose} sx={button(false)}>Cancel</Button>
          <Button variant="contained" disableElevation disabled={totalChanges === 0} onClick={save} sx={button(true)}>Apply changes</Button>
        </div>
      </div>
      {addingLifestyle && (
        <AddLifestyleDialog items={lifestyleToAdd} onClose={() => setAddingLifestyle(false)}
          onAdd={(lifestyleIds) => { addLifestyle(lifestyleIds); setAddingLifestyle(false); }} />
      )}
      {addingBackgrounds && (
        <AddBackgroundsDialog options={backgroundOptions()} onClose={() => setAddingBackgrounds(false)}
          onAdd={(backgroundIds) => { addBackgrounds(backgroundIds); setAddingBackgrounds(false); }} />
      )}
      {addingTemplates && (
        <AddTemplatesDialog open inset={16} zIndex={100005} projectTemplateIds={new Set<string>()} availableTemplates={templatesToAdd}
          onClose={() => setAddingTemplates(false)} onAdd={addTemplates} />
      )}
      {addingLogos && (
        <AddLogosDialog logos={logosToAdd(addingLogos)} onClose={() => setAddingLogos(null)}
          onAdd={(libraryIds) => { addLogos(addingLogos, libraryIds); setAddingLogos(null); }} />
      )}
      {pendingRemoval && (
        <ConfirmModal id="remove-project" title={`Remove ${pendingRemoval.projectName} from this edit?`}
          body="All changes made in this edit so far will not be applied to this project. It will keep its current values."
          confirmLabel="Remove project"
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => { setRemovedIds((r) => [...r, pendingRemoval.id]); setPendingRemoval(null); }} />
      )}
      {generating.size > 0 && ReactDOM.createPortal(
        <div role="status" style={{ position: 'fixed', left: 24, bottom: 24, zIndex: 100030, background: '#1f1d25', color: '#fff', fontFamily: FONT, fontSize: 14, padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CircularProgress size={16} color="inherit" />
          {(() => {
            const left = Math.max(...[...generating.values()].map((start) => GENERATION_ESTIMATE_S - Math.floor((now - start) / 1000)));
            return left > 0 ? `Generating background. Estimated time remaining: ${left}s.` : 'Generating background. Finishing up\u2026';
          })()}
        </div>,
        document.body,
      )}
      {previewSize && previewBackground && previewTemplate && ReactDOM.createPortal(
        <div role="dialog" aria-label="Size preview" onClick={() => setPreviewSize(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100020, background: 'rgba(10,9,16,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <IconButton aria-label="Close preview" onClick={() => setPreviewSize(null)} sx={{ position: 'absolute', top: 16, right: 16, color: '#fff' }}><Close /></IconButton>
          <img src={previewBackground.url} alt={`${collectionName(previewSize.key)} ${previewTemplate.width} x ${previewTemplate.height}`} onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 640, height: 'auto', aspectRatio: `${previewTemplate.width} / ${previewTemplate.height}`, objectFit: 'cover', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
          <div style={{ color: '#fff', fontFamily: FONT, fontSize: 14 }}>{collectionName(previewSize.key)} &middot; {previewTemplate.width} x {previewTemplate.height}</div>
        </div>,
        document.body,
      )}
      {confirmDiscard && (
        <ConfirmModal id="discard-changes" title="Discard your changes?" destructive
          body={`The changes you made to ${n} project${n === 1 ? '' : 's'} will be lost. Nothing has been applied yet.`}
          confirmLabel="Discard changes"
          onCancel={() => setConfirmDiscard(false)} onConfirm={onClose} />
      )}
    </>,
    document.body,
  );
};
