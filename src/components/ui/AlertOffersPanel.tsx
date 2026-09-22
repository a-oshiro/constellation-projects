import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { InfoOutlined, ExpandMore, ChevronRight, MoreVert, Close } from '@mui/icons-material';
import type { Offer, ReviewStatus } from '../../data/types';
import { getOfferTypeDisplayFields } from './OfferCard';
import { OfferIdentityCard } from './OfferIdentityCard';
import { OfferReviewCard } from './OfferReviewCard';
import { OutOfStockBadge } from './OutOfStockBadge';
import { Tooltip } from './Tooltip';
import { ReviewVisibilityMenu } from './AlertApprovalWidgets';
import { scrollElementIntoViewCentered } from '../../utils/smoothScroll';
import { REVIEW_DECISION_STYLE } from '../../utils/alertReview';

/** Tooltips nested inside this panel need a z-index above the dialog's own panel (100001) to escape being
 * clipped by it — 100050 is the convention already used elsewhere in this dialog's subtree. */
const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

/**
 * The Review Offers tab's body, embedded in the alert dialog's big right panel. Two inner tabs:
 * - Review Offers: every offer in this alert, approve/remove-capable. Clicking a card's identity row
 *   opens the Vehicle Info editor; clicking its pricing row opens the offer/lease editor.
 * - Models: an informational list of the models enrolled for this Evergreen dealer, each annotated
 *   with how many offers from that model are present in this email — there's no real "enrollment"
 *   persistence layer in this app, so this is derived/display-only.
 */

/** A request to jump to and briefly highlight one offer's card in the Review Offers tab — `token` is a
 * nonce so re-requesting the same offer (e.g. clicking its canvas asset's Offer Info button again) still
 * retriggers the scroll/flash even though `offerId` hasn't changed. */
export interface OfferHighlightRequest {
  offerId: string;
  token: number;
}

interface AlertOffersPanelProps {
  offers: Offer[];
  projectOffers: Offer[];
  /** True while the project is Evergreen-locked — disables clicking an offer's pricing row to edit it. */
  locked: boolean;
  /** `view` picks which editor opens: the Vehicle Info form (clicked the identity/vehicle row) or the offer/lease form (clicked the pricing row). */
  onEditOffer: (offerId: string, view: 'vehicle' | 'offer') => void;
  /** Set from the canvas's per-asset "Offer Info" button — switches to the Review Offers tab and scrolls/flashes that offer's card. */
  highlightRequest?: OfferHighlightRequest | null;
  reviewStatusFor: (offerId: string) => ReviewStatus;
  approvalDisabled: boolean;
  onApproveOffer: (offerId: string) => void;
  onRejectOffer: (offerId: string) => void;
  onUndoOfferReview: (offerId: string) => void;
  /** The show/hide-approved/rejected filter — applies only to the Review Offers list, never to Models' counting. */
  isOfferVisible: (offerId: string) => boolean;
  showApproved: boolean;
  showRejected: boolean;
  onToggleShowApproved: () => void;
  onToggleShowRejected: () => void;
  /** Closes the whole (collapsible) review panel — the header's X, same action as the canvas's "Reviews" toggle. */
  onClosePanel: () => void;
}

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
 * offer/lease editor), both gated by `locked`. Reused as-is by the Selected tab here, the Models tab
 * (per-model expanded offers), the floating canvas Offer Info Card (`AlertOfferCard`), and atop the
 * Offer Edit panel itself. `highlighted` briefly tints the card to call out a card jumped-to from the
 * canvas — purely visual, fades via the background-color transition.
 */
export const OfferListCard = ({
  offer, locked, onEditVehicle, onEditOffer, highlighted, reviewStatus,
}: { offer: Offer; locked: boolean; onEditVehicle: () => void; onEditOffer: () => void; highlighted?: boolean; reviewStatus?: 'approved' | 'rejected' }) => (
  <div style={{
    background: reviewStatus ? REVIEW_DECISION_STYLE[reviewStatus].background : (highlighted ? 'rgba(99,86,225,0.12)' : '#ffffff'),
    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden',
    transition: 'background-color 0.3s ease',
    ...(reviewStatus ? { outline: REVIEW_DECISION_STYLE[reviewStatus].outline, outlineOffset: REVIEW_DECISION_STYLE[reviewStatus].outlineOffset } : {}),
  }}>
    <OfferIdentityCard offer={offer} bordered={false} onClick={onEditVehicle} locked={locked} />
    <OfferRow offer={offer} locked={locked} onEdit={onEditOffer} />
  </div>
);

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500,
};

const modelCardStyle: React.CSSProperties = {
  background: '#f4f5f6', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden',
};

const modelHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 8px 10px 12px', cursor: 'pointer',
};

/** Every offer belongs to a curated "Evergreen BMW of Seattle" model — the shared `sea-offer-` id
 * prefix (also used by alerts.ts) picks those out of `projectOffers`, which otherwise also contains
 * ~15 unrelated demo BMW offers reused by other, non-Evergreen projects. */
const isEnrolledOffer = (o: Offer) => o.id.startsWith('sea-offer-');
const modelKey = (o: Offer) => `${o.model} · ${o.year}`;

export const AlertOffersPanel = ({
  offers, projectOffers, locked, onEditOffer, highlightRequest, reviewStatusFor, approvalDisabled,
  onApproveOffer, onRejectOffer, onUndoOfferReview, isOfferVisible, showApproved, showRejected,
  onToggleShowApproved, onToggleShowRejected, onClosePanel,
}: AlertOffersPanelProps) => {
  const [tab, setTab] = useState<'selected' | 'models'>('selected');
  const [expandedModelKeys, setExpandedModelKeys] = useState<Set<string>>(new Set());
  const [flashOfferId, setFlashOfferId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const offerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerOfferRef = (id: string, el: HTMLDivElement | null) => {
    if (el) offerRefs.current.set(id, el); else offerRefs.current.delete(id);
  };
  const toggleModel = (key: string) => setExpandedModelKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  // A highlight request always lands on the Selected tab, since that's the only tab with a 1:1 offer card.
  useEffect(() => {
    if (highlightRequest) setTab('selected');
  }, [highlightRequest]);

  // Runs once the Selected tab (and its offer card refs) is actually mounted — scrolls the target card
  // into view within this panel's own scroll container, then flashes it for 3s.
  useEffect(() => {
    if (!highlightRequest || tab !== 'selected') return;
    const container = scrollRef.current;
    const target = offerRefs.current.get(highlightRequest.offerId);
    if (container && target) scrollElementIntoViewCentered(container, target);
    setFlashOfferId(highlightRequest.offerId);
    const t = setTimeout(() => setFlashOfferId(null), 3000);
    return () => clearTimeout(t);
  }, [highlightRequest, tab]);

  const emailCountByModel = new Map<string, number>();
  offers.forEach((o) => {
    const key = modelKey(o);
    emailCountByModel.set(key, (emailCountByModel.get(key) ?? 0) + 1);
  });
  const modelKeys = [...new Set(projectOffers.filter(isEnrolledOffer).map(modelKey))];
  const offersForModel = (key: string) => offers.filter((o) => modelKey(o) === key);
  const visibleOffers = offers.filter((o) => isOfferVisible(o.id));

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Review Offers</span>
        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ padding: '4px' }}>
          <MoreVert style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
        <ReviewVisibilityMenu
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
          showApproved={showApproved}
          showRejected={showRejected}
          onToggleShowApproved={onToggleShowApproved}
          onToggleShowRejected={onToggleShowRejected}
        />
        <IconButton size="small" onClick={onClosePanel} title="Close" sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <button style={tabButtonStyle(tab === 'selected')} onClick={() => setTab('selected')}>Review Offers</button>
        <button style={tabButtonStyle(tab === 'models')} onClick={() => setTab('models')}>Models</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'selected' ? (
          visibleOffers.length === 0 ? (
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>No offers to show — use the menu above to reveal approved or rejected offers.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visibleOffers.map((offer) => (
                <div key={offer.id} ref={(el) => registerOfferRef(offer.id, el)}>
                  <OfferReviewCard
                    offer={offer}
                    locked={locked}
                    approvalStatus={reviewStatusFor(offer.id)}
                    approvalDisabled={approvalDisabled}
                    highlighted={flashOfferId === offer.id}
                    onEditVehicle={() => onEditOffer(offer.id, 'vehicle')}
                    onEditOffer={() => onEditOffer(offer.id, 'offer')}
                    onApprove={() => onApproveOffer(offer.id)}
                    onReject={() => onRejectOffer(offer.id)}
                    onUndo={() => onUndoOfferReview(offer.id)}
                  />
                </div>
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
                const expanded = expandedModelKeys.has(key);
                const modelOffers = offersForModel(key);
                return (
                  <div key={key} style={modelCardStyle}>
                    <div style={modelHeaderStyle} onClick={() => toggleModel(key)}>
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
                            <OutOfStockBadge />
                          </Tooltip>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', marginLeft: 8, whiteSpace: 'nowrap' }}>
                          {count} offer{count === 1 ? '' : 's'} in email
                        </span>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleModel(key); }} sx={{ padding: '2px' }}>
                          {expanded ? <ExpandMore style={{ fontSize: 20, color: '#1f1d25' }} /> : <ChevronRight style={{ fontSize: 20, color: '#1f1d25' }} />}
                        </IconButton>
                      </div>
                    </div>
                    {expanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px 10px' }}>
                        {modelOffers.length === 0 ? (
                          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', padding: '0 4px' }}>No offers in email for this model.</span>
                        ) : (
                          modelOffers.map((offer) => (
                            <OfferListCard
                              key={offer.id}
                              offer={offer}
                              locked={locked}
                              onEditVehicle={() => onEditOffer(offer.id, 'vehicle')}
                              onEditOffer={() => onEditOffer(offer.id, 'offer')}
                            />
                          ))
                        )}
                      </div>
                    )}
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
