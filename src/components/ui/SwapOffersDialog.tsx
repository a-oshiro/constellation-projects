import { useState } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Checkbox, IconButton, Radio, Collapse } from '@mui/material';
import { Close, Refresh, East, CloseRounded } from '@mui/icons-material';
import { useProject } from '../../context/ProjectContext';
import { isAssetOutOfStock } from './OutOfStockBadge';
import { OfferCard } from './OfferCard';
import type { Offer } from '../../data/types';

interface SwapPair {
  outOfStock: Offer;
  replacement: Offer;
}

interface SwapOffersDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SwapOffersDialog({ open, onClose }: SwapOffersDialogProps) {
  const { offers, swapOffer } = useProject();

  const swapPairs: SwapPair[] = offers
    .filter(o => !o.swapOnly && isAssetOutOfStock(o))
    .flatMap(outOfStock => {
      const replacement = offers.find(o => o.swapOnly && o.replacesOfferId === outOfStock.id);
      return replacement ? [{ outOfStock, replacement }] : [];
    });

  const [selected, setSelected] = useState<Set<string>>(() => new Set(swapPairs.map(p => p.outOfStock.id)));
  const [openRefreshId, setOpenRefreshId] = useState<string | null>(null);
  const [selectedReplacementIds, setSelectedReplacementIds] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    swapPairs.forEach(p => { init[p.outOfStock.id] = p.replacement.id; });
    return init;
  });

  const allIds = swapPairs.map(p => p.outOfStock.id);
  const selectedCount = allIds.filter(id => selected.has(id)).length;
  const allSelected = selectedCount === allIds.length;

  const resetState = () => {
    setOpenRefreshId(null);
    const init: Record<string, string> = {};
    swapPairs.forEach(p => { init[p.outOfStock.id] = p.replacement.id; });
    setSelectedReplacementIds(init);
    setSelected(new Set(swapPairs.map(p => p.outOfStock.id)));
  };

  const handleToggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const handleToggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    swapPairs
      .filter(p => selected.has(p.outOfStock.id))
      .forEach(p => {
        const targetId = selectedReplacementIds[p.outOfStock.id] ?? p.replacement.id;
        swapOffer(p.outOfStock.id, targetId);
      });
    resetState();
    onClose();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (swapPairs.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      sx={{
        '& .MuiDialog-paper': {
          width: 1000,
          maxWidth: 1000,
          height: 'fit-content',
          maxHeight: 'calc(100vh - 32px)',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0px 9px 46px 8px rgba(0,0,0,0.12), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 11px 15px -7px rgba(0,0,0,0.2)',
        },
      }}
    >
      {/* Title row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 8px 16px',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6,
        }}>
          Swap 'Out of Stock' Offers
        </span>
        <IconButton size="small" onClick={handleClose} sx={{ padding: '5px' }}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      <DialogContent style={{ padding: '8px 16px 24px', overflowY: 'auto', flex: 1 }}>
        {/* Subtitle */}
        <p style={{
          fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
          color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
          margin: '0 0 16px',
        }}>
          We found alternative Offers to replace your out-of-stock vehicles:
        </p>

        {/* List container */}
        <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#f4f5f6',
            padding: '4px 12px',
          }}>
            <Checkbox
              checked={allSelected}
              indeterminate={selectedCount > 0 && !allSelected}
              onChange={handleToggleAll}
              size="small"
              sx={{
                color: 'rgba(0,0,0,0.38)',
                '&.Mui-checked': { color: '#473bab' },
                '&.MuiCheckbox-indeterminate': { color: '#473bab' },
                padding: '4px',
              }}
            />
            <span style={{
              fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
              color: '#1f1d25', letterSpacing: '0.17px', flex: 1,
            }}>
              {selectedCount} of {allIds.length} Offer{allIds.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleToggleAll}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                color: '#473bab', letterSpacing: '0.46px', padding: '4px 6px',
              }}
            >
              {allSelected ? 'Unselect All' : 'Select All'}
            </button>
          </div>

          {/* Swap rows */}
          {swapPairs.map((pair) => {
            const selectedReplacementId = selectedReplacementIds[pair.outOfStock.id] ?? pair.replacement.id;
            const selectedReplacementOffer = offers.find(o => o.id === selectedReplacementId) ?? pair.replacement;

            const visibleTypeNames = new Set(
              pair.outOfStock.offerTypes.filter(ot => !ot.hidden).map(ot => ot.type)
            );
            const displayReplacement: Offer = {
              ...selectedReplacementOffer,
              offerTypes: selectedReplacementOffer.offerTypes.map(ot => ({
                ...ot,
                hidden: !visibleTypeNames.has(ot.type),
              })),
              swapMatchType: selectedReplacementOffer.id === pair.replacement.id
                ? selectedReplacementOffer.swapMatchType
                : 'different_ymmt',
            };

            // Fixed table: primary replacement for this pair + up to 3 free swap-only offers
            // Order never changes when the user selects a different row
            const primaryReplacementIds = new Set(swapPairs.map(p => p.replacement.id));
            const freeSwapOffers = offers.filter(o =>
              o.swapOnly && !primaryReplacementIds.has(o.id)
            ).slice(0, 3);
            const tableOptions = [pair.replacement, ...freeSwapOffers];

            const isRefreshOpen = openRefreshId === pair.outOfStock.id;

            const refreshButton = (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenRefreshId(prev => prev === pair.outOfStock.id ? null : pair.outOfStock.id);
                }}
                style={{ background: '#473bab', borderRadius: '100px', padding: 5, width: 30, height: 30 }}
                sx={{ '&:hover': { background: '#3730a3' } }}
              >
                <Refresh style={{ fontSize: 18, color: '#ffffff' }} />
              </IconButton>
            );

            return (
              <div
                key={pair.outOfStock.id}
                style={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}
              >
                {/* Cards row */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '16px 12px',
                }}>
                  {/* Row checkbox */}
                  <Checkbox
                    checked={selected.has(pair.outOfStock.id)}
                    onChange={() => handleToggle(pair.outOfStock.id)}
                    size="small"
                    sx={{
                      color: 'rgba(0,0,0,0.38)',
                      '&.Mui-checked': { color: '#473bab' },
                      padding: '4px',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />

                  {/* Out-of-stock card */}
                  <div style={{ flex: '1 0 0', minWidth: 0 }}>
                    <OfferCard
                      offer={pair.outOfStock}
                      hideAddOfferType
                      disableRowHover
                      menuButton={null}
                    />
                  </div>

                  {/* Arrow */}
                  <East style={{ fontSize: 20, color: '#9c99a9', flexShrink: 0, marginTop: 36 }} />

                  {/* Replacement card */}
                  <div style={{ flex: '1 0 0', minWidth: 0 }}>
                    <OfferCard
                      offer={displayReplacement}
                      hideAddOfferType
                      disableRowHover
                      menuButton={refreshButton}
                    />
                  </div>
                </div>

                {/* Change Recommended Offer panel */}
                <Collapse in={isRefreshOpen} timeout={220}>
                  <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, margin: `0px 12px 16px 52px`}}>
                    {/* Panel title */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 16px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)'
                    }}>
                      <span style={{
                        fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                        color: '#1f1d25', letterSpacing: '0.17px',
                      }}>
                        Change Recommended Offer
                      </span>
                      <IconButton
                        size="small"
                        onClick={() => setOpenRefreshId(null)}
                        sx={{ padding: '4px', color: '#686576' }}
                      >
                        <CloseRounded style={{ fontSize: 18 }} />
                      </IconButton>
                    </div>

                    {/* Table header */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      height: 36,
                      padding: '0 16px',
                    }}>
                      <div style={{
                        flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif',
                        fontWeight: 500, color: 'rgba(0,0,0,0.6)', letterSpacing: '0.17px',
                        paddingLeft: 32,
                      }}>
                        Vehicle
                      </div>
                      {(['Aging', 'Sales', 'Inventory'] as const).map(col => (
                        <div key={col} style={{
                          width: 100, fontSize: 12, fontFamily: 'Roboto, sans-serif',
                          fontWeight: 500, color: 'rgba(0,0,0,0.6)', letterSpacing: '0.17px',
                        }}>
                          {col}
                        </div>
                      ))}
                    </div>

                    {/* Table rows */}
                    {tableOptions.map((opt) => {
                      const isRowSelected = opt.id === selectedReplacementId;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedReplacementIds(prev => ({ ...prev, [pair.outOfStock.id]: opt.id }))}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '0 16px',
                            height: 44,
                            background: isRowSelected ? 'rgba(99,86,225,0.08)' : 'transparent',
                            borderTop: '1px solid rgba(0,0,0,0.12)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                            <Radio
                              checked={isRowSelected}
                              onChange={() => setSelectedReplacementIds(prev => ({ ...prev, [pair.outOfStock.id]: opt.id }))}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                              sx={{
                                color: 'rgba(0,0,0,0.38)',
                                '&.Mui-checked': { color: '#473bab' },
                                padding: '4px',
                                flexShrink: 0,
                              }}
                            />
                            <span style={{
                              fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                              color: '#1f1d25', letterSpacing: '0.17px',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {opt.vehicleName}
                            </span>
                          </div>
                          <div style={{ width: 100, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25' }}>
                            {opt.aging ?? '—'}
                          </div>
                          <div style={{ width: 100, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25' }}>
                            {opt.sales ?? '—'}
                          </div>
                          <div style={{ width: 100, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25' }}>
                            {opt.inventory ?? '—'}
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom padding */}
                    <div style={{ height: 8 }} />
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      </DialogContent>

      <DialogActions style={{ padding: '0 16px 16px', gap: 8, flexShrink: 0 }}>
        <Button
          onClick={handleClose}
          variant="text"
          sx={{
            textTransform: 'none', fontFamily: 'Roboto, sans-serif', fontSize: 14,
            fontWeight: 500, color: '#473bab', letterSpacing: '0.46px',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedCount === 0}
          sx={{
            textTransform: 'none', fontFamily: 'Roboto, sans-serif', fontSize: 14,
            fontWeight: 500, letterSpacing: '0.46px',
            background: '#473bab', borderRadius: '20px',
            padding: '6px 16px',
            '&:hover': { background: '#3730a3' },
            '&.Mui-disabled': { background: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.26)' },
          }}
        >
          Swap Offers
        </Button>
      </DialogActions>
    </Dialog>
  );
}
