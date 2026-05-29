import { useState } from 'react';
import {
  Close, Add, FolderOutlined, DragIndicator,
  Visibility, VisibilityOff,
} from '@mui/icons-material';
import {
  Checkbox, Select, MenuItem, Radio, RadioGroup,
  FormControlLabel, Divider,
} from '@mui/material';
import { useProject } from '../../context/ProjectContext';
import { useProgressIndicator } from '../../context/ProgressIndicatorContext';
import { useLayout } from '../../context/LayoutContext';
import { TEMPLATES } from '../../data/mockData';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import type { Asset } from '../../data/types';

// ─── Constants ──────────────────────────────────────────────────────────────

const PIXEL_OPTIONS = ['0.5x', '0.75x', '1x', '1.5x', '2x', '3x', '4x'];
const FILE_TYPE_OPTIONS = ['Composite', 'PNG', 'JPEG'];
const BRAND_OPTIONS = ['BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'Porsche', 'Lexus'];
const ACCOUNT_OPTIONS = ['BMW Seattle', 'BMW Portland', 'BMW San Francisco', 'BMW Los Angeles'];
const NUMBER_POSITION_OPTIONS = ['Before', 'After'];

/** All variables from the provided list — used in Asset Naming & Metadata. */
const ALL_VARIABLES = [
  'account', 'accountImages', 'additionalAprDisclosure', 'additionalLeaseDisclosure',
  'advertisedPrice', 'aprDisclosure', 'aprExpirationDate', 'aprFinanced', 'aprManual',
  'aprMinFico', 'aprPayment', 'aprRate', 'aprTerm', 'aprTextSnippetId', 'assetType',
  'blindSpotMonitor', 'condition', 'dateInStock', 'daysInStock', 'dimensions',
  'disclosure', 'drivetrain', 'drivewayUrls', 'endDate', 'entryAssetSourceId',
  'expirationDate', 'exteriorColor', 'generalTextSnippetId', 'id', 'inTransit',
  'make', 'mileage', 'model', 'modelCode', 'msrp', 'name', 'numberAtThisPrice',
  'offerType', 'priorityScore', 'projectName', 'startDate', 'stockNumber', 'styleName',
  'templateName', 'transmission', 'trim', 'vin', 'vinsAtThisPrice', 'year',
];

/** The 20 naming variables shown in the expanded Asset Naming list. */
const NAMING_VARIABLES_COLLAPSED = ['account', 'year', 'make', 'model', 'trim'];
const NAMING_VARIABLES_EXPANDED = [
  'account', 'year', 'make', 'model', 'trim',
  'assetType', 'condition', 'drivetrain', 'transmission', 'mileage',
  'exteriorColor', 'stockNumber', 'vin', 'dateInStock', 'numberAtThisPrice',
  'advertisedPrice', 'msrp', 'offerType', 'styleName', 'templateName',
];

const DEFAULT_CHECKED_NAMING = new Set(['account', 'year', 'make']);

/** Metadata fields: {label, key, defaultValue} */
const METADATA_FIELDS: { label: string; key: string; defaultValue: string }[] = [
  { label: 'Asset Type',                    key: 'assetType',                  defaultValue: 'assetType' },
  { label: 'Year',                           key: 'year',                       defaultValue: 'year' },
  { label: 'Make',                           key: 'make',                       defaultValue: 'make' },
  { label: 'Model',                          key: 'model',                      defaultValue: 'model' },
  { label: 'Trim',                           key: 'trim',                       defaultValue: 'trim' },
  { label: 'Offer Type',                     key: 'offerType',                  defaultValue: 'offerType' },
  { label: 'Style',                          key: 'styleName',                  defaultValue: 'styleName' },
  { label: 'Condition',                      key: 'condition',                  defaultValue: 'condition' },
  { label: 'Additional Apr Disclosure',      key: 'additionalAprDisclosure',    defaultValue: 'additionalAprDisclosure' },
  { label: 'Additional Lease Disclosure',    key: 'additionalLeaseDisclosure',  defaultValue: 'additionalLeaseDisclosure' },
];

// ─── Shared styles ───────────────────────────────────────────────────────────

const sectionCardStyle: React.CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 12,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#1f1d25',
  letterSpacing: '0.1px',
  lineHeight: 1.57,
};

const labelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#686576',
  letterSpacing: '0.4px',
  lineHeight: 1.66,
  marginBottom: 3,
};

const selectSx = {
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.17px',
  color: '#1f1d25',
  height: 36,
  background: '#f9fafa',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9c99a9' },
  '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 },
};

const radioSx = {
  color: '#cac9cf',
  '&.Mui-checked': { color: '#473bab' },
  padding: '6px',
};

// ─── Thumbnail Stack (AdShell-style rotated layers) ──────────────────────────

/** Renders a single asset letterboxed inside its container — mirrors AdShellCard's AssetLayerContent. */
const AssetLayerContent = ({ asset }: { asset: Asset }) => {
  const template = TEMPLATES.find((t) => t.id === asset.templateId);
  if (!template) return null;
  const isWide = template.width > template.height;
  const innerW = isWide ? 100 : (template.width / template.height) * 100;
  const innerH = !isWide ? 100 : (template.height / template.width) * 100;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: `${innerW}%`, height: `${innerH}%`, position: 'relative', flexShrink: 0 }}>
        <FilledTemplatePreview template={template} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
      </div>
    </div>
  );
};

const AssetThumbnailStack = ({ assets, total }: { assets: Asset[]; total: number }) => {
  const SIZE = 200;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
      {/* Square container — same stacking approach as AdShellCard */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE}}>
        {/* Layer 3 — back, rotated -5° */}
        {assets[2] && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, transform: 'rotate(-5deg)' }}>
            <AssetLayerContent asset={assets[2]} />
          </div>
        )}
        {/* Layer 2 — middle, rotated +5° */}
        {assets[1] && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, transform: 'rotate(5deg)' }}>
            <AssetLayerContent asset={assets[1]} />
          </div>
        )}
        {/* Layer 1 — front, no rotation */}
        {assets[0] && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <AssetLayerContent asset={assets[0]} />
          </div>
        )}
      </div>
      <span style={{
        fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576',
        letterSpacing: '0.17px', lineHeight: 1.43,
      }}>
        {total} {total === 1 ? 'asset' : 'assets'} selected
      </span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface AdvancedGenerationPanelProps {
  selectedAssets: Asset[];
  onClose: () => void;
}

export const AdvancedGenerationPanel = ({ selectedAssets, onClose }: AdvancedGenerationPanelProps) => {
  const { assets: allAssets, bulkSetAssetStatus } = useProject();
  const { startProgress } = useProgressIndicator();
  const { addSubmittingIds, clearSubmittingIds } = useLayout();

  // Determine which assets to use for preview / counter
  const effectiveAssets = selectedAssets.length > 0 ? selectedAssets : allAssets;
  const previewAssets = effectiveAssets.slice(0, 3);
  const totalCount = effectiveAssets.length;

  // ── Generate handler ──
  const handleGenerate = () => {
    // Only draft assets can be submitted for approval
    const draftPool = selectedAssets.length > 0
      ? selectedAssets.filter((a) => a.status === 'draft')
      : allAssets.filter((a) => a.status === 'draft');

    if (draftPool.length === 0) { onClose(); return; }

    const targetIds = new Set(draftPool.map((a) => a.id));

    // Register IDs so ReviewPage renders skeleton cards immediately
    addSubmittingIds(targetIds);

    startProgress(draftPool.map((a) => ({
      id: a.id,
      name: a.name,
      thumbnailUrl: a.backgroundUrl || a.thumbnailUrl,
    })));

    setTimeout(() => {
      bulkSetAssetStatus(targetIds, 'awaiting_approval');
      clearSubmittingIds();
    }, 3000);

    onClose();
  };

  // ── Settings state ──
  const [pixel, setPixel] = useState('1x');
  const [fileType, setFileType] = useState('Composite');
  const [brand, setBrand] = useState('BMW');

  // ── Export to state ──
  const [exportDestination, setExportDestination] = useState<'default' | 'choose'>('default');
  const [account, setAccount] = useState('BMW Seattle');

  // ── Asset Naming state ──
  const [namingExpanded, setNamingExpanded] = useState(false);
  const [checkedVars, setCheckedVars] = useState<Set<string>>(new Set(DEFAULT_CHECKED_NAMING));
  const [numberPosition, setNumberPosition] = useState('After');
  const [numberStart, setNumberStart] = useState('1');

  const visibleNamingVars = namingExpanded ? NAMING_VARIABLES_EXPANDED : NAMING_VARIABLES_COLLAPSED;

  const toggleVar = (v: string) => {
    setCheckedVars((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  // ── Metadata state ──
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    Object.fromEntries(METADATA_FIELDS.map((f) => [f.key, f.defaultValue]))
  );

  const setMetaValue = (key: string, value: string) => {
    setMetadataValues((prev) => ({ ...prev, [key]: value }));
  };

  // ── Example filename ──
  const exampleParts = [...checkedVars].filter((v) => NAMING_VARIABLES_EXPANDED.includes(v));
  const exampleName = exampleParts.length > 0
    ? `Example: ${exampleParts.slice(0, 3).map((v) => {
        if (v === 'year') return '2025';
        if (v === 'make') return 'Toyota';
        if (v === 'model') return 'Camry';
        if (v === 'account') return 'BMW-Seattle';
        return v;
      }).join('-')}-${numberPosition === 'After' ? numberStart : ''}${numberPosition === 'Before' ? numberStart : ''}.jpg`
    : 'Example: 2025-Toyota-Camry-1.jpg';

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 320,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        margin: '8px 8px 8px 0',
        flexShrink: 0,
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
      }}>
        <p style={{
          margin: 0, fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          color: '#1f1d25', letterSpacing: '0.15px', lineHeight: '24px',
        }}>
          Advanced Generation
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', padding: 4,
            display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </button>
      </div>

      {/* ── Scrollable body ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Thumbnail stack ─────────────────────────────── */}
        <AssetThumbnailStack assets={previewAssets} total={totalCount} />

        {/* ── Settings ────────────────────────────────────── */}
        <div style={sectionCardStyle}>
          <p style={sectionTitleStyle}>Settings</p>

          {/* Export Type (read-only) */}
          <div>
            <p style={labelStyle}>Export Type</p>
            <Select value="Save on Portal" size="small" variant="outlined" fullWidth sx={selectSx}>
              <MenuItem value="Save on Portal" sx={{ fontSize: 12 }}>Save on Portal</MenuItem>
            </Select>
          </div>

          {/* Pixel + File Type row */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Pixel</p>
              <Select value={pixel} onChange={(e) => setPixel(e.target.value)} size="small" variant="outlined" fullWidth sx={selectSx}>
                {PIXEL_OPTIONS.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
              </Select>
            </div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>File Type</p>
              <Select value={fileType} onChange={(e) => setFileType(e.target.value)} size="small" variant="outlined" fullWidth sx={selectSx}>
                {FILE_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
              </Select>
            </div>
          </div>

          {/* Brand */}
          <div>
            <p style={labelStyle}>Brand</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#f0f2f4', borderRadius: 4, padding: '3px 8px',
              }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                  {brand}
                </span>
                <button
                  onClick={() => setBrand('BMW')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Close style={{ fontSize: 14, color: '#686576' }} />
                </button>
              </div>
              <Select
                value=""
                displayEmpty
                size="small"
                variant="outlined"
                onChange={(e) => { if (e.target.value) setBrand(e.target.value); }}
                renderValue={() => (
                  <Add style={{ fontSize: 16, color: '#473bab' }} />
                )}
                sx={{
                  height: 28, minWidth: 36,
                  background: '#f9fafa',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                  '& .MuiSelect-select': { padding: '4px 4px !important', display: 'flex', alignItems: 'center' },
                  '& .MuiSelect-iconOutlined': { display: 'none' },
                }}
              >
                {BRAND_OPTIONS.filter((b) => b !== brand).map((b) => (
                  <MenuItem key={b} value={b} sx={{ fontSize: 12 }}>{b}</MenuItem>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* ── Export to ───────────────────────────────────── */}
        <div style={sectionCardStyle}>
          <p style={sectionTitleStyle}>Export to</p>
          <RadioGroup
            value={exportDestination}
            onChange={(_, v) => setExportDestination(v as 'default' | 'choose')}
          >
            {/* Default account folder */}
            <FormControlLabel
              value="default"
              control={<Radio size="small" sx={radioSx} />}
              label={<span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>Default account folder</span>}
              sx={{ marginLeft: 0, marginRight: 0 }}
            />
            {exportDestination === 'default' && (
              <div style={{ paddingLeft: 24, paddingBottom: 4 }}>
                <p style={{ ...labelStyle, marginBottom: 3 }}>Account</p>
                <Select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  size="small"
                  variant="outlined"
                  fullWidth
                  sx={selectSx}
                >
                  {ACCOUNT_OPTIONS.map((o) => (
                    <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>
                  ))}
                </Select>
              </div>
            )}

            {/* Choose folders */}
            <FormControlLabel
              value="choose"
              control={<Radio size="small" sx={radioSx} />}
              label={<span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>Choose folders</span>}
              sx={{ marginLeft: 0, marginRight: 0 }}
            />
            {exportDestination === 'choose' && (
              <div style={{ paddingLeft: 24 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #cac9cf', borderRadius: 4, padding: '6px 10px',
                  background: '#f9fafa',
                }}>
                  <FolderOutlined style={{ fontSize: 18, color: '#473bab' }} />
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                    BMW Offers May
                  </span>
                </div>
              </div>
            )}
          </RadioGroup>
        </div>

        {/* ── Asset Naming ─────────────────────────────────── */}
        <div style={sectionCardStyle}>
          <p style={sectionTitleStyle}>Asset Naming</p>
          <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>
            Select variables to fill name
          </p>

          {/* Add Manual Text */}
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              color: '#473bab',
            }}
          >
            <Add style={{ fontSize: 16, color: '#473bab' }} />
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', color: '#473bab' }}>
              Add Manual Text
            </span>
          </button>

          {/* Variable rows */}
          {visibleNamingVars.map((v) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', height: 38 }}>
              <DragIndicator style={{ fontSize: 18, color: '#9c99a9', cursor: 'grab', flexShrink: 0 }} />
              <Checkbox
                checked={checkedVars.has(v)}
                onChange={() => toggleVar(v)}
                size="small"
                sx={{ '&.Mui-checked': { color: '#473bab' }, padding: '9px' }}
              />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
                {v}
              </span>
            </div>
          ))}

          {/* View All / Hide All */}
          <button
            onClick={() => setNamingExpanded((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', alignSelf: 'flex-start',
            }}
          >
            {namingExpanded
              ? <VisibilityOff style={{ fontSize: 16, color: '#473bab' }} />
              : <Visibility style={{ fontSize: 16, color: '#473bab' }} />
            }
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', color: '#473bab' }}>
              {namingExpanded
                ? `Hide All (${NAMING_VARIABLES_EXPANDED.length})`
                : `View All (${NAMING_VARIABLES_EXPANDED.length})`
              }
            </span>
          </button>

          <Divider />

          {/* Number + Start */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Number</p>
              <Select
                value={numberPosition}
                onChange={(e) => setNumberPosition(e.target.value)}
                size="small" variant="outlined" fullWidth sx={selectSx}
              >
                {NUMBER_POSITION_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>
                ))}
              </Select>
            </div>
            <div style={{ width: 64 }}>
              <p style={labelStyle}>Start</p>
              <input
                type="number"
                value={numberStart}
                min={1}
                onChange={(e) => setNumberStart(e.target.value)}
                style={{
                  width: '100%', height: 36, padding: '6px 8px', fontSize: 12,
                  fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px',
                  background: '#f9fafa', border: '1px solid #cac9cf', borderRadius: 4,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>
            {exampleName}
          </p>
        </div>

        {/* ── Metadata ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={sectionTitleStyle}>Metadata</p>
          <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>
            Select variables to fill each field's metadata
          </p>

          {METADATA_FIELDS.map((field) => (
            <div key={field.key}>
              <p style={labelStyle}>{field.label}</p>
              <Select
                value={metadataValues[field.key]}
                onChange={(e) => setMetaValue(field.key, e.target.value)}
                size="small" variant="outlined" fullWidth sx={selectSx}
              >
                {ALL_VARIABLES.map((v) => (
                  <MenuItem key={v} value={v} sx={{ fontSize: 12 }}>{v}</MenuItem>
                ))}
              </Select>
            </div>
          ))}

          {/* New Field button */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', alignSelf: 'flex-start',
          }}>
            <Add style={{ fontSize: 16, color: '#473bab' }} />
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', color: '#473bab' }}>
              New Field
            </span>
          </button>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid rgba(71,59,171,0.5)', borderRadius: 100,
            padding: '6px 16px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
            fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          style={{
            background: '#473bab', border: 'none', borderRadius: 100,
            padding: '6px 16px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
            fontWeight: 500, color: '#ffffff', letterSpacing: '0.46px', lineHeight: '22px',
            cursor: 'pointer',
          }}
        >
          Generate
        </button>
      </div>
    </div>
  );
};
