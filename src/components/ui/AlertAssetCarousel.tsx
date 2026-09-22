import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { Cancel, CheckCircle, ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { Offer, ReviewStatus, Template } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';

/**
 * Horizontal strip of 100x100 thumbnails, one per offer in the alert — click to change which asset is
 * shown at full size in AlertAssetFocusView. Unlike the focused asset (which shows no colored
 * overlay/outline — that state is read from the AssetStatusBadge instead), a reviewed thumbnail gets a
 * 2px colored outline, a matching color tint, and a small check/cancel badge in its bottom-right corner,
 * so review state reads at a glance across every asset without opening each one.
 *
 * The strip isn't clamped to the focused asset's width: it fills up to the available canvas width,
 * centering itself (and its thumbnails) when everything fits, or filling the canvas and exposing
 * left/right arrow controls to step through the rest when it doesn't.
 */

const THUMB_SIZE = 100;
const GAP = 10;
const STEP = THUMB_SIZE + GAP;

interface AlertAssetCarouselProps {
  offers: Offer[];
  template: Template;
  bgFor: (offer: Offer) => { url: string } | undefined;
  focusedOfferId: string | null;
  onSelect: (offerId: string) => void;
  reviewFor: (offerId: string) => ReviewStatus;
}

export const AlertAssetCarousel = ({ offers, template, bgFor, focusedOfferId, onSelect, reviewFor }: AlertAssetCarouselProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => setAvailableWidth(el.clientWidth);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  const contentWidth = offers.length > 0 ? offers.length * STEP - GAP : 0;
  const overflowing = contentWidth > availableWidth && availableWidth > 0;
  const maxOffset = Math.max(0, contentWidth - availableWidth);

  useEffect(() => {
    setScrollOffset((v) => Math.min(v, maxOffset));
  }, [maxOffset]);

  if (offers.length <= 1) return null;

  const canScrollLeft = overflowing && scrollOffset > 0;
  const canScrollRight = overflowing && scrollOffset < maxOffset;
  const scrollBy = (delta: number) => setScrollOffset((v) => Math.min(maxOffset, Math.max(0, v + delta)));

  return (
    <div ref={outerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          width: '100%', overflow: 'hidden',
          display: 'flex', justifyContent: overflowing ? 'flex-start' : 'center',
        }}
      >
        <div
          style={{
            display: 'flex', gap: GAP, flexShrink: 0,
            transform: overflowing ? `translateX(-${scrollOffset}px)` : undefined,
            transition: 'transform 0.2s ease',
          }}
        >
          {offers.map((offer) => {
            const bg = bgFor(offer);
            if (!bg) return null;
            const isFocused = offer.id === focusedOfferId;
            const status = reviewFor(offer.id);
            const reviewColor = status === 'approved' ? '#4caf50' : status === 'rejected' ? '#be0e1c' : undefined;
            const ringColor = reviewColor ?? (isFocused ? '#473bab' : undefined);

            return (
              <button
                key={offer.id}
                onClick={() => onSelect(offer.id)}
                title={offer.vehicleName}
                style={{
                  position: 'relative', flexShrink: 0, width: THUMB_SIZE, height: THUMB_SIZE, padding: 0, cursor: 'pointer',
                  border: 'none', borderRadius: 8, overflow: 'hidden', background: '#f0f2f4',
                  boxShadow: ringColor ? `inset 0 0 0 2px ${ringColor}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                }}
              >
                <FilledTemplatePreview template={template} offer={offer} backgroundUrl={bg.url} />
                {reviewColor && (
                  <div style={{ position: 'absolute', inset: 0, background: status === 'approved' ? 'rgba(76,175,80,0.22)' : 'rgba(190,14,28,0.22)', pointerEvents: 'none' }} />
                )}
                {status === 'approved' && (
                  <CheckCircle style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 18, color: '#4caf50', background: '#ffffff', borderRadius: '50%' }} />
                )}
                {status === 'rejected' && (
                  <Cancel style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 18, color: '#be0e1c', background: '#ffffff', borderRadius: '50%' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {overflowing && (
        <>
          <IconButton
            size="small"
            disabled={!canScrollLeft}
            onClick={() => scrollBy(-STEP)}
            sx={{
              position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 28, height: 28, background: 'rgba(255,255,255,0.92)', boxShadow: '0px 1px 4px rgba(0,0,0,0.2)',
              opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? 'auto' : 'none',
              '&:hover': { background: '#ffffff' },
            }}
          >
            <ChevronLeft style={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            disabled={!canScrollRight}
            onClick={() => scrollBy(STEP)}
            sx={{
              position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
              width: 28, height: 28, background: 'rgba(255,255,255,0.92)', boxShadow: '0px 1px 4px rgba(0,0,0,0.2)',
              opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? 'auto' : 'none',
              '&:hover': { background: '#ffffff' },
            }}
          >
            <ChevronRight style={{ fontSize: 18 }} />
          </IconButton>
        </>
      )}
    </div>
  );
};
