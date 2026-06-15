import { useState, useMemo, useEffect, useRef } from 'react';
import { Autocomplete, TextField, Tooltip, LinearProgress, IconButton, Menu, MenuItem } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, ContentCopy, ContentPaste, FileUploadOutlined, Close, AutoAwesome, Check, MoreVert } from '@mui/icons-material';
import { detectSmartFill } from '../../utils/smartFill';
import type { SmartFillResult } from '../../utils/smartFill';
import type { Asset, Template, Offer } from '../../data/types';
import { CopyUrlDialog } from './CopyUrlDialog';
import { DESTINATION_URL_OPTIONS, HTML_TEMPLATE_CTAS, getTemplateCtas } from '../../data/destinationUrlOptions';
import type { CtaField } from '../../data/destinationUrlOptions';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';

const MIXED = '__MIXED__';
const ALL_TEMPLATES_ID = '__ALL__';

// CTA with its owning template context (used in "All" view)
type CtaColumn = { key: string; label: string; templateId: string; templateName: string };

interface Props {
  open: boolean;
  onClose: () => void;
  /** Selected HTML assets — matrix and apply are scoped to these */
  allAssets: Asset[];
  /** Template IDs to show in the left column (from selected HTML assets) */
  selectedTemplateIds: string[];
}

// ── Destination URL autocomplete cell ─────────────────────────────────────────

interface UrlCellProps {
  value: string;
  onChange: (url: string) => void;
  pendingValue?: string;
  onApplyToTemplate: (url: string) => void;
}

function UrlCell({ value, onChange, pendingValue = '', onApplyToTemplate }: UrlCellProps) {
  const isMixed = value === MIXED;
  const matchingOption = DESTINATION_URL_OPTIONS.find(o => o.url === value) ?? null;
  const [inputValue, setInputValue] = useState(isMixed ? '' : (matchingOption ? matchingOption.label : value));
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const showAsPending = !value && !!pendingValue && !focused;

  useEffect(() => {
    if (value === MIXED) {
      setInputValue('');
    } else if (value) {
      const opt = DESTINATION_URL_OPTIONS.find(o => o.url === value) ?? null;
      setInputValue(opt ? opt.label : value);
    } else if (pendingValue && !focused) {
      setInputValue(pendingValue);
    } else if (!pendingValue && !value) {
      setInputValue('');
    }
  }, [value, pendingValue, focused]);

  const commitValue = (val: string) => {
    const byLabel = DESTINATION_URL_OPTIONS.find(o => o.label.toLowerCase() === val.toLowerCase());
    onChange(byLabel ? byLabel.url : val);
  };

  const isFilled = !!value && value !== MIXED;

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Tooltip
        title={!focused && isFilled ? value : ''}
        placement="bottom-start"
        enterDelay={400}
        disableFocusListener
        disableTouchListener
        slotProps={{ popper: { sx: { zIndex: 199999 } }, tooltip: { sx: { fontSize: 11, fontFamily: 'Roboto, sans-serif', maxWidth: 360, wordBreak: 'break-all' } } }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Autocomplete
            freeSolo
            fullWidth
            size="medium"
            options={DESTINATION_URL_OPTIONS}
            value={matchingOption ?? (value && value !== MIXED ? value : null)}
            inputValue={showAsPending ? pendingValue : inputValue}
            onInputChange={(_, val) => { if (!showAsPending) setInputValue(val); }}
            onChange={(_, newValue) => {
              if (newValue === null) { setInputValue(''); onChange(''); }
              else if (typeof newValue === 'string') { commitValue(newValue); }
              else { setInputValue(newValue.label); onChange(newValue.url); }
            }}
            onFocus={() => {
              setFocused(true);
              if (showAsPending) setInputValue('');
            }}
            onBlur={() => {
              setFocused(false);
              // If no real value and pendingValue exists, restore pending display
              if (!value && pendingValue) {
                setInputValue(pendingValue);
              } else {
                const stored = DESTINATION_URL_OPTIONS.find(o => o.url === value);
                if (!stored || stored.label !== inputValue) commitValue(inputValue);
              }
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
                <Tooltip key={key} title={opt.url} placement="right" enterDelay={300} slotProps={{ popper: { sx: { zIndex: 200001 } }, tooltip: { sx: { fontSize: 11, fontFamily: 'Roboto, sans-serif', maxWidth: 360, wordBreak: 'break-all' } } }}>
                  <li {...rest} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', padding: '6px 12px' }}>
                    {opt.label}
                  </li>
                </Tooltip>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={showAsPending ? '' : (isMixed && inputValue === '' ? 'Mixed' : 'Select or Type URL')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: showAsPending ? 'rgba(99,86,225,0.04)' : '#f9fafa',
                    borderRadius: '4px',
                    padding: '0 32px 0 0 !important',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: showAsPending ? 'rgba(99,86,225,0.3)' : '#cac9cf' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: showAsPending ? 'rgba(99,86,225,0.5)' : 'rgba(0,0,0,0.54)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab', borderWidth: 2 },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: '5px', px: '8px', fontSize: 12,
                    fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px',
                    color: showAsPending ? '#9c99a9' : (isMixed && inputValue === '' ? '#9c99a9' : '#1f1d25'),
                    fontStyle: showAsPending ? 'italic' : (isMixed && inputValue === '' ? 'italic' : 'normal'),
                    '&::placeholder': { color: '#9c99a9', opacity: 1, fontStyle: 'italic' },
                  },
                }}
              />
            )}
          />
        </div>
      </Tooltip>

      <Tooltip title={isFilled ? 'Apply to column' : ''} placement="top">
        <span>
          <IconButton
            size="small"
            disabled={!isFilled}
            onClick={() => onApplyToTemplate(value)}
            sx={{
              padding: '2px',
              flexShrink: 0,
              visibility: hovered ? 'visible' : 'hidden',
              transition: 'opacity 0.15s',
              color: '#686576',
              '&:hover': { color: '#1f1d25', background: 'rgba(0,0,0,0.04)' },
              '&.Mui-disabled': { visibility: 'hidden' },
            }}
          >
            <ContentCopy sx={{ fontSize: 16 }} />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
}

// ── Smart Fill speech bubble ──────────────────────────────────────────────────

const BUBBLE_WIDTH = 276;

function WizardBubble({ onAccept, onIgnore, placement = 'right' }: { onAccept: () => void; onIgnore: () => void; placement?: 'left' | 'right' }) {
  return (
    <div style={{
      background: '#473bab',
      borderRadius: placement === 'right' ? '0 16px 16px 16px' : '16px 0 16px 16px',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width: 276,
      boxShadow: '0px 2px 4px rgba(0,0,0,0.2), 0px 4px 5px rgba(0,0,0,0.14), 0px 1px 10px rgba(0,0,0,0.12)',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 54, background: '#fafaff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AutoAwesome sx={{ fontSize: 15, color: '#473bab' }} />
        </div>
        <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#fff', letterSpacing: '0.15px', lineHeight: 1.75 }}>
          Smart Fill
        </span>
      </div>

      {/* Body */}
      <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#fff', letterSpacing: '0.17px', lineHeight: 1.43 }}>
        We think these values might fit the Offers.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onIgnore}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', background: 'transparent',
            border: '1px solid rgba(99,86,225,0.5)',
            borderRadius: 100, cursor: 'pointer',
            fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
            color: '#fff', letterSpacing: '0.46px',
          }}
        >
          <Close sx={{ fontSize: 14, color: '#fff' }} />
          Ignore
        </button>
        <button
          onClick={onAccept}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', background: '#f0f2f4',
            border: 'none', borderRadius: 100, cursor: 'pointer',
            fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
            color: '#473bab', letterSpacing: '0.46px',
          }}
        >
          <Check sx={{ fontSize: 14, color: '#473bab' }} />
          Accept
        </button>
      </div>
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
      <div style={{ width: 56, height: 56, display:'grid', placeItems: 'center', borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0'}}>
        <div style={{ width: '100%', height: 32}}>
          <FilledTemplatePreview
            template={template}
            offer={offers[0]}
            backgroundUrl={''}
          />
        </div>
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

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(ALL_TEMPLATES_ID);

  useEffect(() => {
    if (selectedTemplateId === ALL_TEMPLATES_ID) return;
    if (htmlTemplates.length && !htmlTemplates.find(t => t.id === selectedTemplateId)) {
      setSelectedTemplateId(ALL_TEMPLATES_ID);
    }
  }, [htmlTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(() =>
    selectedTemplateId === ALL_TEMPLATES_ID ? null : templates.find(t => t.id === selectedTemplateId),
  [templates, selectedTemplateId]);

  const ctas = useMemo((): CtaColumn[] => {
    if (selectedTemplateId === ALL_TEMPLATES_ID) {
      return htmlTemplates.flatMap(tmpl =>
        getTemplateCtas(tmpl.id).map(c => ({ ...c, templateId: tmpl.id, templateName: tmpl.name }))
      );
    }
    return selectedTemplate
      ? getTemplateCtas(selectedTemplate.id).map(c => ({ ...c, templateId: selectedTemplate.id, templateName: selectedTemplate.name }))
      : [];
  }, [selectedTemplateId, selectedTemplate, htmlTemplates]);

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

  // Helper to read a cell value from whichever template's matrix owns that CTA
  const getCellValue = (offerId: string, ctaTemplateId: string, ctaKey: string): string =>
    globalMatrix[ctaTemplateId]?.[offerId]?.[ctaKey] ?? '';

  const setCellValue = (offerId: string, ctaKey: string, url: string, forTemplateId?: string) => {
    const tmplId = forTemplateId ?? selectedTemplateId;
    const currentTmpl = globalMatrix[tmplId] ?? {};
    const newTmplMatrix = {
      ...currentTmpl,
      [offerId]: { ...(currentTmpl[offerId] ?? {}), [ctaKey]: url },
    };
    setGlobalMatrix(prev => ({ ...prev, [tmplId]: newTmplMatrix }));

    if (!smartFill || smartFill.ctaKey === ctaKey) {
      // Scope smart fill to the offers that belong to this specific template
      const tmplOffers = selectedTemplateId === ALL_TEMPLATES_ID
        ? offers.filter(o => allAssets.some(a => a.templateId === tmplId && a.offerId === o.id))
        : offersForTemplate;
      const labelsMatrix: Record<string, Record<string, string>> = {};
      for (const [oid, ctaMap] of Object.entries(newTmplMatrix)) {
        labelsMatrix[oid] = {};
        for (const [k, v] of Object.entries(ctaMap)) {
          labelsMatrix[oid][k] = DESTINATION_URL_OPTIONS.find(o => o.url === v)?.label ?? v;
        }
      }
      const result = detectSmartFill(tmplOffers, ctaKey, labelsMatrix);
      setSmartFill(result);
    }
  };

  // Offers visible in the right panel
  const offersForTemplate = useMemo(() => {
    if (selectedTemplateId === ALL_TEMPLATES_ID) {
      const seen = new Set<string>();
      return offers.filter(o => {
        if (!seen.has(o.id) && allAssets.some(a => htmlTemplates.some(t => t.id === a.templateId) && a.offerId === o.id)) {
          seen.add(o.id);
          return true;
        }
        return false;
      });
    }
    return offers.filter(o => allAssets.some(a => a.templateId === selectedTemplateId && a.offerId === o.id));
  }, [offers, allAssets, selectedTemplateId, htmlTemplates]);

  const templateAssets = useMemo(() =>
    selectedTemplateId === ALL_TEMPLATES_ID
      ? allAssets.filter(a => htmlTemplates.some(t => t.id === a.templateId))
      : allAssets.filter(a => a.templateId === selectedTemplateId),
  [allAssets, selectedTemplateId, htmlTemplates]);

  // Row complete = all CTAs across all relevant templates are filled
  const isRowComplete = (offerId: string) =>
    ctas.every(c => {
      const v = getCellValue(offerId, c.templateId, c.key);
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

  // ── Smart Fill ─────────────────────────────────────────────────────────────
  const [smartFill, setSmartFill] = useState<SmartFillResult | null>(null);
  const [bubbleTop, setBubbleTop] = useState<number | null>(null);
  const [bubbleLeft, setBubbleLeft] = useState<number | null>(null);
  const [bubblePlacement, setBubblePlacement] = useState<'left' | 'right'>('right');
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const ctaHeaderRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // Clear smart fill when switching templates or closing dialog
  useEffect(() => { setSmartFill(null); }, [selectedTemplateId]);
  useEffect(() => { if (!open) setSmartFill(null); }, [open]);

  // Compute bubble position whenever smartFill or offers change
  useEffect(() => {
    if (!smartFill) { setBubbleTop(null); setBubbleLeft(null); return; }
    const firstId = offersForTemplate.find(o => smartFill.predictions[o.id])?.id;
    if (!firstId) { setBubbleTop(null); setBubbleLeft(null); return; }
    const rowEl = rowRefs.current[firstId];
    const thEl = ctaHeaderRefs.current[smartFill.ctaKey];
    const containerEl = tableContainerRef.current;
    if (!rowEl || !containerEl) { setBubbleTop(null); setBubbleLeft(null); return; }
    const rowRect = rowEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    setBubbleTop(rowRect.top - containerRect.top + containerEl.scrollTop);
    if (thEl) {
      const thRect = thEl.getBoundingClientRect();
      const spaceRight = containerRect.right - thRect.right;
      if (spaceRight >= BUBBLE_WIDTH + 16) {
        setBubblePlacement('right');
        setBubbleLeft(thRect.right - containerRect.left + containerEl.scrollLeft);
      } else {
        setBubblePlacement('left');
        setBubbleLeft(thRect.left - containerRect.left + containerEl.scrollLeft - BUBBLE_WIDTH);
      }
    }
  }, [smartFill, offersForTemplate]);

  const handleSmartFillAccept = () => {
    if (!smartFill) return;
    // In ALL view, find which template owns this CTA key
    const ctaTemplateId = selectedTemplateId === ALL_TEMPLATES_ID
      ? (ctas.find(c => c.key === smartFill.ctaKey)?.templateId ?? '')
      : selectedTemplateId;
    setGlobalMatrix(prev => {
      const tmplMatrix = { ...(prev[ctaTemplateId] ?? {}) };
      Object.entries(smartFill.predictions).forEach(([offerId, label]) => {
        const realUrl = DESTINATION_URL_OPTIONS.find(o => o.label === label)?.url ?? label;
        tmplMatrix[offerId] = { ...(tmplMatrix[offerId] ?? {}), [smartFill.ctaKey]: realUrl };
      });
      return { ...prev, [ctaTemplateId]: tmplMatrix };
    });
    setSmartFill(null);
  };

  const handleSmartFillIgnore = () => setSmartFill(null);

  // ── Column copy/paste ────────────────────────────────────────────────────────
  const [highlightedCol, setHighlightedCol] = useState<{ ctaKey: string; templateId: string } | null>(null);
  const [clipboardValues, setClipboardValues] = useState<Record<string, string> | null>(null);
  const [hoveredHeaderKey, setHoveredHeaderKey] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuCol, setMenuCol] = useState<{ ctaKey: string; templateId: string } | null>(null);

  useEffect(() => { setHighlightedCol(null); setMenuAnchorEl(null); }, [selectedTemplateId]);
  useEffect(() => { if (!open) { setHighlightedCol(null); setClipboardValues(null); setMenuAnchorEl(null); } }, [open]);

  const handleColumnCopy = (col: { ctaKey: string; templateId: string }) => {
    const values: Record<string, string> = {};
    offersForTemplate.forEach(offer => {
      values[offer.id] = globalMatrix[col.templateId]?.[offer.id]?.[col.ctaKey] ?? '';
    });
    setClipboardValues(values);
  };

  const handleColumnPaste = (col: { ctaKey: string; templateId: string }) => {
    if (!clipboardValues) return;
    setGlobalMatrix(prev => {
      const updated = { ...prev };
      const tmplMatrix = { ...(updated[col.templateId] ?? {}) };
      offersForTemplate.forEach(offer => {
        const val = clipboardValues[offer.id];
        if (val !== undefined) {
          tmplMatrix[offer.id] = { ...(tmplMatrix[offer.id] ?? {}), [col.ctaKey]: val };
        }
      });
      updated[col.templateId] = tmplMatrix;
      return updated;
    });
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!highlightedCol) return;
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'c') {
        e.preventDefault();
        const values: Record<string, string> = {};
        offersForTemplate.forEach(offer => {
          values[offer.id] = globalMatrix[highlightedCol.templateId]?.[offer.id]?.[highlightedCol.ctaKey] ?? '';
        });
        setClipboardValues(values);
      } else if (e.key === 'v' && clipboardValues) {
        e.preventDefault();
        setGlobalMatrix(prev => {
          const updated = { ...prev };
          const tmplMatrix = { ...(updated[highlightedCol.templateId] ?? {}) };
          offersForTemplate.forEach(offer => {
            const val = clipboardValues[offer.id];
            if (val !== undefined) {
              tmplMatrix[offer.id] = { ...(tmplMatrix[offer.id] ?? {}), [highlightedCol.ctaKey]: val };
            }
          });
          updated[highlightedCol.templateId] = tmplMatrix;
          return updated;
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, highlightedCol, clipboardValues, offersForTemplate, globalMatrix]);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyDialogSourceUrl, setCopyDialogSourceUrl] = useState('');
  const [copyDialogSourceLabel, setCopyDialogSourceLabel] = useState('');

  const [tableScrolled, setTableScrolled] = useState(false);
  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const onScroll = () => setTableScrolled(container.scrollLeft > 0);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const handleApplyToTemplate = (ctaKey: string, url: string, forTemplateId: string) => {
    setGlobalMatrix(prev => {
      const tmplMatrix = { ...(prev[forTemplateId] ?? {}) };
      offers
        .filter(o => allAssets.some(a => a.templateId === forTemplateId && a.offerId === o.id))
        .forEach(o => {
          tmplMatrix[o.id] = { ...(tmplMatrix[o.id] ?? {}), [ctaKey]: url };
        });
      return { ...prev, [forTemplateId]: tmplMatrix };
    });
  };

  const handleCopyDialogApply = (templateId: string, ctaKey: string, offerId: string, url: string) => {
    setGlobalMatrix(prev => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] ?? {}),
        [offerId]: { ...(prev[templateId]?.[offerId] ?? {}), [ctaKey]: url },
      },
    }));
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
              {/* "All Templates" item */}
              {(() => {
                const allCtaCount = htmlTemplates.reduce((s, t) => s + getTemplateCtas(t.id).length, 0);
                const allOfferCount = new Set(allAssets.filter(a => htmlTemplates.some(t => t.id === a.templateId)).map(a => a.offerId)).size;
                const allAssetCount = allAssets.filter(a => htmlTemplates.some(t => t.id === a.templateId)).length;
                const allComplete = htmlTemplates.length > 0 && htmlTemplates.every(t => isTemplateComplete(t.id));
                return (
                  <div
                    onClick={() => setSelectedTemplateId(ALL_TEMPLATES_ID)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px', borderRadius: 8, cursor: 'pointer',
                      background: selectedTemplateId === ALL_TEMPLATES_ID ? 'rgba(99,86,225,0.08)' : 'transparent',
                      transition: 'background 0.15s', marginBottom: 2,
                    }}
                  >
                    <div style={{ width: 56, height: 56, display: 'grid', placeItems: 'center', flexShrink: 0, background: '#f0f0f0', borderRadius: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 26, height: 26 }}>
                        {[0,1,2,3].map(i => <div key={i} style={{ background: 'rgba(99,86,225,0.35)', borderRadius: 2 }} />)}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', fontWeight: 500, lineHeight: 1.3, letterSpacing: '0.17px' }}>
                        All Templates
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginTop: 2 }}>
                        {allCtaCount} CTAs · {allOfferCount} Offers · {allAssetCount} Assets
                      </div>
                    </div>
                    {allComplete
                      ? <CheckCircle sx={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                      : <RadioButtonUnchecked sx={{ fontSize: 18, color: '#cac9cf', flexShrink: 0 }} />
                    }
                  </div>
                );
              })()}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={() => setHighlightedCol(null)}>
            {/* Right header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
                {selectedTemplateId === ALL_TEMPLATES_ID ? 'All Templates' : (selectedTemplate?.name ?? '')}
              </span>
            </div>

            {/* Matrix table */}
            <div ref={tableContainerRef} style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px 0', position: 'relative' }}>
              <table style={{ width: selectedTemplateId === ALL_TEMPLATES_ID ? 'max-content' : '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  {/* Offer column */}
                  <col style={{ width: 180 }} />
                  {/* CTA columns — fixed 220px in All view, auto-fill in single-template view */}
                  {ctas.map(c => <col key={c.key} style={selectedTemplateId === ALL_TEMPLATES_ID ? { width: 220 } : undefined} />)}
                  {/* Row status */}
                  <col style={{ width: 32 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 8px 8px 24px', textAlign: 'left', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', left: 0, zIndex: 4, background: '#fff', boxShadow: tableScrolled ? '4px 0 8px -2px rgba(0,0,0,0.1)' : 'none' }}>
                      Offer
                    </th>
                    {ctas.map(c => {
                      const isSmartFillActive = smartFill?.ctaKey === c.key;
                      const isCopyHighlighted = highlightedCol?.ctaKey === c.key && highlightedCol?.templateId === c.templateId;
                      const isActive = isSmartFillActive || isCopyHighlighted;
                      const colId = c.key + c.templateId;
                      const showMenuIcon = hoveredHeaderKey === colId || isCopyHighlighted;
                      return (
                        <th
                          key={c.key}
                          ref={el => { ctaHeaderRefs.current[c.key] = el; }}
                          onMouseEnter={() => setHoveredHeaderKey(colId)}
                          onMouseLeave={() => setHoveredHeaderKey(null)}
                          onClick={(e) => { e.stopPropagation(); setHighlightedCol(isCopyHighlighted ? null : { ctaKey: c.key, templateId: c.templateId }); }}
                          style={{
                            padding: '8px 8px 8px', textAlign: 'left', fontSize: 12, fontFamily: 'Roboto, sans-serif',
                            fontWeight: 500, color: '#686576', letterSpacing: '0.4px', minWidth: 220,
                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                            cursor: 'pointer', userSelect: 'none',
                            background: isActive ? 'rgba(99,86,225,0.08)' : undefined,
                            boxShadow: isActive ? 'inset 2px 0 0 #473bab, inset -2px 0 0 #473bab, inset 0 2px 0 #473bab' : undefined,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <span>{c.label.replace(' – Destination URL', '')}</span>
                              {selectedTemplateId === ALL_TEMPLATES_ID && (
                                <span style={{ fontSize: 10, fontWeight: 400, color: '#9c99a9', letterSpacing: '0.3px' }}>
                                  {c.templateName}
                                </span>
                              )}
                            </div>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHighlightedCol({ ctaKey: c.key, templateId: c.templateId });
                                setMenuAnchorEl(e.currentTarget);
                                setMenuCol({ ctaKey: c.key, templateId: c.templateId });
                              }}
                              sx={{
                                padding: '2px',
                                flexShrink: 0,
                                visibility: showMenuIcon ? 'visible' : 'hidden',
                                color: '#686576',
                                '&:hover': { color: '#1f1d25', background: 'rgba(0,0,0,0.04)' },
                              }}
                            >
                              <MoreVert sx={{ fontSize: 16 }} />
                            </IconButton>
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }} />
                  </tr>
                </thead>
                <tbody>
                  {offersForTemplate.map(offer => {
                    const complete = isRowComplete(offer.id);
                    const assetCount = selectedTemplateId === ALL_TEMPLATES_ID
                      ? allAssets.filter(a => a.offerId === offer.id && htmlTemplates.some(t => t.id === a.templateId)).length
                      : templateAssets.filter(a => a.offerId === offer.id).length;
                    return (
                      <tr key={offer.id} ref={el => { rowRefs.current[offer.id] = el; }}>
                        {/* Offer cell */}
                        <td style={{ padding: '10px 8px 10px 24px', verticalAlign: 'middle', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', left: 0, zIndex: 3, background: '#fff', boxShadow: tableScrolled ? '4px 0 8px -2px rgba(0,0,0,0.1)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 3, overflow: 'hidden', flexShrink: 0}}>
                              {offer.imageUrl ? (
                                <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              ) : selectedTemplate && (
                                <FilledTemplatePreview template={selectedTemplate} offer={offer} backgroundUrl="" />
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
                        {ctas.map((cta) => {
                          const isSmartFillActive = smartFill?.ctaKey === cta.key;
                          const isCopyHighlighted = highlightedCol?.ctaKey === cta.key && highlightedCol?.templateId === cta.templateId;
                          const isActive = isSmartFillActive || isCopyHighlighted;
                          const isLastOffer = offersForTemplate.indexOf(offer) === offersForTemplate.length - 1;
                          const sideShadow = isActive ? 'inset 2px 0 0 #473bab, inset -2px 0 0 #473bab' : undefined;
                          const bottomShadow = isActive && isLastOffer ? ', inset 0 -2px 0 #473bab' : '';
                          return (
                            <td
                              key={cta.key}
                              onClick={isCopyHighlighted ? (e) => e.stopPropagation() : undefined}
                              style={{
                                padding: '10px 8px', verticalAlign: 'middle', borderBottom: '1px solid rgba(0,0,0,0.06)',
                                background: isActive ? 'rgba(99,86,225,0.08)' : undefined,
                                boxShadow: sideShadow ? sideShadow + bottomShadow : undefined,
                                position: 'relative', zIndex: 0,
                              }}
                            >
                              <UrlCell
                                value={getCellValue(offer.id, cta.templateId, cta.key)}
                                pendingValue={isSmartFillActive ? (smartFill!.predictions[offer.id] ?? '') : ''}
                                onChange={(url) => setCellValue(offer.id, cta.key, url, cta.templateId)}
                                onApplyToTemplate={(url) => handleApplyToTemplate(cta.key, url, cta.templateId)}
                              />
                            </td>
                          );
                        })}

                        {/* Row complete indicator */}
                        <td style={{ padding: '10px 0 10px 4px', verticalAlign: 'middle', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          {complete && <CheckCircle sx={{ fontSize: 18, color: '#2e7d32' }} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Smart Fill bubble — floats to the right of the active column */}
              {smartFill && bubbleTop !== null && bubbleLeft !== null && (
                <div style={{
                  position: 'absolute',
                  top: bubbleTop + 4,
                  left: bubbleLeft,
                  zIndex: 10,
                  pointerEvents: 'auto',
                }}>
                  <WizardBubble onAccept={handleSmartFillAccept} onIgnore={handleSmartFillIgnore} placement={bubblePlacement} />
                </div>
              )}
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
        <Menu
          open={!!menuAnchorEl}
          anchorEl={menuAnchorEl}
          onClose={() => setMenuAnchorEl(null)}
          onClick={(e) => e.stopPropagation()}
          slotProps={{ paper: { sx: {
            borderRadius: '4px',
            boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            minWidth: 260,
          }}}}
          sx={{ zIndex: 200001 }}
        >
          <MenuItem
            onClick={() => { if (menuCol) handleColumnCopy(menuCol); setMenuAnchorEl(null); }}
            sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', py: '6px', px: '16px', gap: '12px' }}
          >
            <ContentCopy sx={{ fontSize: 20, color: '#686576' }} />
            Copy column values (Cmd+C)
          </MenuItem>
          <MenuItem
            onClick={() => { if (menuCol) handleColumnPaste(menuCol); setMenuAnchorEl(null); }}
            disabled={!clipboardValues}
            sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', py: '6px', px: '16px', gap: '12px' }}
          >
            <ContentPaste sx={{ fontSize: 20, color: '#686576' }} />
            Paste values here (Cmd+V)
          </MenuItem>
        </Menu>
        <CopyUrlDialog
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          sourceUrl={copyDialogSourceUrl}
          sourceLabel={copyDialogSourceLabel}
          allAssets={allAssets}
          htmlTemplates={htmlTemplates}
          offers={offers}
          onApply={handleCopyDialogApply}
        />
    </div>
  );
}
