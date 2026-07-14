import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, IconButton, TextField, Avatar, AvatarGroup, Tooltip,
} from '@mui/material';
import { Add, MoreVert, Search, ArrowDownward, Inventory2Outlined } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { AccountLogo } from '../ui/AccountLogo';
import { ACCOUNTS, accountColor, type DataSource, type AccountUser } from '../../data/accounts';

// ── Small building blocks ────────────────────────────────────────────────────

function DataSourceChip({ source }: { source: DataSource }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '3px 8px', borderRadius: 8,
        background: '#f0f2f4', color: '#1f1d25',
        fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, letterSpacing: '0.17px',
        whiteSpace: 'nowrap',
      }}
    >
      {source}
    </span>
  );
}

function AddDisclosureButton() {
  return (
    <button
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px 3px 8px', borderRadius: 100,
        border: '1px solid rgba(99,86,225,0.5)', background: 'transparent',
        color: '#473bab', fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
        letterSpacing: '0.17px', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <Add style={{ fontSize: 14 }} />
      Add
    </button>
  );
}

function UsersAvatarGroup({ accountUsers }: { accountUsers: AccountUser[] }) {
  return (
    <AvatarGroup
      max={4}
      sx={{
        justifyContent: 'flex-end',
        '& .MuiAvatar-root': {
          width: 28, height: 28, fontSize: 11, fontWeight: 500,
          fontFamily: 'Roboto, sans-serif', border: '2px solid #ffffff',
        },
      }}
    >
      {accountUsers.map((u) => (
        <Tooltip key={u.id} title={u.name}>
          <Avatar sx={{ bgcolor: accountColor(u.name) }}>{u.initials}</Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}

const HEADER_CELL_SX = {
  fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  color: '#686576', letterSpacing: '0.17px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap',
} as const;

const BODY_CELL_SX = {
  fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', whiteSpace: 'nowrap',
} as const;

// ── Main component ───────────────────────────────────────────────────────────

export const AccountsTab = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filteredAccounts = ACCOUNTS.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const allSelected = filteredAccounts.length > 0 && filteredAccounts.every((a) => selected.includes(a.id));
  const someSelected = filteredAccounts.some((a) => selected.includes(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !filteredAccounts.some((a) => a.id === id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...filteredAccounts.map((a) => a.id)])));
    }
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div
      className="flex h-full flex-1 min-w-0"
      style={{
        background: '#ffffff', borderRadius: 16, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px 12px', flexShrink: 0 }}>
        <div style={{ marginBottom: 6 }}>
          <Breadcrumbs items={['Settings', 'Accounts']} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
            Accounts
          </h1>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px 6px 12px', borderRadius: 100,
              border: 'none', background: '#473bab', color: '#ffffff',
              fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.4px', cursor: 'pointer',
            }}
          >
            <Add style={{ fontSize: 18 }} />
            New Account
          </button>
          <IconButton size="small">
            <MoreVert style={{ fontSize: 18 }} />
          </IconButton>

          <div style={{ flex: 1 }} />

          <TextField
            size="small"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <Search style={{ fontSize: 20, color: '#9c99a9', marginRight: 6, flexShrink: 0 }} /> },
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
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onChange={toggleAll}
                    sx={{ color: '#9c99a9', '&.Mui-checked': { color: '#473bab' } }}
                  />
                </TableCell>
                <TableCell sx={HEADER_CELL_SX}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Name
                    <ArrowDownward style={{ fontSize: 14 }} />
                  </div>
                </TableCell>
                <TableCell sx={HEADER_CELL_SX}>Inventory</TableCell>
                <TableCell sx={HEADER_CELL_SX}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Data Source
                    <ArrowDownward style={{ fontSize: 14 }} />
                  </div>
                </TableCell>
                <TableCell sx={HEADER_CELL_SX}>Disclosure Template</TableCell>
                <TableCell sx={HEADER_CELL_SX}>URL</TableCell>
                <TableCell sx={HEADER_CELL_SX}>Brand</TableCell>
                <TableCell sx={{ ...HEADER_CELL_SX, textAlign: 'right' }}>Users</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.map((account) => {
                const isSelected = selected.includes(account.id);
                return (
                  <TableRow
                    key={account.id}
                    hover
                    onClick={() => navigate(`/settings/accounts/${account.id}`)}
                    sx={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99,86,225,0.08)' : 'transparent',
                      '& td': { borderBottom: '1px solid #f0f0f0' },
                    }}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleRow(account.id)}
                        sx={{ color: '#9c99a9', '&.Mui-checked': { color: '#473bab' } }}
                      />
                    </TableCell>
                    <TableCell sx={BODY_CELL_SX}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AccountLogo name={account.name} />
                        <span style={{ color: '#473bab', fontWeight: 500 }}>{account.name}</span>
                      </div>
                    </TableCell>
                    <TableCell sx={BODY_CELL_SX} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Inventory settings">
                        <IconButton size="small" sx={{ padding: '2px' }}>
                          <Inventory2Outlined style={{ fontSize: 18, color: '#686576' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={BODY_CELL_SX}>
                      <DataSourceChip source={account.dataSource} />
                    </TableCell>
                    <TableCell sx={BODY_CELL_SX}>
                      {account.disclosureTemplate ? account.disclosureTemplate : <AddDisclosureButton />}
                    </TableCell>
                    <TableCell sx={{ ...BODY_CELL_SX, color: '#686576' }}>{account.disclosureUrl}</TableCell>
                    <TableCell sx={BODY_CELL_SX}>{account.brand}</TableCell>
                    <TableCell sx={{ ...BODY_CELL_SX, textAlign: 'right' }}>
                      <UsersAvatarGroup accountUsers={account.users} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};
