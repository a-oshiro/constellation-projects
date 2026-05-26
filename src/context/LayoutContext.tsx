import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

interface LayoutContextValue {
  tasksPanelOpen: boolean;
  openTasksPanel: () => void;
  closeTasksPanel: () => void;
  mainPanelRef: RefObject<HTMLDivElement | null>;
}

const LayoutContext = createContext<LayoutContextValue>({
  tasksPanelOpen: true,
  openTasksPanel: () => {},
  closeTasksPanel: () => {},
  mainPanelRef: { current: null },
});

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [tasksPanelOpen, setTasksPanelOpen] = useState(true);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);

  return (
    <LayoutContext.Provider value={{
      tasksPanelOpen,
      openTasksPanel: () => setTasksPanelOpen(true),
      closeTasksPanel: () => setTasksPanelOpen(false),
      mainPanelRef,
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
