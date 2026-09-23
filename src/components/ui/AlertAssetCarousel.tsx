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
 * Every group is laid out side by side in one continuous strip that's natively horizontally scrollable
 * (trackpad/wheel/drag all just work, no scrollbar shown — see the `.hide-scrollbar` class), filling the
 * full canvas width and centering itself when everything fits. The arrow buttons step whole groups at a
 * time, aligning the next/previous group's left edge with the carousel's own left edge; focus moving
 * (keyboard arrows / the large flanking chevrons beside the focused asset) auto-scrolls the strip to keep
 * the newly-focused thumbnail in view.
 */

const GROUP_GAP = 28;
const ITEM_GAP = 10;
const THUMB_SIZE = 100;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [availableWidth, setAvailableWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setContentWidth(el.scrollWidth);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [groups]);

  // Native scroll drives `scrollLeft` state — used only to read the current position (for the arrow
  // buttons' enabled/disabled state), never to set it; actual scrolling is the browser's own (wheel,
  // trackpad, drag), plus the imperative scrollTo calls below.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const overflowing = contentWidth > availableWidth && availableWidth > 0;
  const maxScrollLeft = Math.max(0, contentWidth - availableWidth);

  // Keep the focused thumbnail in view whenever focus changes — combined with the infinite-loop focus
  // stepping in AlertDialog, moving past the last asset jumps back to the first and the strip scrolls with it.
  useEffect(() => {
    const container = scrollRef.current;
    if (!focusedKey || !overflowing || !container) return;
    const el = entryRefs.current.get(focusedKey);
    if (!el) return;
    const entryLeft = el.offsetLeft;
    const entryRight = entryLeft + el.offsetWidth;
    const current = container.scrollLeft;
    let target: number | undefined;
    if (entryLeft < current) target = Math.max(0, entryLeft - 16);
    else if (entryRight > current + availableWidth) target = Math.min(maxScrollLeft, entryRight - availableWidth + 16);
    if (target !== undefined) container.scrollTo({ left: target, behavior: 'smooth' });
  }, [focusedKey, overflowing, availableWidth, maxScrollLeft]);

  const totalEntries = groups.reduce((n, g) => n + g.entries.length, 0);
  if (totalEntries <= 1) return null;

  const canScrollLeft = overflowing && scrollLeft > 0;
  const canScrollRight = overflowing && scrollLeft < maxScrollLeft;

  // Steps a whole group at a time, aligning that group's own left edge with the carousel's left edge —
  // rather than an arbitrary pixel nudge, so a click always reveals the next/previous group in full.
  const scrollToAdjacentGroup = (direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;
    const groupLefts = groups
      .map((g) => groupRefs.current.get(g.label)?.offsetLeft)
      .filter((n): n is number => n !== undefined)
      .sort((a, b) => a - b);
    const current = container.scrollLeft;
    let target: number;
    if (direction === 1) {
      target = groupLefts.find((left) => left > current + 1) ?? maxScrollLeft;
    } else {
      target = [...groupLefts].reverse().find((left) => left < current - 1) ?? 0;
    }
    container.scrollTo({ left: Math.min(Math.max(0, target), maxScrollLeft), behavior: 'smooth' });
  };

  return (
    <div ref={outerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        ref={scrollRef}
        className="hide-scrollbar"
        style={{
          width: '100%', overflowX: 'auto', overflowY: 'hidden',
          display: 'flex', gap: GROUP_GAP, justifyContent: overflowing ? 'flex-start' : 'center',
        }}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            ref={(el) => {
              if (el) groupRefs.current.set(group.label, el);
              else groupRefs.current.delete(group.label);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}
          >
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

      {overflowing && (
        <>
          <IconButton
            size="small"
            disabled={!canScrollLeft}
            onClick={() => scrollToAdjacentGroup(-1)}
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
            onClick={() => scrollToAdjacentGroup(1)}
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
