import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LeftNav } from './LeftNav';
import { TopBar } from './TopBar';
import { TasksPanel } from './TasksPanel';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { PreviewPanel } from '../ui/PreviewPanel';
import { AdShellPanel } from '../ui/AdShellPanel';

const MainLayoutInner = ({ children }: { children: ReactNode }) => {
  const { tasksPanelOpen, closeTasksPanel, mainPanelRef, editingShell, closeAdShellPanel } = useLayout();
  const location = useLocation();

  // Close the Ad Shell panel whenever the user navigates away from the Ads page
  useEffect(() => {
    if (location.pathname !== '/ads') {
      closeAdShellPanel();
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
