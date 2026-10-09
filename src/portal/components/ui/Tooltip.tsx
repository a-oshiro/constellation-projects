// Tooltip — the dark label that appears above a control on hover.
//
// Spec from the Figma `<Tooltip>` component: #616161 body, 4px radius,
// 4/8 padding, 10px white text on a 14px line, and a 12x6 arrow underneath.
// Every tooltip in the file sits ABOVE its target with the arrow pointing
// down, so there is no placement prop — one shape, one direction.
//
// Positioned `fixed` off the trigger's rect rather than absolutely inside it:
// the alerts board scrolls horizontally, and an absolute tooltip would be
// clipped by that scroll container.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Hover dwell before a tooltip opens — long enough that crossing a card's
 *  chips doesn't flash a label at every step. */
const OPEN_DELAY_MS = 300;

export function Tooltip({
  label,
  children,
  className = "",
  delayMs = OPEN_DELAY_MS,
}: {
  /** Omit (or pass empty) to render the children with no tooltip at all. */
  label?: string;
  children: ReactNode;
  /** Applied to the inline wrapper that owns the hover. */
  className?: string;
  /** Hover dwell before opening. Keyboard focus opens immediately. */
  delayMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const el = ref.current;
    if (!el || !label) return;
    const r = el.getBoundingClientRect();
    setAt({ top: r.top - 2, left: r.left + r.width / 2 });
  }, [label]);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setAt(null);
  }, []);

  const show = useCallback(() => {
    if (!label) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(place, delayMs);
  }, [delayMs, label, place]);

  // Never leave a pending open behind on unmount.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      ref={ref}
      className={`inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={place}
      onBlur={hide}
    >
      {children}
      {at && label && (
        <span
          role="tooltip"
          style={{ top: at.top, left: at.left, transform: "translate(-50%, -100%)" }}
          className="fixed z-[9999] pointer-events-none flex flex-col items-center"
        >
          <span className="bg-[#616161] text-white text-[10px] leading-[14px] px-2 py-1 rounded-[4px] whitespace-nowrap">
            {label}
          </span>
          <svg width="12" height="6" viewBox="0 0 12 6" aria-hidden="true" className="block">
            <path d="M0 0 L6 6 L12 0 Z" fill="#616161" />
          </svg>
        </span>
      )}
    </span>
  );
}
