import { useState } from 'react';
import { Checkbox, IconButton, Menu, MenuItem } from '@mui/material';
import { MoreVert, InfoOutlined, Add, Delete } from '@mui/icons-material';
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
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4.5 10L8.5 14L15.5 7" stroke="#6356e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
}: OfferCardProps) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    offer.offerTypes[0]?.id ?? null
  );
  const [hoveredContent, setHoveredContent] = useState(false);

  const existingTypes = new Set(offer.offerTypes.map(ot => ot.type));
  const availableTypes = ALL_OFFER_TYPES.filter(t => !existingTypes.has(t));

  // Resolve active tab: prefer one currently open in panel if it belongs to this offer
  const panelTab = offer.offerTypes.find(ot => ot.id === activeOfferTypeId);
  const localTab = offer.offerTypes.find(ot => ot.id === activeTabId);
  const activeTab = panelTab ?? localTab ?? offer.offerTypes[0] ?? null;

  const handleAddClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => setMenuAnchor(null);

  const handleTypeSelect = (type: OfferTypeName) => {
    handleMenuClose();
    onAddOfferType?.(type);
  };

  const handleTabClick = (ot: OfferTypeData) => {
    setActiveTabId(ot.id);
    onOfferTypeClick?.(ot.id);
  };

  const handleRemoveTab = (e: React.MouseEvent, otId: string) => {
    e.stopPropagation();
    if (activeTabId === otId) {
      const remaining = offer.offerTypes.filter(ot => ot.id !== otId);
      setActiveTabId(remaining[0]?.id ?? null);
    }
    onRemoveOfferType?.(otId);
  };

  return (
    <div
      style={{
        background: 'white',
        border: `1px solid ${selected ? '#473bab' : 'rgba(0,0,0,0.12)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: selected ? '0 0 0 1px #473bab' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Top: image + content */}
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
            <IconButton
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{ padding: '5px', borderRadius: '100px', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
            >
              <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Bottom: tabs + active offer content */}
      {offer.offerTypes.length > 0 && (
        <div style={{ padding: '0 8px 8px' }}>
          {/* Tab strip */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              {offer.offerTypes.map((ot) => {
                const isActive = ot.id === activeTab?.id;
                return (
                  <div
                    key={ot.id}
                    onClick={() => handleTabClick(ot)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 500,
                        letterSpacing: '0.46px',
                        lineHeight: '22px',
                        color: isActive ? '#473bab' : '#686576',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}>
                        {ot.type}
                      </span>
                    </div>
                    {/* Active underline indicator */}
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: '#473bab',
                        borderRadius: '2px 2px 0 0',
                      }} />
                    )}
                  </div>
                );
              })}

              {/* Plus icon — opens add-type menu */}
              {availableTypes.length > 0 && (
                <div
                  onClick={handleAddClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    color: '#686576',
                  }}
                >
                  <Add style={{ fontSize: 20 }} />
                </div>
              )}
            </div>

            {/* Divider below tabs */}
            <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', width: '100%' }} />
          </div>

          {/* Active tab content */}
          {activeTab && (
            <div
              onClick={(e) => { e.stopPropagation(); onOfferTypeClick?.(activeTab.id); }}
              onMouseEnter={() => setHoveredContent(true)}
              onMouseLeave={() => setHoveredContent(false)}
              style={{
                position: 'relative',
                padding: '8px 8px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: 'pointer',
                background: hoveredContent ? '#F5F5F6' : 'transparent',
                transition: 'background 0.12s',
              }}
            >
              {/* Trash icon — top-right on hover */}
              {hoveredContent && (
                <div
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleRemoveTab(e, activeTab.id); }}
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
                    {activeTab.type}
                  </span>
                </div>
                {activeTab.source && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: '#f0f2f4', borderRadius: 8,
                    height: 22, padding: '0 6px',
                  }}>
                    <span style={{
                      fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                      color: '#686576', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap',
                    }}>
                      {activeTab.source}
                    </span>
                  </div>
                )}
              </div>

              {/* Fields row */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                {getOfferTypeDisplayFields(activeTab).map((f, fi) => (
                  <PaymentField key={fi} label={f.label} value={f.value} infoIcon={f.info} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add type menu */}
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
