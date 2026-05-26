import type { ReactNode } from 'react';
import { LeftNav } from './LeftNav';
import { TopBar } from './TopBar';
import { TasksPanel } from './TasksPanel';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import { PreviewPanel } from '../ui/PreviewPanel';

const MainLayoutInner = ({ children }: { children: ReactNode }) => {
  const { tasksPanelOpen, closeTasksPanel, mainPanelRef } = useLayout();

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
