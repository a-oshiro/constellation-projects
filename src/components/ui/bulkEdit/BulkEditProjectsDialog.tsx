import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Autocomplete, Button, Checkbox, Chip, FormControlLabel, IconButton, MenuItem, TextField } from '@mui/material';
import {
  Add, Check, Close, DeleteOutlined, ExpandMore, Search, Undo,
} from '@mui/icons-material';
import { PROJECTS } from '../../../data/projects';
import type { Project } from '../../../data/projects';
import type { Background, Template } from '../../../data/types';
import { ACCOUNTS } from '../../../data/accounts';
import { BACKGROUNDS, MOCK_TEAMMATES } from '../../../data/mockData';
import { getProjectExtras, saveProjectExtras } from '../../../data/projectDefaults';
import type { CustomVariable, ProjectAudio, ProjectLogo } from '../../../data/projectDefaults';
import { useSnackbar } from '../../../context/SnackbarContext';
import bmwLogoSrc from '../../../assets/bmw-logo.png';
import { TEMPLATE_REGISTRY } from '../../../templates';
import { AudioPlayerRow } from './AudioPlayerRow';
import { ProjectAvatar } from './ProjectAvatar';
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
  tags: string[];
  templates: Template[];
  backgrounds: Background[];
  customVariables: CustomVariable[];
  logos: ProjectLogo[];
  audio: ProjectAudio[];
}

type ListKey = 'templates' | 'backgrounds' | 'customVariables' | 'logos' | 'audio';
type Section = 'info' | ListKey;

const FONT = 'Roboto, sans-serif';

const ADDED = { tag: 'ADDED', bg: '#e3f4ea', ink: '#1b6b3a' };
const REMOVED = { tag: 'REMOVED', bg: '#fdeaec', ink: '#b32833' };
const CHANGED = { tag: 'CHANGED', bg: '#fff4e5', ink: '#8a4b00' };
const PURPLE = '#473bab';

const draftOf = (p: Project): Draft => {
  const x = getProjectExtras(p);
  return {
    accountName: p.accountName, accountUrl: p.accountUrl, brandTag: p.brandTag, projectName: p.projectName,
    creator: p.creator, creatorAvatar: p.creatorAvatar, startDate: p.startDate, endDate: p.endDate, isEvergreen: !!p.isEvergreen,
    tags: [...x.tags], templates: [...p.templates], backgrounds: [...p.backgrounds],
    customVariables: [...x.customVariables], logos: [...x.logos], audio: [...x.audio],
  };
};

/** The shared value, or undefined when the selection disagrees. */
const common = (values: string[]): string | undefined =>
  values.length > 0 && values.every((v) => v === values[0]) ? values[0] : undefined;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ── Controls ─────────────────────────────────────────────────────────────────

const MIXED = 'Multiple';

const fieldSx = (changed?: boolean) => ({
  '& .MuiOutlinedInput-root': { fontFamily: FONT, fontSize: 15, background: changed ? '#f4f2ff' : '#fff' },
  // A staged change: purple outline, so it reads as "this will be applied".
  ...(changed ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: PURPLE, borderWidth: 2 } } : {}),
  // "Multiple values": the selection disagrees — light grey and italic, so it
  // reads as an absence of a value rather than as a value.
  '& input::placeholder': { fontStyle: 'italic', color: '#8c8999', opacity: 1 },
});

interface FieldMeta { changed: boolean; mixed: boolean; was?: string; wasMixed?: boolean }

const ChangedTag = () => (
  <span style={{ fontSize: 11, fontWeight: 500, fontFamily: FONT, borderRadius: 100, padding: '2px 8px', color: PURPLE, background: '#e9e6ff' }}>Changed</span>
);

/** Label, a "Changed" tag and the "Was … · Undo" line around a control. */
const Field = ({ label, meta, onReset, hint, span, children }: {
  label: string; meta?: FieldMeta; onReset?: () => void; hint?: React.ReactNode; span?: number; children: React.ReactNode;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
    {label && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500, color: '#4b4958', fontFamily: FONT }}>
        {label}
        {meta?.changed && <ChangedTag />}
      </div>
    )}
    {children}
    {(meta?.changed || hint) && (
      <div style={{ fontSize: 12, color: '#686576', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {meta?.changed ? (
          <>
            {meta.was !== undefined ? `Was ${meta.was} ·` : 'Edited ·'}
            <button type="button" onClick={onReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: PURPLE, fontSize: 12, fontWeight: 500, fontFamily: FONT }}>
              <Undo style={{ fontSize: 13 }} />{meta.wasMixed ? 'Keep each' : 'Undo'}
            </button>
          </>
        ) : hint}
      </div>
    )}
  </div>
);

const MixedText = ({ label, value, onChange, disabled, placeholder, changed }: {
  label: string; value: string | undefined; onChange?: (v: string) => void;
  disabled?: boolean; placeholder?: string; changed?: boolean;
}) => (
  <TextField
    size="small" fullWidth value={value ?? ''} disabled={disabled}
    placeholder={value === undefined ? MIXED : placeholder}
    onChange={(e) => onChange?.(e.target.value)}
    slotProps={{ htmlInput: { 'aria-label': label } }} sx={fieldSx(changed)}
  />
);

const MixedSelect = ({ label, options, value, onChange, changed }: {
  label: string; options: string[]; value: string | undefined; onChange: (v: string) => void; changed?: boolean;
}) => (
  <Autocomplete
    size="small" fullWidth disableClearable options={options}
    value={(value ?? null) as unknown as string}
    onChange={(_, v) => v && onChange(v)}
    renderInput={(params) => (
      <TextField {...params} placeholder={value === undefined ? MIXED : undefined}
        slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, 'aria-label': label } }} sx={fieldSx(changed)} />
    )}
  />
);

const toIso = (text: string) => {
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** A date input that can say "Multiple values": a native date control cannot
 *  show placeholder text, so while mixed it is a text field until focused. */
const MixedDate = ({ label, value, onChange, changed }: {
  label: string; value: string | undefined; onChange: (v: string) => void; changed?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const mixed = value === undefined;
  return (
    <TextField
      size="small" fullWidth
      type={mixed && !focused ? 'text' : 'date'}
      value={mixed ? '' : toIso(value)}
      placeholder={mixed ? MIXED : undefined}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onChange={(e) => e.target.value && onChange(fromIso(e.target.value))}
      slotProps={{ htmlInput: { 'aria-label': label } }} sx={fieldSx(changed)}
    />
  );
};

// ── Dialog ───────────────────────────────────────────────────────────────────

const NAV: { id: ListKey; label: string; description: string }[] = [
  { id: 'customVariables', label: 'Custom Variables', description: 'Values passed into every entry\u2019s templates unless the entry overrides them.' },
  { id: 'templates', label: 'Templates', description: 'What every entry renders from \u2014 and what decides the background sizes and logo slots.' },
  { id: 'backgrounds', label: 'Backgrounds', description: 'The pool entries draw their backgrounds from. Each collection brings a size for every template of the project.' },
  { id: 'logos', label: 'Logos', description: 'The logo pool each placeholder may draw from, matched per entry by vehicle model.' },
  { id: 'audio', label: 'Audio', description: 'Template defaults and vehicle-matched Lifestyle audio for each audio placeholder.' },
];

const LOGO_SLOTS: ProjectLogo['slot'][] = ['Primary Logo', 'Secondary Logo', 'Event Logo'];

/** Backgrounds named "<size> Background N" are one creative at different sizes:
 *  they are added and removed together, as a collection. */
const collectionKey = (name: string) => {
  const m = name.match(/Background\s*(\d+)$/i);
  return m ? `Background ${m[1]}` : name;
};
interface BgCollection { key: string; url: string; sizes: number }
const collectionsOf = (bgs: Background[]): BgCollection[] => {
  const m = new Map<string, BgCollection>();
  bgs.forEach((b) => {
    const key = collectionKey(b.name);
    const e = m.get(key);
    if (e) e.sizes += 1; else m.set(key, { key, url: b.url, sizes: 1 });
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
  if (list === 'backgrounds') return (item as BgCollection).key;
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
  const [showChanges, setShowChanges] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [addingVar, setAddingVar] = useState(false);
  const [varName, setVarName] = useState('');
  const [varValue, setVarValue] = useState('');

  const ids = projects.map((p) => p.id);
  const all = ids.map((id) => drafts[id]);
  const dirty = removedIds.length > 0 || ids.some((id) => !same(drafts[id], initial[id]));

  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (confirmDiscard) setConfirmDiscard(false); else if (pendingRemoval) setPendingRemoval(null); else if (showChanges) setShowChanges(false); else if (showProjects) setShowProjects(false); else requestClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const patchAll = (patch: Partial<Draft>) =>
    setDrafts((prev) => Object.fromEntries(ids.map((id) => [id, { ...prev[id], ...patch }])));
  const patchEach = (fn: (d: Draft, id: string) => Partial<Draft>) =>
    setDrafts((prev) => Object.fromEntries(ids.map((id) => [id, { ...prev[id], ...fn(prev[id], id) }])));
  /** Puts fields back to what each project had when the dialog opened. */
  const reset = (keys: (keyof Draft)[]) =>
    setDrafts((prev) => Object.fromEntries(ids.map((id) => [
      id, { ...prev[id], ...Object.fromEntries(keys.map((k) => [k, initial[id][k]])) },
    ])));

  // ── Fields ────────────────────────────────────────────────────────────────
  const accountOptions = useMemo(
    () => [...new Set([...ACCOUNTS.map((a) => a.name), ...PROJECTS.map((p) => p.accountName)])].sort(),
    [],
  );
  const brandOptions = useMemo(
    () => [...new Set([...ACCOUNTS.map((a) => a.brand), ...PROJECTS.map((p) => p.brandTag)])].sort(),
    [],
  );
  const owners = useMemo(() => {
    const byName = new Map<string, string>();
    MOCK_TEAMMATES.forEach((t) => byName.set(t.name, t.avatarUrl));
    PROJECTS.forEach((p) => { if (!byName.has(p.creator)) byName.set(p.creator, p.creatorAvatar); });
    return byName;
  }, []);

  const evergreen = new Set(ids.filter((id) => drafts[id].isEvergreen));
  const dated = ids.filter((id) => !evergreen.has(id));
  const endDate = common(dated.map((id) => drafts[id].endDate));

  const commonTags = all[0].tags.filter((t) => all.every((d) => d.tags.includes(t)));
  const partialTags = [...new Set(all.flatMap((d) => d.tags))]
    .filter((t) => !commonTags.includes(t))
    .map((t) => ({ tag: t, n: all.filter((d) => d.tags.includes(t)).length }));

  const changedKeys = (keys: (keyof Draft)[]) =>
    ids.some((id) => keys.some((k) => !same(drafts[id][k], initial[id][k])));
  const fmt = (v: unknown) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || '\u2014'));
  const metaOf = (key: 'accountName' | 'brandTag' | 'projectName' | 'creator' | 'startDate' | 'endDate' | 'isEvergreen'): FieldMeta => {
    const was = common(ids.map((id) => fmt(initial[id][key])));
    return {
      changed: changedKeys([key]), mixed: common(ids.map((id) => fmt(drafts[id][key]))) === undefined,
      was: was ?? MIXED, wasMixed: was === undefined,
    };
  };
  const tagsMeta: FieldMeta = { changed: changedKeys(['tags']), mixed: partialTags.length > 0 };

  // ── Defaults ──────────────────────────────────────────────────────────────
  const refs = projects.map((p) => ({ id: p.id, name: p.projectName }));

  const removeFrom = (list: ListKey, key: string, only?: string) =>
    patchEach((d, id) => (only && id !== only
      ? {}
      : { [list]: (d[list] as unknown[]).filter((i) => keyOf(list, i) !== key) }));
  const applyToAll = (list: ListKey, key: string, only?: string) => {
    if (list === 'backgrounds') {
      // The whole collection comes along, in the sizes of each project's own templates.
      patchEach((d, id) => {
        if (only && id !== only) return {};
        const sizes = new Set(d.templates.map((t) => t.id));
        const add = BACKGROUNDS.filter((b) => collectionKey(b.name) === key && sizes.has(b.templateId) && !d.backgrounds.some((x) => x.id === b.id));
        return { backgrounds: [...d.backgrounds, ...add] };
      });
      return;
    }
    const item = all.flatMap((d) => d[list] as unknown[]).find((i) => keyOf(list, i) === key);
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

  const group = <T,>(list: ListKey) =>
    groupDefaults<T>(refs, (id) => itemsIn(list, drafts[id]) as T[], (i) => (list === 'customVariables' ? keyOf(list, i) : diffKeyOf(list, i)),
      (i) => (list === 'customVariables' ? (i as CustomVariable).name : labelOf(list, i)));
  const g = {
    customVariables: group<CustomVariable>('customVariables'),
    templates: group<Template>('templates'),
    backgrounds: group<BgCollection>('backgrounds'),
    logos: group<ProjectLogo>('logos'),
    audio: group<ProjectAudio>('audio'),
  };

  /** Why adding would change nothing: a background only goes to projects that have a template of its size. */
  const addBlocked = (list: ListKey, key: string, only?: string): string | undefined => {
    if (list !== 'backgrounds') return undefined;
    const fitsIn = (d: Draft) => {
      const sizes = new Set(d.templates.map((t) => t.id));
      return BACKGROUNDS.some((b) => collectionKey(b.name) === key && sizes.has(b.templateId) && !d.backgrounds.some((x) => x.id === b.id));
    };
    if (only) return fitsIn(drafts[only]) ? undefined : 'This project has no template of this size.';
    return all.some(fitsIn) ? undefined : 'The other selected projects have no template of this size.';
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
  const goTo = (next: Section) => { setSection(next); setSelected(new Set()); };
  const toggleSelected = (key: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (!next.delete(key)) next.add(key);
    return next;
  });
  const canAddSelected = section !== 'info' && g[section].some((x) => selected.has(x.key) && x.projectIds.length < projects.length && !addBlocked(section, x.key));
  const addSelectedToAll = () => {
    if (section === 'info') return;
    selected.forEach((key) => applyToAll(section, key));
    setSelected(new Set());
  };
  const removeSelectedFromAll = () => {
    if (section === 'info') return;
    selected.forEach((key) => removeFrom(section, key));
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
    tags: diffOf((d) => d.tags, (i) => String(i), (i) => String(i)),
  };
  const countOf = (d: { added: Change[]; removed: Change[] }) => d.added.length + d.removed.length;

  const INFO_FIELDS: { label: string; keys: (keyof Draft)[]; meta: FieldMeta }[] = [
    { label: 'Account', keys: ['accountName', 'accountUrl'], meta: metaOf('accountName') },
    { label: 'Brand', keys: ['brandTag'], meta: metaOf('brandTag') },
    { label: 'Project name', keys: ['projectName'], meta: metaOf('projectName') },
    { label: 'Owner', keys: ['creator', 'creatorAvatar'], meta: metaOf('creator') },
    { label: 'Start date', keys: ['startDate'], meta: metaOf('startDate') },
    { label: 'End date', keys: ['endDate'], meta: metaOf('endDate') },
    { label: 'Evergreen', keys: ['isEvergreen'], meta: metaOf('isEvergreen') },
  ];
  const infoChanges = INFO_FIELDS.filter((f) => f.meta.changed).length + (tagsMeta.changed ? 1 : 0);
  const sectionChanges = (s: Section) => (s === 'info' ? infoChanges : countOf(diffs[s]));
  const totalChanges = infoChanges + NAV.reduce((sum, s) => sum + countOf(diffs[s.id as ListKey]), 0);

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
          prefix: `${f.label}: `, name: `${fmt(initial[id][f.keys[0]])} \u2192 ${fmt(drafts[id][f.keys[0]])}`,
          undo: () => patchOne(id, () => Object.fromEntries(f.keys.map((k) => [k, initial[id][k]]))),
        });
      }
    });

    const tagsBefore = initial[id].tags;
    const tagsNow = drafts[id].tags;
    tagsNow.filter((t) => !tagsBefore.includes(t)).forEach((t) => lines.push({
      prefix: 'Tags: ', name: t, isNew: true, undo: () => patchOne(id, (d) => ({ tags: d.tags.filter((x) => x !== t) })),
    }));
    tagsBefore.filter((t) => !tagsNow.includes(t)).forEach((t) => lines.push({
      prefix: 'Tags: ', name: t, struck: true, undo: () => patchOne(id, (d) => ({ tags: [...d.tags, t] })),
    }));

    NAV.forEach(({ id: list, label }) => {
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
    return lines;
  };
  const changedProjects = projects.map((p) => ({ p, lines: projectChanges(p.id) })).filter((x) => x.lines.length > 0);

  const save = () => {
    projects.forEach((p) => {
      const d = drafts[p.id];
      Object.assign(p, {
        accountName: d.accountName, accountUrl: d.accountUrl, brandTag: d.brandTag, projectName: d.projectName,
        creator: d.creator, creatorAvatar: d.creatorAvatar, startDate: d.startDate, endDate: d.endDate, isEvergreen: d.isEvergreen,
        templates: d.templates, backgrounds: d.backgrounds, lastUpdated: 'Just now',
      });
      saveProjectExtras(p.id, { tags: d.tags, customVariables: d.customVariables, logos: d.logos, audio: d.audio });
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
        <Field label="Account" meta={INFO_FIELDS[0].meta} onReset={() => reset(['accountName', 'accountUrl'])}>
          <MixedSelect label="Account" options={accountOptions} changed={INFO_FIELDS[0].meta.changed}
            value={common(all.map((d) => d.accountName))}
            onChange={(v) => {
              const acc = ACCOUNTS.find((a) => a.name === v);
              patchAll({ accountName: v, ...(acc ? { accountUrl: `https://${acc.disclosureUrl}` } : {}) });
            }} />
        </Field>
        <Field label="Brand" meta={INFO_FIELDS[1].meta} onReset={() => reset(['brandTag'])}>
          <MixedSelect label="Brand" options={brandOptions} changed={INFO_FIELDS[1].meta.changed}
            value={common(all.map((d) => d.brandTag))} onChange={(v) => patchAll({ brandTag: v })} />
        </Field>
        <Field label="Project name" meta={INFO_FIELDS[2].meta} onReset={() => reset(['projectName'])}>
          <MixedText label="Project name" changed={INFO_FIELDS[2].meta.changed}
            value={common(all.map((d) => d.projectName))} onChange={(v) => patchAll({ projectName: v })} />
        </Field>
        <Field label="Owner" meta={INFO_FIELDS[3].meta} onReset={() => reset(['creator', 'creatorAvatar'])}>
          <MixedSelect label="Owner" options={[...owners.keys()]} changed={INFO_FIELDS[3].meta.changed}
            value={common(all.map((d) => d.creator))}
            onChange={(v) => patchAll({ creator: v, creatorAvatar: owners.get(v) ?? '' })} />
        </Field>
        <Field label="" span={2} meta={INFO_FIELDS[6].meta} onReset={() => reset(['isEvergreen'])}>
          <FormControlLabel sx={{ ml: -1, '& .MuiFormControlLabel-label': { fontFamily: FONT, fontSize: 14 } }}
            control={(
              <Checkbox size="small" checked={all.every((d) => d.isEvergreen)}
                indeterminate={INFO_FIELDS[6].meta.mixed}
                onChange={() => patchAll({ isEvergreen: !all.every((d) => d.isEvergreen) })}
                sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PURPLE } }} />
            )}
            label="Evergreen" />
        </Field>
        <Field label="Start date" meta={INFO_FIELDS[4].meta} onReset={() => reset(['startDate'])}>
          <MixedDate label="Start date" changed={INFO_FIELDS[4].meta.changed}
            value={common(all.map((d) => d.startDate))} onChange={(v) => patchAll({ startDate: v })} />
        </Field>
        {dated.length === 0 ? (
          <Field label="End date" hint={n > 1 ? 'All selected projects are evergreen' : 'Evergreen projects have no end date'}>
            <MixedText label="End date" value="" disabled placeholder="No end date" />
          </Field>
        ) : (
          <Field label="End date" meta={INFO_FIELDS[5].meta} onReset={() => reset(['endDate'])}
            hint={evergreen.size > 0 ? 'Evergreen projects have no end date' : undefined}>
            <MixedDate label="End date" value={endDate} changed={INFO_FIELDS[5].meta.changed}
              onChange={(v) => patchEach((_, id) => (evergreen.has(id) ? {} : { endDate: v }))} />
          </Field>
        )}
        <Field label="Tags" span={2} meta={{ ...tagsMeta, mixed: false }} onReset={() => reset(['tags'])}
          hint={partialTags.length > 0 && (
            <>
              On some projects:
              {partialTags.map((t) => (
                <Chip key={t.tag} size="small" label={`${t.tag} · ${t.n} of ${n}`} sx={{ fontFamily: FONT, background: '#fff4e5', color: '#8a4b00' }} />
              ))}
            </>
          )}>
          <Autocomplete
            multiple freeSolo size="small" options={[] as string[]} value={commonTags}
            onChange={(_, next) => {
              const added = next.filter((t) => !commonTags.includes(t));
              const removed = commonTags.filter((t) => !next.includes(t));
              patchEach((d) => ({
                tags: [...d.tags.filter((t) => !removed.includes(t)), ...added.filter((t) => !d.tags.includes(t))],
              }));
            }}
            renderValue={(value, getItemProps) => value.map((t, i) => {
              const { key, ...rest } = getItemProps({ index: i });
              return <Chip key={key} size="small" label={t} {...rest} />;
            })}
            renderInput={(params) => (
              <TextField {...params} placeholder={commonTags.length ? 'Add a tag' : 'Add tags'}
                slotProps={{ ...params.slotProps, htmlInput: { ...params.slotProps?.htmlInput, 'aria-label': 'Tags' } }}
                sx={fieldSx(tagsMeta.changed)} />
            )}
          />
        </Field>
      </div>

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
        <TextField size="small" fullWidth value={f.value} placeholder={placeholder}
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
          renderRow={(v) => variableFields(
            { name: v.name, type: 'Text', value: variableValue(v.name) ?? '' },
            { value: (val) => setVariableValue(v.name, val) },
            variableValue(v.name) === undefined ? MIXED : undefined,
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
          <Overline>Collections ({g.backgrounds.length})</Overline>
          <DefaultsGroupList<BgCollection> {...handlers('backgrounds')} selected={selected} onToggle={toggleSelected} layout="cards" groups={g.backgrounds}
            visual={(c) => thumbImg(c.url)}
            title={(c) => c.key} subtitle={(c) => `${c.sizes} size${c.sizes === 1 ? '' : 's'}`}
            emptyText="No backgrounds on the selected projects." />
        </>
      )}
      {section === 'logos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {LOGO_SLOTS.map((slot) => (
            <div key={slot}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <Overline>{slot} ({logoGroups(slot).length})</Overline>
                <AddButton label="Add logos" />
              </div>
              <DefaultsGroupList<ProjectLogo> {...handlers('logos')} selected={selected} onToggle={toggleSelected} layout="cards" groups={logoGroups(slot)}
                visual={() => thumbImg(bmwLogoSrc, true)}
                title={(l) => l.name} subtitle={(l) => l.scope}
                emptyText="No logos yet for this placeholder." />
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
                onClick={() => setShowChanges((v) => !v)}
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
                  <div onClick={() => setShowChanges(false)} style={{ position: 'fixed', inset: 0, zIndex: 5 }} />
                  <div role="dialog" aria-label="Changes to apply" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 6, width: 420, background: '#fff', borderRadius: 12, border: '1px solid #e1ddf0', overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(31,29,37,0.22)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ece9f3' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>{totalChanges} change{totalChanges === 1 ? '' : 's'} to apply</span>
                      <span style={{ flex: 1 }} />
                      <Button size="small" onClick={() => { setDrafts(initial); setShowChanges(false); }} sx={{ textTransform: 'none', fontSize: 13, color: PURPLE, minWidth: 0 }}>Undo all</Button>
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto', padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {changedProjects.map(({ p, lines }) => (
                        <div key={p.id}>
                          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: FONT, color: '#1f1d25' }}>{p.projectName}</div>
                          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {lines.map((l, i) => {
                              const kind = l.struck ? REMOVED : l.isNew ? ADDED : CHANGED;
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontFamily: FONT, color: '#686576', lineHeight: 1.5, padding: '2px 0' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: '0.3px', background: kind.bg, color: kind.ink, flexShrink: 0 }}>{kind.tag}</span>
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
            {NAV.map((s) => (
              <NavItem key={s.id} label={s.label} active={section === s.id} count={g[s.id].length}
                changes={sectionChanges(s.id)} onClick={() => goTo(s.id)} />
            ))}
          </nav>

          <section style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16 }}>
            <SectionHeading
              title={section === 'info' ? 'Project Info' : NAV.find((x) => x.id === section)!.label}
              description={section === 'info' ? undefined
                : `${NAV.find((x) => x.id === section)!.description}${n > 1 ? ' Each default is listed once, with how many of the selected projects have it.' : ''}`}
              action={
                selected.size > 0 ? <SelectionBar count={selected.size} bulk={n > 1} canAdd={canAddSelected} onClear={() => setSelected(new Set())} onAdd={addSelectedToAll} onRemove={removeSelectedFromAll} />
                  : section === 'customVariables' ? <AddButton label="Add variable" disabled={addingVar} onClick={() => setAddingVar(true)} />
                  : section === 'templates' ? <AddButton label="Add templates" />
                  : section === 'backgrounds' ? <AddButton label="Add backgrounds" />
                  : section === 'audio' ? <AddButton label="Add audio" />
                  : undefined
              } />
            {section === 'info' ? infoView : listView}
          </section>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <div style={{ flex: 1 }} />
          <Button variant="outlined" onClick={requestClose} sx={button(false)}>Cancel</Button>
          <Button variant="contained" disableElevation disabled={totalChanges === 0} onClick={save} sx={button(true)}>Apply changes</Button>
        </div>
      </div>
      {pendingRemoval && (
        <ConfirmModal id="remove-project" title={`Remove ${pendingRemoval.projectName} from this edit?`}
          body="All changes made in this edit so far will not be applied to this project. It will keep its current values."
          confirmLabel="Remove project"
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => { setRemovedIds((r) => [...r, pendingRemoval.id]); setPendingRemoval(null); }} />
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
