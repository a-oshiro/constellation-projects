import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Alert, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import type { DisclosureBlock, DisclosureSnippetMeta, DisclosureTemplate, EnrollmentSettings } from '../../../data/enrollmentSettings';
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

const OVERLINE_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '1px', lineHeight: 2.66,
  textTransform: 'uppercase', whiteSpace: 'nowrap',
};

const BODY2_SECONDARY_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43,
};

/** Height of each side of the raw/template split view — both scroll independently past it (Figma: 273px). */
const SPLIT_PANE_HEIGHT = 273;

/** How long the raw text must sit unchanged before its template is (re)generated. */
const TEMPLATE_DEBOUNCE_MS = 900;

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

  const timersRef = useRef<Partial<Record<DisclosureBlock['id'], ReturnType<typeof setTimeout>>>>({});
  const [generatingIds, setGeneratingIds] = useState<Set<DisclosureBlock['id']>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<DisclosureBlock['id'], string>>>({});
  // Only one disclosure type card is open at a time — expanding another closes it.
  const [expandedId, setExpandedId] = useState<DisclosureBlock['id'] | null>('lease');
  // `closeMessage` — the dialog opened straight after the snippet was generated or updated, so closing it
  // confirms that with a snackbar (matching the Figma flow's "Done" → "Snippet generated.").
  const [snippetDialog, setSnippetDialog] = useState<{ closeMessage?: string } | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

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
      const { snippet: text, replacements } = await generateDisclosureSnippet(sourceText);
      // Dropped if the raw text changed while this was in flight — a newer generation is already queued.
      const current = settingsRef.current.disclosures.find((d) => d.id === id);
      if (current?.text.trim() !== sourceText) return;
      patchDisclosure(id, { template: { text, replacements, sourceText, generatedAt: new Date().toISOString() } });
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
    clearTimeout(timersRef.current[d.id]);
    const trimmed = value.trim();
    if (trimmed === '') {
      patchDisclosure(d.id, { text: value, template: null });
      setGenerating(d.id, false);
      setErrors((e) => ({ ...e, [d.id]: undefined }));
      return;
    }
    patchDisclosure(d.id, { text: value });
    if (d.template?.sourceText === trimmed) {
      setGenerating(d.id, false);
      return;
    }
    setGenerating(d.id, true);
    timersRef.current[d.id] = setTimeout(() => generateTemplate(d.id, trimmed), TEMPLATE_DEBOUNCE_MS);
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
    onChange({ disclosureSnippet: { meta, text: consolidated.text, disclosures: settings.disclosures } });
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
      },
    });
    setUpdateOpen(false);
    setSnippetDialog({ closeMessage: 'Snippet updated.' });
  };

  /** Restores every disclosure to how it was when the snippet was last generated/updated. */
  const handleDiscardChanges = () => {
    if (!snippet) return;
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setGeneratingIds(new Set());
    setErrors({});
    onChange({ disclosures: snippet.disclosures });
  };

  let footer: ReactNode = null;
  if (!snippet) {
    footer = (
      <>
        <p style={{ ...BODY2_SECONDARY_STYLE, flex: 1, minWidth: 0 }}>
          Add disclosures above to generate a snippet or select an existing one.
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
          Changes made to {changedBlocks.map((d, i) => (
            <span key={d.id}>
              {i > 0 && (i === changedBlocks.length - 1 ? ' and ' : ', ')}
              <strong style={{ fontWeight: 700 }}>{d.label}</strong>
            </span>
          ))} {changedBlocks.length === 1 ? 'disclosure' : 'disclosures'}. Update or generate a new snippet to apply.
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
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%', paddingBottom: footer ? 0 : 16, boxSizing: 'border-box' }}>
      <div style={SECTION_CARD_STYLE}>
        <p style={OVERLINE_STYLE}>Snippet</p>
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
              <p style={{ ...BODY2_SECONDARY_STYLE, color: '#1f1d25', fontWeight: 500 }}>No snippet attached yet</p>
              <p style={BODY2_SECONDARY_STYLE}>
                Once generated or selected, this account's snippet appears here.
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
            edited={changedBlocks.some((c) => c.id === d.id)}
            generating={generatingIds.has(d.id)}
            error={errors[d.id]}
            onToggle={() => toggleExpanded(d.id)}
            onRawTextChange={(value) => handleRawTextChange(d, value)}
            onTemplateChange={(text) => patchTemplate(d.id, { text })}
            onReplacementAdded={(replacement) => addTemplateReplacement(d.id, replacement)}
            onIncludeChange={(includeInSnippet) => patchDisclosure(d.id, { includeInSnippet })}
            onDismissError={() => setErrors((e) => ({ ...e, [d.id]: undefined }))}
          />
        ))}
      </div>

      {footer && (
        // Stays pinned to the bottom of the page's scroll area so the snippet actions are always reachable.
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 2, margin: '0 -16px', marginTop: 'auto',
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
          background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.12)',
        }}>
          {footer}
        </div>
      )}

      {snippetDialog && snippet && (
        <DisclosureSnippetDialog
          disclosureLabel={included.map((d) => d.label).join(', ')}
          initialText={snippet.text}
          initialSnippet={snippet.meta}
          onClose={() => {
            if (snippetDialog.closeMessage) showSnackbar({ message: snippetDialog.closeMessage });
            setSnippetDialog(null);
          }}
          onSave={(text, meta) => onChange({ disclosureSnippet: { ...snippet, meta, text } })}
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

interface DisclosureAccordionProps {
  block: DisclosureBlock;
  expanded: boolean;
  /** Changed since the snippet was last generated/updated. */
  edited: boolean;
  generating: boolean;
  error: string | undefined;
  onToggle: () => void;
  onRawTextChange: (value: string) => void;
  onTemplateChange: (text: string) => void;
  onReplacementAdded: (replacement: DisclosureReplacement) => void;
  onIncludeChange: (include: boolean) => void;
  onDismissError: () => void;
}

/** One disclosure type: raw disclosure (left) and its resulting template (right), color-matched value ↔ variable. */
const DisclosureAccordion = ({
  block, expanded, edited, generating, error, onToggle, onRawTextChange, onTemplateChange, onReplacementAdded, onIncludeChange, onDismissError,
}: DisclosureAccordionProps) => {
  const editorRef = useRef<DisclosureSnippetEditorHandle>(null);
  const template = block.template;
  const showTemplate = !!template && !generating;

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
          <Chip
            label="Added by internal user"
            size="small"
            sx={{
              height: 24, borderRadius: '8px', background: 'rgba(99,86,225,0.08)', color: '#473bab',
              fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px', lineHeight: '18px',
              '& .MuiChip-label': { padding: '0 8px' },
            }}
          />
        )}
        {edited && (
          <Chip
            label="Edited"
            size="small"
            sx={{
              height: 24, borderRadius: '8px', background: '#EBF5FB', color: '#01579b',
              fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px', lineHeight: '18px',
              '& .MuiChip-label': { padding: '0 8px' },
            }}
          />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...BODY2_SECONDARY_STYLE }}>
                    <CircularProgress size={14} sx={{ color: '#473bab' }} />
                    Generating template...
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
    </div>
  );
};
