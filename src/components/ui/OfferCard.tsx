import { useState, useRef } from 'react';
import { Checkbox, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import { MoreVert, InfoOutlined, Add, Delete, DragIndicator } from '@mui/icons-material';
import type { Offer, OfferTypeData, OfferTypeName } from '../../data/types';

const ALL_OFFER_TYPES: OfferTypeName[] = ['Lease', 'Finance', 'Purchase', 'ZD Lease', 'Custom'];

interface OfferCardProps {
  offer: Offer;
  selected?: boolean;
  activeOfferTypeId?: string;
  onSelect?: (id: string, checked: boolean) => void;
  onVehicleClick?: () => void;
  onOfferTypeClick?: (offerTypeId: string) => void;
  onAddOfferType?: (type: OfferTypeName) => void;
  onRemoveOfferType?: (offerTypeId: string) => void;
  onReorderOfferTypes?: (newTypes: OfferTypeData[]) => void;
  /** Hides the "+ Add Offer Type" footer button */
  hideAddOfferType?: boolean;
  /** Disables hover/active background on offer type rows */
  disableRowHover?: boolean;
  /** Replaces the MoreVert icon button. Pass null to hide it entirely. */
  menuButton?: React.ReactNode;
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4.5 10L8.5 14L15.5 7" stroke="#6356e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OutOfStockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.04155 4.37467V3.49967C9.04155 2.37209 8.12747 1.45801 6.99988 1.45801C5.8723 1.45801 4.95822 2.37209 4.95822 3.49967V4.37467M5.54155 12.5413H3.00581C2.65082 12.5413 2.37813 12.2269 2.42834 11.8755L3.42834 4.87551C3.46939 4.58813 3.71551 4.37467 4.00581 4.37467H9.99396C10.2843 4.37467 10.5304 4.58813 10.5714 4.87551L10.7499 6.12467M11.7727 12.3558C12.7978 11.3307 12.7978 9.66865 11.7727 8.64352C10.7476 7.61839 9.08552 7.61839 8.06039 8.64352M11.7727 12.3558C10.7476 13.381 9.08552 13.381 8.06039 12.3558C7.03527 11.3307 7.03527 9.66865 8.06039 8.64352M11.7727 12.3558L8.06039 8.64352" stroke="#BE0E1C" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function getOfferTypeDisplayFields(ot: OfferTypeData): { label: string; value: string; info?: boolean }[] {
  switch (ot.type) {
    case 'Lease':
      return [
        { label: 'Monthly Payment', value: ot.monthlyPayment != null ? `$${ot.monthlyPayment}` : '—' },
        { label: 'Term', value: ot.term != null ? String(ot.term) : '—' },
        { label: 'Total Due at Signing', value: ot.totalDueAtSigning != null ? `$${ot.totalDueAtSigning.toLocaleString()}` : '—', info: true },
      ];
    case 'Finance':
      return [
        { label: 'Payment', value: ot.payment != null ? `$${ot.payment}` : '—' },
        { label: 'Rate', value: ot.rate != null ? `${ot.rate}%` : '—' },
        { label: 'Term', value: ot.term != null ? `${ot.term} mo` : '—' },
      ];
    case 'Purchase':
      return [
        { label: 'Final Price', value: ot.finalPrice != null ? `$${ot.finalPrice.toLocaleString()}` : '—' },
        { label: 'Dealer Discount', value: ot.dealerDiscount != null ? `$${ot.dealerDiscount.toLocaleString()}` : '—' },
        { label: 'Savings Off MSRP', value: ot.savingsOffMsrp != null ? `$${ot.savingsOffMsrp.toLocaleString()}` : '—' },
      ];
    case 'ZD Lease':
      return [
        { label: 'Monthly Payment', value: ot.monthlyPayment != null ? `$${ot.monthlyPayment}` : '—' },
        { label: 'No. of Payments', value: ot.noOfPayments != null ? String(ot.noOfPayments) : '—' },
        { label: 'Miles Per Year', value: ot.milesPerYear != null ? ot.milesPerYear.toLocaleString() : '—' },
      ];
    case 'Custom': {
      const fields = (ot.customFields ?? []).slice(0, 3);
      if (fields.length === 0) return [{ label: 'Custom Fields', value: 'None added' }];
      return fields.map(f => ({ label: f.name || 'Field', value: f.value || '—' }));
    }
  }
}

export const OfferCard = ({
  offer,
  selected,
  activeOfferTypeId,
  onSelect,
  onVehicleClick,
  onOfferTypeClick,
  onAddOfferType,
  onRemoveOfferType,
  onReorderOfferTypes,
  hideAddOfferType,
  disableRowHover,
  menuButton,
}: OfferCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isOutOfStock = (offer.inventory ?? offer.inStock) === 0;
  const visibleOfferTypes = offer.offerTypes.filter(ot => !ot.hidden);
  const visibleTypeNames = new Set(visibleOfferTypes.map(ot => ot.type));
  const availableTypes = ALL_OFFER_TYPES.filter(t => !visibleTypeNames.has(t));

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleTypeSelect = (type: OfferTypeName) => {
    handleMenuClose();
    onAddOfferType?.(type);
  };

  return (
    <div
      style={{
        background: isOutOfStock ? '#FDF7F8' : 'white',
        border: `1px solid ${selected ? '#473bab' : isOutOfStock ? '#D2323F' : 'rgba(0,0,0,0.12)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: selected ? '0 0 0 1px #473bab' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        height: 'fit-content',
      }}
    >
      {/* Top: image + content — click opens Vehicle Info */}
      <div
        style={{ display: 'flex', alignItems: 'stretch', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onVehicleClick?.(); }}
      >
        {/* Image area */}
        <div
          style={{
            position: 'relative',
            width: 90,
            minWidth: 90,
            minHeight: 90,
            flexShrink: 0,
            background: '#f0f2f4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src={offer.imageUrl}
            alt={offer.vehicleName}
            style={{ width: 90, height: 90, objectFit: 'contain', pointerEvents: 'none' }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <div style={{
              position: 'absolute', top: 11, left: 11,
              width: 14, height: 14,
              background: 'white', borderRadius: 1, zIndex: 0,
            }} />
            <Checkbox
              checked={!!selected}
              onChange={(e) => { e.stopPropagation(); onSelect?.(offer.id, e.target.checked); }}
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{
                padding: '9px',
                zIndex: 1,
                '& .MuiSvgIcon-root': { fontSize: 20, color: selected ? '#473bab' : 'rgba(0,0,0,0.54)' },
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, padding: 12, position: 'relative' }}>
          {isOutOfStock && (
            <Tooltip
              title="Vehicle is out of stock. Remove offer and assets or adjust vehicle inventory."
              placement="top"
              arrow
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#FBEFF0', borderRadius: 8,
                padding: '3px 8px 3px 6px',
                marginBottom: 6,
                cursor: 'default',
              }}>
                <OutOfStockIcon />
                <span style={{
                  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                  color: '#BE0E1C', letterSpacing: '0.4px', lineHeight: '1.66',
                  whiteSpace: 'nowrap',
                }}>
                  Out of Stock
                </span>
              </div>
            </Tooltip>
          )}
          {!isOutOfStock && offer.swapMatchType && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: offer.swapMatchType === 'exact_match' ? 'rgba(71,59,171,0.08)' : 'rgba(56,142,60,0.08)',
              borderRadius: 8, padding: '3px 8px 3px 6px',
              marginBottom: 6, width: 'fit-content',
            }}>
              <span style={{
                fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                color: offer.swapMatchType === 'exact_match' ? '#473bab' : '#2e7d32',
                letterSpacing: '0.4px', lineHeight: '1.66', whiteSpace: 'nowrap',
              }}>
                {offer.swapMatchType === 'exact_match' ? 'Exact Match (Different VIN)' : 'Different YMMT'}
              </span>
            </div>
          )}
          <div style={{ paddingRight: 28 }}>
            <p style={{
              margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif',
              fontWeight: 400, color: '#1f1d25', lineHeight: 1.43,
              letterSpacing: '0.17px', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {offer.vehicleName}
            </p>
            <p style={{
              margin: '2px 0 0', fontSize: 11, fontFamily: 'Roboto, sans-serif',
              fontWeight: 400, color: '#686576', lineHeight: 1.66,
              letterSpacing: '0.4px', whiteSpace: 'nowrap',
            }}>
              {offer.inStock} in stock
            </p>
          </div>

          {(offer.pvi || offer.aging || offer.sales || offer.inventory) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {offer.pvi != null && <StatChip label="P" value={offer.pvi} />}
              {offer.aging != null && <StatChip label="A" value={offer.aging} />}
              {offer.sales != null && <StatChip label="S" value={offer.sales} />}
              {offer.inventory != null && <StatChip label="In" value={offer.inventory} />}
            </div>
          )}

          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            {menuButton !== undefined ? menuButton : (
              <IconButton
                size="small"
                onClick={(e) => e.stopPropagation()}
                sx={{ padding: '5px', borderRadius: '100px', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
              >
                <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {/* Offer type rows */}
      <div style={{ padding: '0 8px 4px' }}>
        {visibleOfferTypes.map((ot, i) => {
          const isActive = ot.id === activeOfferTypeId;
          const isHovered = hoveredRowId === ot.id && dragFromIndex === null;
          const isDragOver = dragOverIndex === i && dragFromIndex !== null && dragFromIndex !== i;
          const fields = getOfferTypeDisplayFields(ot);
          return (
            <div
              key={ot.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                setDragFromIndex(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== i) setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFromIndex !== null && dragFromIndex !== i) {
                  const newTypes = [...visibleOfferTypes];
                  const [moved] = newTypes.splice(dragFromIndex, 1);
                  newTypes.splice(i, 0, moved);
                  const hidden = offer.offerTypes.filter(ot => ot.hidden);
                  onReorderOfferTypes?.([...newTypes, ...hidden]);
                }
                setDragFromIndex(null);
                setDragOverIndex(null);
              }}
              onDragEnd={() => {
                setDragFromIndex(null);
                setDragOverIndex(null);
              }}
              onClick={(e) => { e.stopPropagation(); onOfferTypeClick?.(ot.id); }}
              onMouseEnter={() => setHoveredRowId(ot.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                position: 'relative',
                borderTop: i === 0 ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.06)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: disableRowHover ? 'default' : 'pointer',
                borderRadius: i === visibleOfferTypes.length - 1 && availableTypes.length === 0 ? '0 0 4px 4px' : 0,
                background: disableRowHover
                  ? 'transparent'
                  : isDragOver
                  ? 'rgba(99,86,225,0.08)'
                  : isHovered
                  ? '#F5F5F6'
                  : isActive
                  ? 'rgba(99,86,225,0.05)'
                  : 'transparent',
                transition: 'background 0.12s',
                outline: isDragOver ? '1px dashed #6356e1' : 'none',
              }}
            >
              {/* Trash icon — top-right on hover */}
              {!disableRowHover && isHovered && (
                <div
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onRemoveOfferType?.(ot.id); }}
                    sx={{
                      padding: '2px',
                      color: '#9e9e9e',
                      '&:hover': { color: '#d32f2f', background: 'rgba(211,47,47,0.06)' },
                    }}
                  >
                    <Delete style={{ fontSize: 15 }} />
                  </IconButton>
                </div>
              )}

              {/* Tags row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  background: 'rgba(99,86,225,0.12)', borderRadius: 8,
                  height: 22, paddingRight: 6,
                }}>
                  <CheckIcon />
                  <span style={{
                    fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                    color: '#6356e1', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap',
                  }}>
                    {ot.type}
                  </span>
                </div>
                {ot.source && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: '#f0f2f4', borderRadius: 8,
                    height: 22, padding: '0 6px',
                  }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                      color: '#686576', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap',
                    }}>
                      {ot.source}
                    </span>
                  </div>
                )}
                {/* Drag handle — appears right of source tag on hover */}
                {!disableRowHover && isHovered && (
                  <div
                    style={{ display: 'flex', alignItems: 'center', cursor: 'grab' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DragIndicator style={{ fontSize: 14, color: '#9e9e9e' }} />
                  </div>
                )}
              </div>

              {/* Fields row */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                {fields.map((f, fi) => (
                  <PaymentField key={fi} label={f.label} value={f.value} infoIcon={f.info} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Add Offer Type button */}
        {!hideAddOfferType && availableTypes.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '6px 4px' }}>
            <button
              ref={addBtnRef}
              onClick={handleAddClick}
              disabled={isOutOfStock}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 2,
                border: 'none', background: 'transparent',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                color: isOutOfStock ? 'rgba(0,0,0,0.26)' : '#473bab',
                fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                padding: '2px 4px', borderRadius: 4,
              }}
            >
              <Add style={{ fontSize: 15 }} />
              Add Offer Type
            </button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { style: { minWidth: 160 } } }}
            >
              {availableTypes.map((type) => (
                <MenuItem
                  key={type}
                  onClick={(e) => { e.stopPropagation(); handleTypeSelect(type); }}
                  sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif' }}
                >
                  {type}
                </MenuItem>
              ))}
            </Menu>
          </div>
        )}
      </div>
    </div>
  );
};

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: '#f0f2f4', borderRadius: 8, padding: '0 6px',
      height: 18, display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
        {label}:
      </span>
      <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function PaymentField({ label, value, infoIcon }: { label: string; value: string; infoIcon?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{
          fontSize: 10, color: '#686576', lineHeight: '10px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </span>
        {infoIcon && (
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <InfoOutlined style={{ fontSize: 14, color: '#686576' }} />
          </span>
        )}
      </div>
      <span style={{
        fontSize: 12, color: '#1f1d25', lineHeight: 1.43,
        letterSpacing: '0.17px', whiteSpace: 'nowrap', marginTop: 1,
      }}>
        {value}
      </span>
    </div>
  );
}
