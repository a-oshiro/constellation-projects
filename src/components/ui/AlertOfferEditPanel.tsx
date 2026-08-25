import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Offer } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { VehicleInfo } from './VehicleInfo';
import { OfferDetails } from './OfferDetails';

/**
 * Right-side offer editor for the alert dialog: a single "Edit Offer" header (with the close X aligned to
 * its title) above a thin tab bar switching between the two panels the Offers task already uses
 * (`VehicleInfo`, `OfferDetails`) — reused with `hideHeader` so their own title/X rows don't duplicate this
 * one. Only ever mounted while the project is unlocked — the lock/tooltip gate lives on `AlertOfferCard`'s
 * "Edit Offer" button instead. Rendered with `key={offer.id}` by the caller so switching offers remounts
 * (and resets the active tab).
 */

interface AlertOfferEditPanelProps {
  offer: Offer;
  onClose: () => void;
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '10px 8px',
  fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: active ? '#473bab' : '#686576',
  borderBottom: active ? '2px solid #473bab' : '2px solid transparent',
});

export const AlertOfferEditPanel = ({ offer, onClose }: AlertOfferEditPanelProps) => {
  const { updateOffer } = useProject();
  const [tab, setTab] = useState<'vehicle' | 'offer'>('vehicle');
  const offerType = offer.offerTypes[0];

  const handleOfferTypeSave = (offerId: string, offerTypeId: string, draft: Record<string, unknown>) => {
    const newOfferTypes = offer.offerTypes.map((ot) => (ot.id === offerTypeId ? { ...ot, ...draft } : ot));
    updateOffer(offerId, { offerTypes: newOfferTypes });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: 360, margin: '8px 8px 0 0', boxSizing: 'border-box', background: '#ffffff',
        borderRadius: '8px 8px 0 0', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
          Edit Offer
        </span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', width: 360, margin: '0 8px 0 0', boxSizing: 'border-box', background: '#ffffff', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <button style={tabButtonStyle(tab === 'vehicle')} onClick={() => setTab('vehicle')}>Vehicle Info</button>
        {offerType && (
          <button style={tabButtonStyle(tab === 'offer')} onClick={() => setTab('offer')}>{offerType.type}</button>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', marginTop: -8 }}>
        {tab === 'offer' && offerType ? (
          <OfferDetails offer={offer} offerType={offerType} onClose={onClose} onSave={handleOfferTypeSave} hideHeader />
        ) : (
          <VehicleInfo offer={offer} onClose={onClose} onSave={updateOffer} hideHeader />
        )}
      </div>
    </div>
  );
};
