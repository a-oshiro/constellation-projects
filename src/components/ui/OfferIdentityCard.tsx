import { useState } from 'react';
import type { Offer } from '../../data/types';

/**
 * The "which vehicle is this" identity block ("Vehicle Row") shared by the Alert Offers panel's
 * Selected-tab cards (rendered unbordered there, with a clickable pricing row appended directly below
 * to form one seamless card), the floating canvas Offer Info Card, and the Offer Edit panel (rendered
 * bordered/standalone, above the edit form, with no pricing row). VIN/Stock No. are plain secondary
 * text here — no hyperlink/action. When `onClick` is provided this row itself becomes clickable (opens
 * the Vehicle Info editor — read only while the project is locked).
 */

interface OfferIdentityCardProps {
  offer: Offer;
  /** False when a sibling element (e.g. a pricing row) completes the card's border/rounding below this. */
  bordered?: boolean;
  onClick?: () => void;
  /** Rendered at the row's top-right (e.g. a per-offer actions menu). Clicks on it never reach `onClick`. */
  trailing?: React.ReactNode;
}

export const OfferIdentityCard = ({ offer, bordered = true, onClick, trailing }: OfferIdentityCardProps) => {
  const [hovered, setHovered] = useState(false);

  const inner = (
    <div
      onClick={onClick}
      onMouseEnter={onClick ? () => setHovered(true) : undefined}
      onMouseLeave={onClick ? () => setHovered(false) : undefined}
      style={{
        display: 'flex', gap: 12, padding: 12,
        cursor: onClick ? 'pointer' : undefined,
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
      {trailing && (
        <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, alignSelf: 'flex-start', margin: '-6px -6px 0 0' }}>
          {trailing}
        </div>
      )}
    </div>
  );

  if (!bordered) return inner;
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      {inner}
    </div>
  );
};
