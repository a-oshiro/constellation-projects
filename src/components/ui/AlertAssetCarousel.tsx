import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { Cancel, CheckCircle, ChevronLeft, ChevronRight } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import type { AlertAssetEntry } from '../../utils/overviewAssets';
import { FilledTemplatePreview } from './FilledTemplatePreview';

/**
 * Horizontal strip of thumbnails, grouped (by vehicle or by template — see AlertDialog's `groupBy`), one
 * thumbnail per asset — click to change which asset is shown at full size in AlertAssetFocusView. Unlike
 * the focused asset (which shows no colored overlay/outline — that state is read from the AssetStatusBadge
 * instead), a reviewed thumbnail gets a 2px colored outline, a matching color tint, and a small
 * check/cancel badge in its bottom-right corner, so review state reads at a glance across every asset
 * without opening each one.
 *
 * Every group is laid out side by side in one continuous horizontally-scrolling row — the strip isn't
 * clamped to the focused asset's width, it fills the full canvas width, centering itself when everything
 * fits, or filling the canvas and exposing left/right arrow controls to manually nudge the scroll when it
 * doesn't. Focus moving (keyboard arrows / the large flanking chevrons beside the focused asset) auto-
 * scrolls the strip to keep the newly-focused thumbnail in view.
 */

const GROUP_GAP = 28;
const ITEM_GAP = 10;
const THUMB_SIZE = 100;
const NUDGE = 300;

interface AlertAssetCarouselGroup {
  label: string;
  entries: AlertAssetEntry[];
}

interface AlertAssetCarouselProps {
  groups: AlertAssetCarouselGroup[];
  focusedKey: string | null;
  onSelect: (key: string) => void;
  reviewFor: (entry: AlertAssetEntry) => ReviewStatus;
}

export const AlertAssetCarousel = ({ groups, focusedKey, onSelect, reviewFor }: AlertAssetCarouselProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [availableWidth, setAvailableWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
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

  // Content width is measured (rather than computed analytically) since thumbnail width now varies per
  // entry's template aspect ratio instead of being a fixed square.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setContentWidth(el.scrollWidth);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [groups]);

  const overflowing = contentWidth > availableWidth && availableWidth > 0;
  const maxOffset = Math.max(0, contentWidth - availableWidth);

  useEffect(() => {
    setScrollOffset((v) => Math.min(v, maxOffset));
  }, [maxOffset]);

  // Keep the focused thumbnail in view whenever focus changes — combined with the infinite-loop focus
  // stepping in AlertDialog, moving past the last asset jumps back to the first and the strip scrolls with it.
  useEffect(() => {
    if (!focusedKey || !overflowing) return;
    const el = entryRefs.current.get(focusedKey);
    if (!el) return;
    const entryLeft = el.offsetLeft;
    const entryRight = entryLeft + el.offsetWidth;
    setScrollOffset((v) => {
      if (entryLeft < v) return Math.max(0, entryLeft - 16);
      if (entryRight > v + availableWidth) return Math.min(maxOffset, entryRight - availableWidth + 16);
      return v;
    });
  }, [focusedKey, overflowing, availableWidth, maxOffset]);

  const totalEntries = groups.reduce((n, g) => n + g.entries.length, 0);
  if (totalEntries <= 1) return null;

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
          ref={contentRef}
          style={{
            display: 'flex', gap: GROUP_GAP, flexShrink: 0,
            transform: overflowing ? `translateX(-${scrollOffset}px)` : undefined,
            transition: 'transform 0.2s ease',
          }}
        >
          {groups.map((group) => (
            <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', whiteSpace: 'nowrap' }}>
                {group.label}
              </span>
              <div style={{ display: 'flex', gap: ITEM_GAP }}>
                {group.entries.map((entry) => {
                  // Contain-fit within the fixed 100x100 box — the square template fills it exactly, every
                  // wider-than-tall template is capped at 100 wide with a shorter height, centered with
                  // spare white space above/below (never stretched, never cropped).
                  const scale = Math.min(THUMB_SIZE / entry.template.width, THUMB_SIZE / entry.template.height);
                  const renderedWidth = Math.round(entry.template.width * scale);
                  const renderedHeight = Math.round(entry.template.height * scale);
                  const isFocused = entry.key === focusedKey;
                  const status = reviewFor(entry);
                  const reviewColor = status === 'approved' ? '#4caf50' : status === 'rejected' ? '#be0e1c' : undefined;
                  const ringColor = reviewColor ?? (isFocused ? '#473bab' : undefined);

                  return (
                    <button
                      key={entry.key}
                      ref={(el) => {
                        if (el) entryRefs.current.set(entry.key, el);
                        else entryRefs.current.delete(entry.key);
                      }}
                      onClick={() => onSelect(entry.key)}
                      title={entry.offer.vehicleName}
                      style={{
                        position: 'relative', flexShrink: 0, width: THUMB_SIZE, height: THUMB_SIZE, padding: 0, cursor: 'pointer',
                        border: 'none', borderRadius: 8, overflow: 'hidden', background: '#ffffff',
                        boxShadow: ringColor ? `inset 0 0 0 2px ${ringColor}` : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                      }}
                    >
                      <div style={{ position: 'absolute', top: '50%', left: '50%', width: renderedWidth, height: renderedHeight, transform: 'translate(-50%, -50%)' }}>
                        <FilledTemplatePreview template={entry.template} offer={entry.offer} backgroundUrl={entry.background.url} />
                      </div>
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
          ))}
        </div>
      </div>

      {overflowing && (
        <>
          <IconButton
            size="small"
            disabled={!canScrollLeft}
            onClick={() => scrollBy(-NUDGE)}
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
            onClick={() => scrollBy(NUDGE)}
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
