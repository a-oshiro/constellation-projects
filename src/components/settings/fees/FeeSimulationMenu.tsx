import { useState } from 'react';
import { IconButton, Menu, MenuItem, Switch } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

// Prototype-only ⋮ menu next to the "Fees" title: toggles that simulate FeeSync failures, since the
// FeeSync connection is mocked. Sizes live here.
const ICON_SIZE = 20;
const MENU_WIDTH = 280;
const HEADER_FONT_SIZE = 11;
const LABEL_FONT_SIZE = 14;
const HELPER_FONT_SIZE = 11;

interface FeeSimulationMenuProps {
  confirmError: boolean;
  connectionLost: boolean;
  rejectedUpdate: boolean;
  onConfirmErrorChange: (value: boolean) => void;
  onConnectionLostChange: (value: boolean) => void;
  onRejectedUpdateChange: (value: boolean) => void;
}

export const FeeSimulationMenu = ({
  confirmError, connectionLost, rejectedUpdate, onConfirmErrorChange, onConnectionLostChange, onRejectedUpdateChange,
}: FeeSimulationMenuProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const items = [
    {
      id: 'sim-confirm-error', label: 'Confirm dealership error', helper: 'Back to the confirm screen; confirming fails with error code 400.',
      checked: confirmError, onChange: onConfirmErrorChange,
    },
    {
      id: 'sim-connection-lost', label: 'Connection lost', helper: 'A connected FeeSync loses its connection.',
      checked: connectionLost, onChange: onConnectionLostChange,
    },
    {
      id: 'sim-rejected-update', label: 'Update not applied', helper: 'A FeeSync update was rejected and the previous setup kept.',
      checked: rejectedUpdate, onChange: onRejectedUpdateChange,
    },
  ];

  return (
    <>
      <IconButton
        aria-label="FeeSync simulations"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ padding: '5px' }}
      >
        <MoreVert style={{ fontSize: ICON_SIZE, color: '#686576' }} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: MENU_WIDTH, borderRadius: '8px' } } }}
      >
        <li style={{
          listStyle: 'none', padding: '4px 16px 8px', fontSize: HEADER_FONT_SIZE, letterSpacing: '0.4px', color: '#686576',
          fontFamily: 'Roboto, sans-serif', textTransform: 'uppercase',
        }}>
          Simulate FeeSync states
        </li>
        {items.map((item) => (
          <MenuItem
            key={item.id}
            role="menuitemcheckbox"
            aria-checked={item.checked}
            onClick={() => item.onChange(!item.checked)}
            sx={{ alignItems: 'flex-start', gap: 1, whiteSpace: 'normal', paddingY: 1 }}
          >
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, sans-serif' }}>
              <span style={{ fontSize: LABEL_FONT_SIZE, color: '#1f1d25', letterSpacing: '0.15px' }}>{item.label}</span>
              <span style={{ fontSize: HELPER_FONT_SIZE, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>{item.helper}</span>
            </span>
            <Switch size="small" checked={item.checked} tabIndex={-1} slotProps={{ input: { 'aria-hidden': true } }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
