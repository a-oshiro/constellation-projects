import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { CardViewVertical } from "@portal/components/ui/CardViewVertical";

/**
 * The card grid, drawing only the rows near the viewport.
 *
 * Why this exists: the Portal's grid is not allowed to cap what it holds. A cap
 * above a grouping makes the grouping a function of the cap — flip the sort and
 * the groups change size, which is the defect `HANDOFF-grouping.md` §3 exists to
 * prevent. So the whole library reaches the grid, and the grid is what has to be
 * cheap: grouping the root by Brands mounted 2,367 cards, 2,367 media elements
 * and 46,823 DOM nodes at once, and the browser offered to kill the page.
 *
 * The rows above and below the window are not drawn at all. Two spacers stand in
 * for them, so the scrollbar and every offset are exactly what they would be if
 * every card were there — nothing jumps as you scroll, and a jump to a group
 * below still lands where it should.
 *
 * This is only sound because **every card is the same height**. The asset name
 * reserves its three lines whether or not it uses them, which is what makes a
 * row's height a constant rather than a thing to measure per row.
 */

/** Rows to draw beyond the viewport on each side, so a fast scroll does not
 *  reach the edge of the drawn window before the next measurement lands. */
const OVERSCAN_ROWS = 3;

/** Until a real row has been measured: one card, plus the grid's 20px gap. */
const ROW_FALLBACK = 384;

/** Drawn before anything has been measured — enough to fill any first screen,
 *  so the page is never briefly empty. */
const FIRST_DRAW = 40;

export function WindowedCardGrid<T>({
  items, renderItem, scrollerRef,
}: {
  items: readonly T[];
  renderItem: (item: T) => ReactNode;
  scrollerRef: RefObject<HTMLDivElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(1);
  const [rowH, setRowH] = useState(ROW_FALLBACK);
  const [range, setRange] = useState({ start: 0, end: FIRST_DRAW });

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let timer = 0;

    const read = () => {
      const wrap = wrapRef.current;
      const grid = gridRef.current;
      if (!wrap || !grid) return;

      /* Columns and row height come off the real grid rather than a constant:
       * the tracks are `auto-fill minmax(240px, 1fr)`, so the count changes
       * with the pane and nothing here should have to know the numbers. */
      const tracks = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
      const firstCard = grid.firstElementChild as HTMLElement | null;
      const height = firstCard ? firstCard.getBoundingClientRect().height + 20 : 0;
      const nextCols = Math.max(1, tracks);
      const nextRowH = height > 1 ? height : rowH;
      if (nextCols !== cols) setCols(nextCols);
      if (Math.abs(nextRowH - rowH) > 1) setRowH(nextRowH);

      /* Where this grid starts inside the scroller's content. The spacers keep
       * the wrapper's own height constant, so this does not move as the window
       * slides — which is what stops the measurement feeding back into itself. */
      const top = wrap.getBoundingClientRect().top
        - scroller.getBoundingClientRect().top + scroller.scrollTop;

      const rows = Math.ceil(items.length / nextCols);
      const from = Math.floor((scroller.scrollTop - top) / nextRowH) - OVERSCAN_ROWS;
      const to = Math.ceil(
        (scroller.scrollTop + scroller.clientHeight - top) / nextRowH,
      ) + OVERSCAN_ROWS;

      const start = Math.max(0, Math.min(from, rows - 1)) * nextCols;
      const end = Math.max(0, Math.min(to, rows)) * nextCols;
      setRange((prev) => {
        if (prev.start === start && prev.end === end) return prev;
        /* Drawing different rows moves this grid's own contents, and every
         * grid below it — so one pass is not enough after a jump. Read again
         * once the change has landed; it converges, because a pass that
         * changes nothing schedules nothing. */
        later();
        return { start, end };
      });
    };

    /** Coalesced, and deliberately not an IntersectionObserver or a rAF: both
     *  ride the frame lifecycle, which does not run in a tab the browser is not
     *  painting. A timer runs either way. */
    const later = () => {
      if (timer) return;
      timer = window.setTimeout(() => { timer = 0; read(); }, 50);
    };

    read();
    scroller.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    return () => {
      scroller.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      if (timer) clearTimeout(timer);
    };
  }, [items.length, scrollerRef, cols, rowH]);

  const rows = Math.ceil(items.length / cols);
  const firstRow = Math.floor(range.start / cols);
  const lastRow = Math.ceil(range.end / cols);
  const above = firstRow * rowH;
  const below = Math.max(0, (rows - lastRow) * rowH);

  return (
    <div ref={wrapRef}>
      {above > 0 && <div style={{ height: above }} aria-hidden />}
      <CardViewVertical ref={gridRef}>
        {items.slice(range.start, range.end).map(renderItem)}
      </CardViewVertical>
      {below > 0 && <div style={{ height: below }} aria-hidden />}
    </div>
  );
}
