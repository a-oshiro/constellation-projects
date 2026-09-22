/**
 * Thin draggable strip on a right-hand panel's left edge — grab it to resize the panel. The panel itself
 * must be `position: relative` (or otherwise establish a positioning context) for this to dock correctly.
 */
export const PanelResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    onMouseDown={onMouseDown}
    style={{ position: 'absolute', left: -5, top: 0, bottom: 0, width: 10, cursor: 'col-resize', zIndex: 20 }}
  />
);
