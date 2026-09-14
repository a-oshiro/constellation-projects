import { useState } from 'react';
import type { Offer } from '../../data/types';
import { Tooltip } from './Tooltip';

/**
 * The "which vehicle is this" identity block ("Vehicle Row") shared by the Alert Offers panel's
 * Selected-tab cards (rendered unbordered there, with a clickable pricing row appended directly below
 * to form one seamless card), the floating canvas Offer Info Card, and the Offer Edit panel (rendered
 * bordered/standalone, above the edit form, with no pricing row). VIN/Stock No. are plain secondary
 * text here — no hyperlink/action. When `onClick` is provided this row itself becomes clickable (opens
 * the Vehicle Info editor), gated by `locked` the same way the pricing row below it is.
 */

interface OfferIdentityCardProps {
  offer: Offer;
  /** False when a sibling element (e.g. a pricing row) completes the card's border/rounding below this. */
  bordered?: boolean;
  onClick?: () => void;
  /** True while the project is Evergreen-locked — disables the click and shows an explanatory tooltip. */
  locked?: boolean;
}

export const OfferIdentityCard = ({ offer, bordered = true, onClick, locked }: OfferIdentityCardProps) => {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <div
      onClick={onClick && !locked ? onClick : undefined}
      onMouseEnter={onClick ? () => setHovered(true) : undefined}
      onMouseLeave={onClick ? () => setHovered(false) : undefined}
      style={{
        display: 'flex', gap: 12, padding: 12,
        cursor: onClick ? (locked ? 'not-allowed' : 'pointer') : undefined,
        background: onClick && hovered ? '#f5f5f6' : 'transparent',
      }}
    >
      <img src={offer.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'contain', background: '#f0f2f4', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {offer.vehicleName}
        </span>
        {offer.vin && (
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{offer.vin}</span>
        )}
        {offer.stockNumber && (
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Stock No. {offer.stockNumber}</span>
        )}
      </div>
    </div>
  );

  const content = onClick ? (
    <Tooltip
      title={locked ? 'Unlock project to make changes to this offer' : ''}
      disableHoverListener={!locked}
      slotProps={{ popper: { style: { zIndex: 100050 } } }}
    >
      {inner}
    </Tooltip>
  ) : inner;

  if (!bordered) return content;
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      {content}
    </div>
  );
};
