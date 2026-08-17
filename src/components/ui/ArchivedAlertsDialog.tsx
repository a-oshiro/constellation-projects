import { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Chip } from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import type { Alert, Offer, Asset } from '../../data/types';
import {
  DEFAULT_ALERT_FILTER_STATE, applyAlertFilters, getActiveFilterChips, getActiveFilterFieldCount,
  removeFilterChip, hasActiveAlertFilters, LIFECYCLE_STEP_LABELS, getModelType,
} from '../../utils/alertFilters';
import type { AlertFilterState } from '../../utils/alertFilters';
import { CATEGORY_STYLE } from '../../utils/alertReview';
import { formatRelativeTime } from '../../utils/relativeTime';
import { AlertsFilterPanel } from './AlertsFilterPanel';
import { ArchivedAlertsTable } from './ArchivedAlertsTable';
import {
  AlertThumbnail, ReviewRow, lastActorFor, FiltersIconWithBadge, TableViewIcon, KanbanViewIcon, CHIP_SX,
} from './AlertsKanbanBoard';

type ViewMode = 'card' | 'table';

const NEUTRAL_CHIP_SX = {
  display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', color: '#1f1d25',
  borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.16px', whiteSpace: 'nowrap',
} as const;

interface ArchivedAlertCardProps {
  alert: Alert;
  assets: Asset[];
  onOpen: () => void;
}

const ArchivedAlertCard = ({ alert, assets, onOpen }: ArchivedAlertCardProps) => {
  const categoryStyle = CATEGORY_STYLE[alert.category];
  return (
    <div
      onClick={onOpen}
      style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden',
        display: 'flex', alignItems: 'stretch', cursor: 'pointer',
      }}
    >
      <div style={{ width: 90, flexShrink: 0 }}>
        <AlertThumbnail assets={assets} size={90} />
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', background: categoryStyle.background, color: categoryStyle.color, borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px', whiteSpace: 'nowrap' }}>
            {alert.category}
          </span>
          <span style={NEUTRAL_CHIP_SX}>{getModelType(alert)}</span>
          <span style={NEUTRAL_CHIP_SX}>{LIFECYCLE_STEP_LABELS[alert.status]}</span>
        </div>
        <div>
          <p style={{
            margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {alert.subject}
          </p>
          <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
            Archived {formatRelativeTime(alert.archivedAt ?? alert.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ReviewRow label="Email content" status={alert.emailStatus} actorName={lastActorFor(alert, 'email')} revealActor />
          <ReviewRow label="Assets" status={alert.assetsStatus} actorName={lastActorFor(alert, 'assets')} revealActor />
        </div>
      </div>
    </div>
  );
};

interface ArchivedAlertsDialogProps {
  alerts: Alert[];
  offers: Offer[];
  assetsByAlertId: Map<string, Asset[]>;
  onClose: () => void;
  onOpenAlert: (id: string) => void;
}

/** Full-screen, dismissable overlay listing every manually-archived alert — same construction as AlertDialog (inset:16, portal to body). */
export const ArchivedAlertsDialog = ({ alerts, offers, assetsByAlertId, onClose, onOpenAlert }: ArchivedAlertsDialogProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Defaults to 'all' time (unlike the Kanban board's 'this month') — an archive is meant to show
  // everything that's been put away, not just what was generated recently.
  const [filterState, setFilterState] = useState<AlertFilterState>({ ...DEFAULT_ALERT_FILTER_STATE, datePreset: 'all' });

  const filteredByFields = useMemo(() => applyAlertFilters(alerts, offers, filterState), [alerts, offers, filterState]);
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return filteredByFields;
    return filteredByFields.filter((alert) => alert.subject.toLowerCase().includes(query));
  }, [filteredByFields, searchQuery]);
  const activeFilterChips = useMemo(() => getActiveFilterChips(filterState), [filterState]);
  const activeFilterFieldCount = useMemo(() => getActiveFilterFieldCount(filterState), [filterState]);

  const updateFilterState = (updates: Partial<AlertFilterState>) => setFilterState((prev) => ({ ...prev, ...updates }));

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }} />
      <div
        style={{
          position: 'fixed', inset: 16, zIndex: 100001,
          background: '#ffffff', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Archived Alerts
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body: optional filter panel + main content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {filterPanelOpen && (
            <AlertsFilterPanel
              alerts={alerts}
              offers={offers}
              state={filterState}
              onChange={updateFilterState}
              onClose={() => setFilterPanelOpen(false)}
            />
          )}

          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar — filter icon, search, item count, and card/table toggle, right above the content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0', flexShrink: 0, flexWrap: 'wrap' }}>
              <IconButton
                size="large"
                onClick={() => setFilterPanelOpen((v) => !v)}
                sx={{
                  padding: '5px', flexShrink: 0,
                  color: filterPanelOpen || hasActiveAlertFilters(filterState) ? '#473bab' : '#1f1d25',
                  '&:hover': { background: '#f0eeff', color: '#473bab' },
                }}
              >
                <FiltersIconWithBadge count={activeFilterFieldCount} />
              </IconButton>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f9fafa', border: '1px solid #dddce0', borderRadius: 20,
                padding: '0 8px', height: 34, boxSizing: 'border-box', width: 240, flexShrink: 0,
              }}>
                <Search style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find archived alert"
                  style={{
                    flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px',
                  }}
                />
              </div>

              <div style={{ flex: 1 }} />

              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                {filtered.length} {filtered.length === 1 ? 'Item' : 'Items'}
              </span>

              <IconButton
                size="large"
                onClick={() => setViewMode((prev) => (prev === 'card' ? 'table' : 'card'))}
                title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
                sx={{ padding: '5px', flexShrink: 0, color: '#686576', '&:hover': { background: '#f0eeff', color: '#473bab' } }}
              >
                {viewMode === 'card' ? <TableViewIcon /> : <KanbanViewIcon />}
              </IconButton>
            </div>

            {/* Active filter chips row */}
            {activeFilterChips.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 0', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
                  Filtering by
                </span>
                {activeFilterChips.map((chip) => (
                  <Chip
                    key={chip.id}
                    label={chip.label}
                    onDelete={() => updateFilterState(removeFilterChip(filterState, chip))}
                    sx={CHIP_SX}
                  />
                ))}
                <button
                  onClick={() => setFilterState({ ...DEFAULT_ALERT_FILTER_STATE, datePreset: 'all' })}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16 }}>
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#686576', fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
                  No archived alerts to show.
                </div>
              ) : viewMode === 'card' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                  {filtered.map((alert) => (
                    <ArchivedAlertCard
                      key={alert.id}
                      alert={alert}
                      assets={assetsByAlertId.get(alert.id) ?? []}
                      onOpen={() => onOpenAlert(alert.id)}
                    />
                  ))}
                </div>
              ) : (
                <ArchivedAlertsTable alerts={filtered} assetsByAlertId={assetsByAlertId} onOpenAlert={onOpenAlert} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};
