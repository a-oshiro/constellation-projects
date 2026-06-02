import { useState } from 'react';
import { Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { PendingOfferChange, PendingRemovalChange } from '../../context/ProjectContext';
import type { Offer } from '../../data/types';

import multiMediaIcon from '../../assets/icons/multi-media.svg';
import circleCheckIcon from '../../assets/icons/circle-check.svg';
import squareLinesIcon from '../../assets/icons/square-lines.svg';
import images2Icon from '../../assets/icons/images-2.svg';
import imageAltTextIcon from '../../assets/icons/image-alt-text.svg';
import megaphoneIcon from '../../assets/icons/megaphone.svg';

// ── Shared overlay + dialog shell ─────────────────────────────────────────────

function DialogOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        width: 600,
        boxShadow: '0px 9px 46px 8px rgba(0,0,0,0.12), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 11px 15px -7px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px 16px 8px' }}>
      <p style={{ margin: 0, fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  );
}

function DialogContent({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  );
}

function DialogActions({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
      {children}
    </div>
  );
}

function ImpactCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {children}
    </div>
  );
}

// ── Apply Changes Dialog ───────────────────────────────────────────────────────

interface ApplyChangesDialogProps {
  updatedCount: number;
  removedCount: number;
  approvedRemovedCount: number;
  adsUpdatedShellCount: number;
  campaignLoaded: boolean;
  approvalEnabled: boolean;
  onClose: () => void;
  onApply: () => void;
  onReviewChanges: () => void;
}

export function ApplyChangesDialog({ updatedCount, removedCount, approvedRemovedCount, adsUpdatedShellCount, campaignLoaded, approvalEnabled, onClose, onApply, onReviewChanges }: ApplyChangesDialogProps) {
  const navigate = useNavigate();

  const linkStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', borderRadius: 100 };
  const descStyle: React.CSSProperties = { margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 };

  const assetsTaskLabel = approvalEnabled ? 'Review' : 'Assets';

  return (
    <DialogOverlay>
      <DialogTitle>Apply Project Changes</DialogTitle>
      <DialogContent>
        <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
          Project updates will impact assets, ad shells and campaigns. Review below all impacted areas. Click{' '}
          <strong>Apply Changes</strong> to confirm the updates across all listed tasks.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Review / Assets */}
          <ImpactCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={multiMediaIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>{assetsTaskLabel}</span>
              <button onClick={() => { onClose(); navigate('/review'); }} style={linkStyle}>Go to {assetsTaskLabel}</button>
            </div>
            <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {updatedCount > 0 && <p style={descStyle}>{updatedCount} updated</p>}
              {removedCount > 0 && <p style={descStyle}>{removedCount} removed</p>}
            </div>
          </ImpactCard>

          {/* Approved — only in approval flow */}
          {approvalEnabled && approvedRemovedCount > 0 && (
            <ImpactCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={circleCheckIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>Approved</span>
                <button onClick={() => { onClose(); navigate('/approved'); }} style={linkStyle}>Go to Approved</button>
              </div>
              <p style={{ ...descStyle, paddingLeft: 32 }}>{approvedRemovedCount} removed</p>
            </ImpactCard>
          )}

          {/* Ads */}
          {adsUpdatedShellCount > 0 && (
            <ImpactCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={imageAltTextIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>Ads</span>
                <button onClick={() => { onClose(); navigate('/ads'); }} style={linkStyle}>Go to Ad Shells</button>
              </div>
              <p style={{ ...descStyle, paddingLeft: 32 }}>{adsUpdatedShellCount} updated</p>
            </ImpactCard>
          )}

          {/* Campaigns — approval flow: only when shells affected; no-approval flow: whenever campaign is loaded */}
          {((approvalEnabled && campaignLoaded && adsUpdatedShellCount > 0) ||
            (!approvalEnabled && campaignLoaded)) && (
            <ImpactCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={megaphoneIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>Campaigns</span>
                <button onClick={() => { onClose(); navigate('/campaigns'); }} style={linkStyle}>Go to Campaigns</button>
              </div>
              <p style={{ ...descStyle, paddingLeft: 32 }}>1 updated</p>
            </ImpactCard>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
        >
          Cancel
        </button>
        <button
          onClick={onReviewChanges}
          style={{ background: 'none', border: '1px solid rgba(99,86,225,0.5)', cursor: 'pointer', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
        >
          Review Changes
        </button>
        <button
          onClick={onApply}
          style={{ background: '#473bab', border: 'none', cursor: 'pointer', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#ffffff', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
        >
          Apply Changes
        </button>
      </DialogActions>
    </DialogOverlay>
  );
}

// ── Revert Changes Dialog ──────────────────────────────────────────────────────

interface RevertChangesDialogProps {
  pendingChanges: PendingOfferChange[];
  pendingRemovals: PendingRemovalChange[];
  offers: Offer[];
  onClose: () => void;
  onRevert: (offerIds: Set<string>) => void;
  onRevertRemovals: (itemIds: Set<string>) => void;
}

export function RevertChangesDialog({ pendingChanges, pendingRemovals, offers, onClose, onRevert, onRevertRemovals }: RevertChangesDialogProps) {
  const navigate = useNavigate();

  const allEditIds = pendingChanges.map((c) => c.offerId);
  const allRemovalIds = pendingRemovals.map((r) => r.id);
  const allIds = [...allEditIds, ...allRemovalIds];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(allIds));

  const allSelected = selectedIds.size === allIds.length;

  const toggle = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleRevert = () => {
    const selectedOfferIds = new Set(allEditIds.filter((id) => selectedIds.has(id)));
    const selectedRemovalIds = new Set(allRemovalIds.filter((id) => selectedIds.has(id)));
    if (selectedOfferIds.size > 0) onRevert(selectedOfferIds);
    if (selectedRemovalIds.size > 0) onRevertRemovals(selectedRemovalIds);
    onClose();
  };

  const templateRemovals = pendingRemovals.filter((r) => r.type === 'template');
  const bgRemovals = pendingRemovals.filter((r) => r.type === 'background');
  const offerRemovals = pendingRemovals.filter((r) => r.type === 'offer');

  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' };

  const renderCheckbox = (id: string) => {
    const checked = selectedIds.has(id);
    return (
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 13, background: 'white', zIndex: 0 }} />
        <Checkbox
          checked={checked}
          onChange={(e) => toggle(id, e.target.checked)}
          size="small"
          sx={{ padding: '9px', position: 'relative', zIndex: 1, '& .MuiSvgIcon-root': { fontSize: 20, color: checked ? '#473bab' : 'rgba(0,0,0,0.54)' } }}
        />
      </div>
    );
  };

  return (
    <DialogOverlay>
      <DialogTitle>Revert Project Changes</DialogTitle>
      <DialogContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ flex: 1, margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
            Select below the changes you wish to revert.
          </p>
          <button
            onClick={handleSelectAll}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#473bab', letterSpacing: '0.17px', lineHeight: 1.43, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Offers section (edits) */}
        {(pendingChanges.length > 0 || offerRemovals.length > 0) && (
          <ImpactCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={squareLinesIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
                Offers:
              </span>
              <button
                onClick={() => { onClose(); navigate('/offers'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', borderRadius: 100 }}
              >
                Go to Offers
              </button>
            </div>

            {pendingChanges.map((change) => {
              const offer = offers.find((o) => o.id === change.offerId) ?? change.previousOffer;
              return (
                <div key={change.offerId} style={rowStyle}>
                  {renderCheckbox(change.offerId)}
                  <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                    <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    {offer.vehicleName}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43, flexShrink: 0 }}>
                    Edited
                  </span>
                </div>
              );
            })}

            {offerRemovals.map((r) => {
              const offer = r.item as import('../../data/types').Offer;
              return (
                <div key={r.id} style={rowStyle}>
                  {renderCheckbox(r.id)}
                  <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                    <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    {offer.vehicleName}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43, flexShrink: 0 }}>
                    Removed
                  </span>
                </div>
              );
            })}
          </ImpactCard>
        )}

        {/* Templates section (removals) */}
        {templateRemovals.length > 0 && (
          <ImpactCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={images2Icon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
                Templates:
              </span>
              <button
                onClick={() => { onClose(); navigate('/templates'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', borderRadius: 100 }}
              >
                Go to Templates
              </button>
            </div>

            {templateRemovals.map((r) => {
              const tmpl = r.item as import('../../data/types').Template;
              return (
                <div key={r.id} style={rowStyle}>
                  {renderCheckbox(r.id)}
                  <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    {tmpl.name} ({tmpl.width} x {tmpl.height})
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43, flexShrink: 0 }}>
                    Removed
                  </span>
                </div>
              );
            })}
          </ImpactCard>
        )}

        {/* Backgrounds section (removals) */}
        {bgRemovals.length > 0 && (
          <ImpactCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={multiMediaIcon} alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57 }}>
                Backgrounds:
              </span>
              <button
                onClick={() => { onClose(); navigate('/theme-and-logos'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 5px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', borderRadius: 100 }}
              >
                Go to Theme and Logos
              </button>
            </div>

            {bgRemovals.map((r) => {
              const bg = r.item as import('../../data/types').Background;
              return (
                <div key={r.id} style={rowStyle}>
                  {renderCheckbox(r.id)}
                  <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                    <img src={bg.url} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    {bg.name}
                  </span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43, flexShrink: 0 }}>
                    Removed
                  </span>
                </div>
              );
            })}
          </ImpactCard>
        )}
      </DialogContent>

      <DialogActions>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
        >
          Cancel
        </button>
        <button
          onClick={handleRevert}
          disabled={selectedIds.size === 0}
          style={{ background: selectedIds.size > 0 ? '#d2323f' : 'rgba(0,0,0,0.12)', border: 'none', cursor: selectedIds.size > 0 ? 'pointer' : 'default', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: selectedIds.size > 0 ? '#ffffff' : 'rgba(0,0,0,0.26)', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
        >
          Revert Selected Changes
        </button>
      </DialogActions>
    </DialogOverlay>
  );
}
