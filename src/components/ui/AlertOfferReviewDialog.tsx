import { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, IconButton } from '@mui/material';
import { Check, Close, ExpandLess, ExpandMore } from '@mui/icons-material';
import type { Alert, Offer } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { CATEGORY_STYLE } from '../../utils/alertReview';
import { OfferReviewCard } from './OfferReviewCard';
import { AlertOfferEditPanel } from './AlertOfferEditPanel';

interface AlertOfferReviewDialogProps {
  alert: Alert;
  onClose: () => void;
}

/**
 * Stage-1 review dialog, opened from a card in the Generated column: review the deal terms/vehicle for
 * every offer selected for this alert, approving or removing each one, before any creative exists to
 * look at. Once every offer has a decision, the alert auto-transitions to 'assets_review' (via
 * `setOfferReview`'s rollup) and the Kanban board swaps this dialog for `AlertDialog` in place, carrying
 * the user straight into asset review.
 */
export const AlertOfferReviewDialog = ({ alert, onClose }: AlertOfferReviewDialogProps) => {
  const { offers, currentProject, locked, setOfferReview } = useProject();
  const [showReviewed, setShowReviewed] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [editingOfferView, setEditingOfferView] = useState<'vehicle' | 'offer'>('offer');

  const projectLocked = currentProject.isEvergreen && locked;
  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const allOffers = [alert.featuredOfferId, ...alert.otherOfferIds]
    .map(findOffer)
    .filter((o): o is Offer => Boolean(o));

  const reviewFor = (offerId: string) => alert.offerReviews?.[offerId]?.status ?? 'pending';
  const pendingOffers = allOffers.filter((o) => reviewFor(o.id) === 'pending');
  const reviewedOffers = allOffers.filter((o) => reviewFor(o.id) !== 'pending');
  const isArchived = !!alert.archivedAt;
  const isSent = alert.status === 'sent';
  const disabled = isArchived || isSent;

  const handleApproveRemaining = () => {
    pendingOffers.forEach((o) => setOfferReview(alert.id, o.id, 'approved'));
  };

  const editingOffer = editingOfferId ? offers.find((o) => o.id === editingOfferId) : undefined;
  const editOffer = (offerId: string, view: 'vehicle' | 'offer') => {
    setEditingOfferId(offerId);
    setEditingOfferView(view);
  };

  const grid = (list: Offer[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {list.map((offer) => (
        <OfferReviewCard
          key={offer.id}
          offer={offer}
          locked={!!projectLocked}
          approvalStatus={reviewFor(offer.id)}
          approvalDisabled={disabled}
          onEditVehicle={() => editOffer(offer.id, 'vehicle')}
          onEditOffer={() => editOffer(offer.id, 'offer')}
          onApprove={() => setOfferReview(alert.id, offer.id, 'approved')}
          onReject={() => setOfferReview(alert.id, offer.id, 'rejected')}
          onUndo={() => setOfferReview(alert.id, offer.id, 'pending')}
        />
      ))}
    </div>
  );

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }} />
      <div
        style={{
          position: 'fixed', inset: 16, zIndex: 100001,
          background: '#ffffff', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.subject}
          </span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
            {`Generated ${formatRelativeTime(alert.createdAt)} by AI AutoAgent`}
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Left rail — alert type + reasoning */}
          <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: 16 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', background: CATEGORY_STYLE[alert.category].background,
                color: CATEGORY_STYLE[alert.category].color, borderRadius: 8, padding: '2px 8px', fontSize: 11,
                fontFamily: 'Roboto, sans-serif', letterSpacing: '0.4px', whiteSpace: 'nowrap', marginBottom: 12,
              }}
            >
              Alert Type: {alert.category}
            </span>
            <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}>
              {alert.reasoning}
            </p>
          </div>

          {/* Main panel — offer grid */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', flex: 1, minWidth: 0 }}>
                {pendingOffers.length > 0
                  ? `${pendingOffers.length} offer${pendingOffers.length === 1 ? '' : 's'} needing approval`
                  : 'Every offer has been reviewed'}
              </span>
              {pendingOffers.length > 0 && (
                <Button
                  variant="contained"
                  disableElevation
                  size="small"
                  disabled={disabled}
                  startIcon={<Check style={{ fontSize: 16 }} />}
                  onClick={handleApproveRemaining}
                  sx={{
                    background: '#4caf50', color: '#ffffff', borderRadius: '100px', padding: '4px 14px',
                    fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
                    textTransform: 'none', whiteSpace: 'nowrap',
                    '&:hover': { background: '#43a047', boxShadow: 'none' },
                  }}
                >
                  Approve all remaining
                </Button>
              )}
            </div>

            {allOffers.length > 0 && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
                {allOffers.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      flex: 1, height: 4, borderRadius: 100,
                      background: reviewFor(o.id) === 'approved' ? '#4caf50' : reviewFor(o.id) === 'rejected' ? '#d2323f' : 'rgba(17,16,20,0.12)',
                    }}
                  />
                ))}
              </div>
            )}

            {pendingOffers.length > 0 ? grid(pendingOffers) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#686576', fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
                This alert is moving into Review Assets.
              </div>
            )}

            {reviewedOffers.length > 0 && (
              <div>
                <button
                  onClick={() => setShowReviewed((v) => !v)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none',
                    cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                    color: '#473bab', letterSpacing: '0.46px', marginBottom: 12,
                  }}
                >
                  {showReviewed ? <ExpandLess style={{ fontSize: 18 }} /> : <ExpandMore style={{ fontSize: 18 }} />}
                  {showReviewed ? 'Hide' : 'Review'} approved &amp; removed offers ({reviewedOffers.length})
                </button>
                {showReviewed && grid(reviewedOffers)}
              </div>
            )}
          </div>

          {editingOffer && !projectLocked && (
            <AlertOfferEditPanel
              key={`${editingOffer.id}-${editingOfferView}`}
              offer={editingOffer}
              initialView={editingOfferView}
              onBack={() => setEditingOfferId(null)}
              onClose={() => setEditingOfferId(null)}
              onFocusAsset={() => {}}
            />
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};
