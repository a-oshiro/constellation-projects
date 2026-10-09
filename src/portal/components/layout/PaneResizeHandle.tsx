import { useRef } from "react";

interface PaneResizeHandleProps {
  /** Current pane size in px (controlled). */
  size: number;
  /** Called with the new size as the user drags. Persistence is the caller's job. */
  onResize: (next: number) => void;
  /**
   * Which side the pane being resized sits on. "left" = the pane is to the
   * left of the handle (dragging right grows it); "right" = the pane is to
   * the right (dragging left grows it).
   */
  side: "left" | "right";
  /** Minimum allowed size in px (default 200). */
  minSize?: number;
  /** Maximum allowed size in px (default 640). */
  maxSize?: number;
  /** Double-click on the rail. Panes that can rebalance themselves use it; the
   *  ones that can't simply leave it out. */
  onDoubleClick?: () => void;
  /** 16px rail instead of the app's 8px gutter, for a seam that IS the whole
   *  gap between two panes rather than a line inside a wider one. */
  wide?: boolean;
}

/**
 * 8 px wide invisible drag rail that sits in the gray gap between panes.
 * Mirrors the current `gap-2` spacing exactly — the gray app background
 * shows through. On hover a bright purple line runs the full height of the
 * gap to advertise the affordance; cursor switches to `col-resize`.
 */
export function PaneResizeHandle({
  size,
  onResize,
  side,
  minSize = 200,
  maxSize = 640,
  onDoubleClick,
  wide = false,
}: PaneResizeHandleProps) {
  const startX = useRef(0);
  const startSize = useRef(size);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startX.current = e.clientX;
    startSize.current = size;

    // Lock the body while dragging so iframes / hover styles don't interfere.
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handleMove(ev: MouseEvent) {
      const dx = ev.clientX - startX.current;
      const delta = side === "left" ? dx : -dx;
      const next = Math.max(minSize, Math.min(maxSize, startSize.current + delta));
      onResize(next);
    }
    function handleUp() {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(size)}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`${wide ? "w-4" : "w-2"} shrink-0 cursor-col-resize group flex items-stretch justify-center select-none`}
      title={onDoubleClick ? "Drag to resize · double-click to even out" : "Drag to resize"}
    >
      {/* Visible indicator — fades in on hover.
        *
        * Full height, and the app's bright purple: a 40px grey stub in the
        * middle of a tall gap read as a mark ON the seam rather than as the
        * seam itself, and it gave no sign of how far the thing you were about
        * to move reached. Running edge to edge, the line IS the boundary.
        * `CreateCanvas` already drew its own splitter this way — this brings
        * the shared one into line with it. */}
      <div className="w-0.5 rounded-full bg-transparent group-hover:bg-semantic-primary-light transition-colors" />
    </div>
  );
}
