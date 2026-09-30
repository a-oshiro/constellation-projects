import { useState } from 'react';
import {
  Button, TextField, InputAdornment, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Menu, MenuItem, ListItemIcon,
} from '@mui/material';
import { Add, Search, ViewSidebarOutlined, MoreVert, EditOutlined, DeleteOutlined } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { Tooltip } from '../ui/Tooltip';
import { useSnackbar } from '../../context/SnackbarContext';
import { INITIAL_FIELDS } from '../../data/fields';
import type { Field, FieldSource } from '../../data/fields';
import { FieldPanel } from './FieldPanel';
import { DeleteFieldDialog } from './DeleteFieldDialog';
import emptyFolderSrc from '../../assets/empty-folder.png';

const TABS: { id: 'all' | 'client' | 'global'; label: string; source?: FieldSource }[] = [
  { id: 'all', label: 'All' },
  { id: 'client', label: 'Client', source: 'Client' },
  { id: 'global', label: 'Global', source: 'Global' },
];

const COLUMNS = [
  { key: 'name', label: 'Name', width: 240 },
  { key: 'source', label: 'Source', width: 200 },
  { key: 'type', label: 'Type', width: 200 },
  { key: 'values', label: 'Values', minWidth: 240 },
] as const;

/** Values beyond this count collapse into a "+N more" chip until expanded. */
const MAX_VISIBLE_VALUES = 10;

const GLOBAL_DELETE_TOOLTIP = 'To delete Global Fields, go to Platform Settings';

const BODY_TEXT_SX = { fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' } as const;

const MENU_ITEM_SX = { fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.15px', lineHeight: 1.5, px: 2, py: '8px' } as const;

// ── Small building blocks ────────────────────────────────────────────────────

function HeaderDivider() {
  return <span style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />;
}

function NewFieldButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="contained"
      color="primary"
      disableElevation
      size="small"
      onClick={onClick}
      startIcon={<Add style={{ fontSize: 18 }} />}
      sx={{
        borderRadius: 100, fontSize: 13, fontWeight: 500, letterSpacing: '0.46px',
        paddingLeft: '14px', paddingRight: '14px', whiteSpace: 'nowrap',
      }}
    >
      New Field
    </Button>
  );
}

// Medium MUI chips — size/label padding come from MUI; only the corner radius and font are overridden.
const CHIP_SX = {
  borderRadius: '8px', fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px',
} as const;

const GRAY_CHIP_SX = { ...CHIP_SX, background: 'rgba(17,16,20,0.04)', color: '#1f1d25' } as const;

function GrayChip({ label }: { label: string }) {
  return <Chip label={label} size="medium" sx={GRAY_CHIP_SX} />;
}

function SourceChip({ source }: { source: FieldSource }) {
  if (source === 'Global') return <Chip label={source} size="medium" color="primary" sx={CHIP_SX} />;
  return <GrayChip label={source} />;
}

function FieldValues({ values }: { values: string[] }) {
  const [expanded, setExpanded] = useState(false);

  if (values.length === 0) return <GrayChip label="-" />;

  const overflow = values.length - MAX_VISIBLE_VALUES;
  const shown = expanded || overflow <= 0 ? values : values.slice(0, MAX_VISIBLE_VALUES);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {shown.map((value) => <GrayChip key={value} label={value} />)}
      {overflow > 0 && (
        <Chip
          label={expanded ? 'Show less' : `+${overflow} more`}
          size="medium"
          variant="outlined"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          sx={{ ...CHIP_SX, background: 'transparent', border: '1px solid rgba(0,0,0,0.23)' }}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export const FieldsTab = () => {
  const { showSnackbar } = useSnackbar();
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [menuState, setMenuState] = useState<{ field: Field; el: HTMLElement } | null>(null);
  const [deletingField, setDeletingField] = useState<Field | null>(null);

  const tabSource = TABS.find((t) => t.id === activeTab)?.source;
  const query = search.trim().toLowerCase();

  const filtered = fields
    .filter((f) => !tabSource || f.source === tabSource)
    .filter((f) => !query || f.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const openNewField = () => {
    setEditingField(null);
    setPanelOpen(true);
  };

  const openEditField = (field: Field) => {
    setPanelOpen(false);
    setEditingField(field);
  };

  const handleCreate = (field: Field) => {
    setFields((prev) => [...prev, field]);
    setPanelOpen(false);
    showSnackbar({ message: `“${field.name}” field created` });
  };

  const handleUpdate = (field: Field) => {
    setFields((prev) => prev.map((f) => (f.id === field.id ? field : f)));
    setEditingField(null);
    showSnackbar({ message: `“${field.name}” field updated` });
  };

  const handleConfirmDelete = () => {
    if (!deletingField) return;
    setFields((prev) => prev.filter((f) => f.id !== deletingField.id));
    if (editingField?.id === deletingField.id) setEditingField(null);
    showSnackbar({ message: `“${deletingField.name}” field deleted` });
    setDeletingField(null);
  };

  const menuField = menuState?.field;
  const deleteDisabled = menuField?.source === 'Global';

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
          <Breadcrumbs items={['Settings', 'Fields']} />
        </div>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 12px', flexShrink: 0 }}>
          <IconButton size="small" sx={{ padding: '4px' }}>
            <ViewSidebarOutlined style={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
          <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: '0 4px 0 0', whiteSpace: 'nowrap' }}>
            Fields
          </h1>
          <NewFieldButton onClick={openNewField} />

          <TextField
            size="small"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 20, color: '#9c99a9' }} /></InputAdornment> },
            }}
            sx={{
              minWidth: 160, width: 200,
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

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
                letterSpacing: '0.4px', minHeight: 42, padding: '9px 16px', minWidth: 0, color: '#686576',
                '&.Mui-selected': { color: '#473bab' },
              }}
            />
          ))}
        </Tabs>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <TableContainer sx={{ overflowX: 'visible' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        width: 'width' in col ? col.width : undefined,
                        minWidth: 'minWidth' in col ? col.minWidth : undefined,
                        fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', background: '#ffffff',
                        color: '#1f1d25', letterSpacing: '0.17px', borderBottom: '1px solid rgba(0,0,0,0.12)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <HeaderDivider />
                        {col.label}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 48, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.12)' }} />
                </TableRow>
              </TableHead>
              {filtered.length > 0 && (
                <TableBody>
                  {filtered.map((row) => {
                    const menuOpenForRow = menuState?.field.id === row.id;
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        selected={editingField?.id === row.id}
                        onClick={() => openEditField(row)}
                        sx={{
                          cursor: 'pointer',
                          '& td': { borderBottom: '1px solid rgba(0,0,0,0.12)', verticalAlign: 'top' },
                          '&:hover .row-menu-btn': { opacity: 1 },
                          '&.Mui-selected, &.Mui-selected:hover': { background: 'rgba(99,86,225,0.04)' },
                        }}
                      >
                        <TableCell sx={{ ...BODY_TEXT_SX, paddingTop: '24px' }}>{row.name}</TableCell>
                        <TableCell><SourceChip source={row.source} /></TableCell>
                        <TableCell><GrayChip label={row.type} /></TableCell>
                        <TableCell><FieldValues values={row.values} /></TableCell>
                        <TableCell padding="none" onClick={(e) => e.stopPropagation()} sx={{ width: 48, paddingTop: '18px !important', paddingRight: '8px !important' }}>
                          <IconButton
                            className="row-menu-btn"
                            size="small"
                            aria-label={`More actions for ${row.name}`}
                            aria-haspopup="menu"
                            onClick={(e) => setMenuState({ field: row, el: e.currentTarget })}
                            sx={{ opacity: menuOpenForRow ? 1 : 0, padding: '4px', transition: 'opacity 0.1s', '&:focus-visible': { opacity: 1 } }}
                          >
                            <MoreVert style={{ fontSize: 20, color: '#686576' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </TableContainer>

          {/* ── Empty state ────────────────────────────────────────────── */}
          {filtered.length === 0 && (
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 100 }}>
              <img src={emptyFolderSrc} alt="" style={{ width: 200, height: 200, objectFit: 'contain', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.43, textAlign: 'center' }}>
                {query ? `No fields match “${search.trim()}”` : 'No fields added yet'}
              </p>
              {!query && activeTab !== 'global' && <NewFieldButton onClick={openNewField} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Row actions menu (one shared menu for the table) ──────────── */}
      <Menu
        anchorEl={menuState?.el ?? null}
        open={!!menuState}
        onClose={() => setMenuState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 140, borderRadius: '4px',
              boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuField) openEditField(menuField);
            setMenuState(null);
          }}
          sx={MENU_ITEM_SX}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <EditOutlined style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
          </ListItemIcon>
          Edit
        </MenuItem>
        {/* Disabled MenuItems swallow pointer events, so the tooltip is anchored to a wrapper. */}
        <Tooltip title={deleteDisabled ? GLOBAL_DELETE_TOOLTIP : ''} placement="left">
          <div>
            <MenuItem
              disabled={deleteDisabled}
              onClick={() => {
                if (menuField) setDeletingField(menuField);
                setMenuState(null);
              }}
              sx={MENU_ITEM_SX}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <DeleteOutlined style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
              </ListItemIcon>
              Delete
            </MenuItem>
          </div>
        </Tooltip>
      </Menu>

      {panelOpen && (
        <FieldPanel onClose={() => setPanelOpen(false)} onSave={handleCreate} existingFields={fields} />
      )}

      {editingField && (
        <FieldPanel
          key={editingField.id}
          initialValue={editingField}
          onClose={() => setEditingField(null)}
          onSave={handleUpdate}
          existingFields={fields}
        />
      )}

      <DeleteFieldDialog
        open={!!deletingField}
        fieldName={deletingField?.name ?? ''}
        onCancel={() => setDeletingField(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
