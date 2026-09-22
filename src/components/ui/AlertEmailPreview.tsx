import { useState } from 'react';
import type { DragEvent } from 'react';
import { DragIndicator, PictureAsPdfOutlined } from '@mui/icons-material';
import type { Alert, Background, Offer, Template } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';

interface AlertEmailPreviewProps {
  alert: Alert;
  /** Already filtered by the caller to only what should be visible right now — offers whose asset has been approved so far. */
  featuredOffer?: Offer;
  otherOffers: Offer[];
  template?: Template;
  accountName: string;
  bgFor: (offer: Offer) => Background | undefined;
  /** When provided, `otherOffers` becomes drag-reorderable — called with the reordered list on drop. Omit for a read-only preview. */
  onReorderOtherOffers?: (next: Offer[]) => void;
}

const renderAsset = (offer: Offer, template: Template, bgFor: (o: Offer) => Background | undefined) => {
  const bg = bgFor(offer);
  if (!bg) return null;
  return (
    <div key={offer.id} style={{ position: 'relative', width: '100%', aspectRatio: `${template.width} / ${template.height}`, marginBottom: 20, borderRadius: 8, overflow: 'hidden' }}>
      <FilledTemplatePreview template={template} offer={offer} backgroundUrl={bg.url} />
    </div>
  );
};

/**
 * Read-only render of the alert's email — preheader/subject/sender/body copy plus whichever assets the
 * caller passes in. Used as `AlertDialog`'s always-available "Email Preview" side panel, passed only
 * offers whose asset has been approved so far (so it visibly builds up as the user approves each one).
 * When `onReorderOtherOffers` is supplied, the non-featured assets can be drag-reordered in place.
 */
export const AlertEmailPreview = ({ alert, featuredOffer, otherOffers, template, accountName, bgFor, onReorderOtherOffers }: AlertEmailPreviewProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragHandlers = (index: number) => ({
    onDragStart: (e: DragEvent) => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragOverIndex(index); },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return; }
      const next = [...otherOffers];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      onReorderOtherOffers?.(next);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    onDragEnd: () => { setDragIndex(null); setDragOverIndex(null); },
  });

  return (
  <div style={{ background: '#ffffff', borderRadius: 8, padding: '20px 20px 32px', width: '100%', maxWidth: 520, margin: '0 auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
    <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
      {alert.preheader}
    </p>
    <h1 style={{ margin: '6px 0 12px', fontSize: 18, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.3 }}>
      {alert.subject}
    </h1>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#473bab', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
        CI
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Constellation Insights</p>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>by {accountName}</p>
      </div>
    </div>

    {alert.bodyParagraphs.map((p, i) => (
      <p key={i} style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}>{p}</p>
    ))}
    <p style={{ margin: '0 0 20px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#1f1d25', letterSpacing: '0.17px' }}>{alert.vin}</p>

    <div style={{ marginBottom: 16 }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
        The recommended monthly payment for this YMMT to dominate this market is:
      </p>
      {featuredOffer && template ? renderAsset(featuredOffer, template, bgFor) : (
        <div
          style={{
            width: '100%', aspectRatio: template ? `${template.width} / ${template.height}` : '1 / 1',
            borderRadius: 8, background: '#1f1d25', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box',
          }}
        >
          <span style={{ color: '#ffffff', opacity: 0.8, fontSize: 13, fontFamily: 'Roboto, sans-serif', textAlign: 'center', lineHeight: 1.4 }}>
            Approved assets will be added to the email.
          </span>
        </div>
      )}
    </div>

    <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'default', marginBottom: 20 }}>
      SEND TO MY PAID MEDIA TEAM
    </button>

    {otherOffers.length > 0 && template && (
      <>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {otherOffers.map((o, index) => onReorderOtherOffers ? (
            <div
              key={o.id}
              draggable
              {...dragHandlers(index)}
              style={{
                position: 'relative',
                borderRadius: 8,
                outline: dragOverIndex === index && dragIndex !== index ? '2px solid #473bab' : 'none',
                opacity: dragIndex === index ? 0.5 : 1,
                cursor: 'grab',
              }}
            >
              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.9)', borderRadius: 6, padding: 2 }}>
                <DragIndicator style={{ fontSize: 18, color: '#686576' }} />
              </div>
              {renderAsset(o, template, bgFor)}
            </div>
          ) : renderAsset(o, template, bgFor))}
        </div>
      </>
    )}

    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
      <PictureAsPdfOutlined style={{ fontSize: 20, color: '#be0e1c', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {accountName.replace(/\s+/g, '-')}-Competitive-Intelligence-Report.pdf
        </p>
        <p style={{ margin: 0, fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>PDF · Competitive Intelligence Report</p>
      </div>
    </div>
  </div>
  );
};
