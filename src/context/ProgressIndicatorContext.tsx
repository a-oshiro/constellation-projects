import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ProgressItem {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

export interface ProgressOptions {
  /** Header while working. Defaults to "Generating assets...". */
  title?: string;
  /** Header once finished. Defaults to "Assets generated.". */
  doneTitle?: string;
  /** Called when the work finishes (the indicator stays until dismissed). */
  onDone?: () => void;
}

interface ProgressIndicatorContextValue {
  startProgress: (items: ProgressItem[], options?: ProgressOptions) => void;
  title: string;
  doneTitle: string;
  dismiss: () => void;
  visible: boolean;
  items: ProgressItem[];
  done: boolean;
}

const DEFAULT_TITLE = 'Generating assets...';
const DEFAULT_DONE_TITLE = 'Assets generated.';

const ProgressIndicatorContext = createContext<ProgressIndicatorContextValue | null>(null);

export function ProgressIndicatorProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [doneTitle, setDoneTitle] = useState(DEFAULT_DONE_TITLE);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startProgress = useCallback((newItems: ProgressItem[], options?: ProgressOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTitle(options?.title ?? DEFAULT_TITLE);
    setDoneTitle(options?.doneTitle ?? DEFAULT_DONE_TITLE);
    setItems(newItems);
    setVisible(true);
    setDone(false);
    timerRef.current = setTimeout(() => {
      setDone(true);
      options?.onDone?.();
    }, 3000);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setItems([]);
    setDone(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ProgressIndicatorContext.Provider value={{ startProgress, dismiss, visible, items, done, title, doneTitle }}>
      {children}
    </ProgressIndicatorContext.Provider>
  );
}

export function useProgressIndicator() {
  const ctx = useContext(ProgressIndicatorContext);
  if (!ctx) throw new Error('useProgressIndicator must be inside ProgressIndicatorProvider');
  return ctx;
}
