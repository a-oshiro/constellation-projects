import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Button, ButtonGroup, TextField, InputAdornment, IconButton, Link,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Chip, Menu, MenuItem, ListItemIcon, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import {
  Add, ArrowDropDown, Search, ViewSidebarOutlined,
  AutoAwesomeOutlined, UploadOutlined, DescriptionOutlined,
  AutoAwesome, Check, Close,
} from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { NewUrlPanel } from './NewUrlPanel';
import { FetchUrlsDialog } from './FetchUrlsDialog';
import { CsvDuplicatesDialog } from './CsvDuplicatesDialog';
import type { CsvDuplicateEntry } from './CsvDuplicatesDialog';
import {
  fetchUrlsFromWebsite, dedupeAgainstExisting, BMW_2026_MODELS,
  parseDestinationUrlsCsv, downloadCsvTemplate,
} from '../../utils/fetchUrlsWithAI';
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

const ACTION_BUTTON_SX = {
  borderRadius: 100, fontSize: 13, fontWeight: 500, letterSpacing: '0.46px',
  paddingLeft: '14px', paddingRight: '14px',
} as const;

const OUTLINED_ACTION_BUTTON_SX = {
  ...ACTION_BUTTON_SX,
  borderColor: 'rgba(99,86,225,0.5)', color: '#473bab',
  '&:hover': { borderColor: 'rgba(99,86,225,0.7)', background: 'rgba(99,86,225,0.04)' },
} as const;

interface ActionButtonProps {
  onClick: () => void;
}

function NewUrlButton({ onClick }: ActionButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      disableElevation
      size="small"
      onClick={onClick}
      startIcon={<Add style={{ fontSize: 18 }} />}
      sx={ACTION_BUTTON_SX}
    >
      New URL
    </Button>
  );
}

function FetchUrlsWithAiButton({ onClick }: ActionButtonProps) {
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={onClick}
      startIcon={<AutoAwesomeOutlined style={{ fontSize: 18 }} />}
      sx={OUTLINED_ACTION_BUTTON_SX}
    >
      Fetch URLs with AI
    </Button>
  );
}

interface UploadCsvButtonProps {
  onUploadCsv: () => void;
  onDownloadCsvTemplate: () => void;
}

function UploadCsvButton({ onUploadCsv, onDownloadCsvTemplate }: UploadCsvButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <ButtonGroup variant="outlined" disableElevation sx={{ borderRadius: 100 }}>
        <Button
          size="small"
          onClick={onUploadCsv}
          startIcon={<UploadOutlined style={{ fontSize: 18 }} />}
          sx={{
            ...OUTLINED_ACTION_BUTTON_SX,
            borderRadius: '100px 0 0 100px', paddingRight: '10px',
          }}
        >
          Upload CSV
        </Button>
        <Button
          size="small"
          aria-label="More upload options"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: '0 100px 100px 0', minWidth: 32, paddingLeft: '6px', paddingRight: '6px',
            borderColor: 'rgba(99,86,225,0.5)', color: '#473bab',
            '&:hover': { borderColor: 'rgba(99,86,225,0.7)', background: 'rgba(99,86,225,0.04)' },
          }}
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
        <MenuItem
          onClick={() => { setAnchorEl(null); onDownloadCsvTemplate(); }}
          sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.15px', lineHeight: 1.5, px: 2, py: '8px' }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <DescriptionOutlined style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
          </ListItemIcon>
          Download CSV Template
        </MenuItem>
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

function SmartUrlFetchBubble({ onAccept, onIgnore }: { onAccept: () => void; onIgnore: () => void }) {
  return (
    <div
      style={{
        position: 'absolute', top: 16, right: 16, zIndex: 5, width: 280,
        background: '#473bab', borderRadius: '16px 16px 0 16px',
        boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px rgba(0,0,0,0.14), 0px 1px 10px rgba(0,0,0,0.12)',
        padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#fafaff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <AutoAwesome style={{ fontSize: 15, color: '#473bab' }} />
        </div>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 700, fontFamily: 'Roboto, sans-serif', color: '#ffffff', letterSpacing: '0.15px', lineHeight: 1.75 }}>
          Smart URL Fetch
        </span>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#ffffff', letterSpacing: '0.17px', lineHeight: 1.43 }}>
        We think these URLs might fit your website.
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          onClick={onIgnore}
          startIcon={<Close style={{ fontSize: 16 }} />}
          sx={{
            border: '1px solid rgba(99,86,225,0.5)', borderRadius: 100, padding: '4px 10px',
            textTransform: 'capitalize', fontSize: 13, fontWeight: 500, letterSpacing: '0.46px',
            color: '#ffffff', minWidth: 0,
            '&:hover': { border: '1px solid rgba(99,86,225,0.7)', background: 'rgba(255,255,255,0.08)' },
          }}
        >
          Ignore
        </Button>
        <Button
          onClick={onAccept}
          startIcon={<Check style={{ fontSize: 16 }} />}
          sx={{
            background: '#f0f2f4', borderRadius: 100, padding: '4px 10px',
            textTransform: 'capitalize', fontSize: 13, fontWeight: 500, letterSpacing: '0.46px',
            color: '#473bab', minWidth: 0,
            '&:hover': { background: '#e2e4e8' },
          }}
        >
          Accept
        </Button>
      </div>
    </div>
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
  const [editingUrl, setEditingUrl] = useState<DestinationUrl | null>(null);
  const [fetchDialogOpen, setFetchDialogOpen] = useState(false);

  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<DestinationUrl[]>([]);

  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [csvInvalidRows, setCsvInvalidRows] = useState<number[]>([]);
  const [csvDuplicates, setCsvDuplicates] = useState<CsvDuplicateEntry[]>([]);
  const [csvPendingUnique, setCsvPendingUnique] = useState<DestinationUrl[]>([]);
  const [csvSnackbarOpen, setCsvSnackbarOpen] = useState(false);

  const filtered = urls.filter((u) => {
    const tab = TABS.find((t) => t.id === activeTab);
    const matchesTab = !tab || tab.id === 'all' || u.type === tab.type;
    const matchesSearch = u.label.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const hasTableContent = filtered.length > 0 || suggestLoading || suggestError !== null || suggestions.length > 0;

  // Suggests the remaining model-specific Inventory URLs once the user manually adds their
  // first one — reuses the same OpenAI pipeline as the "Fetch URLs with AI" dialog, scoped to
  // Inventory only and excluding models the account already has a URL for.
  const triggerModelSuggestions = async (currentUrls: DestinationUrl[]) => {
    setSuggestLoading(true);
    setSuggestError(null);
    try {
      const existingModels = currentUrls
        .filter((u) => u.type === 'Inventory' && u.ymmt)
        .map((u) => u.ymmt!.toLowerCase());
      const modelsToFetch = BMW_2026_MODELS.filter(
        (model) => !existingModels.some((existing) => existing.includes(model.toLowerCase())),
      );
      if (modelsToFetch.length === 0) return;
      const results = await fetchUrlsFromWebsite({
        website: DEFAULT_ACCOUNT_WEBSITE,
        types: ['Inventory'],
        models: modelsToFetch,
        allModelsSelected: modelsToFetch.length === BMW_2026_MODELS.length,
      });
      setSuggestions(dedupeAgainstExisting(results, currentUrls));
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : 'Something went wrong fetching suggested URLs.');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSave = (newUrl: DestinationUrl) => {
    const hadInventoryBefore = urls.some((u) => u.type === 'Inventory');
    setUrls((prev) => [...prev, newUrl]);
    setPanelOpen(false);

    if (newUrl.type === 'Inventory' && !hadInventoryBefore) {
      void triggerModelSuggestions([...urls, newUrl]);
    }
  };

  const handleUpdateUrl = (updatedUrl: DestinationUrl) => {
    setUrls((prev) => prev.map((u) => (u.id === updatedUrl.id ? updatedUrl : u)));
    setEditingUrl(null);
  };

  const handleFetchedUrls = (newUrls: DestinationUrl[]) => {
    setUrls((prev) => [...prev, ...dedupeAgainstExisting(newUrls, prev)]);
    setFetchDialogOpen(false);
  };

  const handleAcceptSuggestions = () => {
    setUrls((prev) => [...prev, ...dedupeAgainstExisting(suggestions, prev)]);
    setSuggestions([]);
  };

  const handleIgnoreSuggestions = () => {
    setSuggestions([]);
  };

  const handleUploadCsvClick = () => {
    csvFileInputRef.current?.click();
  };

  const handleCsvFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const text = await file.text();
    const { valid, invalidRows } = parseDestinationUrlsCsv(text);
    setCsvInvalidRows(invalidRows);

    const existingByLabel = new Map(urls.map((u) => [u.label.trim().toLowerCase(), u]));
    const duplicates: CsvDuplicateEntry[] = [];
    const unique: DestinationUrl[] = [];

    for (const row of valid) {
      const match = existingByLabel.get(row.label.trim().toLowerCase());
      if (match) duplicates.push({ existing: match, incoming: row });
      else unique.push(row);
    }

    if (duplicates.length > 0) {
      setCsvDuplicates(duplicates);
      setCsvPendingUnique(unique);
    } else {
      setUrls((prev) => [...prev, ...unique]);
      setCsvSnackbarOpen(true);
    }
  };

  const handleCsvReplace = () => {
    const replacedIds = new Set(csvDuplicates.map((d) => d.existing.id));
    setUrls((prev) => [
      ...prev.filter((u) => !replacedIds.has(u.id)),
      ...csvDuplicates.map((d) => d.incoming),
      ...csvPendingUnique,
    ]);
    setCsvDuplicates([]);
    setCsvPendingUnique([]);
    setCsvSnackbarOpen(true);
  };

  const handleCsvDoNotReplace = () => {
    setUrls((prev) => [...prev, ...csvPendingUnique]);
    setCsvDuplicates([]);
    setCsvPendingUnique([]);
    setCsvSnackbarOpen(true);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0" style={{ position: 'relative', minWidth: 0 }}>
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

        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleCsvFileSelected}
        />

        {csvInvalidRows.length > 0 && (
          <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
            <Alert severity="error" onClose={() => setCsvInvalidRows([])} sx={{ fontSize: 13 }}>
              {csvInvalidRows.length} URL{csvInvalidRows.length === 1 ? '' : 's'} could not be loaded due to missing or
              invalid fields. Row{csvInvalidRows.length === 1 ? '' : 's'} {csvInvalidRows.join(', ')}.
            </Alert>
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 12px', flexShrink: 0 }}>
          <IconButton size="small" sx={{ padding: '4px' }}>
            <ViewSidebarOutlined style={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
          <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0, whiteSpace: 'nowrap' }}>
            Destination URLs
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NewUrlButton onClick={() => { setEditingUrl(null); setPanelOpen(true); }} />
            <FetchUrlsWithAiButton onClick={() => setFetchDialogOpen(true)} />
            <UploadCsvButton
              onUploadCsv={handleUploadCsvClick}
              onDownloadCsvTemplate={() => downloadCsvTemplate()}
            />
          </div>

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
              {hasTableContent && (
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => { setPanelOpen(false); setEditingUrl(row); }}
                      sx={{ cursor: 'pointer', '& td': { borderBottom: '1px solid rgba(0,0,0,0.12)' } }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" sx={{ color: '#9c99a9', '&.Mui-checked': { color: '#473bab' } }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
                        {row.label}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px' }}>
                        <Link
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.17px' }}
                        >
                          {row.url}
                        </Link>
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

                  {suggestLoading && (
                    <TableRow>
                      <TableCell colSpan={COLUMNS.length + 1} sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CircularProgress size={16} sx={{ color: '#473bab' }} />
                          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                            Fetching model-specific inventory URLs with AI…
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {suggestError && (
                    <TableRow>
                      <TableCell colSpan={COLUMNS.length + 1} sx={{ borderBottom: '1px solid rgba(0,0,0,0.12)', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#b3261e', letterSpacing: '0.17px' }}>
                            {suggestError}
                          </span>
                          <IconButton size="small" onClick={() => setSuggestError(null)} sx={{ padding: '2px' }}>
                            <Close style={{ fontSize: 16, color: '#686576' }} />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {suggestions.map((row, index) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        background: 'rgba(99,86,225,0.06)',
                        '& td': {
                          borderTop: index === 0 ? '1px solid rgba(99,86,225,0.4)' : 'none',
                          borderBottom: index === suggestions.length - 1
                            ? '1px solid rgba(99,86,225,0.4)'
                            : '1px solid rgba(99,86,225,0.2)',
                        },
                        '& td:first-of-type': { borderLeft: '1px solid rgba(99,86,225,0.4)' },
                        '& td:last-of-type': { borderRight: '1px solid rgba(99,86,225,0.4)' },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" disabled sx={{ color: '#c9c3ee' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontStyle: 'italic', color: '#686576', letterSpacing: '0.17px' }}>
                        {row.label}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontStyle: 'italic', letterSpacing: '0.17px' }}>
                        <Link
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontStyle: 'italic', color: '#686576', letterSpacing: '0.17px' }}
                        >
                          {row.url}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <TypeChip type={row.type} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontStyle: 'italic', color: '#686576', letterSpacing: '0.17px' }}>
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
          {!hasTableContent && (
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 100 }}>
              <img src={emptyFolderSrc} alt="" style={{ width: 200, height: 200, objectFit: 'contain', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.43, textAlign: 'center' }}>
                No URLs added yet
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NewUrlButton onClick={() => { setEditingUrl(null); setPanelOpen(true); }} />
                <FetchUrlsWithAiButton onClick={() => setFetchDialogOpen(true)} />
                <UploadCsvButton
                  onUploadCsv={handleUploadCsvClick}
                  onDownloadCsvTemplate={() => downloadCsvTemplate()}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <SmartUrlFetchBubble onAccept={handleAcceptSuggestions} onIgnore={handleIgnoreSuggestions} />
      )}
      </div>

      {panelOpen && (
        <NewUrlPanel onClose={() => setPanelOpen(false)} onSave={handleSave} existingUrls={urls} />
      )}

      {editingUrl && (
        <NewUrlPanel
          key={editingUrl.id}
          initialValue={editingUrl}
          onClose={() => setEditingUrl(null)}
          onSave={handleUpdateUrl}
          existingUrls={urls}
        />
      )}

      <FetchUrlsDialog
        open={fetchDialogOpen}
        onClose={() => setFetchDialogOpen(false)}
        defaultWebsite={DEFAULT_ACCOUNT_WEBSITE}
        onFetched={handleFetchedUrls}
      />

      <CsvDuplicatesDialog
        open={csvDuplicates.length > 0}
        duplicates={csvDuplicates}
        onReplace={handleCsvReplace}
        onDoNotReplace={handleCsvDoNotReplace}
      />

      <Snackbar
        open={csvSnackbarOpen}
        onClose={() => setCsvSnackbarOpen(false)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message="Destination URLs creation complete"
      />
    </>
  );
};
