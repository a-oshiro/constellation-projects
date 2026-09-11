import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Close, ArrowBack, CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import type { Offer } from '../../data/types';
import { getOfferTypeDisplayFields } from './OfferCard';

/**
 * Right-panel content opened from the dialog header's Offers (car) icon button. Two tabs:
 * - Selected: the offers actually used in this alert's email, each with VIN/Stock No. hyperlinks that
 *   drill into a read-only Inventory Item detail view (below) for that offer.
 * - Models: an informational Selected/Unselected breakdown of every model in the project — there's no
 *   real "enrollment" persistence layer in this app, so this is derived/display-only.
 * Per CP-13922 (Figma), simplified: 360px wide (matches every other right-panel in this dialog, not
 * Figma's 400px), no drag-reorder/delete on the Selected cards, and the Inventory Item detail only shows
 * fields the `Offer` type actually has (the same set `VehicleInfo.tsx` already exposes) — no fabricated
 * location/market-analytics fields.
 */

interface AlertOffersPanelProps {
  offers: Offer[];
  projectOffers: Offer[];
  projectId: string;
  inventoryOfferId: string | null;
  onSelectInventory: (id: string | null) => void;
  onClose: () => void;
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '10px 8px',
  fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: active ? '#473bab' : '#686576',
  borderBottom: active ? '2px solid #473bab' : '2px solid transparent',
});

const linkButtonStyle: React.CSSProperties = {
  border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
  fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#473bab', textDecoration: 'underline',
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.08)',
};

const detailLabelStyle: React.CSSProperties = {
  width: 90, flexShrink: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px',
};

const detailValueStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px',
  wordBreak: 'break-word',
};

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <span style={detailValueStyle}>{value}</span>
    </div>
  );
};

const OfferListCard = ({ offer, onOpenInventory }: { offer: Offer; onOpenInventory: () => void }) => {
  const fields = offer.offerTypes[0] ? getOfferTypeDisplayFields(offer.offerTypes[0]) : [];
  return (
    <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 12, padding: 12 }}>
        <img src={offer.imageUrl} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'contain', background: '#f0f2f4', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {offer.vehicleName}
          </span>
          {offer.vin && (
            <button onClick={onOpenInventory} style={linkButtonStyle}>{offer.vin}</button>
          )}
          {offer.stockNumber && (
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
              Stock No: <button onClick={onOpenInventory} style={{ ...linkButtonStyle, display: 'inline' }}>{offer.stockNumber}</button>
            </span>
          )}
        </div>
      </div>
      {fields.length > 0 && (
        <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.08)', padding: '8px 12px', gap: 16 }}>
          {fields.map((f) => (
            <div key={f.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{f.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ModelRow = ({ label, selected }: { label: string; selected: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f4f5f6', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 16px' }}>
    {selected
      ? <CheckBox style={{ fontSize: 20, color: '#473bab' }} />
      : <CheckBoxOutlineBlank style={{ fontSize: 20, color: '#9c99a9' }} />}
    <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#1f1d25' }}>{label}</span>
  </div>
);

export const AlertOffersPanel = ({ offers, projectOffers, projectId, inventoryOfferId, onSelectInventory, onClose }: AlertOffersPanelProps) => {
  const [tab, setTab] = useState<'selected' | 'models'>('selected');
  const inventoryOffer = inventoryOfferId ? projectOffers.find((o) => o.id === inventoryOfferId) ?? offers.find((o) => o.id === inventoryOfferId) : undefined;

  if (inventoryOffer) {
    return (
      <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={panelHeaderStyle}>
          <IconButton size="small" onClick={() => onSelectInventory(null)} sx={{ padding: '4px' }}>
            <ArrowBack style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {inventoryOffer.vehicleName}
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
            <Close style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <img src={inventoryOffer.imageUrl} alt="" style={{ width: 200, height: 140, objectFit: 'contain' }} />
          </div>
          <DetailRow label="VIN" value={inventoryOffer.vin} />
          <DetailRow label="Stock No" value={inventoryOffer.stockNumber} />
          <DetailRow label="Condition" value={inventoryOffer.condition} />
          <DetailRow label="Mileage" value={inventoryOffer.mileage} />
          <DetailRow label="Year" value={inventoryOffer.year} />
          <DetailRow label="Make" value={inventoryOffer.make} />
          <DetailRow label="Model" value={inventoryOffer.model} />
          <DetailRow label="Trim" value={inventoryOffer.trim} />
          <DetailRow label="Drivetrain" value={inventoryOffer.drivetrain} />
          <DetailRow label="Transmission" value={inventoryOffer.transmission} />
          <DetailRow label="Exterior Color" value={inventoryOffer.exteriorColor} />
          <DetailRow label="Model Code" value={inventoryOffer.modelCode} />
          <DetailRow label="Style Name" value={inventoryOffer.styleName} />
          <DetailRow label="MSRP" value={inventoryOffer.msrp != null ? `$${inventoryOffer.msrp.toLocaleString()}` : undefined} />
          <DetailRow label="Advertised Price" value={inventoryOffer.advertisedPrice != null ? `$${inventoryOffer.advertisedPrice.toLocaleString()}` : undefined} />
          <DetailRow label="Days in Stock" value={inventoryOffer.daysInStock} />
          <DetailRow label="Date in Stock" value={inventoryOffer.dateInStock} />
        </div>
      </div>
    );
  }

  const modelKey = (o: Offer) => `${o.model} · ${o.year}`;
  const selectedIds = new Set(offers.map((o) => o.id));
  const groups = new Map<string, { representative: Offer; selected: boolean }>();
  projectOffers.forEach((o) => {
    const key = modelKey(o);
    const existing = groups.get(key);
    const isSelected = selectedIds.has(o.id);
    if (!existing) groups.set(key, { representative: o, selected: isSelected });
    else if (isSelected) existing.selected = true;
  });
  const selectedGroups = [...groups.entries()].filter(([, g]) => g.selected);
  const unselectedGroups = [...groups.entries()].filter(([, g]) => !g.selected);

  return (
    <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={panelHeaderStyle}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Offers</span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <button style={tabButtonStyle(tab === 'selected')} onClick={() => setTab('selected')}>Selected</button>
        <button style={tabButtonStyle(tab === 'models')} onClick={() => setTab('models')}>Models</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'selected' ? (
          offers.length === 0 ? (
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>No offers in this alert.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {offers.map((offer) => (
                <OfferListCard key={offer.id} offer={offer} onOpenInventory={() => onSelectInventory(offer.id)} />
              ))}
            </div>
          )
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
              To change model selection,{' '}
              <button
                onClick={() => window.open(`/projects/${projectId}/offers`, '_blank', 'noopener,noreferrer')}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: '#473bab', textDecoration: 'underline' }}
              >
                Go to Enrollment Settings
              </button>
            </p>

            {selectedGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '1px', textTransform: 'uppercase' }}>Selected</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedGroups.map(([key]) => <ModelRow key={key} label={key} selected />)}
                </div>
              </div>
            )}

            {unselectedGroups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '1px', textTransform: 'uppercase' }}>Unselected</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {unselectedGroups.map(([key]) => <ModelRow key={key} label={key} selected={false} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
