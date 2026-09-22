import { useRef } from 'react';
import { IconButton } from '@mui/material';
import { Close, PictureAsPdfOutlined } from '@mui/icons-material';
import type { Background, EmailCommentAnchor, Offer, ReviewStatus, Template } from '../../data/types';
import { HighlightableParagraph } from './AlertHighlightableText';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { AlertRecipientsAccordion } from './AlertRecipientsAccordion';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { PanelResizeHandle } from './PanelResizeHandle';

/**
 * Right panel showing how the composed email actually looks — hidden by default, toggled via the mail
 * icon in the icon cluster. Only approved offers' assets appear here (progressively built as assets are
 * approved); rejected ones are excluded, and the email shows no assets at all until at least one is
 * approved. Recipients management is folded into a collapsible accordion at the top instead of living in
 * its own panel. Asset cards here are a read-only preview (FilledTemplatePreview, not the commentable
 * version) — commenting on an asset happens in the main asset-focus view, not from this preview. Approving
 * or rejecting the email itself happens from the dialog's footer, not from this panel — the header chip
 * here is just a read-only reflection of that status.
 */

const STATUS_CHIP_STYLE: Record<ReviewStatus, { background: string; color: string; label: string }> = {
  pending: { background: 'rgba(17,16,20,0.06)', color: '#686576', label: 'Pending review' },
  approved: { background: '#edf7ed', color: '#1b5e20', label: 'Approved' },
  rejected: { background: '#FBEFF0', color: '#be0e1c', label: 'Rejected' },
};

interface AlertEmailPreviewPanelProps {
  subject: string;
  preheader: string;
  bodyParagraphs: string[];
  vin: string;
  accountName: string;
  featuredOffer?: Offer;
  otherOffers: Offer[];
  template?: Template;
  hasBackgrounds: boolean;
  bgFor: (offer: Offer) => Background | undefined;
  isOfferApproved: (offerId: string) => boolean;
  recipients: string[];
  onRecipientsChange: (next: string[]) => void;
  emailBodyRef: React.RefObject<HTMLDivElement | null>;
  onEmailMouseUp: () => void;
  anchorsForParagraph: (index: number) => { anchor: EmailCommentAnchor; commentId: string }[];
  activeAnchorId: string | null;
  onHighlightClick: (commentId: string) => void;
  registerAnchorRef: (id: string, el: HTMLElement | null) => void;
  anchorRefsMap: React.RefObject<Map<string, HTMLElement>>;
  showComments: boolean;
  showResolved: boolean;
  commentEntries: ColumnEntry[];
  registerCommentRef: (id: string, el: HTMLDivElement | null) => void;
  pendingAnchor?: EmailCommentAnchor;
  onCancelPendingComment: () => void;
  onSendPendingComment: (text: string, mentionedNames: string[]) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onJumpToAnchor: (commentId: string) => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onClose: () => void;
  panelWidth: number;
  onResizeHandleMouseDown: (e: React.MouseEvent) => void;
  emailStatus: ReviewStatus;
}

/** Read-only asset card for the composed-email preview — no comment/approve affordances, just a static render. */
const EmailAssetCard = ({ offer, template, bg }: { offer: Offer; template: Template; bg: Background }) => (
  <div style={{ width: '100%', aspectRatio: `${template.width} / ${template.height}`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
    <FilledTemplatePreview template={template} offer={offer} backgroundUrl={bg.url} />
  </div>
);

export const AlertEmailPreviewPanel = ({
  subject, preheader, bodyParagraphs, vin, accountName, featuredOffer, otherOffers, template, hasBackgrounds, bgFor,
  isOfferApproved, recipients, onRecipientsChange, emailBodyRef, onEmailMouseUp, anchorsForParagraph, activeAnchorId,
  onHighlightClick, registerAnchorRef, anchorRefsMap, showComments, showResolved, commentEntries, registerCommentRef,
  pendingAnchor, onCancelPendingComment, onSendPendingComment, onToggleResolved, onDeleteComment, onJumpToAnchor,
  onReply, onToggleReaction, onClose, panelWidth, onResizeHandleMouseDown, emailStatus,
}: AlertEmailPreviewPanelProps) => {
  const cardWidth = panelWidth - 32;
  const approvedOtherOffers = otherOffers.filter((o) => isOfferApproved(o.id));
  const contentRef = useRef<HTMLDivElement>(null);
  const statusChip = STATUS_CHIP_STYLE[emailStatus];

  return (
    <div style={{ position: 'relative', width: panelWidth, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PanelResizeHandle onMouseDown={onResizeHandleMouseDown} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Email Preview</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, letterSpacing: '0.4px',
            background: statusChip.background, color: statusChip.color, borderRadius: 100, padding: '3px 10px',
          }}>
            {statusChip.label}
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
            <Close style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, position: 'relative' }}>
        <AlertRecipientsAccordion recipients={recipients} onChange={onRecipientsChange} />

        <div ref={contentRef} style={{ position: 'relative', width: cardWidth }}>
          <div
            ref={emailBodyRef}
            onMouseUp={onEmailMouseUp}
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '20px 20px 32px', width: cardWidth, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'fit-content' }}
          >
            <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
              {preheader}
            </p>
            <h1 style={{ margin: '6px 0 12px', fontSize: 18, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.3 }}>
              {subject}
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

            {bodyParagraphs.map((p, i) => (
              <HighlightableParagraph
                key={i}
                text={p}
                paragraphIndex={i}
                anchors={anchorsForParagraph(i)}
                activeAnchorId={activeAnchorId}
                onHighlightClick={onHighlightClick}
                registerAnchorRef={registerAnchorRef}
                style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}
              />
            ))}
            <HighlightableParagraph
              text={vin}
              paragraphIndex={bodyParagraphs.length}
              anchors={anchorsForParagraph(bodyParagraphs.length)}
              activeAnchorId={activeAnchorId}
              onHighlightClick={onHighlightClick}
              registerAnchorRef={registerAnchorRef}
              style={{ margin: '0 0 20px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#1f1d25', letterSpacing: '0.17px' }}
            />

            {featuredOffer && template && hasBackgrounds && isOfferApproved(featuredOffer.id) && (() => {
              const bg = bgFor(featuredOffer);
              if (!bg) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                    The recommended monthly payment for this YMMT to dominate this market is:
                  </p>
                  <EmailAssetCard offer={featuredOffer} template={template} bg={bg} />
                </div>
              );
            })()}

            <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'pointer', marginBottom: 20 }}>
              SEND TO MY PAID MEDIA TEAM
            </button>

            {otherOffers.length > 0 && template && hasBackgrounds && (
              <>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                  These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {approvedOtherOffers.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', fontStyle: 'italic' }}>
                      No assets approved yet.
                    </p>
                  ) : (
                    approvedOtherOffers.map((offer) => {
                      const bg = bgFor(offer);
                      if (!bg) return null;
                      return <EmailAssetCard key={offer.id} offer={offer} template={template} bg={bg} />;
                    })
                  )}
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

          <FloatingCommentColumn
            entries={showComments ? commentEntries : []}
            anchorRefs={anchorRefsMap}
            containerRef={contentRef}
            left={cardWidth + 24}
            activeAnchorId={activeAnchorId}
            showResolved={showResolved}
            pendingAnchor={pendingAnchor}
            onCancelPending={onCancelPendingComment}
            onSendPending={onSendPendingComment}
            onToggleResolved={onToggleResolved}
            onDeleteComment={onDeleteComment}
            onJumpToAnchor={(c) => onJumpToAnchor(c.id)}
            registerCommentRef={registerCommentRef}
            onReply={onReply}
            onToggleReaction={onToggleReaction}
          />
        </div>
      </div>
    </div>
  );
};
