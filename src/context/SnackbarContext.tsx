import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AppSnackbar } from '../components/ui/Snackbar';

interface SnackbarAction {
  label: string;
  onClick: () => void;
}

interface SnackbarConfig {
  message: string;
  action?: SnackbarAction;
}

interface SnackbarContextValue {
  showSnackbar: (config: SnackbarConfig) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<SnackbarConfig | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback((config: SnackbarConfig) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(config);
    setOpen(true);
    timerRef.current = setTimeout(() => setOpen(false), 2000);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {open && current && (
        <AppSnackbar
          message={current.message}
          action={current.action}
          onClose={handleClose}
        />
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be inside SnackbarProvider');
  return ctx;
}
