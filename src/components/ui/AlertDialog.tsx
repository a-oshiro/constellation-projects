import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Close, HistoryOutlined, PictureAsPdfOutlined, OpenInNew, Check, Replay, Send } from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertStatus, Offer } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { formatRelativeTime } from '../../utils/relativeTime';

const ACTION_LABEL: Record<AlertActivityEntry['action'], string> = {
  generated: 'Generated',
  rebuilt: 'Rebuilt',
  rejected: 'Rejected',
  approved: 'Approved',
  sent: 'Sent',
};

function actionMessage(entry: AlertActivityEntry): string {
  const by = entry.actorEmail ?? entry.actorName;
  return `${ACTION_LABEL[entry.action]} ${formatRelativeTime(entry.timestamp)} by ${by}`;
}

const CTA_CYCLE = ['Shop Now', 'Get Offer', 'Learn More'];

/** Social-campaign copy for the feed table — generated from real offer data (this project only ever has Lease offers). */
function getFeedCopy(offer: Offer, accountName: string, index: number) {
  const lease = offer.offerTypes.find((t) => t.type === 'Lease');
  const payment = lease && 'monthlyPayment' in lease ? lease.monthlyPayment : undefined;
  const term = lease && 'term' in lease ? lease.term : 36;
  const dueAtSigning = lease && 'totalDueAtSigning' in lease ? lease.totalDueAtSigning : undefined;
  const primaryText = `Lease the ${offer.vehicleName} for $${payment}/mo for ${term} months${dueAtSigning ? ` with $${dueAtSigning.toLocaleString()} due at signing` : ''}. Offer available at ${accountName}.`;
  const headline = `${offer.year} BMW ${offer.model} - Lease Offer`;
  return { cta: CTA_CYCLE[index % CTA_CYCLE.length], primaryText, headline };
}

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px',
};

const PaneTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
    <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
      {children}
    </span>
  </div>
);

interface OfferPriceCardProps {
  offer: Offer;
  large?: boolean;
}

const OfferPriceCard = ({ offer, large }: OfferPriceCardProps) => {
  const lease = offer.offerTypes.find((t) => t.type === 'Lease');
  const payment = lease && 'monthlyPayment' in lease ? lease.monthlyPayment : undefined;
  const term = lease && 'term' in lease ? lease.term : 36;

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', background: '#1f1d25', flexShrink: 0, width: large ? '100%' : undefined }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#2c2a33' }}>
        <img src={offer.imageUrl} alt={offer.vehicleName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ padding: large ? '10px 12px' : '6px 8px' }}>
        <p style={{ margin: 0, color: '#ffffff', fontFamily: 'Roboto, sans-serif', fontSize: large ? 12 : 10, fontWeight: 500, letterSpacing: '0.4px' }}>
          LEASE THE {offer.vehicleName.toUpperCase()}
        </p>
        <p style={{ margin: '2px 0 0', color: '#ffffff', fontFamily: 'Roboto, sans-serif', fontSize: large ? 28 : 18, fontWeight: 700, lineHeight: 1.1 }}>
          ${payment ?? '—'}
        </p>
        <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontFamily: 'Roboto, sans-serif', fontSize: 9, letterSpacing: '0.2px' }}>
          Per month for {term ?? 36} months due at signing, security deposit waived
        </p>
      </div>
    </div>
  );
};

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const { offers, currentProject, moveAlert } = useProject();
  const [showHistory, setShowHistory] = useState(false);

  const handleAction = (newStatus: AlertStatus) => {
    moveAlert(alert.id, newStatus);
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOffer = findOffer(alert.featuredOfferId);
  const otherOffers = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));
  const rowOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;

  const template = currentProject.templates[0];
  const background = currentProject.backgrounds[0];

  const lastEntry = alert.activity[alert.activity.length - 1];
  const historyEntries = [...alert.activity].reverse();

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }}
      />
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
          {lastEntry && (
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
              {actionMessage(lastEntry)}
            </span>
          )}
          <IconButton size="small" onClick={() => setShowHistory((v) => !v)} sx={{ padding: '5px', background: showHistory ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <HistoryOutlined style={{ fontSize: 20, color: showHistory ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Email preview */}
          <div style={{ width: 540, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PaneTitle>Email</PaneTitle>
            <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F6', padding: 16 }}>
              <div style={{ background: '#ffffff', borderRadius: 8, padding: '20px 20px 32px' }}>
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
                    <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>by {currentProject.accountName}</p>
                  </div>
                </div>

                {alert.bodyParagraphs.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}>
                    {p}
                  </p>
                ))}
                <p style={{ margin: '0 0 20px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#1f1d25', letterSpacing: '0.17px' }}>
                  {alert.vin}
                </p>

                {featuredOffer && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                      The recommended monthly payment for this YMMT to dominate this market is:
                    </p>
                    <OfferPriceCard offer={featuredOffer} large />
                  </div>
                )}

                <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'pointer', marginBottom: 20 }}>
                  SEND TO MY PAID MEDIA TEAM
                </button>

                {otherOffers.length > 0 && (
                  <>
                    <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                      These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {otherOffers.map((o) => <OfferPriceCard key={o.id} offer={o} />)}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
                  <PictureAsPdfOutlined style={{ fontSize: 20, color: '#be0e1c', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentProject.accountName.replace(/\s+/g, '-')}-Competitive-Intelligence-Report.pdf
                    </p>
                    <p style={{ margin: 0, fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>PDF · Competitive Intelligence Report</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feed table */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PaneTitle>Feed</PaneTitle>
            <div style={{ flex: 1, overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  {[
                    { label: 'Asset Name', width: 240 },
                    { label: 'Year', width: 64 },
                    { label: 'vehicle_1_url', width: 280 },
                    { label: 'Primary Asset', width: 96 },
                    { label: 'Carousel 2', width: 96 },
                    { label: 'Carousel 3', width: 96 },
                    { label: 'Carousel 4', width: 96 },
                    { label: 'Call to Action', width: 120 },
                    { label: 'Primary Text', width: 320 },
                    { label: 'Headline 1', width: 200 },
                  ].map((col) => (
                    <th
                      key={col.label}
                      style={{
                        position: 'sticky', top: 0, background: '#fafafa', zIndex: 1,
                        width: col.width, minWidth: col.width, maxWidth: col.width,
                        textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.08)',
                        fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25',
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowOffers.map((offer, index) => {
                  const assetName = template ? `${offer.vehicleName}_${template.width} x ${template.height}_BG1` : offer.vehicleName;
                  const modelParam = encodeURIComponent(offer.model.replace(/\s+/g, '+'));
                  const url = `https://www.bmwofseattle.com/new-inventory/index.htm?model=${modelParam}`;
                  const { cta, primaryText, headline } = getFeedCopy(offer, currentProject.accountName, index);
                  return (
                    <tr key={offer.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {assetName}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {offer.year}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <a href={url} target="_blank" rel="noreferrer" style={{ color: '#473bab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</a>
                          <OpenInNew style={{ fontSize: 13, color: '#686576', flexShrink: 0 }} />
                        </span>
                      </td>
                      <td style={{ padding: 8 }}>
                        {template && background ? (
                          <div style={{ width: 64, height: 64, borderRadius: 4, overflow: 'hidden', position: 'relative', background: '#f0f2f4' }}>
                            <FilledTemplatePreview template={template} offer={offer} backgroundUrl={background.url} />
                          </div>
                        ) : null}
                      </td>
                      <td style={{ padding: 8 }} />
                      <td style={{ padding: 8 }} />
                      <td style={{ padding: 8 }} />
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {cta}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', lineHeight: 1.4 }}>
                        {primaryText}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        {headline}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Activity history */}
          {showHistory && (
            <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Alert Activity History</span>
                <IconButton size="small" onClick={() => setShowHistory(false)} sx={{ padding: '4px' }}>
                  <Close style={{ fontSize: 16, color: '#686576' }} />
                </IconButton>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {historyEntries.map((entry) => (
                  <div key={entry.id}>
                    <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
                      {formatRelativeTime(entry.timestamp)}
                    </p>
                    <p style={{ margin: '2px 0 4px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
                      {ACTION_LABEL[entry.action]}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {entry.actorAvatar && (
                        <img src={entry.actorAvatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                      )}
                      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
                        by {entry.actorEmail ?? entry.actorName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — actions vary by the alert's current lifecycle status */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: '8px 12px 12px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
          {alert.status === 'generated' && (
            <>
              <button onClick={() => handleAction('rejected')} style={{ ...footerButtonBase, background: '#d2323f', color: '#ffffff' }}>
                <Close style={{ fontSize: 18 }} />
                Reject
              </button>
              <button onClick={() => handleAction('approved')} style={{ ...footerButtonBase, background: '#4caf50', color: '#ffffff' }}>
                <Check style={{ fontSize: 18 }} />
                Approve
              </button>
            </>
          )}
          {alert.status === 'rejected' && (
            <button onClick={() => handleAction('generated')} style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff' }}>
              <Replay style={{ fontSize: 18 }} />
              Rebuild
            </button>
          )}
          {alert.status === 'approved' && (
            <button onClick={() => handleAction('sent')} style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff' }}>
              <Send style={{ fontSize: 16 }} />
              Send
            </button>
          )}
          {alert.status === 'sent' && (
            <button onClick={onClose} style={{ ...footerButtonBase, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)' }}>
              Close
            </button>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
};
