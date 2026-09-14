import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Close, InfoOutlined, WarningAmberOutlined } from '@mui/icons-material';
import type { Offer } from '../../data/types';
import { getOfferTypeDisplayFields } from './OfferCard';
import { OfferIdentityCard } from './OfferIdentityCard';
import { Tooltip } from './Tooltip';
import { useResponsivePanelWidth } from '../../hooks/useResponsivePanelWidth';

/** Tooltips nested inside this dialog's right panel need a z-index above the dialog's own panel (100001)
 * to escape being clipped by it — 100050 is the convention already used elsewhere in this dialog's subtree. */
const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

/**
 * Right-panel content opened from the dialog header's Offers (car) icon button. Two tabs:
 * - Selected: the offers actually used in this alert's email. Each card's pricing row is clickable
 *   (while the project is unlocked) to open the Offer Edit panel for that offer.
 * - Models: an informational list of the models enrolled for this Evergreen dealer, each annotated
 *   with how many offers from that model are present in this email — there's no real "enrollment"
 *   persistence layer in this app, so this is derived/display-only.
 * Width matches every other right-panel in this dialog via `useResponsivePanelWidth` (360px, or 400px on
 * very wide viewports).
 */

interface AlertOffersPanelProps {
  offers: Offer[];
  projectOffers: Offer[];
  /** True while the project is Evergreen-locked — disables clicking an offer's pricing row to edit it. */
  locked: boolean;
  /** `view` picks which editor opens: the Vehicle Info form (clicked the identity/vehicle row) or the offer/lease form (clicked the pricing row). */
  onEditOffer: (offerId: string, view: 'vehicle' | 'offer') => void;
  onClose: () => void;
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexShrink: 0,
};

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '10px 8px',
  fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: active ? '#473bab' : '#686576',
  borderBottom: active ? '2px solid #473bab' : '2px solid transparent',
});

/** The clickable pricing/offer-type row beneath an offer's identity block — the "offer row" that opens the editor. */
const OfferRow = ({ offer, locked, onEdit }: { offer: Offer; locked: boolean; onEdit: () => void }) => {
  const offerType = offer.offerTypes[0];
  const [hovered, setHovered] = useState(false);
  if (!offerType) return null;
  const fields = getOfferTypeDisplayFields(offerType);

  const row = (
    <div
      onClick={locked ? undefined : onEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px',
        borderTop: '1px solid rgba(0,0,0,0.08)', cursor: locked ? 'not-allowed' : 'pointer',
        background: hovered ? '#f5f5f6' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ background: 'rgba(99,86,225,0.12)', color: '#6356e1', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif' }}>
          {offerType.type}
        </span>
        {offerType.source && (
          <span style={{ background: '#f0f2f4', color: '#686576', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif' }}>
            {offerType.source}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {fields.map((f) => (
          <div key={f.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{f.label}</span>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip
      title={locked ? 'Unlock project to make changes to this offer' : ''}
      disableHoverListener={!locked}
      slotProps={tooltipPopperProps}
    >
      {row}
    </Tooltip>
  );
};

/**
 * The "Offer Card": a vehicle identity row (click → Vehicle Info editor) plus a pricing row (click →
 * offer/lease editor), both gated by `locked`. Reused as-is by the Selected tab here, the floating
 * canvas Offer Info Card (`AlertOfferCard`), and atop the Offer Edit panel itself.
 */
export const OfferListCard = ({ offer, locked, onEditVehicle, onEditOffer }: { offer: Offer; locked: boolean; onEditVehicle: () => void; onEditOffer: () => void }) => (
  <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
    <OfferIdentityCard offer={offer} bordered={false} onClick={onEditVehicle} locked={locked} />
    <OfferRow offer={offer} locked={locked} onEdit={onEditOffer} />
  </div>
);

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500,
};

const modelRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  background: '#f4f5f6', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '10px 12px',
};

const noStockChipStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FDF4EC', color: '#c45500',
  borderRadius: 8, padding: '2px 8px 2px 6px', fontSize: 11, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', cursor: 'default', flexShrink: 0,
};

/** Every offer belongs to a curated "Evergreen BMW of Seattle" model — the shared `sea-offer-` id
 * prefix (also used by alerts.ts) picks those out of `projectOffers`, which otherwise also contains
 * ~15 unrelated demo BMW offers reused by other, non-Evergreen projects. */
const isEnrolledOffer = (o: Offer) => o.id.startsWith('sea-offer-');
const modelKey = (o: Offer) => `${o.model} · ${o.year}`;

export const AlertOffersPanel = ({ offers, projectOffers, locked, onEditOffer, onClose }: AlertOffersPanelProps) => {
  const [tab, setTab] = useState<'selected' | 'models'>('selected');
  const panelWidth = useResponsivePanelWidth();

  const emailCountByModel = new Map<string, number>();
  offers.forEach((o) => {
    const key = modelKey(o);
    emailCountByModel.set(key, (emailCountByModel.get(key) ?? 0) + 1);
  });
  const modelKeys = [...new Set(projectOffers.filter(isEnrolledOffer).map(modelKey))];

  return (
    <div style={{ width: panelWidth, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={panelHeaderStyle}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Alert Offers</span>
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
                <OfferListCard
                  key={offer.id}
                  offer={offer}
                  locked={locked}
                  onEditVehicle={() => onEditOffer(offer.id, 'vehicle')}
                  onEditOffer={() => onEditOffer(offer.id, 'offer')}
                />
              ))}
            </div>
          )
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={sectionTitleStyle}>Enrollment Form Models:</span>
              <Tooltip
                title={
                  <>
                    These are the models selected in the Enrollment Form.<br />
                    To change selection, go to Enrolment Settings
                  </>
                }
                slotProps={tooltipPopperProps}
              >
                <IconButton size="small" sx={{ padding: '2px' }}>
                  <InfoOutlined style={{ fontSize: 14, color: '#9c99a9' }} />
                </IconButton>
              </Tooltip>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {modelKeys.map((key) => {
                const count = emailCountByModel.get(key) ?? 0;
                const noStock = count === 0;
                return (
                  <div key={key} style={modelRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {key}
                      </span>
                      {noStock && (
                        <Tooltip title={
                          <>
                            This model has no stock available.<br/>
                            No offers were added to the email.
                          </>
                        } slotProps={tooltipPopperProps}>
                          <span style={noStockChipStyle}>
                            <WarningAmberOutlined style={{ fontSize: 13 }} />
                            No Stock
                          </span>
                        </Tooltip>
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', flexShrink: 0, marginLeft: 8, whiteSpace: 'nowrap' }}>
                      {count} offer{count === 1 ? '' : 's'} in email
                    </span>
                  </div>
                );
              })}
              {modelKeys.length === 0 && (
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>No enrolled models for this project.</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
