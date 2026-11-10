import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DependencyList, RefObject } from 'react';

/** A run of changed text, as the boxes it occupies on screen (one per wrapped line). */
export interface MarkerItem {
  type: 'removed' | 'added';
  rects: DOMRect[];
}

/** A wrapped line of text that holds changes: its vertical center inside the scroll container's content, and what changed on it. */
export interface LineMarker {
  top: number;
  types: Array<'removed' | 'added'>;
}

/** Rects whose centers are closer than this are on the same wrapped line (lines are ≥ 20px apart). */
const SAME_LINE_PX = 10;

/** Groups the changed text's boxes by wrapped line, positioned within `container`'s scrollable content. */
export function buildLineMarkers(container: HTMLElement, items: MarkerItem[]): LineMarker[] {
  const base = container.getBoundingClientRect().top - container.scrollTop;
  const centers = items.flatMap((item) => item.rects
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ type: item.type, center: r.top + r.height / 2 - base })));
  centers.sort((a, b) => a.center - b.center);

  const markers: LineMarker[] = [];
  for (const { type, center } of centers) {
    const last = markers[markers.length - 1];
    if (last && center - last.top < SAME_LINE_PX) {
      if (!last.types.includes(type)) last.types.push(type);
    } else {
      markers.push({ top: center, types: [type] });
    }
  }
  return markers;
}

/** The boxes of every element under `container` tagged `data-diff="removed" | "added"`. */
export function collectTaggedItems(container: HTMLElement): MarkerItem[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-diff]')).map((el) => ({
    type: el.dataset.diff === 'added' ? 'added' : 'removed',
    rects: Array.from(el.getClientRects()),
  }));
}

const sameMarkers = (a: LineMarker[], b: LineMarker[]) => (
  a.length === b.length && a.every((m, i) => Math.abs(m.top - b[i].top) < 1 && m.types.join() === b[i].types.join())
);

/**
 * Measures where the changed text sits inside `containerRef` (a position:relative scroll container) and
 * returns one marker per wrapped line that holds a change. Re-measured after every render the `deps`
 * name and whenever the container resizes (text rewraps).
 */
export function useDiffMarkers(
  containerRef: RefObject<HTMLElement | null>,
  collect: (container: HTMLElement) => MarkerItem[],
  deps: DependencyList,
): LineMarker[] {
  const [markers, setMarkers] = useState<LineMarker[]>([]);
  const collectRef = useRef(collect);
  // Kept current in a layout effect (declared before the measuring one, so it runs first) rather than during render.
  useLayoutEffect(() => { collectRef.current = collect; });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const next = buildLineMarkers(container, collectRef.current(container));
    setMarkers((prev) => (sameMarkers(prev, next) ? prev : next));
  }, [containerRef]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, deps);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    // Web fonts load after first paint and change how the text wraps.
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => observer.disconnect();
  }, [containerRef, measure]);

  return markers;
}
