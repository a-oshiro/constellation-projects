import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Alert, Button, Checkbox, Chip, CircularProgress, IconButton, InputAdornment, Tab, Tabs, TextField } from '@mui/material';
import { AutoAwesome, Close } from '@mui/icons-material';
import type { AdditionalFee, DisclosureBlock, DisclosureSnippetMeta, EnrollmentSettings } from '../../../data/enrollmentSettings';
import { FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, LINK_BUTTON_STYLE, TEXT_FIELD_SX } from './shared';
import { buildCombinedDisclosureSource, generateDisclosureSnippet } from '../../../utils/disclosureSnippetAI';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { CURRENT_USER } from '../../../data/mockData';
import { useSnackbar } from '../../../context/SnackbarContext';
import { DisclosureSnippetDialog } from './DisclosureSnippetDialog';
import { RemoveSnippetDialog } from './RemoveSnippetDialog';
import { RemoveDisclosureDialog } from './RemoveDisclosureDialog';
import pageTextLinkIcon from '../../../assets/icons/disclosures/page-text-link.svg';
import pageTextAddIcon from '../../../assets/icons/disclosures/page-text-add.svg';
import plusSmallIcon from '../../../assets/icons/disclosures/plus-small.svg';
import pencilIcon from '../../../assets/icons/disclosures/pencil.svg';
import circleXIcon from '../../../assets/icons/disclosures/circle-x.svg';
import chevronTopIcon from '../../../assets/icons/disclosures/chevron-top-small.svg';
import arrowsRepeatIcon from '../../../assets/icons/disclosures/arrows-repeat.svg';
import refreshIcon from '../../../assets/icons/disclosures/refresh.svg';

/** Figma-provided icon for the "Bulk Disclosure Upload" action — no equivalent shape in the MUI icon set. */
const BulkDisclosureUploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.2915 12.5V16.0417C2.2915 16.5019 2.6646 16.875 3.12484 16.875H10.2082C10.6684 16.875 11.0415 16.5019 11.0415 16.0417V12.5" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.12513 8.95866L8.52543 11.3604C8.6551 12.1384 9.32823 12.7087 10.117 12.7087C11.2584 12.7087 12.039 11.5558 11.615 10.4959L11.043 9.06583C10.9165 8.74945 10.61 8.54199 10.2693 8.54199H3.06433C2.72357 8.54199 2.41715 8.74945 2.2906 9.06583L1.71856 10.4959C1.29462 11.5558 2.07516 12.7087 3.21664 12.7087C4.00537 12.7087 4.6785 12.1384 4.80817 11.3604L5.20847 8.95866" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.12499 8.95801L8.40749 10.653C8.58678 11.7288 7.75722 12.708 6.66665 12.708C5.57608 12.708 4.74653 11.7288 4.92582 10.653L5.20832 8.95801" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.0743 5.23633C15.2536 6.31206 14.4241 7.29132 13.3335 7.29132" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.7915 11.8753H16.8748C17.3351 11.8753 17.7082 11.5022 17.7082 11.042V7.29199" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.7913 3.54167L15.1916 5.94344C15.3213 6.72144 15.9944 7.29167 16.7832 7.29167C17.9247 7.29167 18.7052 6.13879 18.2813 5.07895L17.7092 3.64884C17.5827 3.33246 17.2762 3.125 16.9355 3.125H9.73054C9.38978 3.125 9.08336 3.33246 8.95681 3.64884L8.38477 5.07895M11.5969 5.20833L11.8747 3.54167" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

const SMALL_BUTTON_BASE_SX = {
  borderRadius: 100, textTransform: 'capitalize', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.46px', lineHeight: '22px', minWidth: 0, whiteSpace: 'nowrap',
  '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '8px' },
};

const OUTLINED_SMALL_BUTTON_SX = {
  ...SMALL_BUTTON_BASE_SX,
  padding: '3px 10px', color: '#473bab', borderColor: 'rgba(99,86,225,0.5)',
  '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
};

const CONTAINED_SMALL_BUTTON_SX = {
  ...SMALL_BUTTON_BASE_SX,
  padding: '4px 10px', background: '#473bab', color: '#ffffff',
  '&:hover': { background: '#3d3396' },
  '&.Mui-disabled': { background: 'rgba(17,16,20,0.08)', color: 'rgba(17,16,20,0.38)' },
};

const TEXT_SMALL_BUTTON_SX = { ...SMALL_BUTTON_BASE_SX, padding: '4px 5px', color: '#473bab' };

const SECTION_CARD_STYLE: CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 16,
};

const OVERLINE_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '1px', lineHeight: 2.66,
  textTransform: 'uppercase', whiteSpace: 'nowrap',
};

const DISCLOSURE_TEXT_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    padding: '6px 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', lineHeight: 1.43, letterSpacing: '0.17px',
    color: '#1f1d25', background: '#ffffff', alignItems: 'flex-start',
    '& fieldset': { borderColor: '#dddce0' },
    '&:hover fieldset': { borderColor: '#9b96b0' },
    '&.Mui-focused fieldset': { borderColor: '#473bab', borderWidth: 1 },
    '& textarea': { height: '148px !important', overflowY: 'auto !important' },
  },
};

const READ_ONLY_TEXT_FIELD_SX = {
  ...DISCLOSURE_TEXT_FIELD_SX,
  '& .MuiOutlinedInput-root': {
    ...DISCLOSURE_TEXT_FIELD_SX['& .MuiOutlinedInput-root'],
    background: '#f9fafa', color: '#686576',
    '&:hover fieldset': { borderColor: '#dddce0' },
    '&.Mui-focused fieldset': { borderColor: '#dddce0', borderWidth: 1 },
  },
};

type FeesDisclosuresSubTab = 'disclosures' | 'fees';
type SnippetAction = 'generate' | 'update' | 'new';

interface FeesDisclosuresTabProps {
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

/** Name for a brand-new snippet replacing `previousName` — suffixes `_1`, `_2`, … when the default name is already taken this month. */
function buildReplacementSnippetName(accountName: string, previousName: string): string {
  const base = buildDefaultSnippetName(accountName);
  if (previousName === base) return `${base}_1`;
  const match = previousName.startsWith(`${base}_`) ? /_(\d+)$/.exec(previousName) : null;
  return match ? `${base}_${Number(match[1]) + 1}` : base;
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

export const FeesDisclosuresTab = (props: FeesDisclosuresTabProps) => {
  const [subTab, setSubTab] = useState<FeesDisclosuresSubTab>('disclosures');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Tabs
        value={subTab}
        onChange={(_, value: FeesDisclosuresSubTab) => setSubTab(value)}
        slotProps={{ indicator: { style: { background: '#473bab', height: 2 } } }}
        sx={{ minHeight: 42, borderBottom: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}
      >
        {(['disclosures', 'fees'] as const).map((id) => (
          <Tab
            key={id}
            value={id}
            label={id === 'disclosures' ? 'Disclosures' : 'Fees'}
            disableRipple
            sx={{
              textTransform: 'capitalize', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.4px', minHeight: 42, padding: '9px 16px', minWidth: 0, color: '#686576',
              '&.Mui-selected': { color: '#473bab' },
            }}
          />
        ))}
      </Tabs>
      {subTab === 'disclosures' ? <DisclosuresPanel {...props} /> : <FeesPanel settings={props.settings} onChange={props.onChange} />}
    </div>
  );
};

const DisclosuresPanel = ({ settings, onChange, accountName, accountBrand }: FeesDisclosuresTabProps) => {
  const { showSnackbar } = useSnackbar();
  const snippet = settings.disclosureSnippet;

  const [busy, setBusy] = useState<{ id: DisclosureBlock['id']; action: SnippetAction } | null>(null);
  const [errors, setErrors] = useState<Partial<Record<DisclosureBlock['id'], string>>>({});
  // Blocks already built into the snippet that the user reopened via "Update Disclosure" — holds the
  // in-progress text so "Cancel" can drop it without touching the saved disclosure.
  const [drafts, setDrafts] = useState<Partial<Record<DisclosureBlock['id'], string>>>({});
  // Selected rows are expanded by default; this tracks the ones the user (or a finished generation) collapsed.
  const [collapsedIds, setCollapsedIds] = useState<Set<DisclosureBlock['id']>>(new Set());
  // Unchecking a row that already has disclosure text asks for confirmation first.
  const [uncheckRequestId, setUncheckRequestId] = useState<DisclosureBlock['id'] | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  // `firstGeneration` — the dialog opened straight after the snippet was first created, so closing it
  // confirms creation with a snackbar (matching the Figma flow's "Done" → "Snippet generated.").
  const [snippetDialog, setSnippetDialog] = useState<{ firstGeneration: boolean } | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);

  const isEditing = (d: DisclosureBlock) => d.enabled && (!d.inSnippet || d.id in drafts);
  const editText = (d: DisclosureBlock) => drafts[d.id] ?? d.text;

  const updateDisclosure = (id: DisclosureBlock['id'], patch: Partial<DisclosureBlock>) => {
    onChange({ disclosures: settings.disclosures.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  const clearDraft = (id: DisclosureBlock['id']) => {
    setDrafts((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setCollapsed = (id: DisclosureBlock['id'], collapsed: boolean) => {
    setCollapsedIds((prev) => {
      if (prev.has(id) === collapsed) return prev;
      const next = new Set(prev);
      if (collapsed) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const uncheckDisclosure = (id: DisclosureBlock['id']) => {
    clearDraft(id);
    setCollapsed(id, false);
    updateDisclosure(id, { enabled: false, text: '', inSnippet: false });
  };

  const handleToggleEnabled = (d: DisclosureBlock, checked: boolean) => {
    if (checked) {
      setCollapsed(d.id, false);
      updateDisclosure(d.id, { enabled: true });
      return;
    }
    if (d.inSnippet || editText(d).trim() !== '') {
      setUncheckRequestId(d.id);
      return;
    }
    uncheckDisclosure(d.id);
  };

  const handleEditTextChange = (d: DisclosureBlock, value: string) => {
    if (d.inSnippet) setDrafts((prev) => ({ ...prev, [d.id]: value }));
    else updateDisclosure(d.id, { text: value });
  };

  /**
   * Builds the account snippet from every checked disclosure with text — `block`'s current (possibly
   * draft) text plus every other disclosure's saved text — so the one snippet always covers all disclosure
   * types added. `generate` creates the first snippet, `update` regenerates the existing snippet in place,
   * and `new` creates a fresh snippet that replaces (detaches) the current one.
   */
  const runSnippetAction = async (block: DisclosureBlock, action: SnippetAction) => {
    const blockText = editText(block).trim();
    const sourceTextFor = (d: DisclosureBlock) => (d.id === block.id ? blockText : d.text.trim());
    const included = settings.disclosures.filter((d) => d.enabled && sourceTextFor(d) !== '');
    const sourceText = buildCombinedDisclosureSource(
      included.map((d) => ({ label: d.label, text: sourceTextFor(d) })),
    );

    setBusy({ id: block.id, action });
    setErrors((e) => ({ ...e, [block.id]: undefined }));
    try {
      const { snippet: generatedText, replacements } = await generateDisclosureSnippet(sourceText);
      const meta: DisclosureSnippetMeta = action === 'update' && snippet
        ? { ...snippet.meta, sourceText, replacements, updatedAt: new Date().toISOString() }
        : buildSnippetMeta(
            action === 'new' && snippet ? buildReplacementSnippetName(accountName, snippet.meta.name) : buildDefaultSnippetName(accountName),
            accountName, accountBrand, sourceText, replacements,
          );
      const includedIds = new Set(included.map((d) => d.id));
      onChange({
        disclosureSnippet: { meta, text: generatedText },
        disclosures: settings.disclosures.map((d) => (
          includedIds.has(d.id) ? { ...d, inSnippet: true, text: d.id === block.id ? blockText : d.text } : d
        )),
      });
      clearDraft(block.id);
      included.forEach((d) => setCollapsed(d.id, true));
      if (action === 'generate') setSnippetDialog({ firstGeneration: true });
      else showSnackbar({ message: action === 'update' ? 'Snippet updated.' : 'Snippet generated.' });
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [block.id]: err instanceof Error ? err.message : 'Something went wrong while generating this snippet.',
      }));
    } finally {
      setBusy(null);
    }
  };

  const uncheckBlock = settings.disclosures.find((d) => d.id === uncheckRequestId);
  // The other disclosures the snippet is rebuilt from once `uncheckBlock` is removed.
  const remainingInSnippet = settings.disclosures.filter((d) => d.enabled && d.inSnippet && d.id !== uncheckRequestId);

  const closeRemoveDialog = () => {
    setUncheckRequestId(null);
    setRemoveError(null);
  };

  /**
   * Removes `uncheckBlock` and, when it was part of the account snippet, regenerates the snippet in place
   * from the remaining disclosures. Nothing changes unless regeneration succeeds, so a failure leaves the
   * disclosure checked and the snippet untouched. Removing the snippet's last disclosure detaches the snippet.
   */
  const handleConfirmRemove = async () => {
    if (!uncheckBlock) return;
    const id = uncheckBlock.id;
    const disclosures = settings.disclosures.map((d) => (d.id === id ? { ...d, enabled: false, text: '', inSnippet: false } : d));

    if (!snippet || !uncheckBlock.inSnippet) {
      uncheckDisclosure(id);
      closeRemoveDialog();
      return;
    }

    if (remainingInSnippet.length === 0) {
      onChange({ disclosures, disclosureSnippet: null });
      clearDraft(id);
      setCollapsed(id, false);
      closeRemoveDialog();
      showSnackbar({ message: 'Disclosure removed. Snippet detached.' });
      return;
    }

    setRemoving(true);
    setRemoveError(null);
    try {
      const sourceText = buildCombinedDisclosureSource(remainingInSnippet.map((d) => ({ label: d.label, text: d.text })));
      const { snippet: generatedText, replacements } = await generateDisclosureSnippet(sourceText);
      onChange({
        disclosures,
        disclosureSnippet: {
          meta: { ...snippet.meta, sourceText, replacements, updatedAt: new Date().toISOString() },
          text: generatedText,
        },
      });
      clearDraft(id);
      setCollapsed(id, false);
      closeRemoveDialog();
      showSnackbar({ message: 'Disclosure removed. Snippet regenerated.' });
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Something went wrong while regenerating the snippet.');
    } finally {
      setRemoving(false);
    }
  };

  const busyLabel: Record<SnippetAction, string> = {
    generate: 'Generating Snippet...',
    update: 'Updating Snippet...',
    new: 'Generating Snippet...',
  };

  const renderEditActions = (d: DisclosureBlock) => {
    const empty = editText(d).trim() === '';
    if (busy?.id === d.id) {
      return (
        <Button
          disabled
          variant="contained"
          disableElevation
          startIcon={<AutoAwesome style={{ fontSize: 16 }} />}
          endIcon={<CircularProgress size={14} sx={{ color: 'rgba(17,16,20,0.38)' }} />}
          sx={CONTAINED_SMALL_BUTTON_SX}
        >
          {busyLabel[busy.action]}
        </Button>
      );
    }
    if (!snippet) {
      return (
        <Button
          variant="contained"
          disableElevation
          disabled={empty || !!busy}
          onClick={() => runSnippetAction(d, 'generate')}
          startIcon={<AutoAwesome style={{ fontSize: 16 }} />}
          sx={CONTAINED_SMALL_BUTTON_SX}
        >
          Generate Snippet
        </Button>
      );
    }
    return (
      <>
        {d.inSnippet && (
          <Button variant="text" onClick={() => clearDraft(d.id)} sx={TEXT_SMALL_BUTTON_SX}>
            Cancel
          </Button>
        )}
        <Button
          variant="outlined"
          disabled={empty || !!busy}
          onClick={() => runSnippetAction(d, 'new')}
          startIcon={<MaskedIcon src={pageTextAddIcon} size={18} color="currentColor" />}
          sx={OUTLINED_SMALL_BUTTON_SX}
        >
          Generate New Snippet
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={empty || !!busy}
          onClick={() => runSnippetAction(d, 'update')}
          startIcon={<MaskedIcon src={refreshIcon} size={18} color="currentColor" />}
          sx={CONTAINED_SMALL_BUTTON_SX}
        >
          Update Snippet
        </Button>
      </>
    );
  };

  return (
    <>
      <div style={SECTION_CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={OVERLINE_STYLE}>Snippet</p>
          {!snippet && (
            <Button
              variant="outlined"
              startIcon={<MaskedIcon src={pageTextLinkIcon} size={18} color="currentColor" />}
              sx={OUTLINED_SMALL_BUTTON_SX}
            >
              Select Existing Snippet
            </Button>
          )}
        </div>
        {snippet && (
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
              <IconButton aria-label="Edit snippet" onClick={() => setSnippetDialog({ firstGeneration: false })} sx={{ padding: '5px' }}>
                <MaskedIcon src={pencilIcon} size={20} />
              </IconButton>
              <IconButton aria-label="Remove snippet" onClick={() => setRemoveOpen(true)} sx={{ padding: '5px' }}>
                <MaskedIcon src={circleXIcon} size={20} />
              </IconButton>
            </div>
          </div>
        )}
      </div>

      <div style={SECTION_CARD_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p style={OVERLINE_STYLE}>Disclosures</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              variant="outlined"
              startIcon={<MaskedIcon src={plusSmallIcon} size={18} color="currentColor" />}
              sx={OUTLINED_SMALL_BUTTON_SX}
            >
              Add General Disclosure
            </Button>
            <Button variant="outlined" startIcon={<BulkDisclosureUploadIcon />} sx={{ ...OUTLINED_SMALL_BUTTON_SX, textTransform: 'none' }}>
              Bulk Disclosure Upload
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {settings.disclosures.map((d) => {
            const editing = isEditing(d);
            const expanded = d.enabled && !collapsedIds.has(d.id);
            return (
              <div
                key={d.id}
                style={{ borderTop: '1px solid rgba(0,0,0,0.12)', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <Checkbox
                      checked={d.enabled}
                      onChange={(e) => handleToggleEnabled(d, e.target.checked)}
                      disabled={busy?.id === d.id}
                      sx={{ color: 'rgba(17,16,20,0.56)', '&.Mui-checked': { color: '#473bab' } }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
                      {d.label}
                    </span>
                    {d.optional && !d.enabled && (
                      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                        (Optional)
                      </span>
                    )}
                    {d.enabled && d.inSnippet && (
                      <Chip
                        label="Client-Provided Disclosure"
                        size="small"
                        sx={{
                          height: 24, borderRadius: '8px', background: 'rgba(17,16,20,0.04)', color: '#1f1d25',
                          fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
                          '& .MuiChip-label': { padding: '0 10px' },
                        }}
                      />
                    )}
                  </label>
                  {d.enabled && (
                    <IconButton
                      aria-label={expanded ? `Collapse ${d.label}` : `Expand ${d.label}`}
                      aria-expanded={expanded}
                      onClick={() => setCollapsed(d.id, expanded)}
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
                  )}
                </div>

                {expanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 50, paddingBottom: 8 }}>
                    <TextField
                      multiline
                      fullWidth
                      value={editing ? editText(d) : d.text}
                      onChange={(e) => handleEditTextChange(d, e.target.value)}
                      disabled={busy?.id === d.id}
                      slotProps={{ input: { readOnly: !editing } }}
                      sx={editing ? DISCLOSURE_TEXT_FIELD_SX : READ_ONLY_TEXT_FIELD_SX}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                      {editing ? renderEditActions(d) : (
                        <Button
                          variant="text"
                          onClick={() => setDrafts((prev) => ({ ...prev, [d.id]: d.text }))}
                          startIcon={<MaskedIcon src={arrowsRepeatIcon} size={18} color="currentColor" />}
                          sx={TEXT_SMALL_BUTTON_SX}
                        >
                          Update Disclosure
                        </Button>
                      )}
                    </div>
                    {errors[d.id] && (
                      <Alert severity="error" sx={{ fontSize: 12 }} onClose={() => setErrors((e) => ({ ...e, [d.id]: undefined }))}>
                        {errors[d.id]}
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {snippetDialog && snippet && (
        <DisclosureSnippetDialog
          disclosureLabel={settings.disclosures.filter((d) => d.inSnippet).map((d) => d.label).join(', ')}
          initialText={snippet.text}
          initialSnippet={snippet.meta}
          onClose={() => {
            if (snippetDialog.firstGeneration) showSnackbar({ message: 'Snippet generated.' });
            setSnippetDialog(null);
          }}
          onSave={(text, meta) => onChange({ disclosureSnippet: { meta, text } })}
        />
      )}

      <RemoveDisclosureDialog
        open={!!uncheckBlock}
        disclosureLabel={uncheckBlock?.label ?? ''}
        snippetEffect={
          !snippet || !uncheckBlock?.inSnippet ? 'none'
            : remainingInSnippet.length === 0 ? 'detach'
              : 'regenerate'
        }
        busy={removing}
        error={removeError}
        onCancel={closeRemoveDialog}
        onConfirm={handleConfirmRemove}
      />

      <RemoveSnippetDialog
        open={removeOpen && !!snippet}
        snippetName={snippet?.meta.name ?? ''}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => {
          // Detaching the snippet keeps each disclosure's text and drops it back into edit mode,
          // ready to generate a new snippet or select an existing one.
          onChange({
            disclosureSnippet: null,
            disclosures: settings.disclosures.map((d) => ({ ...d, inSnippet: false })),
          });
          setDrafts({});
          setRemoveOpen(false);
        }}
      />
    </>
  );
};

const FeesPanel = ({ settings, onChange }: Pick<FeesDisclosuresTabProps, 'settings' | 'onChange'>) => {
  const addFee = () => {
    const fee: AdditionalFee = { id: `fee-${Date.now()}`, label: '', amount: null };
    onChange({ additionalFees: [...settings.additionalFees, fee] });
  };

  const updateFee = (id: string, patch: Partial<AdditionalFee>) => {
    onChange({ additionalFees: settings.additionalFees.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  };

  const removeFee = (id: string) => {
    onChange({ additionalFees: settings.additionalFees.filter((f) => f.id !== id) });
  };

  return (
    <div>
      <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 16 }}>
        Constellation appends these fees to the end of the legal disclosure when they are missing from the disclosure copy.
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={FIELD_LABEL_STYLE}>Doc Fee</div>
        <TextField
          size="small"
          value={settings.docFee ?? ''}
          onChange={(e) => {
            const value = e.target.value.trim();
            const parsed = value === '' ? null : Number(value);
            onChange({ docFee: parsed !== null && Number.isNaN(parsed) ? settings.docFee : parsed });
          }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
          sx={{ width: 160, ...TEXT_FIELD_SX }}
        />
        <p style={{ ...HELPER_TEXT_STYLE, marginTop: 6 }}>Dealership document fee included in the legal disclosure. Leave blank if none applies.</p>
      </div>

      <div style={FIELD_LABEL_STYLE}>Additional Fees</div>
      <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 8 }}>Government fees and any other fees that must be included in the legal disclosure.</p>
      {settings.additionalFees.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {settings.additionalFees.map((fee) => (
            <div key={fee.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TextField
                size="small"
                placeholder="Fee name"
                value={fee.label}
                onChange={(e) => updateFee(fee.id, { label: e.target.value })}
                sx={{ flex: 1, ...TEXT_FIELD_SX }}
              />
              <TextField
                size="small"
                placeholder="0.00"
                value={fee.amount ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const parsed = value === '' ? null : Number(value);
                  updateFee(fee.id, { amount: parsed !== null && Number.isNaN(parsed) ? fee.amount : parsed });
                }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                sx={{ width: 140, ...TEXT_FIELD_SX }}
              />
              <IconButton size="small" onClick={() => removeFee(fee.id)}>
                <Close style={{ fontSize: 16, color: '#686576' }} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      <button style={LINK_BUTTON_STYLE} onClick={addFee}>+ Add New Fee</button>
    </div>
  );
};
