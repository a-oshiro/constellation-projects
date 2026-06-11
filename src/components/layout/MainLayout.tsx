import { type ReactNode, useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { LeftNav } from './LeftNav';
import { TopBar } from './TopBar';
import { TasksPanel } from './TasksPanel';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { PreviewPanel } from '../ui/PreviewPanel';
import { AdShellPanel } from '../ui/AdShellPanel';
import { AdvancedGenerationPanel } from '../ui/AdvancedGenerationPanel';
import { FilterPanel } from './FilterPanel';

// ── Resize constraints ────────────────────────────────────────────────────────
const LEFT_DEFAULT  = 280;
const LEFT_MIN      = 180;
const LEFT_MAX      = 480;
const RIGHT_DEFAULT = 320;
const RIGHT_MIN     = 220;
const RIGHT_MAX     = 560;

// ── ResizeHandle ─────────────────────────────────────────────────────────────
interface ResizeHandleProps {
  /** Called with incremental pixel delta on every mousemove while dragging. */
  onDrag: (delta: number) => void;
}

const ResizeHandle = ({ onDrag }: ResizeHandleProps) => {
  const [hovered, setHovered]   = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    let lastX = e.clientX;
    setDragging(true);
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (me: MouseEvent) => {
      const delta = me.clientX - lastX;
      lastX = me.clientX;
      onDrag(delta);
    };

    const onUp = () => {
      setDragging(false);
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [onDrag]);

  const active = hovered || dragging;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 4,
        flexShrink: 0,
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        zIndex: 20,
        alignSelf: 'stretch',
      }}
    >
      <div
        style={{
          width: 2,
          borderRadius: 1,
          background: active ? '#473bab' : 'transparent',
          transition: 'background 0.12s',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

/** Pages where the Advanced Generation panel should auto-close. */
const ADV_GEN_HIDDEN_PATHS = ['/approved', '/ads', '/campaigns'];
/** Pages where the filter panel is available. */
const FILTER_PANEL_PATHS = ['/review', '/assets', '/approved'];

const MainLayoutInner = ({ children }: { children: ReactNode }) => {
  const {
    tasksPanelOpen, closeTasksPanel, mainPanelRef,
    filterPanelOpen, closeFilterPanel,
    editingShell, closeAdShellPanel,
    advancedGenerationOpen, advancedGenerationAssets, closeAdvancedGeneration,
  } = useLayout();
  const location = useLocation();

  const [leftWidth,  setLeftWidth]  = useState(LEFT_DEFAULT);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);

  const handleLeftDrag  = useCallback((delta: number) => {
    setLeftWidth((w)  => Math.min(LEFT_MAX,  Math.max(LEFT_MIN,  w + delta)));
  }, []);
  const handleRightDrag = useCallback((delta: number) => {
    setRightWidth((w) => Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, w - delta)));
  }, []);

  const hasRightPanel = !!editingShell || advancedGenerationOpen;

  // Close the Ad Shell panel whenever the user navigates away from the Ads page
  useEffect(() => {
    if (location.pathname !== '/ads') {
      closeAdShellPanel();
    }
  }, [location.pathname]);

  // Close Advanced Generation panel on restricted pages
  useEffect(() => {
    if (ADV_GEN_HIDDEN_PATHS.includes(location.pathname)) {
      closeAdvancedGeneration();
    }
  }, [location.pathname]);

  // Close filter panel when navigating to pages where it's not available
  useEffect(() => {
    if (!FILTER_PANEL_PATHS.includes(location.pathname)) {
      closeFilterPanel();
    }
  }, [location.pathname]);

  const showLeftPanel = tasksPanelOpen || filterPanelOpen;

  return (
    <div className="flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <LeftNav />
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#f0f2f4' }}>
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {showLeftPanel && (
            <>
              {filterPanelOpen
                ? <FilterPanel width={leftWidth} />
                : <TasksPanel onClose={closeTasksPanel} width={leftWidth} />
              }
              <ResizeHandle onDrag={handleLeftDrag} />
            </>
          )}
          <div
            ref={mainPanelRef}
            className="flex-1 min-w-0 overflow-hidden"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {children}
            </div>
            <PreviewPanel />
          </div>
          {hasRightPanel && <ResizeHandle onDrag={handleRightDrag} />}
          {editingShell && (
            <AdShellPanel
              key={editingShell.id}
              shell={editingShell}
              onClose={closeAdShellPanel}
              width={rightWidth}
            />
          )}
          {advancedGenerationOpen && (
            <AdvancedGenerationPanel
              selectedAssets={advancedGenerationAssets}
              onClose={closeAdvancedGeneration}
              width={rightWidth}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const MainLayout = ({ children }: { children: ReactNode }) => (
  <LayoutProvider>
    <MainLayoutInner>{children}</MainLayoutInner>
  </LayoutProvider>
);
