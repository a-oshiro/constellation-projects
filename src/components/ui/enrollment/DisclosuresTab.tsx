import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Alert, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import type {
  DisclosureBlock, DisclosureSnippetMeta, DisclosureSnippetVersion, DisclosureTemplate, EnrollmentSettings,
} from '../../../data/enrollmentSettings';
import {
  buildCombinedDisclosureSource, consolidateDisclosureTemplates, generateDisclosureSnippet, mergeDisclosureReplacements,
} from '../../../utils/disclosureSnippetAI';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { buildVariableColorMap, findActiveVariableKeys } from '../../../utils/disclosureSnippetColors';
import { CURRENT_USER } from '../../../data/mockData';
import { useSnackbar } from '../../../context/SnackbarContext';
import { DisclosureSnippetDialog } from './DisclosureSnippetDialog';
import { DisclosureSnippetEditor } from './DisclosureSnippetEditor';
import type { DisclosureSnippetEditorHandle } from './DisclosureSnippetEditor';
import { DisclosureRawInput } from './DisclosureRawInput';
import { DisclosureWarningsDialog } from './DisclosureWarningsDialog';
import { RemoveSnippetDialog } from './RemoveSnippetDialog';
import { UpdateSnippetDialog } from './UpdateSnippetDialog';
import pageTextLinkIcon from '../../../assets/icons/disclosures/page-text-link.svg';
import pencilIcon from '../../../assets/icons/disclosures/pencil.svg';
import circleXIcon from '../../../assets/icons/disclosures/circle-x.svg';
import chevronTopIcon from '../../../assets/icons/disclosures/chevron-top-small.svg';
import refreshIcon from '../../../assets/icons/disclosures/refresh.svg';

/**
 * Renders a Figma icon asset as a mask, tinted to `color` — matches Figma's "Masked Icon" color overrides.
 * Button icons pass `currentColor` so they follow the button's text color, including its disabled state.
 */
const MaskedIcon = ({ src, size, color = '#473bab' }: { src: string; size: number; color?: string }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-block', width: size, height: size, flexShrink: 0, backgroundColor: color,
      // Quoted — Vite inlines small SVGs as data URIs, which contain characters an unquoted url() can't hold.
      WebkitMaskImage: `url(${JSON.stringify(src)})`, maskImage: `url(${JSON.stringify(src)})`,
      WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    }}
  />
);

// Medium buttons, matching the page footer's other actions (Discard/Save on the other settings pages).
const MEDIUM_BUTTON_BASE_SX = {
  borderRadius: 100, textTransform: 'none', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.4px', lineHeight: '24px', minWidth: 0, whiteSpace: 'nowrap',
  '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '8px' },
};

const OUTLINED_MEDIUM_BUTTON_SX = {
  ...MEDIUM_BUTTON_BASE_SX,
  padding: '5px 15px', color: '#473bab', borderColor: 'rgba(99,86,225,0.5)',
  '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
};

const CONTAINED_MEDIUM_BUTTON_SX = {
  ...MEDIUM_BUTTON_BASE_SX,
  padding: '6px 16px', background: '#473bab', color: '#ffffff',
  '&:hover': { background: '#3d3396' },
  '&.Mui-disabled': { background: 'rgba(17,16,20,0.08)', color: 'rgba(17,16,20,0.38)' },
};

const TEXT_MEDIUM_BUTTON_SX = { ...MEDIUM_BUTTON_BASE_SX, padding: '6px 8px', color: '#473bab' };

const SECTION_CARD_STYLE: CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4,
};

const SUBTITLE2_STYLE: CSSProperties = {
  margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57,
};

const BODY2_SECONDARY_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43,
};

/** Height of each side of the raw/template split view — both scroll independently past it (Figma: 273px). */
const SPLIT_PANE_HEIGHT = 273;

interface DisclosuresTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
  accountName: string;
  accountBrand: string;
}

function buildDefaultSnippetName(accountName: string): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  return `Disclosure Template_${accountName}_${month}${String(now.getFullYear()).slice(-2)}`;
}

/** yyyy-mm-dd (native <input type="date"> value format) for December 31st of the current year. */
function lastDayOfYear(): string {
  return `${new Date().getFullYear()}-12-31`;
}

function buildSnippetMeta(
  name: string,
  accountName: string,
  accountBrand: string,
  sourceText: string,
  replacements: DisclosureReplacement[],
): DisclosureSnippetMeta {
  const now = new Date().toISOString();
  return {
    id: `snippet-${Date.now()}`,
    name,
    tags: [],
    folder: accountName,
    brands: [accountBrand],
    expirationDate: lastDayOfYear(),
    websiteDescription: '',
    websiteNotes: '',
    createdAt: now,
    updatedAt: now,
    createdBy: CURRENT_USER.name,
    sourceText,
    replacements,
  };
}

function buildSnippetVersion(
  name: string,
  text: string,
  sourceText: string,
  replacements: DisclosureReplacement[],
  disclosures: DisclosureBlock[],
): DisclosureSnippetVersion {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name, text, sourceText, replacements, disclosures,
    createdAt: new Date().toISOString(),
    createdBy: CURRENT_USER.name,
  };
}

/** True when the block's template was generated from its current raw text (not stale or still pending). */
const hasCurrentTemplate = (d: DisclosureBlock) => !!d.template && d.text.trim() !== '' && d.template.sourceText === d.text.trim();

export const DisclosuresTab = ({ settings, onChange, accountName, accountBrand }: DisclosuresTabProps) => {
  const { showSnackbar } = useSnackbar();
  const snippet = settings.disclosureSnippet;

  // Async template generations patch whatever the disclosures are when they finish, not what they were
  // when they started — otherwise a result would overwrite edits made to other rows in the meantime.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [generatingIds, setGeneratingIds] = useState<Set<DisclosureBlock['id']>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<DisclosureBlock['id'], string>>>({});
  // Only one disclosure type card is open at a time — expanding another closes it.
  const [expandedId, setExpandedId] = useState<DisclosureBlock['id'] | null>('lease');
  // `closeMessage` — the dialog opened straight after the snippet was generated or updated, so closing it
  // confirms that with a snackbar (matching the Figma flow's "Done" → "Snippet generated.").
  const [snippetDialog, setSnippetDialog] = useState<{ closeMessage?: string } | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const patchDisclosure = (id: DisclosureBlock['id'], patch: Partial<DisclosureBlock>) => {
    const disclosures = settingsRef.current.disclosures.map((d) => (d.id === id ? { ...d, ...patch } : d));
    // Updated right away (not on the next render) so two templates finishing back to back don't overwrite each other.
    settingsRef.current = { ...settingsRef.current, disclosures };
    onChangeRef.current({ disclosures });
  };

  // Reads the latest template (not the render's closure) so a text change and a new replacement made by the same editor action both land.
  const patchTemplate = (id: DisclosureBlock['id'], patch: Partial<DisclosureTemplate>) => {
    const template = settingsRef.current.disclosures.find((d) => d.id === id)?.template;
    if (template) patchDisclosure(id, { template: { ...template, ...patch } });
  };

  const addTemplateReplacement = (id: DisclosureBlock['id'], replacement: DisclosureReplacement) => {
    const replacements = settingsRef.current.disclosures.find((d) => d.id === id)?.template?.replacements ?? [];
    if (replacements.some((r) => r.key === replacement.key && r.original === replacement.original)) return;
    patchTemplate(id, { replacements: [...replacements, replacement] });
  };

  const setGenerating = (id: DisclosureBlock['id'], generating: boolean) => {
    setGeneratingIds((prev) => {
      if (prev.has(id) === generating) return prev;
      const next = new Set(prev);
      if (generating) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const generateTemplate = async (id: DisclosureBlock['id'], sourceText: string) => {
    setGenerating(id, true);
    setErrors((e) => ({ ...e, [id]: undefined }));
    try {
      const { snippet: text, replacements, issues } = await generateDisclosureSnippet(sourceText);
      // Dropped if the raw text changed while this was in flight — a newer generation is already queued.
      const current = settingsRef.current.disclosures.find((d) => d.id === id);
      if (current?.text.trim() !== sourceText) return;
      patchDisclosure(id, { template: { text, replacements, sourceText, issues, generatedAt: new Date().toISOString() } });
    } catch (err) {
      if (settingsRef.current.disclosures.find((d) => d.id === id)?.text.trim() !== sourceText) return;
      setErrors((e) => ({ ...e, [id]: err instanceof Error ? err.message : 'Something went wrong while generating this template.' }));
    } finally {
      if (settingsRef.current.disclosures.find((d) => d.id === id)?.text.trim() === sourceText) setGenerating(id, false);
    }
  };

  // Raw text that arrived without a matching template (pre-filled disclosures) gets one generated on first view.
  const initialGenerationRef = useRef(false);
  useEffect(() => {
    if (initialGenerationRef.current) return;
    initialGenerationRef.current = true;
    settingsRef.current.disclosures
      .filter((d) => d.text.trim() !== '' && !hasCurrentTemplate(d))
      .forEach((d) => generateTemplate(d.id, d.text.trim()));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRawTextChange = (d: DisclosureBlock, value: string) => {
    if (value.trim() === '') {
      patchDisclosure(d.id, { text: value, template: null });
      setGenerating(d.id, false);
      setErrors((e) => ({ ...e, [d.id]: undefined }));
      return;
    }
    // Typing into an empty disclosure makes this user its author.
    patchDisclosure(d.id, d.text.trim() === '' ? { text: value, addedBy: 'internal' } : { text: value });
  };

  // The template is (re)built once the user leaves the raw text, not on every keystroke.
  const handleRawTextBlur = (id: DisclosureBlock['id']) => {
    const d = settingsRef.current.disclosures.find((b) => b.id === id);
    const trimmed = d?.text.trim() ?? '';
    if (!d || trimmed === '' || hasCurrentTemplate(d) || generatingIds.has(id)) return;
    generateTemplate(id, trimmed);
  };

  const toggleExpanded = (id: DisclosureBlock['id']) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // The account snippet is every included template combined, with anything repeated across them written once.
  const included = useMemo(
    () => settings.disclosures.filter((d) => d.includeInSnippet && hasCurrentTemplate(d)),
    [settings.disclosures],
  );
  const consolidated = useMemo(() => ({
    text: consolidateDisclosureTemplates(included.map((d) => d.template!.text)),
    sourceText: buildCombinedDisclosureSource(included.map((d) => ({ label: d.label, text: d.text.trim() }))),
    replacements: mergeDisclosureReplacements(included.map((d) => d.template!.replacements)),
  }), [included]);

  const anyGenerating = generatingIds.size > 0;
  const canGenerate = included.length > 0 && !anyGenerating;
  const blockStatus = (d: DisclosureBlock): DisclosureSnippetStatus | null => {
    if (changedBlocks.some((c) => c.id === d.id)) return 'edited';
    if (!snippet || d.text.trim() === '') return null;
    const saved = snippet.disclosures.find((s) => s.id === d.id);
    return saved?.includeInSnippet && saved.template ? 'applied' : 'not_applied';
  };

  // Disclosure types edited since the snippet was last generated/updated (raw text, template, or "Apply to automated offers").
  const changedBlocks = useMemo(() => {
    if (!snippet) return [];
    return settings.disclosures.filter((d) => {
      const saved = snippet.disclosures.find((s) => s.id === d.id);
      return !saved || saved.text !== d.text || saved.includeInSnippet !== d.includeInSnippet || saved.template?.text !== d.template?.text;
    });
  }, [settings.disclosures, snippet]);

  const handleGenerateSnippet = () => {
    const meta = buildSnippetMeta(
      buildDefaultSnippetName(accountName), accountName, accountBrand, consolidated.sourceText, consolidated.replacements,
    );
    const version = buildSnippetVersion(meta.name, consolidated.text, meta.sourceText, meta.replacements, settings.disclosures);
    onChange({ disclosureSnippet: { meta, text: consolidated.text, disclosures: settings.disclosures, versions: [version] } });
    setExpandedId(null);
    setSnippetDialog({ closeMessage: 'Snippet generated.' });
  };

  /** Confirmed from the Update Snippet dialog — `text` is the rebuilt snippet, possibly edited there. */
  const handleConfirmUpdate = (text: string) => {
    if (!snippet) return;
    onChange({
      disclosureSnippet: {
        meta: {
          ...snippet.meta,
          sourceText: consolidated.sourceText,
          replacements: consolidated.replacements,
          updatedAt: new Date().toISOString(),
        },
        text,
        disclosures: settings.disclosures,
        versions: [
          ...snippet.versions,
          buildSnippetVersion(snippet.meta.name, text, consolidated.sourceText, consolidated.replacements, settings.disclosures),
        ],
      },
    });
    setUpdateOpen(false);
    setExpandedId(null);
    showSnackbar({ message: 'Snippet updated.' });
  };

  /** Saved from the snippet dialog: the edited text/metadata become a new version, built from the same disclosures. */
  const handleSnippetSave = (text: string, meta: DisclosureSnippetMeta) => {
    if (!snippet) return;
    const version = buildSnippetVersion(meta.name, text, meta.sourceText, meta.replacements, snippet.disclosures);
    onChange({ disclosureSnippet: { ...snippet, meta, text, versions: [...snippet.versions, version] } });
  };

  /**
   * Restoring a previous version copies it forward as a new current version (history is never rewritten)
   * and brings back the disclosures it was built from, on this page too.
   */
  const handleRestoreVersion = (versionId: string) => {
    if (!snippet) return;
    const restored = snippet.versions.find((v) => v.id === versionId);
    if (!restored) return;
    const version = buildSnippetVersion(
      snippet.meta.name, restored.text, restored.sourceText, restored.replacements, restored.disclosures,
    );
    setGeneratingIds(new Set());
    setErrors({});
    onChange({
      disclosures: restored.disclosures,
      disclosureSnippet: {
        ...snippet,
        meta: { ...snippet.meta, sourceText: restored.sourceText, replacements: restored.replacements, updatedAt: version.createdAt },
        text: restored.text,
        disclosures: restored.disclosures,
        versions: [...snippet.versions, version],
      },
    });
    showSnackbar({ message: 'Version restored.' });
  };

  /** Restores every disclosure to how it was when the snippet was last generated/updated. */
  const handleDiscardChanges = () => {
    if (!snippet) return;
    setGeneratingIds(new Set());
    setErrors({});
    onChange({ disclosures: snippet.disclosures });
  };

  const labelList = (blocks: DisclosureBlock[]) => blocks.map((d, i) => (
    <span key={d.id}>
      {i > 0 && (i === blocks.length - 1 ? ' and ' : ', ')}
      <strong style={{ fontWeight: 700 }}>{d.label}</strong>
    </span>
  ));

  let footer: ReactNode;
  if (!snippet) {
    footer = (
      <>
        <p style={{ ...BODY2_SECONDARY_STYLE, flex: 1, minWidth: 0 }}>
          {included.length === 0 ? 'Add disclosures to generate snippet.' : (
            <>Template created for {labelList(included)} {included.length === 1 ? 'disclosure' : 'disclosures'}. Generate snippet to apply.</>
          )}
        </p>
        <Button
          variant="outlined"
          startIcon={<MaskedIcon src={pageTextLinkIcon} size={20} color="currentColor" />}
          sx={OUTLINED_MEDIUM_BUTTON_SX}
        >
          Select Existing Snippet
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={!canGenerate}
          onClick={handleGenerateSnippet}
          startIcon={<AutoAwesome style={{ fontSize: 18 }} />}
          sx={CONTAINED_MEDIUM_BUTTON_SX}
        >
          Generate Snippet
        </Button>
      </>
    );
  } else if (changedBlocks.length > 0) {
    footer = (
      <>
        <p style={{ ...BODY2_SECONDARY_STYLE, flex: 1, minWidth: 0 }}>
          Changes made to {labelList(changedBlocks)} {changedBlocks.length === 1 ? 'disclosure' : 'disclosures'}. Update snippet to apply.
          <br />
          If you exit, all changes will be lost.
        </p>
        <Button variant="text" onClick={handleDiscardChanges} sx={TEXT_MEDIUM_BUTTON_SX}>
          Discard Changes
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={anyGenerating || included.length === 0}
          onClick={() => setUpdateOpen(true)}
          startIcon={<MaskedIcon src={refreshIcon} size={20} color="currentColor" />}
          sx={CONTAINED_MEDIUM_BUTTON_SX}
        >
          Update Snippet
        </Button>
      </>
    );
  } else {
    // Snippet up to date: the actions stay visible but disabled until a disclosure is edited.
    footer = (
      <>
        <p style={{ ...BODY2_SECONDARY_STYLE, flex: 1, minWidth: 0 }}>
          Edit disclosure templates to update the snippet.
        </p>
        <Button variant="text" disabled sx={{ ...TEXT_MEDIUM_BUTTON_SX, '&.Mui-disabled': { color: 'rgba(17,16,20,0.38)' } }}>
          Discard Changes
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled
          startIcon={<MaskedIcon src={refreshIcon} size={20} color="currentColor" />}
          sx={CONTAINED_MEDIUM_BUTTON_SX}
        >
          Update Snippet
        </Button>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%', boxSizing: 'border-box' }}>
      <div style={{ ...SECTION_CARD_STYLE, gap: 8 }}>
        <p style={SUBTITLE2_STYLE}>Automated Offers Snippet</p>
        {snippet ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8,
            border: '1px solid #473bab', background: 'rgba(99,86,225,0.08)',
          }}>
            <img src={pageTextLinkIcon} width={20} height={20} alt="" style={{ flexShrink: 0 }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0, overflow: 'hidden',
              fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.17px', lineHeight: 1.43,
            }}>
              <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{accountName} Snippet:</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{snippet.meta.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 28 }}>
              <IconButton aria-label="Edit snippet" onClick={() => setSnippetDialog({})} sx={{ padding: '5px' }}>
                <MaskedIcon src={pencilIcon} size={20} />
              </IconButton>
              <IconButton aria-label="Remove snippet" onClick={() => setRemoveOpen(true)} sx={{ padding: '5px' }}>
                <MaskedIcon src={circleXIcon} size={20} />
              </IconButton>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8,
            border: '1px dashed #c9c7d1', background: '#f9fafa',
          }}>
            <MaskedIcon src={pageTextLinkIcon} size={20} color="#9c99a9" />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <p style={{ ...BODY2_SECONDARY_STYLE, color: '#1f1d25', fontWeight: 500 }}>No snippet attached to this account yet.</p>
              <p style={BODY2_SECONDARY_STYLE}>
                Select an existing snippet or generate a new one from the disclosure templates.
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {settings.disclosures.map((d) => (
          <DisclosureAccordion
            key={d.id}
            block={d}
            expanded={expandedId === d.id}
            status={blockStatus(d)}
            generating={generatingIds.has(d.id)}
            error={errors[d.id]}
            onToggle={() => toggleExpanded(d.id)}
            onRawTextChange={(value) => handleRawTextChange(d, value)}
            onRawTextBlur={() => handleRawTextBlur(d.id)}
            onTemplateChange={(text) => patchTemplate(d.id, { text })}
            onReplacementAdded={(replacement) => addTemplateReplacement(d.id, replacement)}
            onIncludeChange={(includeInSnippet) => patchDisclosure(d.id, { includeInSnippet })}
            onDismissError={() => setErrors((e) => ({ ...e, [d.id]: undefined }))}
          />
        ))}
      </div>

      {/* Stays pinned to the bottom of the page's scroll area so the snippet actions are always reachable. */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 2, margin: '0 -16px', marginTop: 'auto',
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
        background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.12)',
      }}>
        {footer}
      </div>

      {snippetDialog && snippet && (
        <DisclosureSnippetDialog
          disclosureLabel={included.map((d) => d.label).join(', ')}
          initialText={snippet.text}
          initialSnippet={snippet.meta}
          onClose={() => {
            if (snippetDialog.closeMessage) showSnackbar({ message: snippetDialog.closeMessage });
            setSnippetDialog(null);
          }}
          disclosures={snippet.disclosures}
          versions={snippet.versions}
          onSave={handleSnippetSave}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      <UpdateSnippetDialog
        open={updateOpen && !!snippet}
        currentText={snippet?.text ?? ''}
        newText={consolidated.text}
        onCancel={() => setUpdateOpen(false)}
        onConfirm={handleConfirmUpdate}
      />

      <RemoveSnippetDialog
        open={removeOpen && !!snippet}
        snippetName={snippet?.meta.name ?? ''}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => {
          onChange({ disclosureSnippet: null });
          setRemoveOpen(false);
        }}
      />
    </div>
  );
};

/**
 * Where a disclosure stands against the account snippet: `edited` since the snippet was last
 * generated/updated, or — when unchanged — whether the snippet includes it.
 */
type DisclosureSnippetStatus = 'edited' | 'applied' | 'not_applied';

const TAG_TONES = {
  purple: { background: 'rgba(99,86,225,0.08)', color: '#473bab' },
  blue: { background: '#EBF5FB', color: '#01579b' },
  green: { background: 'rgba(46,125,50,0.08)', color: '#1b5e20' },
  orange: { background: 'rgba(239,108,0,0.1)', color: '#9a4400' },
} as const;

const STATUS_TAGS: Record<DisclosureSnippetStatus, { label: string; tone: keyof typeof TAG_TONES }> = {
  edited: { label: 'Edited', tone: 'blue' },
  applied: { label: 'Applied in snippet', tone: 'green' },
  not_applied: { label: 'Not applied in snippet', tone: 'orange' },
};

/** Small tag in a disclosure card's header (MUI Chip size="small", Figma's 8px-radius tag look). */
const HeaderTag = ({ label, tone, onClick }: { label: string; tone: keyof typeof TAG_TONES; onClick?: () => void }) => (
  <Chip
    label={label}
    size="small"
    onClick={onClick && ((e: MouseEvent) => { e.stopPropagation(); onClick(); })}
    // Keeps Enter/Space on the tag from also toggling the card it sits in.
    onKeyDown={onClick && ((e: KeyboardEvent) => e.stopPropagation())}
    sx={{
      height: 24, borderRadius: '8px', ...TAG_TONES[tone],
      fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px', lineHeight: '18px',
      '& .MuiChip-label': { padding: '0 8px', textDecoration: onClick ? 'underline' : 'none' },
      '&.MuiChip-clickable:hover': { background: TAG_TONES[tone].background, filter: 'brightness(0.96)' },
    }}
  />
);

interface DisclosureAccordionProps {
  block: DisclosureBlock;
  expanded: boolean;
  status: DisclosureSnippetStatus | null;
  generating: boolean;
  error: string | undefined;
  onToggle: () => void;
  onRawTextChange: (value: string) => void;
  onRawTextBlur: () => void;
  onTemplateChange: (text: string) => void;
  onReplacementAdded: (replacement: DisclosureReplacement) => void;
  onIncludeChange: (include: boolean) => void;
  onDismissError: () => void;
}

/** One disclosure type: raw disclosure (left) and its resulting template (right), color-matched value ↔ variable. */
const DisclosureAccordion = ({
  block, expanded, status, generating, error, onToggle, onRawTextChange, onRawTextBlur, onTemplateChange, onReplacementAdded, onIncludeChange, onDismissError,
}: DisclosureAccordionProps) => {
  const editorRef = useRef<DisclosureSnippetEditorHandle>(null);
  const template = block.template;
  const showTemplate = !!template && !generating;
  const issues = showTemplate ? template.issues : [];
  const [warningsOpen, setWarningsOpen] = useState(false);

  // Only variables mapped back to a raw value AND still present in the template get a color, so a
  // variable the user removed from the template also drops its highlight on the raw side.
  const colors = useMemo(
    () => (template ? buildVariableColorMap(template.replacements, findActiveVariableKeys(template.text)) : {}),
    [template],
  );

  useEffect(() => {
    editorRef.current?.applyChipColors(colors);
  }, [colors, showTemplate, expanded]);

  const paneHeaderStyle: CSSProperties = { ...BODY2_SECONDARY_STYLE, whiteSpace: 'nowrap' };

  return (
    <div style={{ ...SECTION_CARD_STYLE, gap: 12 }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 30, cursor: 'pointer', outline: 'none' }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
          {block.label}
        </span>
        {block.text.trim() !== '' && (
          <HeaderTag label={block.addedBy === 'client' ? 'Added by client' : 'Added by internal user'} tone="purple" />
        )}
        {status && <HeaderTag {...STATUS_TAGS[status]} />}
        {issues.length > 0 && (
          <HeaderTag label={`Warnings (${issues.length})`} tone="orange" onClick={() => setWarningsOpen(true)} />
        )}
        <span style={{ flex: 1 }} />
        <IconButton
          aria-label={expanded ? `Collapse ${block.label}` : `Expand ${block.label}`}
          tabIndex={-1}
          sx={{ padding: '5px' }}
        >
          <img
            src={chevronTopIcon}
            width={20}
            height={20}
            alt=""
            style={{ transform: expanded ? 'none' : 'rotate(180deg)', transition: 'transform 0.15s ease' }}
          />
        </IconButton>
      </div>

      {expanded && (
        <>
          <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 12px', borderRight: '1px solid rgba(0,0,0,0.12)' }}>
              <p style={paneHeaderStyle}>Raw Disclosure</p>
              <DisclosureRawInput
                ariaLabel={`${block.label} raw disclosure`}
                value={block.text}
                onChange={onRawTextChange}
                onBlur={onRawTextBlur}
                replacements={showTemplate ? template.replacements : []}
                colors={colors}
                placeholder={`Paste the client's ${block.label} disclosure here.`}
                height={SPLIT_PANE_HEIGHT}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 12px' }}>
              <p style={paneHeaderStyle}>Resulting Template</p>
              <div style={{ height: SPLIT_PANE_HEIGHT, overflowY: 'auto' }}>
                {generating ? (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, ...BODY2_SECONDARY_STYLE }}>
                    <CircularProgress size={20} sx={{ color: '#473bab' }} />
                    Building template...
                  </div>
                ) : template ? (
                  <DisclosureSnippetEditor
                    key={template.generatedAt}
                    ref={editorRef}
                    initialValue={template.text}
                    onChange={onTemplateChange}
                    resolveOriginal={(key) => template.replacements.find((r) => r.key === key)?.original}
                    onReplacementAdded={onReplacementAdded}
                    contentStyle={{ fontSize: 12, lineHeight: '28px', letterSpacing: '0.15px', minHeight: SPLIT_PANE_HEIGHT }}
                  />
                ) : (
                  <p style={{ ...BODY2_SECONDARY_STYLE, color: '#9c99a9', lineHeight: '24px' }}>
                    The resulting template appears here once a raw disclosure is added.
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <Alert severity="error" sx={{ fontSize: 12 }} onClose={onDismissError}>
              {error}
            </Alert>
          )}

          <FormControlLabel
            control={(
              <Checkbox
                size="small"
                checked={block.includeInSnippet}
                onChange={(e) => onIncludeChange(e.target.checked)}
                sx={{ padding: '5px 9px', color: 'rgba(17,16,20,0.56)', '&.Mui-checked': { color: '#473bab' } }}
              />
            )}
            label="Apply to automated offers"
            sx={{
              margin: 0, alignSelf: 'flex-start',
              '& .MuiFormControlLabel-label': { fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 },
            }}
          />
        </>
      )}

      <DisclosureWarningsDialog
        open={warningsOpen && issues.length > 0}
        disclosureLabel={block.label}
        issues={issues}
        onClose={() => setWarningsOpen(false)}
      />
    </div>
  );
};
