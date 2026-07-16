import { useState } from 'react';
import {
  Button, ButtonGroup, TextField, InputAdornment, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import {
  Add, ArrowDropDown, Search, ViewSidebarOutlined,
  AutoAwesomeOutlined, UploadOutlined, DescriptionOutlined,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { NewUrlPanel } from './NewUrlPanel';
import { FetchUrlsDialog } from './FetchUrlsDialog';
import emptyFolderSrc from '../../assets/empty-folder.png';

const DEFAULT_ACCOUNT_WEBSITE = 'https://www.bmwnyc.com/';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DestinationUrlType = 'Contact' | 'Inventory' | 'Specials' | 'Trade-In';

export interface DestinationUrl {
  id: string;
  label: string;
  url: string;
  type: DestinationUrlType;
  ymmt?: string;
  ctas: string[];
}

// ── Shared reference data — used here and by the New URL panel ─────────────────

export const CTA_OPTIONS = [
  'See Inventory',
  'See New Vehicles',
  'New Inventory',
  'Value Trade',
  'Trade-in your vehicle',
  'Trade-In',
  'Contact Dealer',
  'Sign-up for News',
  'Claim Special',
  'Get Offer',
];

export const EXISTING_LABEL_SUGGESTIONS = [
  'View Inventory - X1',
  'View Inventory - X3',
  'View Inventory - X5',
  'View Inventory - X7',
  'View Inventory - iX',
  'View Inventory - i5',
  'Value Trade',
  'Lead Form',
  'Claim Offer - X1',
  'Claim Offer - X3',
];

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'contact', label: 'Contact', type: 'Contact' },
  { id: 'inventory', label: 'Inventory', type: 'Inventory' },
  { id: 'specials', label: 'Specials', type: 'Specials' },
  { id: 'trade-in', label: 'Trade-In', type: 'Trade-In' },
] as const;

const COLUMNS = [
  { key: 'label', label: 'Label', width: 200 },
  { key: 'url', label: 'URL Address', width: 360 },
  { key: 'type', label: 'Type', width: 120 },
  { key: 'ymmt', label: 'YMMT', width: 160 },
  { key: 'ctas', label: 'Associated CTAs', minWidth: 240 },
] as const;

// ── Small building blocks ────────────────────────────────────────────────────

function HeaderDivider() {
  return <span style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />;
}

interface NewUrlMenuOption {
  label: string;
  icon: SvgIconComponent;
}

const NEW_URL_MENU_OPTIONS: NewUrlMenuOption[] = [
  { label: 'New URL', icon: Add },
  { label: 'Fetch URLs with AI', icon: AutoAwesomeOutlined },
  { label: 'Upload CSV', icon: UploadOutlined },
  { label: 'Download CSV Template', icon: DescriptionOutlined },
];

function NewUrlButton({ onClick, onFetchWithAI }: { onClick: () => void; onFetchWithAI: () => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOptionClick = (label: string) => {
    setAnchorEl(null);
    if (label === 'New URL') onClick();
    else if (label === 'Fetch URLs with AI') onFetchWithAI();
  };

  return (
    <>
      <ButtonGroup variant="contained" color="primary" disableElevation sx={{ borderRadius: 100 }}>
        <Button
          size="small"
          onClick={onClick}
          startIcon={<Add style={{ fontSize: 18 }} />}
          sx={{ borderRadius: '100px 0 0 100px', fontSize: 13, fontWeight: 500, letterSpacing: '0.46px', paddingLeft: '14px' }}
        >
          New URL
        </Button>
        <Button
          size="small"
          aria-label="More URL options"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ borderRadius: '0 100px 100px 0', minWidth: 32, paddingLeft: '6px', paddingRight: '6px' }}
        >
          <ArrowDropDown style={{ fontSize: 18 }} />
        </Button>
      </ButtonGroup>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 220,
              borderRadius: '4px',
              boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        {NEW_URL_MENU_OPTIONS.map(({ label, icon: Icon }) => (
          <MenuItem
            key={label}
            onClick={() => handleOptionClick(label)}
            sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.15px', lineHeight: 1.5, px: 2, py: '8px' }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Icon style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
            </ListItemIcon>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function TypeChip({ type }: { type: DestinationUrlType }) {
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        height: 24, borderRadius: '8px', background: 'rgba(17,16,20,0.04)', color: '#1f1d25',
        fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
        '& .MuiChip-label': { padding: '0 6px' },
      }}
    />
  );
}

function CtaChip({ label }: { label: string }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 24, borderRadius: '8px', background: 'rgba(99,86,225,0.08)', color: '#473bab',
        fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
        '& .MuiChip-label': { padding: '0 6px' },
      }}
    />
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface DestinationURLsProps {
  accountName: string;
}

export const DestinationURLs = ({ accountName }: DestinationURLsProps) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('all');
  const [urls, setUrls] = useState<DestinationUrl[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);

  const filtered = urls.filter((u) => {
    const tab = TABS.find((t) => t.id === activeTab);
    const matchesTab = !tab || tab.id === 'all' || u.type === tab.type;
    const matchesSearch = u.label.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSave = (newUrl: DestinationUrl) => {
    setUrls((prev) => [...prev, newUrl]);
    setPanelOpen(false);
  };

  const handleFetchedUrls = (newUrls: DestinationUrl[]) => {
    setUrls((prev) => [...prev, ...newUrls]);
    setFetchDialogOpen(false);
  };

  return (
    <>
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{
          minWidth: 0, background: '#ffffff', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          <Breadcrumbs items={['Settings', 'Accounts', accountName, 'Destination URLs']} />
        </div>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 12px', flexShrink: 0 }}>
          <IconButton size="small" sx={{ padding: '4px' }}>
            <ViewSidebarOutlined style={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
          <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0, whiteSpace: 'nowrap' }}>
            Destination URLs
          </h1>
          <NewUrlButton onClick={() => setPanelOpen(true)} onFetchWithAI={() => setFetchDialogOpen(true)} />

          <div style={{ flex: 1 }} />

          <TextField
            size="small"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 20, color: '#9c99a9' }} /></InputAdornment> },
            }}
            sx={{
              minWidth: 160, maxWidth: 211,
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px', background: '#f9fafa', height: 34,
                '& fieldset': { borderColor: '#cac9cf' },
                '&:hover fieldset': { borderColor: '#9c99a9' },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: 14, color: '#1f1d25', letterSpacing: '0.15px', padding: '6px 8px 6px 0',
                '&::placeholder': { color: '#9c99a9', opacity: 1 },
              },
            }}
          />

          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {filtered.length} {filtered.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          TabIndicatorProps={{ style: { background: '#473bab', height: 2 } }}
          sx={{ minHeight: 42, borderBottom: '1px solid rgba(0,0,0,0.12)', paddingLeft: '16px', flexShrink: 0 }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              disableRipple
              sx={{
                textTransform: 'capitalize', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.4px', minHeight: 42, padding: '9px 16px', color: '#686576',
                '&.Mui-selected': { color: '#473bab' },
              }}
            />
          ))}
        </Tabs>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
                    <Checkbox size="small" sx={{ color: '#9c99a9', '&.Mui-checked': { color: '#473bab' } }} />
                  </TableCell>
                  {COLUMNS.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        width: col.width, minWidth: 'minWidth' in col ? col.minWidth : col.width,
                        fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                        color: '#1f1d25', letterSpacing: '0.17px', borderBottom: '1px solid rgba(0,0,0,0.12)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <HeaderDivider />
                        {col.label}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              {filtered.length > 0 && (
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(0,0,0,0.12)' } }}>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" sx={{ color: '#9c99a9', '&.Mui-checked': { color: '#473bab' } }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                        {row.label}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                        {row.url}
                      </TableCell>
                      <TableCell>
                        <TypeChip type={row.type} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                        {row.ymmt ?? ''}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {row.ctas.map((cta) => <CtaChip key={cta} label={cta} />)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </TableContainer>

          {/* ── Empty state ────────────────────────────────────────────── */}
          {filtered.length === 0 && (
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 100 }}>
              <img src={emptyFolderSrc} alt="" style={{ width: 200, height: 200, objectFit: 'contain', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.43, textAlign: 'center' }}>
                No URLs added yet
              </p>
              <NewUrlButton onClick={() => setPanelOpen(true)} onFetchWithAI={() => setFetchDialogOpen(true)} />
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <NewUrlPanel onClose={() => setPanelOpen(false)} onSave={handleSave} />
      )}

      <FetchUrlsDialog
        open={fetchDialogOpen}
        onClose={() => setFetchDialogOpen(false)}
        defaultWebsite={DEFAULT_ACCOUNT_WEBSITE}
        onFetched={handleFetchedUrls}
      />
    </>
  );
};
