import { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Select, MenuItem, FormControl } from '@mui/material';
import {
  Close,
  Add,
  Remove,
  ContentCopy,
  InfoOutlined,
  ChatBubbleOutlineOutlined,
  HistoryOutlined,
  Search,
  MoreVert,
  SendOutlined,
} from '@mui/icons-material';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES, PROJECT_INFO, CURRENT_USER } from '../../data/mockData';
import type { Asset, AssetVersion, AssetComment } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { useTestWidget } from '../../context/TestWidgetContext';
import { DESTINATION_URL_OPTIONS, getTemplateCtas } from '../../data/destinationUrlOptions';

const ZOOM_STEPS = [50, 75, 100, 150, 200, 300];

const SIDE_TABS = [
  { id: 'metadata',  label: 'Metadata',  Icon: InfoOutlined },
  { id: 'comments',  label: 'Comments',  Icon: ChatBubbleOutlineOutlined },
  { id: 'history',   label: 'History',   Icon: HistoryOutlined },
] as const;

type TabId = typeof SIDE_TABS[number]['id'];

const LABEL_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 400,
  color: '#686576',
  letterSpacing: '0.4px',
  lineHeight: '16px',
  marginBottom: 4,
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: 13,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 400,
  color: '#1f1d25',
  letterSpacing: '0.17px',
  lineHeight: '20px',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}
const Field = ({ label, children }: FieldProps) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <p style={LABEL_STYLE}>{label}</p>
    {children}
  </div>
);


const LEASE_DISCLOSURE =
  "Lease payment is calculated based on Manufacturer's Suggested Retail Price for vehicle as shown and does not necessarily represent the dealer's actual sale price. Dealer sets actual price. See dealer for details.";

const MOCK_DATE = '05/28/2026 02:37 PM';

const ChipValue = ({ label }: { label: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 6,
      background: '#f0f2f4',
      borderRadius: 4,
      padding: '3px 8px',
      fontSize: 13,
      fontFamily: 'Roboto, sans-serif',
      color: '#1f1d25',
      letterSpacing: '0.17px',
      lineHeight: '20px',
      maxWidth: '100%',
    }}
  >
    <span style={{ flex: 1, wordBreak: 'break-word' }}>{label}</span>
    <span style={{ fontSize: 18, color: '#9c99a9', cursor: 'pointer', lineHeight: '20px', flexShrink: 0 }}>×</span>
  </span>
);

interface ChipSelectFieldProps {
  label: string;
  chips: string[];
  placeholder?: string;
}
const ChipSelectField = ({ label, chips, placeholder }: ChipSelectFieldProps) => (
  <div style={{ position: 'relative', border: '1px solid rgba(0,0,0,0.23)', borderRadius: 4, padding: '8px 32px 8px 10px', minHeight: 44 }}>
    <span
      style={{
        position: 'absolute',
        top: -9,
        left: 8,
        background: '#ffffff',
        padding: '0 4px',
        fontSize: 11,
        fontFamily: 'Roboto, sans-serif',
        color: '#686576',
        letterSpacing: '0.4px',
        lineHeight: '16px',
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {chips.map((chip, i) => <ChipValue key={i} label={chip} />)}
      {chips.length === 0 && placeholder && (
        <span style={{ fontSize: 13, color: '#9c99a9', fontFamily: 'Roboto, sans-serif' }}>{placeholder}</span>
      )}
    </div>
    <svg
      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M7 10l5 5 5-5z" fill="#686576" />
    </svg>
  </div>
);

const MetadataPanel = ({ asset }: { asset: Asset }) => {
  const { destinationUrls, setDestinationUrl } = useProject();
  const isLease = asset.offerType?.toLowerCase().includes('lease') ||
    asset.offer.offerType.some((t) => t.toLowerCase().includes('lease'));

  const ctas = getTemplateCtas(asset.templateId);
  const isHtml = ctas.length > 0;
  const assetUrls = destinationUrls[asset.id] ?? {};

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 10px',
    fontSize: 13,
    fontFamily: 'Roboto, sans-serif',
    color: '#1f1d25',
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.23)',
    borderRadius: 4,
    outline: 'none',
    letterSpacing: '0.17px',
    lineHeight: '20px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23686576' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    paddingRight: 28,
    cursor: 'pointer',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: '7px 0',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
  };

  const rowLabelStyle: React.CSSProperties = {
    ...LABEL_STYLE,
    margin: 0,
    flexShrink: 0,
    minWidth: 110,
    paddingTop: 1,
  };

  const rowValueStyle: React.CSSProperties = {
    ...VALUE_STYLE,
    textAlign: 'right',
    wordBreak: 'break-all',
    flex: 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 16px 16px' }}>

      {/* ── Name ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={{ ...LABEL_STYLE, marginBottom: 4 }}>
          <span style={{ color: '#be0e1c', marginRight: 3 }}>*</span>Name
        </p>
        <div style={{ position: 'relative' }}>
          <input
            defaultValue={asset.name}
            style={{ ...inputStyle, paddingRight: 36 }}
          />
          <IconButton
            size="small"
            onClick={() => navigator.clipboard?.writeText(asset.name)}
            sx={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: '2px' }}
          >
            <ContentCopy style={{ fontSize: 14, color: '#686576' }} />
          </IconButton>
        </div>
      </div>

      {/* ── Tags ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={LABEL_STYLE}>Tags</p>
        <input
          defaultValue={asset.tags.join(', ')}
          placeholder="Tags"
          style={inputStyle}
        />
      </div>

      {/* ── Brands ──────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <p style={LABEL_STYLE}>Brands</p>
        <select defaultValue={asset.offer.make} style={selectStyle}>
          <option value={asset.offer.make}>{asset.offer.make}</option>
        </select>
      </div>

      {/* ── Chip-select fields ──────────────────────────── */}
      <ChipSelectField
        label="Accounts"
        chips={[PROJECT_INFO.accountName]}
        placeholder="Select accounts"
      />
      <ChipSelectField label="Make" chips={[asset.offer.make]} />
      <ChipSelectField label="Model" chips={[asset.offer.model]} />
      <ChipSelectField label="Year" chips={[String(asset.offer.year)]} />
      <ChipSelectField label="Trim" chips={[asset.offer.trim]} />
      <ChipSelectField label="Account" chips={[PROJECT_INFO.accountName]} />
      <ChipSelectField label="Asset Type" chips={[asset.platform]} />
      <ChipSelectField label="Offer Type" chips={[asset.offerType]} />
      <ChipSelectField label="Vehicle Condition" chips={['New']} />
      <ChipSelectField label="Entity Status" chips={[]} />
      {isLease && (
        <ChipSelectField label="Additional Lease Disclosure" chips={[LEASE_DISCLOSURE]} />
      )}

      {/* ── Destination URLs — HTML assets only ─────────── */}
      {isHtml && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '4px 0 0' }} />
          <p style={{
            margin: '4px 0 8px',
            fontSize: 13,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            color: '#1f1d25',
            letterSpacing: '0.15px',
            lineHeight: '20px',
          }}>
            Destination URLs
          </p>
          {ctas.map((cta) => {
            const currentVal = assetUrls[cta.key] ?? '';
            return (
              <div key={cta.key} style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={LABEL_STYLE}>{cta.label}</p>
                <FormControl size="small" fullWidth>
                  <Select
                    value={currentVal}
                    onChange={(e) => setDestinationUrl(asset.id, cta.key, e.target.value as string)}
                    displayEmpty
                    renderValue={(v) =>
                      v
                        ? (DESTINATION_URL_OPTIONS.find((o) => o.url === v)?.label ?? v)
                        : <span style={{ color: '#9c99a9', fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px' }}>Select or Type URL</span>
                    }
                    MenuProps={{ style: { zIndex: 200000 } }}
                    sx={{
                      background: '#f9fafa',
                      borderRadius: '4px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.54)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#473bab',
                        borderWidth: 2,
                      },
                      '& .MuiSelect-select': {
                        py: '6px',
                        px: '8px',
                        fontSize: 12,
                        fontFamily: 'Roboto, sans-serif',
                        letterSpacing: '0.17px',
                        color: '#1f1d25',
                      },
                    }}
                  >
                    {DESTINATION_URL_OPTIONS.map((opt) => (
                      <MenuItem
                        key={opt.url}
                        value={opt.url}
                        sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            );
          })}
        </>
      )}

      {/* ── Add Field ───────────────────────────────────── */}
      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 0',
          fontSize: 13,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          color: '#473bab',
          letterSpacing: '0.46px',
          alignSelf: 'flex-start',
        }}
      >
        + Add Field
      </button>

      {/* ── Divider ─────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.08)', margin: '16px 0 0 0' }} />

      {/* ── Read-only asset info ─────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Asset ID</span>
          <span style={rowValueStyle}>{asset.id}</span>
          <IconButton
            size="small"
            onClick={() => navigator.clipboard?.writeText(asset.id)}
            sx={{ padding: '2px', flexShrink: 0, mt: '-2px' }}
          >
            <ContentCopy style={{ fontSize: 14, color: '#686576' }} />
          </IconButton>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>File Type</span>
          <span style={rowValueStyle}>{asset.imageType}</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>File Size</span>
          <span style={rowValueStyle}>NA</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Dimensions</span>
          <span style={rowValueStyle}>{asset.width} x {asset.height}</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Date Uploaded</span>
          <span style={rowValueStyle}>{MOCK_DATE}</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Created at</span>
          <span style={rowValueStyle}>{MOCK_DATE}</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Created by</span>
          <span style={rowValueStyle}>NA</span>
        </div>
        <div style={rowStyle}>
          <span style={rowLabelStyle}>Last Modified</span>
          <span style={rowValueStyle}>{MOCK_DATE}</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={rowLabelStyle}>Modified by</span>
          <span style={rowValueStyle}>NA</span>
        </div>
      </div>

    </div>
  );
};

// ── History Panel helpers ────────────────────────────────────────────────────

function formatVersionTimestamp(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date} ${time}`;
}

function getDateGroupLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface HistoryPanelProps {
  asset: Asset;
  selectedVersionId: string | undefined;
  onVersionSelect: (v: AssetVersion | null) => void;
}

const HistoryPanel = ({ asset, selectedVersionId, onVersionSelect }: HistoryPanelProps) => {
  const { assetVersions } = useProject();
  const [search, setSearch] = useState('');
  const template = TEMPLATES.find((t) => t.id === asset.templateId);
  const isWide = asset.width > asset.height;
  const innerWPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  const allVersions = useMemo(() => {
    const vs = assetVersions[asset.id] ?? [];
    return [...vs].sort((a, b) => b.timestamp - a.timestamp); // newest first
  }, [assetVersions, asset.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allVersions;
    const q = search.toLowerCase();
    return allVersions.filter(
      (v) => v.name.toLowerCase().includes(q) || formatVersionTimestamp(v.timestamp).toLowerCase().includes(q)
    );
  }, [allVersions, search]);

  const groups = useMemo(() => {
    const map = new Map<string, AssetVersion[]>();
    filtered.forEach((v) => {
      const label = getDateGroupLabel(v.timestamp);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(v);
    });
    return Array.from(map.entries()).map(([label, versions]) => ({ label, versions }));
  }, [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Search + add */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 16px 10px', flexShrink: 0 }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(0,0,0,0.23)',
            borderRadius: 4,
            padding: '6px 10px',
          }}
        >
          <Search style={{ fontSize: 18, color: '#9c99a9', flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search versions"
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', background: 'transparent',
            }}
          />
        </div>
        <button
          style={{
            width: 40, height: 40, borderRadius: '50%', background: '#473bab',
            border: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Add style={{ fontSize: 20, color: '#ffffff' }} />
        </button>
      </div>

      {/* Count */}
      <span
        style={{
          fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576',
          padding: '0 16px 12px', flexShrink: 0,
        }}
      >
        {allVersions.length} saved version{allVersions.length !== 1 ? 's' : ''}
      </span>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        {allVersions.length === 0 ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 120, color: '#9c99a9', fontSize: 13, fontFamily: 'Roboto, sans-serif',
            }}
          >
            No versions yet
          </div>
        ) : groups.map(({ label, versions }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <p
              style={{
                margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif',
                fontWeight: 600, color: '#1f1d25', letterSpacing: '0.17px',
              }}
            >
              {label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {versions.map((version) => {
                const isLatest = version.id === allVersions[0]?.id;
                const isSelected = version.id === selectedVersionId;
                return (
                  <div
                    key={version.id}
                    onClick={() => onVersionSelect(isSelected ? null : version)}
                    style={{
                      display: 'flex',
                      border: isSelected ? '2px solid #473bab' : '1px solid rgba(0,0,0,0.12)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#ffffff',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: 90, height: 90, flexShrink: 0, position: 'relative',
                        overflow: 'hidden', background: '#F0F2F4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {template && (
                        <div
                          style={{
                            width: `${innerWPct}%`,
                            height: `${innerHPct}%`,
                            position: 'relative',
                          }}
                        >
                          <FilledTemplatePreview
                            template={template}
                            offer={version.offer}
                            backgroundUrl={version.backgroundUrl}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      style={{
                        flex: 1, minWidth: 0, padding: '8px 10px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                          style={{
                            fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576',
                            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {formatVersionTimestamp(version.timestamp)}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              background: 'rgba(71,59,171,0.12)', color: '#473bab',
                              borderRadius: 100, padding: '1px 8px',
                              fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                              letterSpacing: '0.4px', flexShrink: 0, whiteSpace: 'nowrap',
                            }}
                          >
                            Current
                          </span>
                        )}
                        <IconButton
                          size="small"
                          sx={{ padding: '2px', flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVert style={{ fontSize: 16, color: '#686576' }} />
                        </IconButton>
                      </div>
                      <p
                        style={{
                          margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif',
                          fontWeight: 500, color: '#1f1d25',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}
                      >
                        {version.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={CURRENT_USER.avatarUrl}
                          alt={CURRENT_USER.name}
                          style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: 11, fontFamily: 'Roboto, sans-serif',
                            color: '#9c99a9', letterSpacing: '0.4px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {CURRENT_USER.name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Comments Panel ───────────────────────────────────────────────────────────

function formatCommentTimestamp(ts: number): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `${time} · Today`;
  if (d.toDateString() === yesterday.toDateString()) return `${time} · Yesterday`;
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${time} · ${day}`;
}

interface CommentsPanelProps {
  asset: Asset;
}

const CommentsPanel = ({ asset }: CommentsPanelProps) => {
  const { assetComments, addAssetComment } = useProject();
  const [inputText, setInputText] = useState('');

  const comments: AssetComment[] = assetComments[asset.id] ?? [];
  // Newest first
  const sortedComments = [...comments].reverse();

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    addAssetComment(asset.id, text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Reply input — pinned at the top */}
      <div
        style={{
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '10px 12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* <img
          src={CURRENT_USER.avatarUrl}
          alt="You"
          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        /> */}
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply…"
          style={{
            flex: 1, border: '1px solid rgba(0,0,0,0.18)', borderRadius: 20,
            padding: '6px 14px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
            color: '#1f1d25', outline: 'none', background: '#f9fafa',
          }}
        />
        <IconButton
          size="small"
          onClick={handleSend}
          disabled={!inputText.trim()}
          sx={{
            color: inputText.trim() ? '#473bab' : '#9c99a9',
            padding: '5px',
            '&:disabled': { color: '#9c99a9' },
          }}
        >
          <SendOutlined style={{ fontSize: 18 }} />
        </IconButton>
      </div>

      {/* Comment list — newest at top */}
      <div
        style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        {sortedComments.length === 0 ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: 120, color: '#9c99a9', fontSize: 13,
              fontFamily: 'Roboto, sans-serif', textAlign: 'center',
            }}
          >
            No comments yet. Be the first to comment!
          </div>
        ) : (
          sortedComments.map((comment) => (
            <div key={comment.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <img
                src={comment.authorAvatar}
                alt={comment.authorName}
                style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 13, fontFamily: 'Roboto, sans-serif',
                      fontWeight: 600, color: '#1f1d25', letterSpacing: '0.17px',
                    }}
                  >
                    {comment.authorName}
                  </span>
                  <span
                    style={{
                      fontSize: 11, fontFamily: 'Roboto, sans-serif',
                      color: '#9c99a9', letterSpacing: '0.4px',
                    }}
                  >
                    {formatCommentTimestamp(comment.timestamp)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif',
                    color: '#3b3848', lineHeight: 1.5, wordBreak: 'break-word',
                  }}
                >
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── Main dialog ──────────────────────────────────────────────────────────────

interface AssetDetailsDialogProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetDetailsDialog = ({ asset, onClose }: AssetDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('metadata');
  const [zoomIndex, setZoomIndex] = useState(3); // 150%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [previewVersion, setPreviewVersion] = useState<AssetVersion | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { widgetWidth } = useTestWidget();

  // Reset version preview when switching away from History tab
  useEffect(() => {
    if (activeTab !== 'history') setPreviewVersion(null);
  }, [activeTab]);

  const zoomPct = ZOOM_STEPS[zoomIndex];
  const zoomFactor = zoomPct / 100;

  const isWide = asset.width > asset.height;
  const BASE = 460;
  const previewW = isWide
    ? BASE * zoomFactor
    : (asset.width / asset.height) * BASE * zoomFactor;
  const previewH = !isWide
    ? BASE * zoomFactor
    : (asset.height / asset.width) * BASE * zoomFactor;

  // Refs so the single wheel handler always reads current rendered dimensions
  const previewWRef = useRef(previewW);
  previewWRef.current = previewW;
  const previewHRef = useRef(previewH);
  previewHRef.current = previewH;

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const BUFFER = 60;
    const onWheel = (e: WheelEvent) => {
      const { width: containerW, height: containerH } = el.getBoundingClientRect();
      const assetW = previewWRef.current;
      const assetH = previewHRef.current;
      // Only pan when the rendered asset overflows the container in at least one axis
      if (assetW <= containerW && assetH <= containerH) return;
      e.preventDefault();
      const maxX = Math.max(0, (assetW - containerW) / 2) + BUFFER;
      const maxY = Math.max(0, (assetH - containerH) / 2) + BUFFER;
      setPan((prev) => ({
        x: Math.min(maxX, Math.max(-maxX, prev.x - e.deltaX)),
        y: Math.min(maxY, Math.max(-maxY, prev.y - e.deltaY)),
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const template = TEMPLATES.find((t) => t.id === asset.templateId);

  // When a history version is selected, preview that version; otherwise use the live asset data
  const previewOffer = previewVersion ? previewVersion.offer : asset.offer;
  const previewBgUrl = previewVersion ? previewVersion.backgroundUrl : asset.backgroundUrl;

  const tabLabel = SIDE_TABS.find((t) => t.id === activeTab)?.label ?? 'Metadata';

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0, left: widgetWidth,
          zIndex: 100000,
          background: 'rgba(0,0,0,0.4)',
          transition: 'left 0.2s ease',
        }}
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          top: 16, right: 16, bottom: 16, left: widgetWidth + 16,
          zIndex: 100001,
          transition: 'left 0.2s ease',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow:
            '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 16px 10px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
            gap: 8,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 16,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: '#1f1d25',
              letterSpacing: '0.15px',
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {asset.name}
          </span>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              padding: '5px',
              background: 'rgba(17,16,20,0.08)',
              borderRadius: '100px',
              '&:hover': { background: 'rgba(17,16,20,0.14)' },
            }}
          >
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Preview area */}
          <div
            ref={previewRef}
            style={{
              flex: 1,
              position: 'relative',
              background: '#f0f2f4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              <div style={{ position: 'relative', width: previewW, height: previewH }}>
                {template && previewOffer ? (
                  <FilledTemplatePreview
                    template={template}
                    offer={previewOffer}
                    backgroundUrl={previewBgUrl}
                  />
                ) : (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    draggable={false}
                  />
                )}
              </div>
            </div>

            {/* Zoom controls */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 4,
                background: '#ffffff',
              }}
            >
              <IconButton
                size="small"
                onClick={() => { setZoomIndex((i) => Math.max(0, i - 1)); setPan({ x: 0, y: 0 }); }}
                disabled={zoomIndex === 0}
                sx={{ padding: '4px', borderRadius: '100px' }}
              >
                <Remove style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>
              <div
                style={{
                  width: 49,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    color: '#1f1d25',
                    letterSpacing: '0.17px',
                    lineHeight: 1.43,
                  }}
                >
                  {zoomPct}%
                </span>
              </div>
              <IconButton
                size="small"
                onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                sx={{ padding: '4px', borderRadius: '100px' }}
              >
                <Add style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>
            </div>

            {/* Action buttons */}
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.23)',
                  borderRadius: 100,
                  padding: '5px 14px',
                  fontSize: 13,
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500,
                  color: '#1f1d25',
                  letterSpacing: '0.46px',
                  lineHeight: '22px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Edit Source Template
              </button>
              <button
                style={{
                  background: '#473bab',
                  border: 'none',
                  borderRadius: 100,
                  padding: '5px 14px',
                  fontSize: 13,
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500,
                  color: '#ffffff',
                  letterSpacing: '0.46px',
                  lineHeight: '22px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Configure Variables
              </button>
            </div>
          </div>

          {/* Right panel */}
          <div
            style={{
              width: 393,
              display: 'flex',
              borderLeft: '1px solid rgba(0,0,0,0.08)',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {/* Vertical tabs */}
            <div
              style={{
                width: 73,
                borderRight: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 8,
                flexShrink: 0,
              }}
            >
              {SIDE_TABS.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      borderLeft: active ? '3px solid #473bab' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <Icon
                      style={{
                        fontSize: 20,
                        color: active ? '#473bab' : '#686576',
                        transition: 'color 0.15s',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: active ? 500 : 400,
                        color: active ? '#473bab' : '#686576',
                        letterSpacing: '0.4px',
                        lineHeight: '14px',
                        transition: 'color 0.15s',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 500,
                    color: '#1f1d25',
                    letterSpacing: '0.1px',
                    lineHeight: 1.5,
                  }}
                >
                  {tabLabel}
                </span>
              </div>

              {/* Scrollable panel body */}
              <div style={{ flex: 1, overflowY: (activeTab === 'history' || activeTab === 'comments') ? 'hidden' : 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'metadata' ? (
                  <MetadataPanel asset={asset} />
                ) : activeTab === 'history' ? (
                  <HistoryPanel
                    asset={asset}
                    selectedVersionId={previewVersion?.id}
                    onVersionSelect={setPreviewVersion}
                  />
                ) : activeTab === 'comments' ? (
                  <CommentsPanel asset={asset} />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 200,
                      color: '#9c99a9',
                      fontSize: 13,
                      fontFamily: 'Roboto, sans-serif',
                    }}
                  >
                    Coming soon
                  </div>
                )}
              </div>

              {/* Panel footer */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    background: '#473bab',
                    border: 'none',
                    borderRadius: 100,
                    padding: '6px 20px',
                    fontSize: 14,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 500,
                    color: '#ffffff',
                    letterSpacing: '0.4px',
                    lineHeight: '24px',
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
