import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { AdShell } from '../components/ui/AdShellCard';

interface LayoutContextValue {
  tasksPanelOpen: boolean;
  openTasksPanel: () => void;
  closeTasksPanel: () => void;
  mainPanelRef: RefObject<HTMLDivElement | null>;
  editingShell: AdShell | null;
  openAdShellPanel: (shell: AdShell) => void;
  closeAdShellPanel: () => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  tasksPanelOpen: true,
  openTasksPanel: () => {},
  closeTasksPanel: () => {},
  mainPanelRef: { current: null },
  editingShell: null,
  openAdShellPanel: () => {},
  closeAdShellPanel: () => {},
});

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [tasksPanelOpen, setTasksPanelOpen] = useState(true);
  const [editingShell, setEditingShell] = useState<AdShell | null>(null);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);

  return (
    <LayoutContext.Provider value={{
      tasksPanelOpen,
      openTasksPanel: () => setTasksPanelOpen(true),
      closeTasksPanel: () => setTasksPanelOpen(false),
      mainPanelRef,
      editingShell,
      openAdShellPanel: (shell) => setEditingShell(shell),
      closeAdShellPanel: () => setEditingShell(null),
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
