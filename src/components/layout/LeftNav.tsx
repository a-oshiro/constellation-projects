import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import constellationLogo from '../../assets/constellation-logo.png';

// ── Design tokens ─────────────────────────────────────────────────────────────
const RAIL_BG   = '#1e1a42';
const HOVER_BG  = '#2f2673';
const ACTIVE_BG = '#2a2260';
const IC        = '#ACABFF';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const ProjectsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M7.543 9.498L8.668 10.248L10.54 7.752M13.808 9H16.308M13.75 15H16.25M7.543 15.499L8.668 16.249L10.54 13.753M4.75 20.25H19.25C19.802 20.25 20.25 19.802 20.25 19.25V4.75C20.25 4.198 19.802 3.75 19.25 3.75H4.75C4.198 3.75 3.75 4.198 3.75 4.75V19.25C3.75 19.802 4.198 20.25 4.75 20.25Z" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FeedsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M4.125 10C4.125 9.517 4.517 9.125 5 9.125C10.454 9.125 14.875 13.546 14.875 19C14.875 19.483 14.483 19.875 14 19.875C13.517 19.875 13.125 19.483 13.125 19C13.125 14.513 9.487 10.875 5 10.875C4.517 10.875 4.125 10.483 4.125 10Z" fill={IC}/>
    <path fillRule="evenodd" clipRule="evenodd" d="M4.125 4.48C4.141 3.997 4.546 3.618 5.029 3.634C13.376 3.907 20.093 10.624 20.366 18.971C20.382 19.454 20.004 19.859 19.52 19.875C19.038 19.89 18.633 19.512 18.617 19.029C18.374 11.603 12.397 5.626 4.971 5.383C4.488 5.367 4.11 4.963 4.125 4.48Z" fill={IC}/>
    <path d="M8.5 17.5C8.5 18.605 7.605 19.5 6.5 19.5C5.395 19.5 4.5 18.605 4.5 17.5C4.5 16.395 5.395 15.5 6.5 15.5C7.605 15.5 8.5 16.395 8.5 17.5Z" fill={IC}/>
  </svg>
);

const DesignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21.25 12C21.25 19.109 13.657 12.798 12 16.118C10.972 18.176 14.906 20.75 12 20.75C6.891 20.75 2.75 16.832 2.75 12C2.75 7.168 6.891 3.25 12 3.25C17.109 3.25 21.25 7.168 21.25 12Z" stroke={IC} strokeWidth="1.5"/>
    <path d="M11.5 7.75C11.5 8.44 10.94 9 10.25 9C9.56 9 9 8.44 9 7.75C9 7.06 9.56 6.5 10.25 6.5C10.94 6.5 11.5 7.06 11.5 7.75Z" fill={IC}/>
    <path d="M8.5 12C8.5 12.69 7.94 13.25 7.25 13.25C6.56 13.25 6 12.69 6 12C6 11.31 6.56 10.75 7.25 10.75C7.94 10.75 8.5 11.31 8.5 12Z" fill={IC}/>
    <path d="M16.5 9.25C16.5 9.94 15.94 10.5 15.25 10.5C14.56 10.5 14 9.94 14 9.25C14 8.56 14.56 8 15.25 8C15.94 8 16.5 8.56 16.5 9.25Z" fill={IC}/>
  </svg>
);

const PortalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M4.833 6.111V17.222M8.389 5.222V18.111M19.5 6.429V16.904C19.5 17.325 19.206 17.687 18.795 17.774L13.017 18.996C12.464 19.112 11.944 18.691 11.944 18.126V5.208C11.944 4.643 12.464 4.221 13.017 4.338L18.795 5.559C19.206 5.646 19.5 6.009 19.5 6.429Z" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CampaignsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 25 24" fill="none">
    <path d="M15.32 14.381C16.744 14.381 17.898 13.225 17.898 11.798C17.898 10.372 16.744 9.215 15.32 9.215M10.447 18.041C10.093 19.044 9.138 19.763 8.016 19.763C6.592 19.763 5.437 18.606 5.437 17.18V15.888M5.439 7.708V15.888M15.32 5.862V17.735C15.32 18.314 14.76 18.728 14.207 18.557L2.606 14.968C2.246 14.857 2 14.524 2 14.146V9.451C2 9.073 2.246 8.739 2.606 8.628L14.207 5.039C14.76 4.868 15.32 5.282 15.32 5.862Z" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.346 7.782L20.171 9.607" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21.161 11.875H24" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.346 15.971L20.171 14.146" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InventoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M14.75 2.75L20.25 6.75V19.25C20.25 19.802 19.802 20.25 19.25 20.25H4.75C4.198 20.25 3.75 19.802 3.75 19.25V6.75L9.25 2.75M20.25 6.75H3.75M9.75 11.25H14.25" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InsightsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M5 16.75V19.25M9.872 12.75V19.25M14.744 8.75V19.25M19.616 4.75V19.25" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AIToolsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M13 7C13.414 7 13.75 7.336 13.75 7.75C13.75 10.176 14.286 11.751 15.267 12.733C16.249 13.714 17.824 14.25 20.25 14.25C20.664 14.25 21 14.586 21 15C21 15.414 20.664 15.75 20.25 15.75C17.824 15.75 16.249 16.286 15.267 17.267C14.286 18.249 13.75 19.824 13.75 22.25C13.75 22.664 13.414 23 13 23C12.586 23 12.25 22.664 12.25 22.25C12.25 19.824 11.714 18.249 10.733 17.267C9.751 16.286 8.176 15.75 5.75 15.75C5.336 15.75 5 15.414 5 15C5 14.586 5.336 14.25 5.75 14.25C8.176 14.25 9.751 13.714 10.733 12.733C11.714 11.751 12.25 10.176 12.25 7.75C12.25 7.336 12.586 7 13 7ZM13 12.009C12.699 12.689 12.301 13.286 11.793 13.793C11.286 14.301 10.689 14.699 10.009 15C10.689 15.301 11.286 15.699 11.793 16.207C12.301 16.714 12.699 17.311 13 17.991C13.301 17.311 13.699 16.714 14.207 16.207C14.714 15.699 15.311 15.301 15.991 15C15.311 14.699 14.714 14.301 14.207 13.793C13.699 13.286 13.301 12.689 13 12.009Z" fill={IC}/>
    <path d="M6 5.5C6 5.224 5.776 5 5.5 5C5.224 5 5 5.224 5 5.5C5 6.481 4.783 7.073 4.428 7.428C4.073 7.783 3.481 8 2.5 8C2.224 8 2 8.224 2 8.5C2 8.776 2.224 9 2.5 9C3.481 9 4.073 9.217 4.428 9.572C4.783 9.927 5 10.519 5 11.5C5 11.776 5.224 12 5.5 12C5.776 12 6 11.776 6 11.5C6 10.519 6.217 9.927 6.572 9.572C6.927 9.217 7.519 9 8.5 9C8.776 9 9 8.776 9 8.5C9 8.224 8.776 8 8.5 8C7.519 8 6.927 7.783 6.572 7.428C6.217 7.073 6 6.481 6 5.5Z" fill={IC}/>
    <path d="M11 1.5C11 1.224 10.776 1 10.5 1C10.224 1 10 1.224 10 1.5C10 2.133 9.859 2.475 9.667 2.667C9.475 2.859 9.133 3 8.5 3C8.224 3 8 3.224 8 3.5C8 3.776 8.224 4 8.5 4C9.133 4 9.475 4.141 9.667 4.333C9.859 4.525 10 4.867 10 5.5C10 5.776 10.224 6 10.5 6C10.776 6 11 5.776 11 5.5C11 4.867 11.141 4.525 11.333 4.333C11.525 4.141 11.867 4 12.5 4C12.776 4 13 3.776 13 3.5C13 3.224 12.776 3 12.5 3C11.867 3 11.525 2.859 11.333 2.667C11.141 2.475 11 2.133 11 1.5Z" fill={IC}/>
  </svg>
);

const ChatsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M17.25 14.25H20.252C20.804 14.25 21.252 13.802 21.252 13.25V4.75C21.252 4.198 20.804 3.75 20.252 3.75H8.002C7.45 3.75 7.002 4.198 7.002 4.75V7.75M16.252 7.75H3.752C3.2 7.75 2.752 8.198 2.752 8.75V17.25C2.752 17.802 3.2 18.25 3.752 18.25H6.002V20.75L10.502 18.25H16.252C16.804 18.25 17.252 17.802 17.252 17.25V8.75C17.252 8.198 16.804 7.75 16.252 7.75Z" stroke={IC} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M9.75 9.25V8.75C9.75 8.198 10.198 7.75 10.75 7.75H13.25C13.802 7.75 14.25 8.198 14.25 8.75V9.965C14.25 10.299 14.083 10.611 13.805 10.797L12.445 11.703C12.167 11.889 12 12.201 12 12.535V13.25M12 16V15.99M21.25 12C21.25 17.109 17.109 21.25 12 21.25C6.891 21.25 2.75 17.109 2.75 12C2.75 6.891 6.891 2.75 12 2.75C17.109 2.75 21.25 6.891 21.25 12ZM12.25 16C12.25 16.138 12.138 16.25 12 16.25C11.862 16.25 11.75 16.138 11.75 16C11.75 15.862 11.862 15.75 12 15.75C12.138 15.75 12.25 15.862 12.25 16Z" stroke={IC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M6 9L12 15L18 9" stroke="rgba(172,171,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Nav item data ─────────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  hasChevron?: boolean;
  enabled: boolean;
};

const GROUP_1: NavItem[] = [
  { id: 'projects',  label: 'Projects', icon: <ProjectsIcon />, route: '/projects', hasChevron: true, enabled: true },
  { id: 'feeds',     label: 'Feeds',    icon: <FeedsIcon />,    route: '/feeds',    enabled: false },
  { id: 'design',    label: 'Design',   icon: <DesignIcon />,   route: '/design',   hasChevron: true, enabled: false },
  { id: 'portal',    label: 'Portal',   icon: <PortalIcon />,   route: '/portal',   enabled: false },
];

const GROUP_2: NavItem[] = [
  { id: 'campaigns', label: 'Campaigns', icon: <CampaignsIcon />, route: '/campaigns', hasChevron: true, enabled: false },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon />, route: '/inventory', enabled: false },
  { id: 'insights',  label: 'Insights',  icon: <InsightsIcon />,  route: '/insights',  hasChevron: true, enabled: false },
  { id: 'ai-tools',  label: 'AI Tools',  icon: <AIToolsIcon />,   route: '/ai-tools',  enabled: false },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'chats', label: 'Chats', icon: <ChatsIcon />, route: '/chats', enabled: false },
  { id: 'help',  label: 'Help',  icon: <HelpIcon />,  route: '/help',  enabled: false },
];

// Routes that keep "Projects" highlighted as the active section
const PROJECTS_ROUTES = ['/projects', '/offers', '/templates', '/theme-and-logos', '/review', '/approved', '/ads'];

// ── Mock client data ──────────────────────────────────────────────────────────

const RECENTLY_USED = ['Lithia', 'Aflac', 'Cardinale'];
const ALL_CLIENTS   = [
  'ABC Creative', 'Aflac', 'Cardinale', 'Chase', 'Lithia',
  'GSK', 'Automotive Mastermind', 'NBCU', 'Name of client', 'True Car',
];

function clientColor(name: string) {
  const palette = ['#1565C0','#B71C1C','#BF360C','#1A237E','#1B5E20','#4A148C','#E65100','#006064','#37474F','#880E4F'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}

function ClientAvatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: clientColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      fontSize: size * 0.4, fontWeight: 700,
      color: 'white', fontFamily: 'Roboto, sans-serif',
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Item renderers ────────────────────────────────────────────────────────────

function CollapsedItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={item.enabled ? onClick : undefined}
      onMouseEnter={() => item.enabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={item.label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 4,
        width: '100%', padding: '7px 0 3px',
        border: 'none', borderRadius: 12,
        background: active ? ACTIVE_BG : hovered ? HOVER_BG : 'transparent',
        cursor: item.enabled ? 'pointer' : 'default',
        opacity: item.enabled ? 1 : 0.4,
        transition: 'background 0.15s',
        outline: 'none',
      }}
    >
      {item.icon}
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: 'white', letterSpacing: '0.4px', lineHeight: 1.6, whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
    </button>
  );
}

function ExpandedItem({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={item.enabled ? onClick : undefined}
      onMouseEnter={() => item.enabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '10px 12px',
        border: 'none', borderRadius: 10,
        background: active ? ACTIVE_BG : hovered ? HOVER_BG : 'transparent',
        cursor: item.enabled ? 'pointer' : 'default',
        opacity: item.enabled ? 1 : 0.4,
        transition: 'background 0.15s',
        outline: 'none',
      }}
    >
      <span style={{ flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: active ? 500 : 400, color: 'white', textAlign: 'left', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {item.hasChevron && <ChevronDownIcon />}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 'calc(100% - 16px)', margin: '4px 8px', height: 1, background: 'rgba(172,171,255,0.12)', flexShrink: 0 }} />;
}

// ── Rail mode ─────────────────────────────────────────────────────────────────
type Mode = 'collapsed' | 'rail' | 'switch-client';

// ── LeftNav — the complete left navigation ───────────────────────────────────

export const LeftNav: React.FC = () => {
  const [mode, setMode] = useState<Mode>('collapsed');
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  const expanded  = mode !== 'collapsed';
  const railWidth = expanded ? 256 : 72;

  // Collapse when clicking outside
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMode('collapsed');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  const isProjectsActive = PROJECTS_ROUTES.some(
    r => location.pathname === r || location.pathname.startsWith(r + '/')
  );

  function getActive(item: NavItem) {
    if (item.id === 'projects') return isProjectsActive;
    return location.pathname === item.route || location.pathname.startsWith(item.route + '/');
  }

  function handleNav(item: NavItem) {
    navigate(item.route);
    setMode('collapsed');
  }

  const navGroups = [
    { items: GROUP_1,      divider: true  },
    { items: GROUP_2,      divider: true  },
    { items: BOTTOM_ITEMS, divider: false },
  ];

  return (
    // Outer shell — always reserves 72 px in the flex layout
    <div style={{ width: 72, flexShrink: 0, position: 'relative', zIndex: 9999 }}>

      {/* Inner panel — animates between 72 px and 256 px */}
      <div
        ref={navRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          height: '100vh', width: railWidth,
          background: RAIL_BG,
          display: 'flex', flexDirection: 'column',
          paddingBottom: 16,
          boxShadow: expanded ? '4px 0 20px rgba(0,0,0,0.35)' : 'none',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          zIndex: 9999,
        }}
      >
        {/* ── Client logo / header ─────────────────────────────── */}
        <div
          onClick={() => setMode(prev => prev === 'collapsed' ? 'rail' : 'collapsed')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: expanded ? '12px 12px 8px' : '12px 0 8px',
            justifyContent: expanded ? 'flex-start' : 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          {/* Client logo */}
          <img
            src={constellationLogo}
            alt="Constellation"
            style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, objectFit: 'cover' }}
          />

          {/* Name + Switch Client (expanded only) */}
          {expanded && (
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Constellation Internal
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setMode('switch-client'); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: IC, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}
              >
                Switch Client
              </button>
            </div>
          )}
        </div>

        {/* ── Switch Client panel ──────────────────────────────── */}
        {mode === 'switch-client' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'white', fontFamily: 'Roboto, sans-serif', padding: '4px 4px 12px' }}>
              Switch Client
            </div>
            <div style={{ fontSize: 11, color: 'rgba(172,171,255,0.7)', fontFamily: 'Roboto, sans-serif', padding: '0 4px 6px', letterSpacing: '0.4px' }}>
              Recently used:
            </div>
            {RECENTLY_USED.map((name, i) => (
              <button key={name} onClick={() => setMode('rail')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 8px', border: 'none', borderRadius: 8, background: i === 0 ? '#2f2673' : 'transparent', cursor: 'pointer', marginBottom: 2 }}>
                <ClientAvatar name={name} size={28} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: 'white' }}>{name}</span>
              </button>
            ))}
            <div style={{ fontSize: 11, color: 'rgba(172,171,255,0.7)', fontFamily: 'Roboto, sans-serif', padding: '10px 4px 6px', letterSpacing: '0.4px' }}>
              All Clients ({ALL_CLIENTS.length})
            </div>
            {ALL_CLIENTS.map((name) => (
              <button key={name} onClick={() => setMode('rail')} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '6px 8px', border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer', marginBottom: 2 }}>
                <ClientAvatar name={name} size={28} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: 'white' }}>{name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Nav groups ───────────────────────────────────────── */}
        {mode !== 'switch-client' && navGroups.map((group, gi) => (
          <div key={gi} style={{ display: 'contents' }}>
            <nav style={{
              padding: expanded ? '0 8px' : '0 4px',
              display: 'flex', flexDirection: 'column', gap: 2,
              flexShrink: 0,
              ...(gi === navGroups.length - 1 && { marginTop: 'auto' }),
            }}>
              {group.items.map(item =>
                expanded
                  ? <ExpandedItem key={item.id} item={item} active={getActive(item)} onClick={() => handleNav(item)} />
                  : <CollapsedItem key={item.id} item={item} active={getActive(item)} onClick={() => handleNav(item)} />
              )}
            </nav>
            {group.divider && <Divider />}
          </div>
        ))}
      </div>
    </div>
  );
};
