import { forwardRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Menu, MenuItem } from '@mui/material';
import { Search } from '@mui/icons-material';
import constellationLockup from '../../assets/constellation-lockup.svg';
import { CURRENT_USER } from '../../data/mockData';

const AIAgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M16 10C16.4142 10 16.75 10.3358 16.75 10.75C16.75 13.1758 17.2859 14.7513 18.2673 15.7327C19.2487 16.7141 20.8242 17.25 23.25 17.25C23.6642 17.25 24 17.5858 24 18C24 18.4142 23.6642 18.75 23.25 18.75C20.8242 18.75 19.2487 19.2859 18.2673 20.2673C17.2859 21.2487 16.75 22.8242 16.75 25.25C16.75 25.6642 16.4142 26 16 26C15.5858 26 15.25 25.6642 15.25 25.25C15.25 22.8242 14.7141 21.2487 13.7327 20.2673C12.7513 19.2859 11.1758 18.75 8.75 18.75C8.33579 18.75 8 18.4142 8 18C8 17.5858 8.33579 17.25 8.75 17.25C11.1758 17.25 12.7513 16.7141 13.7327 15.7327C14.7141 14.7513 15.25 13.1758 15.25 10.75C15.25 10.3358 15.5858 10 16 10ZM16 15.0086C15.699 15.6893 15.3008 16.2859 14.7934 16.7934C14.2859 17.3008 13.6893 17.699 13.0086 18C13.6893 18.301 14.2859 18.6992 14.7934 19.2066C15.3008 19.7141 15.699 20.3107 16 20.9914C16.301 20.3107 16.6992 19.7141 17.2066 19.2066C17.7141 18.6992 18.3107 18.301 18.9914 18C18.3107 17.699 17.7141 17.3008 17.2066 16.7934C16.6992 16.2859 16.301 15.6893 16 15.0086Z" fill="#111014" fillOpacity="0.56"/>
    <path d="M9 8.5C9 8.22386 8.77614 8 8.5 8C8.22386 8 8 8.22386 8 8.5C8 9.48063 7.78279 10.0726 7.4277 10.4277C7.0726 10.7828 6.48063 11 5.5 11C5.22386 11 5 11.2239 5 11.5C5 11.7761 5.22386 12 5.5 12C6.48063 12 7.0726 12.2172 7.4277 12.5723C7.78279 12.9274 8 13.5194 8 14.5C8 14.7761 8.22386 15 8.5 15C8.77614 15 9 14.7761 9 14.5C9 13.5194 9.21721 12.9274 9.5723 12.5723C9.9274 12.2172 10.5194 12 11.5 12C11.7761 12 12 11.7761 12 11.5C12 11.2239 11.7761 11 11.5 11C10.5194 11 9.9274 10.7828 9.5723 10.4277C9.21721 10.0726 9 9.48063 9 8.5Z" fill="#111014" fillOpacity="0.56"/>
    <path d="M14 4.5C14 4.22386 13.7761 4 13.5 4C13.2239 4 13 4.22386 13 4.5C13 5.13341 12.8592 5.47538 12.6673 5.66728C12.4754 5.85918 12.1334 6 11.5 6C11.2239 6 11 6.22386 11 6.5C11 6.77614 11.2239 7 11.5 7C12.1334 7 12.4754 7.14082 12.6673 7.33272C12.8592 7.52462 13 7.86659 13 8.5C13 8.77614 13.2239 9 13.5 9C13.7761 9 14 8.77614 14 8.5C14 7.86659 14.1408 7.52462 14.3327 7.33272C14.5246 7.14082 14.8666 7 15.5 7C15.7761 7 16 6.77614 16 6.5C16 6.22386 15.7761 6 15.5 6C14.8666 6 14.5246 5.85918 14.3327 5.66728C14.1408 5.47538 14 5.13341 14 4.5Z" fill="#111014" fillOpacity="0.56"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
    <path d="M8.12679 8.125H21.8768C22.337 8.125 22.7101 8.4981 22.7101 8.95833V19.375C22.7101 19.8352 22.337 20.2083 21.8768 20.2083H15.0018L10.8351 22.5V20.2083H8.12679C7.66655 20.2083 7.29346 19.8352 7.29346 19.375V8.95833C7.29346 8.4981 7.66655 8.125 8.12679 8.125Z" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="round"/>
    <path d="M11.2502 14.5833C11.02 14.5833 10.8335 14.3968 10.8335 14.1667C10.8335 13.9365 11.02 13.75 11.2502 13.75C11.4803 13.75 11.6668 13.9365 11.6668 14.1667C11.6668 14.3968 11.4803 14.5833 11.2502 14.5833Z" fill="#111014" fillOpacity="0.56"/>
    <path d="M15.0002 14.5833C14.77 14.5833 14.5835 14.3968 14.5835 14.1667C14.5835 13.9365 14.77 13.75 15.0002 13.75C15.2303 13.75 15.4168 13.9365 15.4168 14.1667C15.4168 14.3968 15.2303 14.5833 15.0002 14.5833Z" fill="#111014" fillOpacity="0.56"/>
    <path d="M18.7502 14.5833C18.52 14.5833 18.3335 14.3968 18.3335 14.1667C18.3335 13.9365 18.52 13.75 18.7502 13.75C18.9803 13.75 19.1668 13.9365 19.1668 14.1667C19.1668 14.3968 18.9803 14.5833 18.7502 14.5833Z" fill="#111014" fillOpacity="0.56"/>
  </svg>
);

const NotificationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
    <path d="M18.3333 19.3751C18.3333 21.216 16.8409 22.7084 15 22.7084C13.1591 22.7084 11.6667 21.216 11.6667 19.3751M20.4137 12.4242L20.575 15.6176C20.5822 15.7598 20.6197 15.8989 20.685 16.0255L21.7818 18.1526C21.843 18.2714 21.875 18.4032 21.875 18.5368C21.875 18.9998 21.4997 19.3751 21.0367 19.3751H8.96327C8.50031 19.3751 8.125 18.9998 8.125 18.5368C8.125 18.4032 8.15696 18.2714 8.21821 18.1526L9.31504 16.0255C9.3803 15.8989 9.41778 15.7598 9.42496 15.6176L9.58626 12.4242C9.7305 9.5491 12.1116 7.29175 15 7.29175C17.8884 7.29175 20.2695 9.5491 20.4137 12.4242Z" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
    <path d="M12.1261 9.47473L10.6322 9.12998C10.3522 9.06537 10.0587 9.14955 9.85554 9.35272L9.35247 9.85578C9.1493 10.0589 9.06513 10.3525 9.12974 10.6324L9.47448 12.1263C9.55243 12.4641 9.41315 12.8148 9.12474 13.0071L7.66259 13.9819C7.43075 14.1364 7.2915 14.3966 7.2915 14.6752V15.3249C7.2915 15.6036 7.43075 15.8637 7.66259 16.0183L9.12474 16.9931C9.41315 17.1853 9.55243 17.5361 9.47448 17.8738L9.12974 19.3677C9.06513 19.6477 9.1493 19.9412 9.35247 20.1444L9.85554 20.6474C10.0587 20.8506 10.3522 20.9348 10.6322 20.8702L12.1261 20.5254C12.4638 20.4475 12.8146 20.5868 13.0068 20.8752L13.9816 22.3373C14.1362 22.5692 14.3964 22.7084 14.675 22.7084H15.3247C15.6033 22.7084 15.8635 22.5692 16.0181 22.3373L16.9928 20.8752C17.1851 20.5868 17.5358 20.4475 17.8736 20.5254L19.3675 20.8702C19.6475 20.9348 19.941 20.8506 20.1441 20.6474L20.6472 20.1444C20.8504 19.9412 20.9345 19.6477 20.8699 19.3677L20.5252 17.8738C20.4472 17.5361 20.5865 17.1853 20.8749 16.9931L22.3371 16.0183C22.5689 15.8637 22.7082 15.6036 22.7082 15.3249V14.6752C22.7082 14.3966 22.5689 14.1364 22.3371 13.9819L20.8749 13.0071C20.5865 12.8148 20.4472 12.4641 20.5252 12.1263L20.8699 10.6324C20.9345 10.3525 20.8504 10.0589 20.6472 9.85578L20.1441 9.35272C19.941 9.14955 19.6475 9.06537 19.3675 9.12998L17.8736 9.47473C17.5358 9.55267 17.1851 9.4134 16.9928 9.12499L16.0181 7.66283C15.8635 7.431 15.6033 7.29175 15.3247 7.29175H14.675C14.3964 7.29175 14.1362 7.431 13.9816 7.66283L13.0068 9.12499C12.8146 9.4134 12.4638 9.55267 12.1261 9.47473Z" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M17.2915 15.0001C17.2915 16.2657 16.2655 17.2917 14.9998 17.2917C13.7342 17.2917 12.7082 16.2657 12.7082 15.0001C12.7082 13.7344 13.7342 12.7084 14.9998 12.7084C16.2655 12.7084 17.2915 13.7344 17.2915 15.0001Z" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const IconBtn = forwardRef<
  HTMLButtonElement,
  { children: ReactNode; title: string; onClick?: (e: MouseEvent<HTMLButtonElement>) => void }
>(({ children, title, onClick }, ref) => {
  return (
    <button
      ref={ref}
      title={title}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30,
        border: 'none', borderRadius: '100px',
        background: 'transparent',
        cursor: 'pointer',
        padding: 5,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
});
IconBtn.displayName = 'IconBtn';

export const TopBar = () => {
  const navigate = useNavigate();
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

  const closeSettingsMenu = () => setSettingsAnchor(null);

  const handleClientSettings = () => {
    closeSettingsMenu();
    navigate('/settings/accounts');
  };

  const handleAccountSettings = () => {
    closeSettingsMenu();
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        height: 48,
        paddingLeft: 8,
        paddingRight: 16,
        flexShrink: 0,
        background: 'transparent',
        zIndex: 100,
        paddingTop: 8,
      }}
    >
      {/* Platform Lock-up logo */}
      <img
        src={constellationLockup}
        alt="Constellation"
        style={{ height: 32, width: 'auto', flexShrink: 0 }}
      />

      {/* Search bar — absolutely centered */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          top: 8+3.5,
          height: 34,
        }}
      >
        <TextField
          placeholder="Search anything"
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <Search style={{ color: '#9c99a9', fontSize: 20, marginRight: 8 }} />
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 34,
              borderRadius: '20px',
              background: 'white',
              '& fieldset': { border: '1px solid #cac9cf' },
              '&:hover fieldset': { border: '1px solid #9c99a9' },
              '&.Mui-focused fieldset': { border: '1px solid #473bab' },
            },
            '& input': {
              fontSize: 14,
              fontFamily: 'Roboto, sans-serif',
              color: '#9c99a9',
              letterSpacing: '0.15px',
              padding: '6px 0',
            },
          }}
        />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        <IconBtn title="AI Agent"><AIAgentIcon /></IconBtn>
        <IconBtn title="Messages"><MessagesIcon /></IconBtn>
        <IconBtn title="Notifications"><NotificationIcon /></IconBtn>
        <IconBtn title="Settings" onClick={(e) => setSettingsAnchor(e.currentTarget)}>
          <SettingsIcon />
        </IconBtn>
        <Menu
          anchorEl={settingsAnchor}
          open={!!settingsAnchor}
          onClose={closeSettingsMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { style: { minWidth: 180, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 8 } } }}
        >
          <MenuItem onClick={handleClientSettings} sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
            Client Settings
          </MenuItem>
          <MenuItem onClick={handleAccountSettings} sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
            Account Settings
          </MenuItem>
        </Menu>

        <img
          src={CURRENT_USER.avatarUrl}
          alt="User"
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginLeft: 8, cursor: 'pointer', flexShrink: 0 }}
        />
      </div>
    </div>
  );
};
