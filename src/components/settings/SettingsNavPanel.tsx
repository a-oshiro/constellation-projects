import type { ReactNode } from 'react';
import { IconButton } from '@mui/material';
import { ViewSidebarOutlined } from '@mui/icons-material';
import { setSettingsNavPanelOpen, useSettingsNavPanelOpen } from './settingsNavPanelStore';

/**
 * Wraps the settings left nav panel so it slides out to the left and back in, while the main panel beside
 * it grows and shrinks with it (`.settings-nav-frame` in index.css). Also holds the 16px gap to the main
 * panel, so nothing is left behind when closed. The panel stays mounted; while closed it's `inert`.
 */
export const SettingsNavPanelFrame = ({ children }: { children: ReactNode }) => {
  const open = useSettingsNavPanelOpen();
  return (
    <div className="settings-nav-frame" data-open={open} inert={!open}>
      <div className="settings-nav-slider">{children}</div>
    </div>
  );
};

/** Sits left of a settings pane's title; shown only while the left nav panel is closed, and reopens it. */
export const SettingsNavPanelToggle = () => {
  const open = useSettingsNavPanelOpen();
  if (open) return null;
  return (
    <IconButton
      size="small"
      title="Show panel"
      aria-label="Show panel"
      onClick={() => setSettingsNavPanelOpen(true)}
      sx={{ padding: '4px', flexShrink: 0 }}
    >
      {/* Mirrored so the sidebar half of the icon sits on the left, where the panel opens. */}
      <ViewSidebarOutlined style={{ fontSize: 20, color: '#686576', transform: 'scaleX(-1)' }} />
    </IconButton>
  );
};
