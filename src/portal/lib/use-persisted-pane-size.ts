import { useEffect, useRef, useState } from "react";

/**
 * Stateful pane width that survives reloads and navigation by persisting to
 * `localStorage` under the given key. SSR-safe: starts from `defaultSize`,
 * then upgrades from `localStorage` on mount (so panes never read storage
 * during server render).
 *
 * Standard keys used across the app:
 *   - "pane:left-width"   → all left panes / sidebars
 *   - "pane:right-width"  → all right panes
 *
 * Reusing the same key from multiple pages is intentional — that's what makes
 * the resize "stick" when the user navigates between screens.
 */
export function usePersistedPaneSize(
  key: string,
  defaultSize: number,
  /**
   * Width supplied by the caller (e.g. decoded from a shared URL). When set it
   * wins over the stored value, and hydration from `localStorage` is skipped —
   * a shared layout must not be overwritten by the viewer's own last drag.
   */
  initial?: number,
): [number, (size: number) => void] {
  const [size, setSize] = useState<number>(initial ?? defaultSize);
  const hydrated = useRef(false);

  // Hydrate from localStorage on first client mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initial != null) {
      hydrated.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed) && parsed > 0) setSize(parsed);
      }
    } catch {
      // localStorage unavailable / blocked — keep the default
    }
    hydrated.current = true;
  }, [key, initial]);

  function persist(next: number) {
    setSize(next);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, String(Math.round(next)));
    } catch {
      // ignore
    }
  }

  return [size, persist];
}
