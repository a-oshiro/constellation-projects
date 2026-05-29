import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { AdShell } from '../components/ui/AdShellCard';
import type { Asset } from '../data/types';

interface LayoutContextValue {
  tasksPanelOpen: boolean;
  openTasksPanel: () => void;
  closeTasksPanel: () => void;
  mainPanelRef: RefObject<HTMLDivElement | null>;
  editingShell: AdShell | null;
  openAdShellPanel: (shell: AdShell) => void;
  closeAdShellPanel: () => void;
  advancedGenerationOpen: boolean;
  advancedGenerationAssets: Asset[];
  openAdvancedGeneration: (selectedAssets?: Asset[]) => void;
  closeAdvancedGeneration: () => void;
  /** IDs currently being generated — drives skeleton cards in ReviewPage. */
  submittingIds: Set<string>;
  addSubmittingIds: (ids: Set<string>) => void;
  clearSubmittingIds: () => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  tasksPanelOpen: true,
  openTasksPanel: () => {},
  closeTasksPanel: () => {},
  mainPanelRef: { current: null },
  editingShell: null,
  openAdShellPanel: () => {},
  closeAdShellPanel: () => {},
  advancedGenerationOpen: false,
  advancedGenerationAssets: [],
  openAdvancedGeneration: () => {},
  closeAdvancedGeneration: () => {},
  submittingIds: new Set(),
  addSubmittingIds: () => {},
  clearSubmittingIds: () => {},
});

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [tasksPanelOpen, setTasksPanelOpen] = useState(true);
  const [editingShell, setEditingShell] = useState<AdShell | null>(null);
  const [advancedGenerationOpen, setAdvancedGenerationOpen] = useState(false);
  const [advancedGenerationAssets, setAdvancedGenerationAssets] = useState<Asset[]>([]);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
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
      advancedGenerationOpen,
      advancedGenerationAssets,
      openAdvancedGeneration: (selectedAssets = []) => {
        setAdvancedGenerationAssets(selectedAssets);
        setAdvancedGenerationOpen(true);
      },
      closeAdvancedGeneration: () => {
        setAdvancedGenerationOpen(false);
        setAdvancedGenerationAssets([]);
      },
      submittingIds,
      addSubmittingIds: (ids) => setSubmittingIds((prev) => new Set([...prev, ...ids])),
      clearSubmittingIds: () => setSubmittingIds(new Set()),
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
