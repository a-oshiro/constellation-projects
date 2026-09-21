import { PictureAsPdfOutlined } from '@mui/icons-material';
import type { Alert, Background, Offer, Template } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';

interface AlertEmailPreviewProps {
  alert: Alert;
  /** Already filtered by the caller to only what should be visible right now (e.g. stage-2-approved offers during Review Assets, or every offer once Fully Reviewed). */
  featuredOffer?: Offer;
  otherOffers: Offer[];
  template?: Template;
  accountName: string;
  bgFor: (offer: Offer) => Background | undefined;
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
 * caller passes in. Serves two roles in `AlertDialog`: a small toggleable "Email Preview" side panel
 * during asset review (passed only stage-2-approved offers, so it visibly builds up as the user
 * approves each one), and, full-width, the main canvas once every asset is approved ("Fully Reviewed").
 */
export const AlertEmailPreview = ({ alert, featuredOffer, otherOffers, template, accountName, bgFor }: AlertEmailPreviewProps) => (
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

    {featuredOffer && template && (
      <div style={{ marginBottom: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          The recommended monthly payment for this YMMT to dominate this market is:
        </p>
        {renderAsset(featuredOffer, template, bgFor)}
      </div>
    )}

    <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'default', marginBottom: 20 }}>
      SEND TO MY PAID MEDIA TEAM
    </button>

    {otherOffers.length > 0 && template && (
      <>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {otherOffers.map((o) => renderAsset(o, template, bgFor))}
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
