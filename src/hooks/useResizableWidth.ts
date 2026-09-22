import { useEffect, useRef, useState } from 'react';

/**
 * A panel width that starts at `defaultWidth` and keeps tracking it (e.g. as the responsive default
 * changes with viewport size) until the user drags the returned resize handle themselves, at which point
 * it's clamped to [min, max] and stays under manual control for the rest of the panel's lifetime.
 */
export function useResizableWidth(defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState(defaultWidth);
  const manualRef = useRef(false);

  useEffect(() => {
    if (!manualRef.current) setWidth(defaultWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultWidth]);

  const onResizeHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    manualRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      // The handle sits on the panel's left edge (the panel itself is pinned to the dialog's right edge),
      // so dragging left (negative clientX delta) should widen the panel.
      const delta = startX - ev.clientX;
      setWidth(Math.min(max, Math.max(min, startWidth + delta)));
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return { width, onResizeHandleMouseDown };
}
