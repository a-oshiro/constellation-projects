import { useState } from 'react';
import { Autocomplete, Checkbox, IconButton, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Asset, Offer, Template } from '../../data/types';
import { DESTINATION_URL_OPTIONS, getTemplateCtas } from '../../data/destinationUrlOptions';
import { FilledTemplatePreview } from './FilledTemplatePreview';

interface CopyUrlDialogProps {
  open: boolean;
  onClose: () => void;
  sourceUrl: string;
  sourceLabel: string;
  allAssets: Asset[];
  htmlTemplates: Template[];
  offers: Offer[];
  onApply: (templateId: string, ctaKey: string, offerId: string, url: string) => void;
}

const CHECKBOX_SX = {
  padding: '2px',
  flexShrink: 0,
  '& .MuiSvgIcon-root': { fontSize: 18 },
  color: '#cac9cf',
  '&.Mui-checked': { color: '#473bab' },
  '&.MuiCheckbox-indeterminate': { color: '#473bab' },
};

export function CopyUrlDialog({
  open,
  onClose,
  sourceUrl,
  sourceLabel,
  allAssets,
  htmlTemplates,
  offers,
  onApply,
}: CopyUrlDialogProps) {
  const [viewingTemplateId, setViewingTemplateId] = useState<string>(htmlTemplates[0]?.id ?? '');
  const [checkedTemplateIds, setCheckedTemplateIds] = useState<Set<string>>(new Set());
  const [checkedCtaKeys, setCheckedCtaKeys] = useState<Set<string>>(new Set());
  const [checkedOfferIds, setCheckedOfferIds] = useState<Set<string>>(new Set());

  // Editable URL state — defaults to what was selected when opening the dialog
  const [selectedUrl, setSelectedUrl] = useState(sourceUrl);
  const [inputValue, setInputValue] = useState(sourceLabel);

  if (!open) return null;

  const viewingTemplate = htmlTemplates.find(t => t.id === viewingTemplateId);
  const ctasForViewing = viewingTemplate ? getTemplateCtas(viewingTemplate.id) : [];
  const offersForViewing = offers.filter(o =>
    allAssets.some(a => a.templateId === viewingTemplateId && a.offerId === o.id)
  );

  // ── Select-all helpers ────────────────────────────────────────────────────
  const allTemplatesChecked = htmlTemplates.length > 0 && htmlTemplates.every(t => checkedTemplateIds.has(t.id));
  const someTemplatesChecked = !allTemplatesChecked && htmlTemplates.some(t => checkedTemplateIds.has(t.id));
  const toggleAllTemplates = () => {
    if (allTemplatesChecked) setCheckedTemplateIds(new Set());
    else setCheckedTemplateIds(new Set(htmlTemplates.map(t => t.id)));
  };

  const allCtasChecked = ctasForViewing.length > 0 && ctasForViewing.every(c => checkedCtaKeys.has(c.key));
  const someCtasChecked = !allCtasChecked && ctasForViewing.some(c => checkedCtaKeys.has(c.key));
  const toggleAllCtas = () => {
    if (allCtasChecked) setCheckedCtaKeys(new Set());
    else setCheckedCtaKeys(new Set(ctasForViewing.map(c => c.key)));
  };

  const allOffersChecked = offersForViewing.length > 0 && offersForViewing.every(o => checkedOfferIds.has(o.id));
  const someOffersChecked = !allOffersChecked && offersForViewing.some(o => checkedOfferIds.has(o.id));
  const toggleAllOffers = () => {
    if (allOffersChecked) setCheckedOfferIds(new Set());
    else setCheckedOfferIds(new Set(offersForViewing.map(o => o.id)));
  };

  // ── Selection count ───────────────────────────────────────────────────────
  let selectedCount = 0;
  let totalCount = 0;
  htmlTemplates.forEach(tmpl => {
    const tmplCtas = getTemplateCtas(tmpl.id);
    const tmplOfferIds = new Set(allAssets.filter(a => a.templateId === tmpl.id).map(a => a.offerId));
    totalCount += tmplCtas.length * tmplOfferIds.size;
    if (checkedTemplateIds.has(tmpl.id)) {
      tmplCtas.forEach(cta => {
        if (checkedCtaKeys.has(cta.key)) {
          checkedOfferIds.forEach(oid => {
            if (tmplOfferIds.has(oid)) selectedCount++;
          });
        }
      });
    }
  });

  const canCopy = selectedCount > 0 && !!selectedUrl;

  const handleCopy = () => {
    checkedTemplateIds.forEach(tmplId => {
      const tmplCtas = getTemplateCtas(tmplId);
      const tmplOfferIds = new Set(allAssets.filter(a => a.templateId === tmplId).map(a => a.offerId));
      tmplCtas.forEach(cta => {
        if (checkedCtaKeys.has(cta.key)) {
          checkedOfferIds.forEach(offerId => {
            if (tmplOfferIds.has(offerId)) {
              onApply(tmplId, cta.key, offerId, selectedUrl);
            }
          });
        }
      });
    });
    onClose();
  };

  const toggleTemplate = (id: string) => {
    setCheckedTemplateIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleCta = (key: string) => {
    setCheckedCtaKeys(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };
  const toggleOffer = (id: string) => {
    setCheckedOfferIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const matchingOption = DESTINATION_URL_OPTIONS.find(o => o.url === selectedUrl) ?? null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: 1100,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
      }}>
        {/* ── Dialog header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px', flexShrink: 0 }}>
          <span style={{ fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Copy URL
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', color: '#686576' }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </div>

        {/* ── Content: CSS Grid aligns URL container with Templates column ── */}
        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '116px 1fr 1fr 1fr',
          gridTemplateRows: 'auto 1fr',
          columnGap: 16,
          rowGap: 8,
          padding: '16px 16px 0',
        }}>
          {/* Row 1, col 1: "Selected URL:" label */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
              Selected URL:
            </span>
          </div>

          {/* Row 1, col 2: editable URL field in gray container */}
          <div style={{ background: '#f0f2f4', borderRadius: 12, padding: 12 }}>
            <Autocomplete
              freeSolo
              fullWidth
              size="small"
              options={DESTINATION_URL_OPTIONS}
              value={matchingOption ?? (selectedUrl || null)}
              inputValue={inputValue}
              onInputChange={(_, val) => setInputValue(val)}
              onChange={(_, newValue) => {
                if (newValue === null) {
                  setSelectedUrl('');
                  setInputValue('');
                } else if (typeof newValue === 'string') {
                  const byLabel = DESTINATION_URL_OPTIONS.find(o => o.label.toLowerCase() === newValue.toLowerCase());
                  setSelectedUrl(byLabel ? byLabel.url : newValue);
                  setInputValue(newValue);
                } else {
                  setSelectedUrl(newValue.url);
                  setInputValue(newValue.label);
                }
              }}
              onBlur={() => {
                const byLabel = DESTINATION_URL_OPTIONS.find(o => o.label.toLowerCase() === inputValue.toLowerCase());
                if (byLabel) {
                  setSelectedUrl(byLabel.url);
                  setInputValue(byLabel.label);
                }
              }}
              getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.label}
              isOptionEqualToValue={(opt, val) =>
                typeof val === 'string' ? opt.url === val : opt.url === val.url
              }
              filterOptions={(options, { inputValue: iv }) => {
                const lower = iv.toLowerCase();
                return options.filter(o => o.label.toLowerCase().includes(lower) || o.url.toLowerCase().includes(lower));
              }}
              slotProps={{ popper: { sx: { zIndex: 300000 } } }}
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
                  placeholder="Select or Type URL"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: '#fff',
                      borderRadius: '8px',
                      fontSize: 13,
                      fontFamily: 'Roboto, sans-serif',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.15)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.4)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab', borderWidth: 2 },
                    },
                    '& .MuiOutlinedInput-input': {
                      py: '6px', px: '8px', fontSize: 13,
                      fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', color: '#1f1d25',
                    },
                  }}
                />
              )}
            />
          </div>

          {/* Row 1, col 3 & 4: empty — grid keeps them sized to match CTA/Offers columns */}
          <div />
          <div />

          {/* Row 2, col 1: "Copy to:" label */}
          <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: 14 }}>
            <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
              Copy to:
            </span>
          </div>

          {/* Row 2, col 2: Templates card */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f2f4', borderRadius: 12, minHeight: 0 }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Checkbox size="small" checked={allTemplatesChecked} indeterminate={someTemplatesChecked} onChange={toggleAllTemplates} sx={CHECKBOX_SX} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>Templates</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {htmlTemplates.map(tmpl => {
                const tmplCtas = getTemplateCtas(tmpl.id);
                const tmplOfferIds = new Set(allAssets.filter(a => a.templateId === tmpl.id).map(a => a.offerId));
                const isSelected = viewingTemplateId === tmpl.id;
                const isChecked = checkedTemplateIds.has(tmpl.id);
                const firstOffer = offers.find(o => tmplOfferIds.has(o.id));
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setViewingTemplateId(tmpl.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: isSelected ? 'rgba(99,86,225,0.1)' : 'transparent', marginBottom: 2 }}
                  >
                    <Checkbox size="small" checked={isChecked} onChange={e => { e.stopPropagation(); toggleTemplate(tmpl.id); }} onClick={e => e.stopPropagation()} sx={CHECKBOX_SX} />
                    <div style={{ display:'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0}}>
                      {firstOffer && <div style={{ width: '100%', height: 32}}><FilledTemplatePreview template={tmpl} offer={firstOffer} backgroundUrl="" /></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.name}</div>
                      <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 1 }}>
                        {tmplCtas.length} CTAs | {tmplOfferIds.size} Offers | {allAssets.filter(a => a.templateId === tmpl.id).length} Assets
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2, col 3: CTAs card */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f2f4', borderRadius: 12, minHeight: 0 }}>
            <div style={{ padding: '12px 16px 4px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox size="small" checked={allCtasChecked} indeterminate={someCtasChecked} onChange={toggleAllCtas} sx={CHECKBOX_SX} />
                <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>CTAs</span>
              </div>
              {viewingTemplate && (
                <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 2, marginLeft: 34, marginBottom: 6 }}>
                  {viewingTemplate.name}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {ctasForViewing.map(cta => {
                const isChecked = checkedCtaKeys.has(cta.key);
                return (
                  <div
                    key={cta.key}
                    onClick={() => toggleCta(cta.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: isChecked ? 'rgba(99,86,225,0.1)' : 'transparent', marginBottom: 2 }}
                  >
                    <Checkbox size="small" checked={isChecked} onChange={() => toggleCta(cta.key)} onClick={e => e.stopPropagation()} sx={CHECKBOX_SX} />
                    <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cta.label.replace(' – Destination URL', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2, col 4: Offers card */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f2f4', borderRadius: 12, minHeight: 0 }}>
            <div style={{ padding: '12px 16px 4px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox size="small" checked={allOffersChecked} indeterminate={someOffersChecked} onChange={toggleAllOffers} sx={CHECKBOX_SX} />
                <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>Offers</span>
              </div>
              {viewingTemplate && (
                <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 2, marginLeft: 34, marginBottom: 6 }}>
                  {viewingTemplate.name}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
              {offersForViewing.map(offer => {
                const isChecked = checkedOfferIds.has(offer.id);
                const assetCount = allAssets.filter(a => a.offerId === offer.id && a.templateId === viewingTemplateId).length;
                return (
                  <div
                    key={offer.id}
                    onClick={() => toggleOffer(offer.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: isChecked ? 'rgba(99,86,225,0.1)' : 'transparent', marginBottom: 2 }}
                  >
                    <Checkbox size="small" checked={isChecked} onChange={() => toggleOffer(offer.id)} onClick={e => e.stopPropagation()} sx={CHECKBOX_SX} />
                    <div style={{ width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0}}>
                      {offer.imageUrl ? (
                        <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      ) : viewingTemplate ? (
                        <FilledTemplatePreview template={viewingTemplate} offer={offer} backgroundUrl="" />
                      ) : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{offer.vehicleName}</div>
                      <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 1 }}>{assetCount} {assetCount === 1 ? 'asset' : 'assets'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 24px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginRight: 8 }}>
            Selected {selectedCount}/{totalCount}
          </span>
          <button onClick={onClose} style={{ padding: '7px 20px', background: 'transparent', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px' }}>
            Cancel
          </button>
          <button onClick={handleCopy} disabled={!canCopy} style={{ padding: '7px 20px', background: canCopy ? '#473bab' : 'rgba(0,0,0,0.12)', border: 'none', borderRadius: 100, cursor: canCopy ? 'pointer' : 'default', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: canCopy ? '#fff' : 'rgba(0,0,0,0.26)', fontWeight: 500, letterSpacing: '0.46px' }}>
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
