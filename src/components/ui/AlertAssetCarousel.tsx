import type { ReactNode } from 'react';
import type { Background, Offer, Template } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';

const LARGE_SIZE = 420;
const THUMB_SIZE = 64;

interface AlertAssetCarouselProps {
  /** Every asset currently visible in the carousel, in email order. */
  offers: Offer[];
  selectedOfferId: string | null;
  onSelect: (offerId: string) => void;
  template: Template;
  bgFor: (offer: Offer) => Background | undefined;
  /** Renders the large preview's contents for the selected offer — the caller supplies this so the large
   * tile can still carry comment pins, QC tags, and the approve/reject controls, exactly like the asset
   * grid tile did before. */
  renderLarge: (offer: Offer) => ReactNode;
}

/**
 * Asset Review's canvas: one large (420x420) preview of the selected offer's asset, with a horizontally
 * scrollable thumbnail strip below it — one thumbnail per visible offer — so the user can switch which
 * asset the large preview shows without leaving the canvas.
 */
export const AlertAssetCarousel = ({ offers, selectedOfferId, onSelect, template, bgFor, renderLarge }: AlertAssetCarouselProps) => {
  const selected = offers.find((o) => o.id === selectedOfferId) ?? offers[0];
  // Fit within a 420-max bounding box while preserving the template's own aspect ratio, same approach as
  // the full-screen AlertAssetPreviewModal, rather than forcing a hard square that would crop/stretch it.
  const ratio = template.width / template.height;
  const boxWidth = ratio >= 1 ? LARGE_SIZE : LARGE_SIZE * ratio;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {selected && (
        <div style={{ position: 'relative', width: boxWidth, aspectRatio: `${template.width} / ${template.height}`, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
          {renderLarge(selected)}
        </div>
      )}

      {offers.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', width: '100%', padding: '4px 2px' }}>
          {offers.map((offer) => {
            const bg = bgFor(offer);
            const isSelected = offer.id === selected?.id;
            const thumbWidth = ratio >= 1 ? THUMB_SIZE : THUMB_SIZE * ratio;
            return (
              <button
                key={offer.id}
                onClick={() => onSelect(offer.id)}
                style={{
                  width: thumbWidth, aspectRatio: `${template.width} / ${template.height}`, flexShrink: 0, padding: 0, cursor: 'pointer',
                  borderRadius: 6, overflow: 'hidden', position: 'relative',
                  border: isSelected ? '2px solid #473bab' : '2px solid transparent',
                  boxShadow: '0px 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                {bg && <FilledTemplatePreview template={template} offer={offer} backgroundUrl={bg.url} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
