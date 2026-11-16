import { IconButton } from '@mui/material';
import { ViewSidebarOutlined } from '@mui/icons-material';
import { setSettingsNavPanelOpen, useSettingsNavPanelOpen } from './settingsNavPanelStore';

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
