import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LeftNav } from './LeftNav';
import { TopBar } from './TopBar';
import { TasksPanel } from './TasksPanel';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { PreviewPanel } from '../ui/PreviewPanel';
import { AdShellPanel } from '../ui/AdShellPanel';
import { AdvancedGenerationPanel } from '../ui/AdvancedGenerationPanel';

/** Pages where the Advanced Generation panel should auto-close. */
const ADV_GEN_HIDDEN_PATHS = ['/approved', '/ads', '/campaigns'];

const MainLayoutInner = ({ children }: { children: ReactNode }) => {
  const {
    tasksPanelOpen, closeTasksPanel, mainPanelRef,
    editingShell, closeAdShellPanel,
    advancedGenerationOpen, advancedGenerationAssets, closeAdvancedGeneration,
  } = useLayout();
  const location = useLocation();

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

  return (
    <div className="flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <LeftNav />
      <div className="flex flex-col flex-1 min-w-0" style={{ background: '#f0f2f4' }}>
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {tasksPanelOpen && <TasksPanel onClose={closeTasksPanel} />}
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
          {editingShell && (
            <AdShellPanel
              key={editingShell.id}
              shell={editingShell}
              onClose={closeAdShellPanel}
            />
          )}
          {advancedGenerationOpen && (
            <AdvancedGenerationPanel
              selectedAssets={advancedGenerationAssets}
              onClose={closeAdvancedGeneration}
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
