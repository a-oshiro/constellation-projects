import { useState, useEffect, useRef } from 'react';
import { Checkbox, FormControlLabel, Autocomplete, TextField, Popover } from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import { ExpandMore, ExpandLess, WarningAmber, HourglassEmpty, HighlightOff } from '@mui/icons-material';
import { OutOfStockBadge, isAssetOutOfStock } from './OutOfStockBadge';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';
import type { Asset, AssetStatus } from '../../data/types';
import { getPrimaryLeaseData } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { getTemplateCtas, DESTINATION_URL_OPTIONS } from '../../data/destinationUrlOptions';
import pageTextLinkSvg from '../../assets/icons/page-text-link.svg';

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_CHIP_CONFIG: Partial<Record<AssetStatus, {
  bg: string; color: string; opacity?: number; label: string; Icon: React.ElementType;
}>> = {
  updated:           { bg: 'rgba(225,118,19,0.08)', color: '#c45500', opacity: 0.75, label: 'Updated',           Icon: WarningAmber },
  removed:           { bg: 'rgba(210,50,63,0.08)',  color: '#be0e1c',               label: 'Removed',           Icon: HighlightOff },
  awaiting_approval: { bg: 'rgba(225,118,19,0.08)', color: '#c45500', opacity: 0.75, label: 'Awaiting Approval', Icon: HourglassEmpty },
};

function AssetStatusChip({ status }: { status: AssetStatus }) {
  const cfg = STATUS_CHIP_CONFIG[status];
  if (!cfg) return null;
  const { bg, color, opacity = 1, label, Icon } = cfg;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, borderRadius: 8, padding: '3px 8px 3px 6px', flexShrink: 0, alignSelf: 'flex-start' }}>
      <Icon style={{ fontSize: 14, color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color, opacity, letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDestinationUrl(asset: Asset): string {
  return `/${asset.offer.model.toLowerCase().replace(/\s+/g, '-')}/new`;
}
function buildDisclaimer(asset: Asset): string {
  return `${asset.offer.year} ${asset.offer.make} ${asset.offer.trim}`;
}
function buildDisclaimerContent(asset: Asset): string {
  const { offer } = asset;
  const lease = getPrimaryLeaseData(offer);
  return (
    `${lease.monthlyPayment ?? 0}/mo. lease for ${lease.term ?? 0} mos. $${lease.downPayment ?? 0} due at signing. ` +
    `${(lease.milesPerYear ?? 0).toLocaleString()} miles/year. Offer expires ${lease.expirationDate ?? ''}. ` +
    `Not all buyers will qualify. Subject to credit approval. Residency restrictions apply. ` +
    `See dealer for complete details. Tax, title, license, and dealer fees extra.`
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, marginBottom: 2,
};

export const fieldInputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px',
  fontSize: 12, fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
  background: '#ffffff', border: '1px solid #dddce0',
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
};

// ── CTA-specific destination URL autocomplete ─────────────────────────────────

const DestinationUrlHorizontalField = ({
  assetId,
  ctaKey,
  value: currentVal,
  warning,
}: {
  assetId: string;
  ctaKey: string;
  value: string;
  warning?: boolean;
}) => {
  const { setDestinationUrl } = useProject();
  const matchingOption = DESTINATION_URL_OPTIONS.find(o => o.url === currentVal) ?? null;
  const [inputValue, setInputValue] = useState(matchingOption ? matchingOption.label : currentVal);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const opt = DESTINATION_URL_OPTIONS.find(o => o.url === currentVal) ?? null;
    setInputValue(opt ? opt.label : currentVal);
  }, [currentVal]);

  const commitValue = (val: string) => {
    const byLabel = DESTINATION_URL_OPTIONS.find(o => o.label.toLowerCase() === val.toLowerCase());
    setDestinationUrl(assetId, ctaKey, byLabel ? byLabel.url : val);
  };

  const isFilled = !!currentVal;
  const showWarning = warning && !isFilled && !focused;

  return (
    <Autocomplete
      freeSolo
      fullWidth
      size="medium"
      options={DESTINATION_URL_OPTIONS}
      value={matchingOption ?? (currentVal || null)}
      inputValue={inputValue}
      onInputChange={(_, val) => setInputValue(val)}
      onChange={(_, newValue) => {
        if (newValue === null) {
          setInputValue('');
          setDestinationUrl(assetId, ctaKey, '');
        } else if (typeof newValue === 'string') {
          commitValue(newValue);
        } else {
          setInputValue((newValue as { label: string; url: string }).label);
          setDestinationUrl(assetId, ctaKey, (newValue as { label: string; url: string }).url);
        }
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const stored = DESTINATION_URL_OPTIONS.find(o => o.url === currentVal);
        if (!stored || stored.label !== inputValue) commitValue(inputValue);
      }}
      getOptionLabel={(opt) => typeof opt === 'string' ? opt : (opt as { label: string }).label}
      isOptionEqualToValue={(opt, val) =>
        typeof val === 'string' ? opt.url === val : opt.url === (val as { url: string }).url
      }
      filterOptions={(options, { inputValue: iv }) => {
        const lower = iv.toLowerCase();
        return options.filter(o =>
          o.label.toLowerCase().includes(lower) ||
          o.url.toLowerCase().includes(lower)
        );
      }}
      slotProps={{ popper: { sx: { zIndex: 200000 } } }}
      renderOption={(props, opt) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };
        return (
          <li key={key} {...rest} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', padding: '6px 12px' }}>
            {(opt as { label: string }).label}
          </li>
        );
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            placeholder="Select or Type URL"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: '#ffffff',
                borderRadius: '4px',
                padding: '0 32px 0 0 !important',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: showWarning ? '#F59E0B' : '#cac9cf',
                  borderWidth: showWarning ? 2 : 1,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: showWarning ? '#F59E0B' : 'rgba(0,0,0,0.54)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab', borderWidth: 2 },
              },
              '& .MuiOutlinedInput-input': {
                py: '4px',
                px: '8px',
                fontSize: 12,
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.17px',
                color: '#1f1d25',
                '&::placeholder': { color: '#9c99a9', opacity: 1 },
              },
            }}
          />
        );
      }}
    />
  );
};

// ── CTA color picker ──────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_CTA_COLOR = '#473bab';

const CtaColorField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) => {
  const swatchRef = useRef<HTMLDivElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [hexInput, setHexInput] = useState(value || DEFAULT_CTA_COLOR);

  // Keep input in sync when the value prop changes from outside
  useEffect(() => {
    if (value && HEX_RE.test(value)) setHexInput(value);
  }, [value]);

  const liveColor = HEX_RE.test(hexInput) ? hexInput : (value || DEFAULT_CTA_COLOR);

  const handlePickerChange = (hex: string) => {
    setHexInput(hex);
    onChange(hex);
  };

  const handleTextChange = (raw: string) => {
    // Auto-prepend # when the user starts typing without it
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    setHexInput(normalized.slice(0, 7));
    if (HEX_RE.test(normalized)) onChange(normalized);
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Colored swatch — click to open picker */}
        <div
          ref={swatchRef}
          onClick={() => setAnchorEl(swatchRef.current)}
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            background: liveColor,
            border: '1px solid #dddce0',
            cursor: 'pointer',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
        {/* Hex text input */}
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleTextChange(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          style={{ ...fieldInputStyle, flex: 1 }}
        />
      </div>

      {/* Color picker popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: '4px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', overflow: 'hidden' } } }}
      >
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <HexColorPicker color={liveColor} onChange={handlePickerChange} style={{ width: 220, height: 180 }} />
          {/* Hex input inside popover for convenience */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: liveColor, border: '1px solid #dddce0', flexShrink: 0 }} />
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleTextChange(e.target.value)}
              maxLength={7}
              placeholder="#000000"
              style={{ ...fieldInputStyle, flex: 1, fontSize: 12 }}
            />
          </div>
        </div>
      </Popover>
    </>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AssetHorizontalCardProps {
  asset: Asset;
  /** Multi-select state (controlled by parent) */
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  /** Lead form state (lifted to parent for bulk operations) */
  leadFormEnabled?: boolean;
  leadFormCta?: string;
  onLeadFormEnabledChange?: (enabled: boolean) => void;
  onLeadFormCtaChange?: (cta: string) => void;
  onOpenUrlsDialog?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AssetHorizontalCard = ({
  asset,
  selected = false,
  onSelect,
  leadFormEnabled = false,
  leadFormCta = 'Claim Offer',
  onLeadFormEnabledChange,
  onLeadFormCtaChange,
  onOpenUrlsDialog,
}: AssetHorizontalCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const template = TEMPLATES.find((t) => t.id === asset.templateId);

  const { destinationUrls } = useProject();
  const ctas = getTemplateCtas(asset.templateId);
  const isHtml = ctas.length > 0;
  const assetUrls = destinationUrls[asset.id] ?? {};
  const hasMissingUrls = isHtml && asset.status !== 'draft' && asset.status !== 'removed' && ctas.some((cta) => !assetUrls[cta.key]);

  const isWide = asset.width > asset.height;
  const innerWidthPct  = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  const isOutOfStock = isAssetOutOfStock(asset.offer);

  const [expirationDate,    setExpirationDate]    = useState(getPrimaryLeaseData(asset.offer).expirationDate ?? '');
  const [destinationUrl,    setDestinationUrl]    = useState(buildDestinationUrl(asset));
  const [disclaimer,        setDisclaimer]        = useState(buildDisclaimer(asset));
  const [disclaimerContent, setDisclaimerContent] = useState(buildDisclaimerContent(asset));
  // ctaKey → hex color
  const [ctaColors, setCtaColors] = useState<Record<string, string>>({});
  const setCtaColor = (ctaKey: string, hex: string) =>
    setCtaColors((prev) => ({ ...prev, [ctaKey]: hex }));

  return (
    <div
      style={{
        background: '#ffffff',
        border: selected ? '2px solid #473bab' : isOutOfStock ? '1px solid #D2323F' : '1px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'border-color 0.12s',
      }}
    >
      {/* ── Top: thumbnail + info ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>

        {/* Thumbnail 90×90 */}
        <div
          style={{
            width: 90, height: 90, flexShrink: 0,
            background: '#f0f2f4', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            outline: isOutOfStock ? '1px solid #D2323F' : undefined,
            outlineOffset: '-1px',
          }}
        >
          {template && asset.offer ? (
            <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
              <FilledTemplatePreview template={template} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
            </div>
          ) : (
            <img src={asset.thumbnailUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}

          {/* Selection checkbox — top-left of thumbnail */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', top: 7, left: 7, width: 13, height: 13, background: 'white', borderRadius: 1, zIndex: 0 }} />
            <Checkbox
              checked={selected}
              size="small"
              onChange={(e) => { e.stopPropagation(); onSelect?.(asset.id, e.target.checked); }}
              onClick={(e) => e.stopPropagation()}
              sx={{
                padding: '5px', zIndex: 1, position: 'relative',
                '& .MuiSvgIcon-root': { fontSize: 19, color: selected ? '#473bab' : 'rgba(0,0,0,0.54)' },
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {isOutOfStock ? <OutOfStockBadge /> : <AssetStatusChip status={asset.status} />}
          <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.name}
          </p>
          <div style={{ display: 'flex', gap: 4, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.66, letterSpacing: '0.4px' }}>
            <span>{asset.imageType}</span>
            <span>|</span>
            <span>{asset.width} x {asset.height}</span>
          </div>
          {hasMissingUrls && (
            <div
              onClick={(e) => { e.stopPropagation(); onOpenUrlsDialog?.(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px 3px 6px', borderRadius: 8,
                background: '#FDF4EC', cursor: 'pointer', alignSelf: 'flex-start',
              }}
            >
              <img src={pageTextLinkSvg} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#c45500', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
                Missing Destination URLs
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Configure Website Data toggle ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', borderTop: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', userSelect: 'none'}}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', }}>
            Configure Website Data
          </span>
          {expanded
            ? <ExpandLess style={{ fontSize: 18, color: '#473bab' }} />
            : <ExpandMore style={{ fontSize: 18, color: '#473bab' }} />
          }
        </div>
      </div>

      {/* ── Expanded fields ── */}
      {expanded && (
        <div style={{ background: '#ffffff', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10,}}>

          <div>
            <p style={fieldLabelStyle}>Offer Expiration Date</p>
            <input type="text" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={fieldInputStyle} />
          </div>

          {isHtml ? (
            ctas.map((cta) => (
              <div key={cta.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <p style={fieldLabelStyle}>{cta.label}</p>
                  <DestinationUrlHorizontalField
                    assetId={asset.id}
                    ctaKey={cta.key}
                    value={assetUrls[cta.key] ?? ''}
                    warning={!assetUrls[cta.key]}
                  />
                </div>

              </div>
            ))
          ) : (
            <div>
              <p style={fieldLabelStyle}>Destination URL</p>
              <input type="text" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} style={fieldInputStyle} />
            </div>
          )}

          <div>
            <p style={fieldLabelStyle}>Disclaimer</p>
            <input type="text" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} style={fieldInputStyle} />
          </div>

          <div>
            <p style={fieldLabelStyle}>Disclaimer Content</p>
            <textarea
              value={disclaimerContent}
              onChange={(e) => setDisclaimerContent(e.target.value)}
              rows={4}
              style={{ ...fieldInputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* ── Lead Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={leadFormEnabled}
                  onChange={(e) => onLeadFormEnabledChange?.(e.target.checked)}
                  size="small"
                  sx={{ color: 'rgba(0,0,0,0.54)', '&.Mui-checked': { color: '#473bab' }, padding: '9px' }}
                />
              }
              label={
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                  Lead Form
                </span>
              }
              sx={{ margin: 0 }}
            />

            {leadFormEnabled && (
              <div style={{ paddingLeft: 38 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#d2323f', lineHeight: '12px' }}>*</span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.15px', lineHeight: '12px' }}>
                    Lead Form CTA
                  </span>
                </div>
                <input
                  type="text"
                  value={leadFormCta}
                  onChange={(e) => onLeadFormCtaChange?.(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
