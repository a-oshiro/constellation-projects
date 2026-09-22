import { useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material';
import { Add, Autorenew, AutoAwesome, Close, DescriptionOutlined, EditOutlined, RemoveCircleOutlineOutlined } from '@mui/icons-material';
import type { AdditionalFee, DisclosureBlock, DisclosureSnippetMeta, EnrollmentSettings } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE, FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, LINK_BUTTON_STYLE, TEXT_FIELD_SX } from './shared';
import { generateDisclosureSnippet } from '../../../utils/disclosureSnippetAI';
import type { DisclosureReplacement } from '../../../utils/disclosureSnippetColors';
import { CURRENT_USER } from '../../../data/mockData';
import { DisclosureSnippetDialog } from './DisclosureSnippetDialog';
import { RemoveSnippetDialog } from './RemoveSnippetDialog';
import { ReplaceSnippetDialog } from './ReplaceSnippetDialog';

/** "Select Snippet" action icon — a document with a small link/select badge, no equivalent shape in the MUI icon set. */
const SelectSnippetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 3.5C5.5 2.94772 5.94772 2.5 6.5 2.5H11.5L15 6.5V16C15 16.5523 14.5523 17 14 17H6.5C5.94772 17 5.5 16.5523 5.5 16V3.5Z" stroke="#473BAB" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M11 2.5V6C11 6.55228 11.4477 7 12 7H15" stroke="#473BAB" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7.5 10H11.5M7.5 12.5H9.5" stroke="#473BAB" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="14" cy="14.5" r="3.2" fill="white" stroke="#473BAB" strokeWidth="1.3" />
    <path d="M12.6 14.5C12.6 13.72 13.22 13.1 14 13.1M15.4 14.5C15.4 15.28 14.78 15.9 14 15.9" stroke="#473BAB" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

interface FeesDisclosuresTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
  accountName: string;
  accountBrand: string;
}

function buildDefaultSnippetName(accountName: string, label: string): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  const type = label.replace(' Disclosure', '');
  return `${accountName}_${type}_${month}-${now.getFullYear()}`;
}

/** yyyy-mm-dd (native <input type="date"> value format) for December 31st of the current year. */
function lastDayOfYear(): string {
  return `${new Date().getFullYear()}-12-31`;
}

function buildSnippetMeta(
  accountName: string,
  accountBrand: string,
  label: string,
  sourceText: string,
  replacements: DisclosureReplacement[],
): DisclosureSnippetMeta {
  const now = new Date().toISOString();
  return {
    id: `snippet-${Date.now()}`,
    name: buildDefaultSnippetName(accountName, label),
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

export const FeesDisclosuresTab = ({ settings, onChange, accountName, accountBrand }: FeesDisclosuresTabProps) => {
  const [generatingId, setGeneratingId] = useState<DisclosureBlock['id'] | null>(null);
  const [generateErrors, setGenerateErrors] = useState<Partial<Record<DisclosureBlock['id'], string>>>({});
  const [editingId, setEditingId] = useState<DisclosureBlock['id'] | null>(null);
  // A pending removal, either from the "Remove" link (block stays checked, reverts to the CTA state) or
  // from unchecking a block that already has a snippet (block also becomes unchecked) — both destroy the
  // snippet + text, so both are gated behind the same confirmation dialog.
  const [removalRequest, setRemovalRequest] = useState<{ id: DisclosureBlock['id']; uncheck: boolean } | null>(null);
  // A pending replacement, requested from the "Replace" link — detaches the snippet and drops the
  // block straight into text entry so the user can provide new disclosure text and generate a fresh snippet.
  const [replaceRequest, setReplaceRequest] = useState<DisclosureBlock['id'] | null>(null);
  // Blocks where the user has clicked "Use Client-Provided Disclosure" — shows the text field instead
  // of the CTA chooser. Selecting a disclosure type always lands on the CTAs first, even if it already
  // has text behind the scenes — see `showTextEntry` below. Unchecking a block always clears it back out,
  // so re-checking lands on the CTAs again too.
  const [textEntryStarted, setTextEntryStarted] = useState<Set<DisclosureBlock['id']>>(new Set());
  const showTextEntry = (d: DisclosureBlock) => textEntryStarted.has(d.id);

  const updateDisclosure = (id: DisclosureBlock['id'], patch: Partial<DisclosureBlock>) => {
    onChange({ disclosures: settings.disclosures.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  const clearTextEntryStarted = (id: DisclosureBlock['id']) => {
    setTextEntryStarted((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleEnabled = (d: DisclosureBlock, checked: boolean) => {
    if (!checked && d.snippet) {
      setRemovalRequest({ id: d.id, uncheck: true });
      return;
    }
    if (!checked) {
      // Unchecking a block with no snippet yet still resets it back to the CTA starting state.
      clearTextEntryStarted(d.id);
      updateDisclosure(d.id, { enabled: false, text: '' });
      return;
    }
    updateDisclosure(d.id, { enabled: true });
  };

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

  const handleGenerate = async (block: DisclosureBlock) => {
    setGeneratingId(block.id);
    setGenerateErrors((e) => ({ ...e, [block.id]: undefined }));
    const sourceText = block.text;
    try {
      const { snippet: generatedText, replacements } = await generateDisclosureSnippet(sourceText);
      const snippet = buildSnippetMeta(accountName, accountBrand, block.label, sourceText, replacements);
      updateDisclosure(block.id, { text: generatedText, snippet });
      setEditingId(block.id);
    } catch (err) {
      setGenerateErrors((e) => ({
        ...e,
        [block.id]: err instanceof Error ? err.message : 'Something went wrong while generating this snippet.',
      }));
    } finally {
      setGeneratingId(null);
    }
  };

  const editingBlock = settings.disclosures.find((d) => d.id === editingId);
  const removalBlock = settings.disclosures.find((d) => d.id === removalRequest?.id);
  const replaceBlock = settings.disclosures.find((d) => d.id === replaceRequest);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={BODY_TEXT_STYLE}>
        Lease, cash, and finance disclosure copy that renders on offers for this account, plus the doc fee and additional fees
        included in the legal disclosure.
      </p>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
        {settings.disclosures.map((d, i) => (
          <div key={d.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #e0e0e0', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Checkbox
                  size="small"
                  checked={d.enabled}
                  onChange={(e) => handleToggleEnabled(d, e.target.checked)}
                  sx={{ padding: 0, '&.Mui-checked': { color: '#473bab' } }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
                  {d.label}{d.optional ? ' — optional' : ''}
                </span>
                {d.snippet && (
                  <span style={{
                    fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#473bab', background: '#ece9f9',
                    borderRadius: 100, padding: '2px 10px', fontWeight: 500,
                  }}>
                    Client-Provided Generation
                  </span>
                )}
              </label>
              {d.enabled && d.snippet && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button style={LINK_BUTTON_STYLE} onClick={() => setEditingId(d.id)}>
                    <EditOutlined style={{ fontSize: 15 }} /> Edit
                  </button>
                  <button style={LINK_BUTTON_STYLE} onClick={() => setReplaceRequest(d.id)}>
                    <Autorenew style={{ fontSize: 15 }} /> Replace
                  </button>
                  <button style={LINK_BUTTON_STYLE} onClick={() => setRemovalRequest({ id: d.id, uncheck: false })}>
                    <RemoveCircleOutlineOutlined style={{ fontSize: 15 }} /> Remove
                  </button>
                </div>
              )}
            </div>

            {d.enabled && (
              <div style={{ paddingTop: 10, paddingLeft: 32 }}>
                {d.snippet ? (
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 14, background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <DescriptionOutlined style={{ fontSize: 15, color: '#686576' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {d.snippet.name}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: 12.5, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {d.text}
                    </p>
                  </div>
                ) : !showTextEntry(d) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button
                      variant="contained"
                      disableElevation
                      startIcon={<Add style={{ fontSize: 18 }} />}
                      onClick={() => setTextEntryStarted((prev) => new Set(prev).add(d.id))}
                      sx={{
                        borderRadius: 100, textTransform: 'capitalize', fontSize: 13, fontWeight: 500,
                        letterSpacing: '0.4px', background: '#473bab', padding: '6px 20px',
                        '&:hover': { background: '#3d3396' },
                      }}
                    >
                      Use Client-Provided Disclosure
                    </Button>
                    <Button
                      disableElevation
                      variant="text"
                      startIcon={<SelectSnippetIcon />}
                      sx={{
                        textTransform: 'capitalize', fontSize: 13, fontWeight: 500,
                        letterSpacing: '0.4px', color: '#473bab', padding: '6px 8px',
                      }}
                    >
                      Select Snippet
                    </Button>
                  </div>
                ) : (
                  <>
                    <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 6 }}>Provide the legal disclosure text for your {d.label.toLowerCase()}.</p>
                    <TextField
                      multiline
                      minRows={7}
                      fullWidth
                      value={d.text}
                      onChange={(e) => updateDisclosure(d.id, { text: e.target.value })}
                      sx={{ ...TEXT_FIELD_SX, '& .MuiOutlinedInput-root': { ...TEXT_FIELD_SX['& .MuiOutlinedInput-root'], fontSize: 13, lineHeight: 1.6 } }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>{d.text.length} characters</span>
                      <button
                        onClick={() => handleGenerate(d)}
                        disabled={d.text.trim() === '' || generatingId === d.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 100,
                          padding: '6px 16px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                          cursor: d.text.trim() === '' || generatingId === d.id ? 'default' : 'pointer',
                          background: d.text.trim() === '' ? 'rgba(0,0,0,0.08)' : '#473bab',
                          color: d.text.trim() === '' ? 'rgba(0,0,0,0.38)' : '#ffffff',
                        }}
                      >
                        {generatingId === d.id ? <CircularProgress size={14} sx={{ color: '#ffffff' }} /> : <AutoAwesome style={{ fontSize: 15 }} />}
                        Generate Snippet
                      </button>
                    </div>
                    {generateErrors[d.id] && (
                      <Alert severity="error" sx={{ fontSize: 12, marginTop: 8 }} onClose={() => setGenerateErrors((e) => ({ ...e, [d.id]: undefined }))}>
                        {generateErrors[d.id]}
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          Fees
        </p>
        <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 12 }}>
          Constellation appends these fees to the end of the legal disclosure when they are missing from the copy above.
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

      {editingBlock && editingBlock.snippet && (
        <DisclosureSnippetDialog
          disclosureLabel={editingBlock.label}
          initialText={editingBlock.text}
          initialSnippet={editingBlock.snippet}
          onClose={() => setEditingId(null)}
          onSave={(text, snippet) => {
            updateDisclosure(editingBlock.id, { text, snippet });
            setEditingId(null);
          }}
        />
      )}

      <RemoveSnippetDialog
        open={!!removalBlock?.snippet}
        snippetName={removalBlock?.snippet?.name ?? ''}
        onCancel={() => setRemovalRequest(null)}
        onConfirm={() => {
          if (removalRequest) {
            clearTextEntryStarted(removalRequest.id);
            updateDisclosure(removalRequest.id, {
              text: '', snippet: undefined,
              ...(removalRequest.uncheck ? { enabled: false } : {}),
            });
          }
          setRemovalRequest(null);
        }}
      />

      <ReplaceSnippetDialog
        open={!!replaceBlock?.snippet}
        snippetName={replaceBlock?.snippet?.name ?? ''}
        onCancel={() => setReplaceRequest(null)}
        onConfirm={() => {
          if (replaceRequest) {
            setTextEntryStarted((prev) => new Set(prev).add(replaceRequest));
            updateDisclosure(replaceRequest, { text: '', snippet: undefined });
          }
          setReplaceRequest(null);
        }}
      />
    </div>
  );
};
