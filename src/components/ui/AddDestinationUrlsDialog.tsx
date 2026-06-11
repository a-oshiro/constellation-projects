import { useState, useMemo, useEffect } from 'react';
import { Autocomplete, TextField, Tooltip, LinearProgress, IconButton } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, ContentCopy, FileUploadOutlined, Close } from '@mui/icons-material';
import type { Asset, Template, Offer } from '../../data/types';
import { DESTINATION_URL_OPTIONS, HTML_TEMPLATE_CTAS, getTemplateCtas } from '../../data/destinationUrlOptions';
import type { CtaField } from '../../data/destinationUrlOptions';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';

const MIXED = '__MIXED__';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Selected HTML assets — matrix and apply are scoped to these */
  allAssets: Asset[];
  /** Template IDs to show in the left column (from selected HTML assets) */
  selectedTemplateIds: string[];
}

// ── Destination URL autocomplete cell ─────────────────────────────────────────

function UrlCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const isMixed = value === MIXED;
  const matchingOption = DESTINATION_URL_OPTIONS.find(o => o.url === value) ?? null;
  const [inputValue, setInputValue] = useState(isMixed ? '' : (matchingOption ? matchingOption.label : value));
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (value === MIXED) {
      setInputValue('');
    } else {
      const opt = DESTINATION_URL_OPTIONS.find(o => o.url === value) ?? null;
      setInputValue(opt ? opt.label : value);
    }
  }, [value]);

  const commitValue = (val: string) => {
    const byLabel = DESTINATION_URL_OPTIONS.find(o => o.label.toLowerCase() === val.toLowerCase());
    onChange(byLabel ? byLabel.url : val);
  };

  const handleCopy = () => {
    const toCopy = matchingOption ? matchingOption.url : value;
    if (toCopy && toCopy !== MIXED) navigator.clipboard.writeText(toCopy);
  };

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Autocomplete
        freeSolo
        fullWidth
        size="medium"
        options={DESTINATION_URL_OPTIONS}
        value={matchingOption ?? (value && value !== MIXED ? value : null)}
        inputValue={inputValue}
        onInputChange={(_, val) => setInputValue(val)}
        onChange={(_, newValue) => {
          if (newValue === null) { setInputValue(''); onChange(''); }
          else if (typeof newValue === 'string') { commitValue(newValue); }
          else { setInputValue(newValue.label); onChange(newValue.url); }
        }}
        onBlur={() => {
          const stored = DESTINATION_URL_OPTIONS.find(o => o.url === value);
          if (!stored || stored.label !== inputValue) commitValue(inputValue);
        }}
        getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.label}
        isOptionEqualToValue={(opt, val) =>
          typeof val === 'string' ? opt.url === val : opt.url === val.url
        }
        filterOptions={(options, { inputValue: iv }) => {
          const lower = iv.toLowerCase();
          return options.filter(o =>
            o.label.toLowerCase().includes(lower) || o.url.toLowerCase().includes(lower)
          );
        }}
        slotProps={{ popper: { sx: { zIndex: 200000 } } }}
        renderOption={(props, opt) => {
          const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };
          return (
            <li key={key} {...rest} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', padding: '6px 12px' }}>
              {opt.label}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={isMixed && inputValue === '' ? 'Mixed' : 'Select or Type URL'}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: '#f9fafa',
                borderRadius: '4px',
                padding: '0 32px 0 0 !important',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.54)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab', borderWidth: 2 },
              },
              '& .MuiOutlinedInput-input': {
                py: '5px', px: '8px', fontSize: 12,
                fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px',
                color: isMixed && inputValue === '' ? '#9c99a9' : '#1f1d25',
                fontStyle: isMixed && inputValue === '' ? 'italic' : 'normal',
                '&::placeholder': { color: '#9c99a9', opacity: 1, fontStyle: 'italic' },
              },
            }}
          />
        )}
      />
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          padding: '2px',
          opacity: hovered && value && value !== MIXED ? 1 : 0,
          transition: 'opacity 0.15s',
          position: 'absolute',
          right: 28,
          pointerEvents: hovered && value && value !== MIXED ? 'auto' : 'none',
        }}
      >
        <ContentCopy sx={{ fontSize: 16, color: '#686576' }} />
      </IconButton>
    </div>
  );
}

// ── Template list item ─────────────────────────────────────────────────────────

function TemplateListItem({
  template,
  offers,
  ctas,
  assetCount,
  isSelected,
  isComplete,
  onClick,
}: {
  template: Template;
  offers: Offer[];
  ctas: CtaField[];
  assetCount: number;
  isSelected: boolean;
  isComplete: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 12,
        cursor: 'pointer',
        background: isSelected ? 'rgba(99,86,225,0.08)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Thumbnail */}
      <div style={{ width: 56, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: '1px solid #e0dfe8' }}>
        <FilledTemplatePreview
          template={template}
          offer={offers[0]}
          backgroundUrl={''}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', fontWeight: 500, lineHeight: 1.3, letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {template.name}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 2 }}>
          {ctas.length} CTAs · {offers.length} Offers · {assetCount} Assets
        </div>
      </div>

      {/* Status icon */}
      {isComplete
        ? <CheckCircle sx={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
        : <RadioButtonUnchecked sx={{ fontSize: 18, color: '#cac9cf', flexShrink: 0 }} />
      }
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

export function AddDestinationUrlsDialog({ open, onClose, allAssets, selectedTemplateIds }: Props) {
  const { destinationUrls, bulkSetDestinationUrls, offers, templates } = useProject();

  // HTML templates in the order they appear in the selected set, filtered to HTML_TEMPLATE_CTAS
  const htmlTemplates = useMemo(() =>
    selectedTemplateIds
      .map(id => templates.find(t => t.id === id))
      .filter((t): t is Template => !!t && !!HTML_TEMPLATE_CTAS[t.id]),
  [selectedTemplateIds, templates]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(htmlTemplates[0]?.id ?? '');

  useEffect(() => {
    if (htmlTemplates.length && !htmlTemplates.find(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(htmlTemplates[0].id);
    }
  }, [htmlTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(() =>
    templates.find(t => t.id === selectedTemplateId),
  [templates, selectedTemplateId]);

  const ctas = useMemo(() =>
    selectedTemplate ? getTemplateCtas(selectedTemplate.id) : [],
  [selectedTemplate]);

  // Global matrix persisted across template switches: { [templateId]: { [offerId]: { [ctaKey]: url } } }
  const [globalMatrix, setGlobalMatrix] = useState<Record<string, Record<string, Record<string, string>>>>({});

  // Seed all templates from destinationUrls when dialog opens; don't re-seed on template switch
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, Record<string, Record<string, string>>> = {};
    htmlTemplates.forEach(tmpl => {
      const tmplCtas = getTemplateCtas(tmpl.id);
      const tmplAssets = allAssets.filter(a => a.templateId === tmpl.id);
      const tmplOffers = offers.filter(o => allAssets.some(a => a.templateId === tmpl.id && a.offerId === o.id));
      const tmplMatrix: Record<string, Record<string, string>> = {};
      tmplOffers.forEach(offer => {
        const ctaMap: Record<string, string> = {};
        tmplCtas.forEach(cta => {
          const assetsForOffer = tmplAssets.filter(a => a.offerId === offer.id);
          const urls = assetsForOffer.map(a => (destinationUrls[a.id] ?? {})[cta.key] ?? '');
          const unique = [...new Set(urls)];
          ctaMap[cta.key] = unique.length === 1 ? unique[0] : MIXED;
        });
        tmplMatrix[offer.id] = ctaMap;
      });
      initial[tmpl.id] = tmplMatrix;
    });
    setGlobalMatrix(initial);
  // Only re-seed when the dialog opens, not on every dependency change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Slice of globalMatrix for the currently-visible template
  const matrix = useMemo(() => globalMatrix[selectedTemplateId] ?? {}, [globalMatrix, selectedTemplateId]);

  const setCellValue = (offerId: string, ctaKey: string, url: string) => {
    setGlobalMatrix(prev => ({
      ...prev,
      [selectedTemplateId]: {
        ...(prev[selectedTemplateId] ?? {}),
        [offerId]: { ...(prev[selectedTemplateId]?.[offerId] ?? {}), [ctaKey]: url },
      },
    }));
  };

  // Offers and assets scoped to selected assets only
  const offersForTemplate = useMemo(() =>
    offers.filter(o => allAssets.some(a => a.templateId === selectedTemplateId && a.offerId === o.id)),
  [offers, allAssets, selectedTemplateId]);

  const templateAssets = useMemo(() =>
    allAssets.filter(a => a.templateId === selectedTemplateId),
  [allAssets, selectedTemplateId]);

  // Row complete = all CTAs filled and no MIXED
  const isRowComplete = (offerId: string) =>
    ctas.every(c => {
      const v = matrix[offerId]?.[c.key] ?? '';
      return v && v !== MIXED;
    });

  // Apply all templates' matrices to only the selected assets
  const handleApply = () => {
    const updates: Record<string, Record<string, string>> = {};
    htmlTemplates.forEach(tmpl => {
      const tmplCtas = getTemplateCtas(tmpl.id);
      const tmplAssets = allAssets.filter(a => a.templateId === tmpl.id);
      const tmplMatrix = globalMatrix[tmpl.id] ?? {};
      const tmplOffers = offers.filter(o => allAssets.some(a => a.templateId === tmpl.id && a.offerId === o.id));
      tmplOffers.forEach(offer => {
        const ctaMap = tmplMatrix[offer.id] ?? {};
        tmplAssets.filter(a => a.offerId === offer.id).forEach(asset => {
          const assetCtaMap: Record<string, string> = {};
          tmplCtas.forEach(cta => {
            const v = ctaMap[cta.key] ?? '';
            if (v && v !== MIXED) assetCtaMap[cta.key] = v;
          });
          if (Object.keys(assetCtaMap).length) updates[asset.id] = assetCtaMap;
        });
      });
    });
    bulkSetDestinationUrls(updates);
    onClose();
  };

  // Progress based on live globalMatrix, scoped to selected assets only
  const { totalAssets, readyAssets } = useMemo(() => {
    let total = 0;
    let ready = 0;
    htmlTemplates.forEach(tmpl => {
      const tmplCtas = getTemplateCtas(tmpl.id);
      const tmplAssets = allAssets.filter(a => a.templateId === tmpl.id);
      const tmplMatrix = globalMatrix[tmpl.id] ?? {};
      const tmplOffers = offers.filter(o => allAssets.some(a => a.templateId === tmpl.id && a.offerId === o.id));
      total += tmplAssets.length;
      tmplOffers.forEach(offer => {
        const rowComplete = tmplCtas.every(c => {
          const v = tmplMatrix[offer.id]?.[c.key] ?? '';
          return v && v !== MIXED;
        });
        if (rowComplete) {
          ready += tmplAssets.filter(a => a.offerId === offer.id).length;
        }
      });
    });
    return { totalAssets: total, readyAssets: ready };
  }, [htmlTemplates, allAssets, globalMatrix, offers]);

  const isTemplateComplete = (tmplId: string) => {
    const tmplCtas = getTemplateCtas(tmplId);
    const tmplAssets = allAssets.filter(a => a.templateId === tmplId);
    const tmplMatrix = globalMatrix[tmplId] ?? {};
    const tmplOffers = offers.filter(o => allAssets.some(a => a.templateId === tmplId && a.offerId === o.id));
    return tmplAssets.length > 0 && tmplOffers.every(offer =>
      tmplCtas.every(c => {
        const v = tmplMatrix[offer.id]?.[c.key] ?? '';
        return v && v !== MIXED;
      })
    );
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: 'calc(100vw - 32px)',
        height: 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize: 18, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Add Destination URLs
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '6px' }}>
            <Close sx={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* ── Left panel ── */}
          <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
            <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Templates</span>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px',
                background: 'transparent', border: '1px solid #473bab', borderRadius: 100,
                cursor: 'pointer', fontSize: 12, fontFamily: 'Roboto, sans-serif',
                color: '#473bab', fontWeight: 500, letterSpacing: '0.4px', whiteSpace: 'nowrap',
              }}>
                <FileUploadOutlined sx={{ fontSize: 14, color: '#473bab' }} />
                Upload URLs CSV
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 16px', marginBottom: 8 }}>
              <LinearProgress
                variant="determinate"
                value={totalAssets ? (readyAssets / totalAssets) * 100 : 0}
                sx={{
                  height: 4, borderRadius: 2,
                  backgroundColor: 'rgba(99,86,225,0.08)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#473bab', borderRadius: 2 },
                }}
              />
              <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 4 }}>
                {readyAssets} / {totalAssets} Assets ready
              </div>
            </div>

            {/* Template list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
              {htmlTemplates.map(tmpl => {
                const tmplOffers = offers.filter(o => allAssets.some(a => a.templateId === tmpl.id && a.offerId === o.id));
                const tmplCtas = getTemplateCtas(tmpl.id);
                const tmplAssetCount = allAssets.filter(a => a.templateId === tmpl.id).length;
                return (
                  <TemplateListItem
                    key={tmpl.id}
                    template={tmpl}
                    offers={tmplOffers}
                    ctas={tmplCtas}
                    assetCount={tmplAssetCount}
                    isSelected={selectedTemplateId === tmpl.id}
                    isComplete={isTemplateComplete(tmpl.id)}
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Right header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
                {selectedTemplate?.name ?? ''}
              </span>
            </div>

            {/* Matrix table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  {/* Offer column */}
                  <col style={{ width: 180 }} />
                  {/* CTA columns */}
                  {ctas.map(c => <col key={c.key} />)}
                  {/* Row status */}
                  <col style={{ width: 32 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 8px 8px 0', textAlign: 'left', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      Offer
                    </th>
                    {ctas.map(c => (
                      <th key={c.key} style={{ padding: '12px 8px 8px', textAlign: 'left', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        {c.label.replace(' – Destination URL', '')}
                      </th>
                    ))}
                    <th style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }} />
                  </tr>
                </thead>
                <tbody>
                  {offersForTemplate.map(offer => {
                    const complete = isRowComplete(offer.id);
                    const assetCount = templateAssets.filter(a => a.offerId === offer.id).length;
                    return (
                      <tr key={offer.id}>
                        {/* Offer cell */}
                        <td style={{ padding: '10px 8px 10px 0', verticalAlign: 'middle', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 20, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: '1px solid #e0dfe8' }}>
                              {selectedTemplate && (
                                <FilledTemplatePreview
                                  template={selectedTemplate}
                                  offer={offer}
                                  backgroundUrl={''}
                                />
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', lineHeight: 1.3, letterSpacing: '0.17px' }}>
                                {offer.vehicleName}
                              </div>
                              <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
                                {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CTA URL cells */}
                        {ctas.map(cta => (
                          <td key={cta.key} style={{ padding: '10px 8px', verticalAlign: 'middle', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                            <UrlCell
                              value={matrix[offer.id]?.[cta.key] ?? ''}
                              onChange={(url) => setCellValue(offer.id, cta.key, url)}
                            />
                          </td>
                        ))}

                        {/* Row complete indicator */}
                        <td style={{ padding: '10px 0 10px 4px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          {complete && <CheckCircle sx={{ fontSize: 18, color: '#2e7d32' }} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 20px', background: 'transparent', border: '1px solid rgba(0,0,0,0.23)', borderRadius: 100,
              cursor: 'pointer', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', fontWeight: 500, letterSpacing: '0.46px',
            }}
          >
            Close
          </button>
          <button
            onClick={handleApply}
            style={{
              padding: '7px 20px', background: '#473bab', border: 'none', borderRadius: 100,
              cursor: 'pointer', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#fff', fontWeight: 500, letterSpacing: '0.46px',
            }}
          >
            Apply URLs
          </button>
        </div>
      </div>
    </div>
  );
}
