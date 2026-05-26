import { Checkbox, IconButton } from '@mui/material';
import { MoreVert, InfoOutlined } from '@mui/icons-material';
import type { Offer } from '../../data/types';

interface OfferCardProps {
  offer: Offer;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: () => void;
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M4.5 10L8.5 14L15.5 7" stroke="#6356e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Map offer types to chip sources (second chip label)
function getOfferSource(offerTypes: string[]): string | null {
  if (offerTypes.includes('Regional')) return 'Regional';
  if (offerTypes.includes('National')) return 'National';
  if (offerTypes.includes('Local')) return 'Local';
  return 'National';
}

export const OfferCard = ({ offer, selected, onSelect, onClick }: OfferCardProps) => {
  const primaryType = offer.offerType[0] || 'Lease';
  const source = getOfferSource(offer.offerType);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: `1px solid ${selected ? '#473bab' : 'rgba(0,0,0,0.12)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 1px #473bab' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Top: image + content */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* Image area — 90×90 */}
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

          {/* Checkbox — top-left */}
          <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <div style={{
              position: 'absolute',
              top: 11,
              left: 11,
              width: 14,
              height: 14,
              background: 'white',
              borderRadius: 1,
              zIndex: 0,
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

        {/* Content — right of image */}
        <div style={{ flex: 1, minWidth: 0, padding: 12, position: 'relative' }}>
          {/* Title */}
          <div style={{ paddingRight: 28 }}>
            <p style={{
              margin: 0,
              fontSize: 12,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              color: '#1f1d25',
              lineHeight: 1.43,
              letterSpacing: '0.17px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {offer.vehicleName}
            </p>

            {/* Subtitle — in stock count */}
            <p style={{
              margin: '2px 0 0',
              fontSize: 11,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              color: '#686576',
              lineHeight: 1.66,
              letterSpacing: '0.4px',
              whiteSpace: 'nowrap',
            }}>
              {offer.inStock} in stock
            </p>
          </div>

          {/* Stat chips row */}
          {(offer.pvi || offer.aging || offer.sales || offer.inventory) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {offer.pvi != null && <StatChip label="P" value={offer.pvi} />}
              {offer.aging != null && <StatChip label="A" value={offer.aging} />}
              {offer.sales != null && <StatChip label="S" value={offer.sales} />}
              {offer.inventory != null && <StatChip label="In" value={offer.inventory} />}
            </div>
          )}

          {/* More button */}
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <IconButton
              size="small"
              onClick={(e) => e.stopPropagation()}
              sx={{
                padding: '5px',
                borderRadius: '100px',
                '&:hover': { background: 'rgba(0,0,0,0.04)' },
              }}
            >
              <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Bottom: offer type chips + payment details */}
      <div style={{ padding: '0 8px 4px' }}>
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.12)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {/* Chips row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', paddingBottom: 4 }}>
              {/* Offer type chip (Lease / Finance etc.) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(99,86,225,0.12)',
                borderRadius: 8,
                height: 22,
                paddingRight: 6,
              }}>
                <CheckIcon />
                <span style={{
                  fontSize: 11,
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 400,
                  color: '#6356e1',
                  letterSpacing: '0.16px',
                  lineHeight: '18px',
                  whiteSpace: 'nowrap',
                }}>
                  {primaryType}
                </span>
              </div>

              {/* Source chip (National / Regional) */}
              {source && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f0f2f4',
                  borderRadius: 8,
                  height: 22,
                  padding: '0 6px',
                }}>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    color: '#686576',
                    letterSpacing: '0.16px',
                    lineHeight: '18px',
                    whiteSpace: 'nowrap',
                  }}>
                    {source}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment details row */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            <PaymentField label="Monthly Payment" value={`$${offer.monthlyPayment}`} />
            <PaymentField label="Term" value={String(offer.term)} />
            <PaymentField
              label="Total Due at Signing"
              value={`$${offer.totalDueAtSigning.toLocaleString()} `}
              infoIcon
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: '#f0f2f4',
      borderRadius: 8,
      padding: '0 6px',
      height: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
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
          fontSize: 10,
          color: '#686576',
          lineHeight: '10px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
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
        fontSize: 12,
        color: '#1f1d25',
        lineHeight: 1.43,
        letterSpacing: '0.17px',
        whiteSpace: 'nowrap',
        marginTop: 1,
      }}>
        {value}
      </span>
    </div>
  );
}
