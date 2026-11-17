import { useState, useSyncExternalStore } from 'react';
import type { ReactNode, TransitionEvent } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
  );
}

/**
 * Smoothly expands and collapses its content (accordion bodies). The height animates through a CSS
 * grid row going 0fr <-> 1fr (`.expandable` in index.css): the browser tracks the content's real height
 * itself, so no JavaScript measures or runs per frame. The content stays mounted; while collapsed it's
 * `inert` (no focus, hidden from screen readers) and, once the collapse has finished, skipped by layout
 * and paint via `content-visibility: hidden`.
 */
export function Expandable({ open, children }: { open: boolean; children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  // Whether the transition into the current state has finished (no transition runs with reduced motion).
  const [settled, setSettled] = useState(true);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setSettled(reducedMotion);
  }
  const state = !settled ? 'animating' : open ? 'open' : 'closed';

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.propertyName === 'grid-template-rows') setSettled(true);
  };

  return (
    <div className="expandable" data-open={open} data-state={state} inert={!open} onTransitionEnd={handleTransitionEnd}>
      <div>{children}</div>
    </div>
  );
}
