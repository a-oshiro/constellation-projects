// A header that scrolls off with the content, and comes back over it.
//
// The whole thing turns on one rule: it is only `sticky` once it has already
// left the screen.
//
//  · While any of it is still in view it is plain `relative` content, so
//    scrolling down carries it off the top exactly like the row below it.
//    Sticky from the start was the bug — the header pinned itself instead of
//    leaving, so the only thing that ever happened was the fade, and it read
//    as the header blinking out.
//  · Sticky is for coming BACK, not for having gone. Making it sticky the
//    moment it went past was a bug of its own: the header snapped to the top
//    of the viewport just to play its fade-out there, so the first scroll down
//    flashed it back into view. Out of sight it stays in flow, where being
//    invisible costs nothing and shows nothing.
//  · Coming back it is pinned over the content rather than re-inserted above
//    it, which would shove the row you were reading down the page. It stays
//    pinned for the length of the fade on the way out, too — otherwise the
//    fade would play off-screen and it would just vanish.
//  · It only lets go of being pinned at scrollTop 0. Anywhere else the pinned
//    position and the in-flow position are a header's height apart, so
//    swapping between them jumps — which is what made it look like it
//    disappeared just before the real header arrived. At 0 the two coincide
//    exactly, and the handoff is invisible.
//
// Because the element keeps its slot in the flow throughout, the scroller's
// height never changes and the scroll position is never disturbed.
//
// One deliberate hesitation: a header you just asked for does not leave the
// moment you nudge the list. Once it has been brought back, scrolling down
// again gives it HIDE_DELAY_MS before it goes — long enough to read a filter
// and carry on, and cancelled outright if you scroll up again inside it.

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** Ignore jitter: a trackpad reports a stream of 1–2px moves either way. */
const DIRECTION_THRESHOLD = 6;
/** Grace period before a header that was brought back leaves again. */
const HIDE_DELAY_MS = 800;
/** Matches the opacity transition below — how long it stays pinned while
 *  fading out, so the fade is actually seen. */
const FADE_MS = 200;

export function ScrollAwayHeader({
  scrollerRef, children, className = "", hold = false,
}: {
  /** The element that scrolls. The header listens to it rather than owning it,
   *  because the content below has to share the same scroller. */
  scrollerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** The surface it sits on — it overlays content when pinned, so it needs an
   *  opaque background. Defaults to white. */
  className?: string;
  /** Hold it in view whatever the scroll is doing. For a header that has
   *  become a control rather than a label: with rows selected, the bulk bar
   *  lives in here, and a bar that scrolls away takes the actions for the
   *  selection with it. */
  hold?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /** Scrolled clear of the header's own height — it is off-screen. */
  const [past, setPast] = useState(false);
  /** Brought back deliberately, by scrolling up. */
  const [pinned, setPinned] = useState(false);
  /** Mid fade-out: still pinned, so the fade happens where it can be seen. */
  const [leaving, setLeaving] = useState(false);
  const lastY = useRef(0);
  // Read inside the scroll handler, which is attached once and must not go
  // stale on every state change.
  const pinnedRef = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function cancelHide() {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = undefined;
    }

    function show() {
      cancelHide();
      pinnedRef.current = true;
      setPinned(true);
    }

    function hide() {
      cancelHide();
      // Only worth a fade if it was actually on screen.
      if (pinnedRef.current) {
        setLeaving(true);
        window.setTimeout(() => setLeaving(false), FADE_MS);
      }
      pinnedRef.current = false;
      setPinned(false);
    }

    function onScroll() {
      const y = el!.scrollTop;
      const height = ref.current?.offsetHeight ?? 0;
      const isPast = y > height;
      setPast(isPast);

      const delta = y - lastY.current;
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;
      lastY.current = y;

      // Only at the very top do the pinned and in-flow positions agree, so
      // that is the only place the swap can happen without a jump. No fade
      // here: it is already fully visible and stays that way.
      if (y <= 0) {
        cancelHide();
        pinnedRef.current = false;
        setPinned(false);
        setLeaving(false);
        return;
      }

      if (delta < 0) { show(); return; }

      // Going down. A header that is already away just stays away; one that
      // was brought back gets its grace period, started once rather than
      // restarted by every wheel tick.
      if (pinnedRef.current && hideTimer.current === undefined) {
        hideTimer.current = window.setTimeout(hide, HIDE_DELAY_MS);
      }
    }

    lastY.current = el.scrollTop;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(hideTimer.current);
    };
  }, [scrollerRef]);

  // What anything else sticking to the top of this scroller has to clear.
  // Only while pinned: in flow the header occupies real space and scrolls away
  // on its own, and a sticky row beneath simply passes under it.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const height = pinned || leaving ? (ref.current?.offsetHeight ?? 0) : 0;
    el.style.setProperty("--chrome-offset", `${height}px`);
  }, [pinned, leaving, scrollerRef]);

  // `hold` overrides the whole dance: still in flow when it has not left,
  // pinned once it has, and never faded out.
  const shown = !past || pinned || hold;

  return (
    <div
      ref={ref}
      aria-hidden={!shown}
      // z-30 in both states, not only when pinned: a section heading sticking
      // to the top of the same scroller would otherwise paint over the header
      // during the moments it is still leaving. Above it in every state, the
      // heading passes underneath, which is what leaving looks like.
      className={`${pinned || leaving || (hold && past) ? "sticky top-0" : "relative"} z-30 bg-white transition-opacity duration-200 ease-out ${
        shown ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${className}`}
    >
      {children}
    </div>
  );
}
