import { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { ArrowBack, Close } from '@mui/icons-material';
import type { Offer } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { VehicleInfo } from './VehicleInfo';
import { OfferDetails } from './OfferDetails';
import { OfferListCard } from './AlertOffersPanel';
import { DiscardOfferEditDialog } from './DiscardOfferEditDialog';
import { useResponsivePanelWidth } from '../../hooks/useResponsivePanelWidth';

/**
 * Right-side offer editor for the alert dialog. No tabs — instead the same "Offer Card" (identity +
 * pricing row) used everywhere else drives navigation: clicking its pricing row reveals the offer/lease
 * form ("offer" view), clicking its vehicle row opens Vehicle Info ("vehicle" view), and the Offer Card
 * itself is only shown in the "offer" view (never above the Vehicle Info fields), per CP-13922. It's
 * passed to `OfferDetails` as `topContent` so it scrolls together with the fields below it, rather than
 * staying pinned above a separately-scrolling form.
 * Leaving with unsaved changes — via the header back arrow, the header close X, or the form's own
 * "Back" footer button — is gated behind a confirmation dialog. Only ever mounted while the project is
 * unlocked — the lock/tooltip gate lives on the Offer Card's rows instead. Rendered with `key={offer.id}`
 * by the caller so switching offers remounts (and resets the active view).
 */

interface AlertOfferEditPanelProps {
  offer: Offer;
  /** Which view to land on when the panel mounts — set by whichever Offer Card row triggered this edit.
   * The caller includes this in the `key` it renders us with, so a new request always remounts us fresh
   * (even for the same offer) instead of needing an effect to resync internal state. */
  initialView: 'vehicle' | 'offer';
  /** Returns to the Alert Offers list panel — used by the header back arrow and the form's "Back" button. */
  onBack: () => void;
  /** Fully dismisses the right panel (no panel shown) — used by the header close X. */
  onClose: () => void;
  /** Scrolls the email preview canvas so this offer's asset is in view — called whenever a row on the
   * Offer Card (here or elsewhere) puts this offer's editor on screen, so the user can watch their edits
   * land on the asset as they make them. */
  onFocusAsset: () => void;
}

export const AlertOfferEditPanel = ({ offer, initialView, onBack, onClose, onFocusAsset }: AlertOfferEditPanelProps) => {
  const { updateOffer } = useProject();
  const [view, setView] = useState(initialView);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const panelWidth = useResponsivePanelWidth();
  const offerType = offer.offerTypes[0];

  const guardedNavigate = (action: () => void) => {
    if (isDirty) {
      pendingActionRef.current = action;
      setConfirmOpen(true);
    } else {
      action();
    }
  };

  const handleOfferTypeSave = (offerId: string, offerTypeId: string, draft: Record<string, unknown>) => {
    const newOfferTypes = offer.offerTypes.map((ot) => (ot.id === offerTypeId ? { ...ot, ...draft } : ot));
    updateOffer(offerId, { offerTypes: newOfferTypes });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        width: panelWidth, margin: '8px 8px 0 0', boxSizing: 'border-box', background: '#ffffff',
        borderRadius: '8px 8px 0 0', padding: '8px 16px', flexShrink: 0,
      }}>
        <IconButton size="small" onClick={() => guardedNavigate(onBack)} sx={{ padding: '4px' }}>
          <ArrowBack style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
          {view === 'vehicle' ? 'Edit Vehicle Information' : 'Edit Offer'}
        </span>
        <IconButton size="small" onClick={() => guardedNavigate(onClose)} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {view === 'offer' && offerType ? (
          <OfferDetails
            offer={offer}
            offerType={offerType}
            onClose={onClose}
            onSave={handleOfferTypeSave}
            onBack={() => guardedNavigate(onBack)}
            onSaved={onBack}
            onDirtyChange={setIsDirty}
            width={panelWidth}
            hideHeader
            topContent={(
              <OfferListCard
                offer={offer}
                locked={false}
                onEditVehicle={() => { setView('vehicle'); onFocusAsset(); }}
                onEditOffer={onFocusAsset}
              />
            )}
          />
        ) : (
          <VehicleInfo
            offer={offer}
            onClose={onClose}
            onSave={updateOffer}
            onBack={() => guardedNavigate(onBack)}
            onSaved={onBack}
            onDirtyChange={setIsDirty}
            width={panelWidth}
            hideHeader
          />
        )}
      </div>

      <DiscardOfferEditDialog
        open={confirmOpen}
        onContinueEditing={() => setConfirmOpen(false)}
        onGoBack={() => {
          setConfirmOpen(false);
          setIsDirty(false);
          pendingActionRef.current?.();
        }}
      />
    </div>
  );
};
