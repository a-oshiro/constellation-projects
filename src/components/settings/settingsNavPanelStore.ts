import { useSyncExternalStore } from 'react';

// Whether the Client Settings / Account Settings left nav panel is open. Module-level so closing it on
// one settings page keeps it closed on the next (both pages, and every tab pane, read the same value);
// lasts for the browser session only.
let navPanelOpen = true;
const listeners = new Set<() => void>();

export function setSettingsNavPanelOpen(open: boolean) {
  if (open === navPanelOpen) return;
  navPanelOpen = open;
  listeners.forEach((l) => l());
}

export function useSettingsNavPanelOpen(): boolean {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => navPanelOpen,
  );
}
