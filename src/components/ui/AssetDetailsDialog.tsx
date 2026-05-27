import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import {
  Close,
  Add,
  Remove,
  ContentCopy,
  InfoOutlined,
  ChatBubbleOutlineOutlined,
  HistoryOutlined,
  FactCheckOutlined,
} from '@mui/icons-material';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';
import type { Asset } from '../../data/types';

const ZOOM_STEPS = [50, 75, 100, 150, 200, 300];

const SIDE_TABS = [
  { id: 'metadata',  label: 'Metadata',  Icon: InfoOutlined },
  { id: 'comments',  label: 'Comments',  Icon: ChatBubbleOutlineOutlined },
  { id: 'approvals', label: 'Approvals', Icon: FactCheckOutlined },
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

interface ReadOnlyRowProps {
  label: string;
  value: string;
  copy?: boolean;
}
const ReadOnlyRow = ({ label, value, copy }: ReadOnlyRowProps) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, gap: 8 }}>
    <span style={{ ...LABEL_STYLE, margin: 0, flexShrink: 0, minWidth: 96 }}>{label}</span>
    <span style={{ ...VALUE_STYLE, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{value}</span>
    {copy && (
      <IconButton
        size="small"
        onClick={() => navigator.clipboard?.writeText(value)}
        sx={{ padding: '2px', flexShrink: 0 }}
      >
        <ContentCopy style={{ fontSize: 14, color: '#686576' }} />
      </IconButton>
    )}
  </div>
);

const TagChip = ({ label }: { label: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: '#f0f2f4',
      borderRadius: 100,
      padding: '2px 10px',
      fontSize: 12,
      fontFamily: 'Roboto, sans-serif',
      color: '#1f1d25',
      letterSpacing: '0.17px',
      lineHeight: '20px',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

const MetadataPanel = ({ asset }: { asset: Asset }) => {
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

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: 64,
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

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(0,0,0,0.08)',
    margin: '4px 0',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 16px 8px' }}>
      <Field label="Name">
        <input defaultValue={asset.name} style={inputStyle} />
      </Field>

      <Field label="Brand">
        <select defaultValue={asset.offer.make} style={selectStyle}>
          <option value={asset.offer.make}>{asset.offer.make}</option>
        </select>
      </Field>

      <Field label="Tags">
        {asset.tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {asset.tags.map((t) => <TagChip key={t} label={t} />)}
          </div>
        ) : (
          <span style={{ ...VALUE_STYLE, color: '#9c99a9' }}>No tags</span>
        )}
      </Field>

      <Field label="Offer Type">
        <select defaultValue={asset.offerType} style={selectStyle}>
          <option value="Lease">Lease</option>
          <option value="Purchase">Purchase</option>
          <option value="Finance">Finance</option>
        </select>
      </Field>

      <Field label="Expiration Date">
        <input
          type="text"
          defaultValue={asset.offer.expirationDate}
          style={inputStyle}
        />
      </Field>

      <Field label="Description">
        <textarea defaultValue={asset.description} style={textareaStyle} />
      </Field>

      <Field label="Notes">
        <textarea placeholder="Add notes…" style={textareaStyle} />
      </Field>

      <hr style={dividerStyle} />

      <p style={{ ...LABEL_STYLE, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 0 }}>
        Asset Attributes
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ReadOnlyRow label="Asset ID" value={asset.id} copy />
        <ReadOnlyRow label="File Type" value={asset.imageType} />
        <ReadOnlyRow label="Resolution" value={`${asset.width} × ${asset.height}`} />
        <ReadOnlyRow label="Platform" value={asset.platform} />
        <ReadOnlyRow label="Folder" value={asset.folder} />
        <ReadOnlyRow label="Offer" value={`${asset.offer.year} ${asset.offer.make} ${asset.offer.model}`} />
        <ReadOnlyRow label="Term" value={`${asset.offer.term} mo`} />
        <ReadOnlyRow label="Monthly" value={`$${asset.offer.monthlyPayment}/mo`} />
      </div>
    </div>
  );
};

interface AssetDetailsDialogProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetDetailsDialog = ({ asset, onClose }: AssetDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('metadata');
  const [zoomIndex, setZoomIndex] = useState(2); // 100%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  const zoomPct = ZOOM_STEPS[zoomIndex];
  const zoomFactor = zoomPct / 100;

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const canPan = ZOOM_STEPS[zoomIndex] > 100;
    const onWheel = (e: WheelEvent) => {
      if (!canPan) return;
      e.preventDefault();
      setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomIndex]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const template = TEMPLATES.find((t) => t.id === asset.templateId);
  const isWide = asset.width > asset.height;
  const BASE = 460;
  const previewW = isWide
    ? BASE * zoomFactor
    : (asset.width / asset.height) * BASE * zoomFactor;
  const previewH = !isWide
    ? BASE * zoomFactor
    : (asset.height / asset.width) * BASE * zoomFactor;

  const tabLabel = SIDE_TABS.find((t) => t.id === activeTab)?.label ?? 'Metadata';

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.4)',
        }}
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          inset: 16,
          zIndex: 10000,
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
                {template && asset.offer ? (
                  <FilledTemplatePreview
                    template={template}
                    offer={asset.offer}
                    backgroundUrl={asset.backgroundUrl}
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
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {activeTab === 'metadata' ? (
                  <MetadataPanel asset={asset} />
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
