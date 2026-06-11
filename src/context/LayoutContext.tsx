import { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { AdShell } from '../components/ui/AdShellCard';
import type { Asset } from '../data/types';
import { DEFAULT_FILTER_STATE } from '../utils/assetFilters';
import type { FilterState } from '../utils/assetFilters';

export type { FilterState };

interface LayoutContextValue {
  tasksPanelOpen: boolean;
  openTasksPanel: () => void;
  closeTasksPanel: () => void;
  filterPanelOpen: boolean;
  openFilterPanel: () => void;
  closeFilterPanel: () => void;
  filterState: FilterState;
  updateFilterState: (updates: Partial<FilterState>) => void;
  resetFilterState: () => void;
  mainPanelRef: RefObject<HTMLDivElement | null>;
  editingShell: AdShell | null;
  openAdShellPanel: (shell: AdShell) => void;
  closeAdShellPanel: () => void;
  shellCustomizations: Record<string, Partial<AdShell>>;
  updateAdShell: (id: string, updates: Partial<AdShell>) => void;
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
  filterPanelOpen: false,
  openFilterPanel: () => {},
  closeFilterPanel: () => {},
  filterState: DEFAULT_FILTER_STATE,
  updateFilterState: () => {},
  resetFilterState: () => {},
  mainPanelRef: { current: null },
  editingShell: null,
  openAdShellPanel: () => {},
  closeAdShellPanel: () => {},
  shellCustomizations: {},
  updateAdShell: () => {},
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
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [editingShell, setEditingShell] = useState<AdShell | null>(null);
  const [shellCustomizations, setShellCustomizations] = useState<Record<string, Partial<AdShell>>>({});
  const [advancedGenerationOpen, setAdvancedGenerationOpen] = useState(false);
  const [advancedGenerationAssets, setAdvancedGenerationAssets] = useState<Asset[]>([]);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const mainPanelRef = useRef<HTMLDivElement | null>(null);

  const updateFilterState = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilterState = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  return (
    <LayoutContext.Provider value={{
      tasksPanelOpen,
      openTasksPanel: () => setTasksPanelOpen(true),
      closeTasksPanel: () => setTasksPanelOpen(false),
      filterPanelOpen,
      openFilterPanel: () => setFilterPanelOpen(true),
      closeFilterPanel: () => setFilterPanelOpen(false),
      filterState,
      updateFilterState,
      resetFilterState,
      mainPanelRef,
      editingShell,
      openAdShellPanel: (shell) => setEditingShell(shell),
      closeAdShellPanel: () => setEditingShell(null),
      shellCustomizations,
      updateAdShell: (id, updates) => {
        setShellCustomizations((prev) => ({
          ...prev,
          [id]: { ...(prev[id] ?? {}), ...updates },
        }));
        setEditingShell((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
      },
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
