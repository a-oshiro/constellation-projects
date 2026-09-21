import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Button, Chip, IconButton, InputAdornment, TextField, Tooltip,
} from '@mui/material';
import {
  Close, ContentCopy, InfoOutlined, DataObject, AutoAwesome, FolderOutlined,
  Undo as UndoIcon, FormatBold, FormatItalic, FormatUnderlined, FormatStrikethrough,
  ImageSearchOutlined, ViewColumnOutlined, ExpandMore,
} from '@mui/icons-material';
import { useTestWidget } from '../../../context/TestWidgetContext';
import type { DisclosureSnippetMeta } from '../../../data/enrollmentSettings';
import { DisclosureSnippetEditor } from './DisclosureSnippetEditor';
import type { DisclosureFormatType, DisclosureSnippetEditorHandle } from './DisclosureSnippetEditor';
import { renderFormattedHtml, substituteVariablesWithSamples } from '../../../utils/disclosureSnippetFormatting';
import { buildVariableColorMap, findActiveVariableKeys } from '../../../utils/disclosureSnippetColors';
import { DisclosureSourcePane } from './DisclosureSourcePane';

const SIDE_TABS = [
  { id: 'metadata', label: 'Metadata', Icon: InfoOutlined },
  { id: 'rules', label: 'Rules', Icon: DataObject },
  { id: 'ai', label: 'Build w/ AI', Icon: AutoAwesome },
] as const;

type SideTabId = typeof SIDE_TABS[number]['id'];

const MOCK_BRANDS = ['BMW', 'Honda', 'Toyota', 'Ford', 'Chevrolet'];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.15px', marginBottom: 4,
};

const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    background: '#ffffff', fontSize: 13, fontFamily: 'Roboto, sans-serif',
    '& fieldset': { borderColor: '#cac9cf' },
    '&:hover fieldset': { borderColor: '#9b96b0' },
    '&.Mui-focused fieldset': { borderColor: '#473bab' },
  },
};

const CHIP_SX = { height: 22, borderRadius: '8px', background: '#f0f2f4', color: '#1f1d25', fontSize: 11, fontFamily: 'Roboto, sans-serif' };

// MUI Popper-based components (Tooltip, Autocomplete's dropdown) default to a z-index (~1300-1500)
// well below this dialog's own portal (100001), which would render them invisibly behind its opaque
// panel — bump them above it here.
const POPPER_SLOT_PROPS = { popper: { sx: { zIndex: 100002 } } };

const ROW_LABEL_STYLE: React.CSSProperties = { fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' };
const ROW_VALUE_STYLE: React.CSSProperties = { fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// A native <input type="date">'s displayed format follows OS/browser locale (not guaranteed mm/dd/yyyy
// for every user), so the Expiration Date field is a plain text field instead, always mm/dd/yyyy,
// storing yyyy-mm-dd internally for consistency with the rest of the data model.
function isoToMmDdYyyy(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${m}/${d}/${y}`;
}

function mmDdYyyyToIso(display: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, m, d, y] = match;
  return `${y}-${m}-${d}`;
}

const InfoRow = ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
    <span style={ROW_LABEL_STYLE}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={ROW_VALUE_STYLE}>{value}</span>
      {copyable && (
        <IconButton size="small" onClick={() => navigator.clipboard?.writeText(value)} sx={{ padding: '2px' }}>
          <ContentCopy style={{ fontSize: 13, color: '#9c99a9' }} />
        </IconButton>
      )}
    </div>
  </div>
);

interface ToolbarIconButtonProps {
  onClick?: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}
const ToolbarIconButton = ({ onClick, title, active, children }: ToolbarIconButtonProps) => (
  <Tooltip title={title} slotProps={POPPER_SLOT_PROPS}>
    <IconButton
      size="small"
      onClick={onClick}
      sx={{
        padding: '6px',
        color: active ? '#473bab' : '#1f1d25',
        background: active ? 'rgba(99,86,225,0.12)' : 'transparent',
        '&:hover': { background: active ? 'rgba(99,86,225,0.18)' : 'rgba(0,0,0,0.06)' },
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

interface DisclosureSnippetDialogProps {
  disclosureLabel: string;
  initialText: string;
  initialSnippet: DisclosureSnippetMeta;
  onClose: () => void;
  onSave: (text: string, snippet: DisclosureSnippetMeta) => void;
}

export function DisclosureSnippetDialog({ disclosureLabel, initialText, initialSnippet, onClose, onSave }: DisclosureSnippetDialogProps) {
  const { widgetWidth } = useTestWidget();
  const editorRef = useRef<DisclosureSnippetEditorHandle>(null);
  const addVariableBtnRef = useRef<HTMLButtonElement>(null);

  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [splitView, setSplitView] = useState(false);
  const [sideTab, setSideTab] = useState<SideTabId>('metadata');
  const [text, setText] = useState(initialText);
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState(initialSnippet.name);
  const [tags, setTags] = useState<string[]>(initialSnippet.tags);
  const [folder, setFolder] = useState(initialSnippet.folder);
  const [brands, setBrands] = useState<string[]>(initialSnippet.brands);
  const [expirationDate, setExpirationDate] = useState(initialSnippet.expirationDate ?? '');
  const [expirationDisplay, setExpirationDisplay] = useState(() => isoToMmDdYyyy(initialSnippet.expirationDate));
  const [websiteDescription, setWebsiteDescription] = useState(initialSnippet.websiteDescription);
  const [websiteNotes, setWebsiteNotes] = useState(initialSnippet.websiteNotes);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleEditorChange = (value: string) => {
    setText(value);
    markDirty();
  };

  const handleFormat = (type: DisclosureFormatType) => {
    editorRef.current?.applyFormat(type);
    markDirty();
  };

  const handleAddVariable = () => {
    if (addVariableBtnRef.current) editorRef.current?.openAddVariablePicker(addVariableBtnRef.current);
    markDirty();
  };

  const handleUndo = () => editorRef.current?.undo();

  // Which color each outcome variable currently gets — only variables the AI mapped back to a source
  // substring (`initialSnippet.replacements`) AND still present in the live text get one; anything else
  // (a manually added/replaced variable) stays the default gray chip.
  const chipColors = useMemo(
    () => buildVariableColorMap(initialSnippet.replacements, findActiveVariableKeys(text)),
    [text, initialSnippet.replacements],
  );

  useEffect(() => {
    // `mode` is included because switching Write/Preview remounts the editor at a different JSX
    // position when splitView is active, which resets its internal color state.
    editorRef.current?.applyChipColors(splitView ? chipColors : null);
  }, [splitView, chipColors, mode]);

  const handleSave = () => {
    const snippet: DisclosureSnippetMeta = {
      ...initialSnippet,
      name,
      tags,
      folder,
      brands,
      expirationDate: expirationDate || null,
      websiteDescription,
      websiteNotes,
      updatedAt: new Date().toISOString(),
    };
    onSave(text, snippet);
    setDirty(false);
  };

  const fileSizeLabel = formatBytes(new Blob([text]).size);
  const previewHtml = renderFormattedHtml(substituteVariablesWithSamples(text));

  return ReactDOM.createPortal(
    <>
      <div
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: widgetWidth, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed', top: 16, right: 16, bottom: 16, left: widgetWidth + 16, zIndex: 100001,
          background: '#ffffff', borderRadius: 16,
          boxShadow: '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 14px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <span style={{ flex: 1, fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Create Text Snippet
          </span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', marginRight: 12 }}>{disclosureLabel}</span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px', '&:hover': { background: 'rgba(17,16,20,0.14)' } }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Left: editor */}
          <div style={{ flex: 1, background: '#f0f2f4', overflow: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', background: '#ffffff', borderRadius: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 16px', borderBottom: '1px solid #ececec', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 16, marginRight: 12 }}>
                  {(['write', 'preview'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                        fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                        color: mode === m ? '#473bab' : '#686576',
                        borderBottom: mode === m ? '2px solid #473bab' : '2px solid transparent',
                        textTransform: 'capitalize',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div style={{ width: 1, height: 20, background: '#e0e0e0', margin: '0 4px' }} />
                <ToolbarIconButton title="Undo" onClick={handleUndo}><UndoIcon style={{ fontSize: 18 }} /></ToolbarIconButton>
                <ToolbarIconButton title="Bold" onClick={() => handleFormat('bold')}><FormatBold style={{ fontSize: 18 }} /></ToolbarIconButton>
                <ToolbarIconButton title="Italic" onClick={() => handleFormat('italic')}><FormatItalic style={{ fontSize: 18 }} /></ToolbarIconButton>
                <ToolbarIconButton title="Underline" onClick={() => handleFormat('underline')}><FormatUnderlined style={{ fontSize: 18 }} /></ToolbarIconButton>
                <ToolbarIconButton title="Strikethrough" onClick={() => handleFormat('strikethrough')}><FormatStrikethrough style={{ fontSize: 18 }} /></ToolbarIconButton>

                <button
                  ref={addVariableBtnRef}
                  onClick={handleAddVariable}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                    border: '1px solid #473bab', borderRadius: 100, padding: '5px 12px', marginLeft: 4,
                    cursor: 'pointer', color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                  }}
                >
                  <DataObject style={{ fontSize: 16 }} />
                  Add Variable
                </button>

                <div style={{ flex: 1 }} />

                <ToolbarIconButton title="AI insight (coming soon)"><ImageSearchOutlined style={{ fontSize: 18 }} /></ToolbarIconButton>
                <ToolbarIconButton
                  title={splitView ? 'Exit comparison view' : 'Compare source disclosure to outcome snippet'}
                  active={splitView}
                  onClick={() => setSplitView((v) => !v)}
                >
                  <ViewColumnOutlined style={{ fontSize: 18 }} />
                </ToolbarIconButton>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                    border: '1px solid #473bab', borderRadius: 100, padding: '5px 12px', marginLeft: 4,
                    cursor: 'pointer', color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap',
                  }}
                >
                  <AutoAwesome style={{ fontSize: 16 }} />
                  Create With AI (Cmd + /)
                </button>
              </div>

              {/* Content */}
              <div style={{ padding: '20px 24px 32px', flex: 1 }}>
                {mode === 'write' && splitView ? (
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 24, borderRight: '1px solid #ececec' }}>
                      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        Source Disclaimer
                      </p>
                      <DisclosureSourcePane sourceText={initialSnippet.sourceText} replacements={initialSnippet.replacements} colors={chipColors} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        Outcome Snippet
                      </p>
                      <DisclosureSnippetEditor ref={editorRef} initialValue={text} onChange={handleEditorChange} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: mode === 'write' ? 'block' : 'none' }}>
                    <DisclosureSnippetEditor ref={editorRef} initialValue={text} onChange={handleEditorChange} />
                  </div>
                )}
                {mode === 'preview' && (
                  <div
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: 14, lineHeight: 1.7, color: '#1f1d25' }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
              </div>

              <div style={{ padding: '8px 24px 16px', borderTop: '1px solid #ececec', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>M↓ Styling with Markdown is supported.</span>
              </div>
            </div>
          </div>

          {/* Right: side panel */}
          <div style={{ width: 393, display: 'flex', borderLeft: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ width: 73, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', paddingTop: 8, flexShrink: 0 }}>
              {SIDE_TABS.map(({ id, label, Icon }) => {
                const active = sideTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSideTab(id)}
                    style={{
                      width: '100%', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 4, background: 'none', border: 'none',
                      borderLeft: active ? '3px solid #473bab' : '3px solid transparent', cursor: 'pointer',
                    }}
                  >
                    <Icon style={{ fontSize: 20, color: active ? '#473bab' : '#686576' }} />
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: active ? 500 : 400, color: active ? '#473bab' : '#686576', letterSpacing: '0.4px' }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {sideTab === 'metadata' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Metadata</span>

                  <div>
                    <div style={LABEL_STYLE}>* Name</div>
                    <TextField
                      fullWidth size="small" value={name}
                      onChange={(e) => { setName(e.target.value); markDirty(); }}
                      sx={FIELD_SX}
                      slotProps={{ input: { endAdornment: (
                        <IconButton size="small" onClick={() => navigator.clipboard?.writeText(name)}><ContentCopy style={{ fontSize: 14, color: '#9c99a9' }} /></IconButton>
                      ) } }}
                    />
                  </div>

                  <div>
                    <div style={LABEL_STYLE}>Folder</div>
                    <TextField
                      fullWidth
                      size="small"
                      value={folder}
                      onChange={(e) => { setFolder(e.target.value); markDirty(); }}
                      placeholder="Folder"
                      sx={FIELD_SX}
                      slotProps={{ input: { startAdornment: (
                        <InputAdornment position="start"><FolderOutlined style={{ fontSize: 18, color: '#473bab' }} /></InputAdornment>
                      ) } }}
                    />
                  </div>

                  <div>
                    <div style={LABEL_STYLE}>Brand</div>
                    <Autocomplete
                      multiple size="small" disableCloseOnSelect
                      options={MOCK_BRANDS}
                      value={brands}
                      onChange={(_, v) => { setBrands(v); markDirty(); }}
                      slotProps={{ popper: POPPER_SLOT_PROPS.popper }}
                      renderValue={(value, getItemProps) => value.map((option, index) => {
                        const { key, ...itemProps } = getItemProps({ index });
                        return <Chip key={key} label={option} size="small" {...itemProps} sx={CHIP_SX} />;
                      })}
                      renderInput={(params) => <TextField {...params} placeholder="Select Brand" sx={FIELD_SX} />}
                    />
                  </div>

                  <div>
                    <div style={LABEL_STYLE}>Tags</div>
                    <Autocomplete
                      multiple freeSolo size="small" disableCloseOnSelect
                      options={[]}
                      value={tags}
                      onChange={(_, v) => { setTags(v as string[]); markDirty(); }}
                      slotProps={{ popper: POPPER_SLOT_PROPS.popper }}
                      renderValue={(value, getItemProps) => value.map((option, index) => {
                        const { key, ...itemProps } = getItemProps({ index });
                        return <Chip key={key} label={option} size="small" {...itemProps} sx={CHIP_SX} />;
                      })}
                      renderInput={(params) => <TextField {...params} placeholder="Add tags" sx={FIELD_SX} />}
                    />
                  </div>

                  <div>
                    <div style={LABEL_STYLE}>Expiration Date</div>
                    <TextField
                      fullWidth size="small"
                      placeholder="mm/dd/yyyy"
                      value={expirationDisplay}
                      onChange={(e) => {
                        const display = e.target.value;
                        setExpirationDisplay(display);
                        const iso = mmDdYyyyToIso(display);
                        if (iso) { setExpirationDate(iso); markDirty(); }
                      }}
                      sx={FIELD_SX}
                    />
                  </div>

                  <Accordion
                    disableGutters
                    sx={{ boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: '8px !important', '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Website Integration Data</span>
                    </AccordionSummary>
                    <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={LABEL_STYLE}>Description</div>
                        <TextField
                          fullWidth size="small" multiline minRows={2} value={websiteDescription}
                          onChange={(e) => { setWebsiteDescription(e.target.value); markDirty(); }}
                          sx={FIELD_SX}
                        />
                      </div>
                      <div>
                        <div style={LABEL_STYLE}>Notes</div>
                        <TextField
                          fullWidth size="small" multiline minRows={2} value={websiteNotes}
                          onChange={(e) => { setWebsiteNotes(e.target.value); markDirty(); }}
                          sx={FIELD_SX}
                        />
                      </div>
                    </AccordionDetails>
                  </Accordion>

                  <div style={{ borderTop: '1px solid #ececec', marginTop: 4, paddingTop: 4 }}>
                    <InfoRow label="Snippet ID" value={initialSnippet.id} copyable />
                    <InfoRow label="File Type" value="Text Snippet" />
                    <InfoRow label="File Size" value={fileSizeLabel} />
                    <InfoRow label="Date Uploaded" value={formatDateTime(initialSnippet.createdAt)} />
                    <InfoRow label="Last Updated" value={formatDateTime(initialSnippet.updatedAt)} />
                    <InfoRow label="Created By" value={initialSnippet.createdBy} />
                  </div>
                </div>
              )}

              {sideTab === 'rules' && (
                <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>Coming soon.</div>
              )}
              {sideTab === 'ai' && (
                <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>Coming soon.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <Tooltip title={dirty ? '' : 'Snippet created. No new changes to save.'} disableHoverListener={dirty} slotProps={POPPER_SLOT_PROPS}>
            <span>
              <Button
                onClick={handleSave}
                disabled={!dirty}
                variant="contained"
                sx={{
                  borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
                  letterSpacing: '0.4px', background: '#473bab', padding: '6px 20px',
                  '&:hover': { background: '#3d3396' },
                  '&.Mui-disabled': { background: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.26)' },
                }}
              >
                Save
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>
    </>,
    document.body,
  );
}
