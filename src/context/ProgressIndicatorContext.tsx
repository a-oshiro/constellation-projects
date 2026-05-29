import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ProgressItem {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

interface ProgressIndicatorContextValue {
  startProgress: (items: ProgressItem[]) => void;
  dismiss: () => void;
  visible: boolean;
  items: ProgressItem[];
  done: boolean;
}

const ProgressIndicatorContext = createContext<ProgressIndicatorContextValue | null>(null);

export function ProgressIndicatorProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startProgress = useCallback((newItems: ProgressItem[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setItems(newItems);
    setVisible(true);
    setDone(false);
    timerRef.current = setTimeout(() => setDone(true), 3000);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setItems([]);
    setDone(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ProgressIndicatorContext.Provider value={{ startProgress, dismiss, visible, items, done }}>
      {children}
    </ProgressIndicatorContext.Provider>
  );
}

export function useProgressIndicator() {
  const ctx = useContext(ProgressIndicatorContext);
  if (!ctx) throw new Error('useProgressIndicator must be inside ProgressIndicatorProvider');
  return ctx;
}
