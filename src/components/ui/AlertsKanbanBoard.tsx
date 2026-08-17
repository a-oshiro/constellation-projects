import { useMemo, useState } from 'react';
import { Checkbox, IconButton, Chip, Menu, MenuItem, ListItemIcon } from '@mui/material';
import {
  Close, Check, Replay, Send, CheckCircle, Cancel, CheckCircleOutlined, MoreVert, Inventory2Outlined,
} from '@mui/icons-material';
import type { Alert, AlertStatus, ReviewStatus, Asset } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { useLayout } from '../../context/LayoutContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { computePreviewAssets } from '../../utils/overviewAssets';
import { CATEGORY_STYLE, formatReviewerName } from '../../utils/alertReview';
import { applyAlertFilters, getActiveFilterChips, removeFilterChip, hasActiveAlertFilters, getActiveFilterFieldCount } from '../../utils/alertFilters';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { AlertDialog } from './AlertDialog';
import { AlertsTable } from './AlertsTable';
import { FeedQc } from './FeedQc';
import { ArchivedAlertsDialog } from './ArchivedAlertsDialog';

type ViewMode = 'kanban' | 'table';

export const CHIP_SX = {
  background: '#f0f2f4',
  borderRadius: '8px',
  height: 24,
  maxHeight: 24,
  '& .MuiChip-label': {
    fontSize: 11,
    fontFamily: 'Roboto, sans-serif',
    color: '#1f1d25',
    letterSpacing: '0.16px',
    padding: '0 6px',
  },
  '& .MuiChip-deleteIcon': {
    fontSize: 16,
    opacity: 0.26,
    color: '#1f1d25',
    margin: '0 4px 0 -2px',
  },
};

export const FiltersIcon = () => (
  <svg width={28} height={28} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.2915 8.95825H22.7082M12.2915 21.0416H17.7082M9.7915 14.9999H20.2082" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const FiltersIconWithBadge = ({ count }: { count: number }) => (
  <div style={{ position: 'relative', display: 'inline-flex' }}>
    <FiltersIcon />
    {count > 0 && (
      <span
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#473bab',
          color: '#ffffff',
          fontSize: 10,
          lineHeight: '10px',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {count}
      </span>
    )}
  </div>
);

export const TableViewIcon = () => (
  <svg width={28} height={28} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.16659 17.4998H20.8333C21.2916 17.4998 21.6666 17.1248 21.6666 16.6665C21.6666 16.2082 21.2916 15.8332 20.8333 15.8332H9.16659C8.70825 15.8332 8.33325 16.2082 8.33325 16.6665C8.33325 17.1248 8.70825 17.4998 9.16659 17.4998ZM9.16659 20.8332H20.8333C21.2916 20.8332 21.6666 20.4582 21.6666 19.9998C21.6666 19.5415 21.2916 19.1665 20.8333 19.1665H9.16659C8.70825 19.1665 8.33325 19.5415 8.33325 19.9998C8.33325 20.4582 8.70825 20.8332 9.16659 20.8332ZM9.16659 14.1665H20.8333C21.2916 14.1665 21.6666 13.7915 21.6666 13.3332C21.6666 12.8748 21.2916 12.4998 20.8333 12.4998H9.16659C8.70825 12.4998 8.33325 12.8748 8.33325 13.3332C8.33325 13.7915 8.70825 14.1665 9.16659 14.1665ZM8.33325 9.99984C8.33325 10.4582 8.70825 10.8332 9.16659 10.8332H20.8333C21.2916 10.8332 21.6666 10.4582 21.6666 9.99984C21.6666 9.5415 21.2916 9.1665 20.8333 9.1665H9.16659C8.70825 9.1665 8.33325 9.5415 8.33325 9.99984Z" fill="currentColor" />
  </svg>
);

export const KanbanViewIcon = () => (
  <svg width={28} height={28} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.5588 8C22.0786 8 22.5 8.39797 22.5 8.88889L22.5 21.1111C22.5 21.602 22.0786 22 21.5588 22L19.7353 22C19.2155 22 18.7941 21.602 18.7941 21.1111L18.7941 8.88889C18.7941 8.39797 19.2155 8 19.7353 8L21.5588 8Z" fill="currentColor" />
    <path d="M15.9118 8C16.4316 8 16.8529 8.39797 16.8529 8.88889L16.8529 21.1111C16.8529 21.602 16.4316 22 15.9118 22L14.0882 22C13.5684 22 13.1471 21.602 13.1471 21.1111L13.1471 8.88889C13.1471 8.39797 13.5684 8 14.0882 8L15.9118 8Z" fill="currentColor" />
    <path d="M10.2647 8C10.7845 8 11.2059 8.39797 11.2059 8.88889L11.2059 21.1111C11.2059 21.602 10.7845 22 10.2647 22L8.44118 22C7.92138 22 7.5 21.602 7.5 21.1111L7.5 8.88889C7.5 8.39797 7.92138 8 8.44118 8L10.2647 8Z" fill="currentColor" />
  </svg>
);

const COLUMNS: { key: AlertStatus; label: string }[] = [
  { key: 'generated', label: 'Generated' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'approved', label: 'Approved' },
  { key: 'sent', label: 'Sent' },
];

interface ColumnAction {
  icon: React.ElementType;
  color: string;
  borderColor: string;
  targetStatus: AlertStatus;
  label: string;
}

/** Per-column lifecycle actions — mirrors the AlertDialog footer and the Kanban drag-drop transition matrix. */
const COLUMN_ACTIONS: Partial<Record<AlertStatus, ColumnAction[]>> = {
  generated: [
    { icon: Close, color: '#d2323f', borderColor: 'rgba(210,50,63,0.5)', targetStatus: 'rejected', label: 'Reject' },
    { icon: Check, color: '#4caf50', borderColor: 'rgba(76,175,80,0.5)', targetStatus: 'approved', label: 'Approve' },
  ],
  rejected: [
    { icon: Replay, color: '#473bab', borderColor: 'rgba(99,86,225,0.5)', targetStatus: 'generated', label: 'Rebuild' },
  ],
  approved: [
    { icon: Send, color: '#473bab', borderColor: 'rgba(99,86,225,0.5)', targetStatus: 'sent', label: 'Send' },
  ],
};

/** Labels for the Rejected/Approved cards' quick actions when surfaced in the card's three-dot menu. */
const CARD_MENU_ACTION_LABEL: Partial<Record<AlertStatus, string>> = {
  rejected: 'Rebuild Alert',
  approved: 'Send Alert',
};

/** Most recent activity entry for a given review track, used to attribute its row on the card. */
export function lastActorFor(alert: Alert, track: 'email' | 'assets'): string | undefined {
  const actions = track === 'email' ? ['email_approved', 'email_rejected'] : ['assets_approved', 'assets_rejected'];
  const entry = [...alert.activity].reverse().find((e) => actions.includes(e.action));
  return entry?.actorName;
}

const REVIEW_ROW_STYLE: Record<ReviewStatus, { Icon: React.ElementType; color: string }> = {
  pending: { Icon: CheckCircleOutlined, color: '#9c99a9' },
  approved: { Icon: CheckCircle, color: '#4caf50' },
  rejected: { Icon: Cancel, color: '#d2323f' },
};

interface ReviewRowProps {
  label: string;
  status: ReviewStatus;
  actorName?: string;
  revealActor: boolean;
  showPendingLabel?: boolean;
}

export const ReviewRow = ({ label, status, actorName, revealActor, showPendingLabel = true }: ReviewRowProps) => {
  const { Icon, color } = REVIEW_ROW_STYLE[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon style={{ fontSize: 16, color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ flexShrink: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px', whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {status === 'pending' ? (showPendingLabel ? 'Pending' : '') : revealActor ? formatReviewerName(actorName ?? '') : ''}
      </span>
    </div>
  );
};

export const THUMB_SIZE = 72;

const ThumbTile = ({ asset, dim }: { asset: Asset; dim?: boolean }) => {
  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: dim ? 'brightness(0.5)' : undefined,
    }}>
      <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
        <FilledTemplatePreview
          template={{ id: asset.templateId, name: '', type: asset.imageType, width: asset.width, height: asset.height, brand: '', previewUrl: '' }}
          offer={asset.offer}
          backgroundUrl={asset.backgroundUrl}
        />
      </div>
    </div>
  );
};

/** Preview of the assets referenced by an alert's email — one full tile, or a 2x2 grid with a "+N" overlay past four. */
export const AlertThumbnail = ({ assets, size = THUMB_SIZE }: { assets: Asset[]; size?: number }) => {
  if (assets.length === 0) {
    return <div style={{ width: size, height: size, borderRadius: 12, background: '#f0f2f4', flexShrink: 0 }} />;
  }

  if (assets.length === 1) {
    return (
      <div style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
        <ThumbTile asset={assets[0]} />
      </div>
    );
  }

  const overflow = assets.length > 4 ? assets.length - 3 : 0;
  const gridAssets = overflow > 0 ? assets.slice(0, 3) : assets.slice(0, 4);

  return (
    <div style={{
      width: size, height: size, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, background: '#ffffff',
    }}>
      {gridAssets.map((asset) => <ThumbTile key={asset.id} asset={asset} />)}
      {overflow > 0 && (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <ThumbTile asset={assets[3]} dim />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          }}>
            +{overflow}
          </div>
        </div>
      )}
    </div>
  );
};

interface AlertCardProps {
  alert: Alert;
  assets: Asset[];
  dragging: boolean;
  selected: boolean;
  selectable: boolean;
  bulkActive: boolean;
  onToggleSelect: (checked: boolean) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (status: AlertStatus) => void;
  onArchive: () => void;
}

const AlertCard = ({
  alert, assets, dragging, selected, selectable, bulkActive, onToggleSelect, onDragStart, onDragEnd, onOpen, onMove, onArchive,
}: AlertCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const categoryStyle = CATEGORY_STYLE[alert.category];
  const actions = COLUMN_ACTIONS[alert.status] ?? [];
  const highlighted = hovered || selected;
  const showCardMenuActions = actions.length > 0 && alert.status !== 'generated';
  const showArchiveButton = (hovered || !!menuAnchor) && !bulkActive;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: highlighted ? '2px solid #473bab' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: '10px 12px 10px 4px',
        display: 'flex',
        gap: 4,
        cursor: 'pointer',
        opacity: dragging ? 0.4 : 1,
        position: 'relative',
      }}
    >
      {selectable ? (
        <Checkbox
          size="small"
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onToggleSelect(e.target.checked)}
          style={{ margin: 4, padding: 0, flexShrink: 0, position: 'absolute', top: 0, left: 0, zIndex: 1, backgroundColor: '#ffffff', borderRadius: 4 }}
        />
      ) : (
        <div style={{ width: 0, flexShrink: 0 }} />
      )}
      <AlertThumbnail assets={assets} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span
          style={{
            display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center',
            background: categoryStyle.background, color: categoryStyle.color,
            borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif',
            fontWeight: 400, letterSpacing: '0.4px', whiteSpace: 'nowrap',
          }}
        >
          {alert.category}
        </span>
        <span
          style={{
            fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25',
            letterSpacing: '0.17px', lineHeight: 1.43,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {alert.subject}
        </span>
        {alert.status === 'generated' && (
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
            Created {formatRelativeTime(alert.createdAt)}
          </span>
        )}
        <ReviewRow label="Email content" status={alert.emailStatus} actorName={lastActorFor(alert, 'email')} revealActor={hovered} showPendingLabel={false} />
        <ReviewRow label="Assets" status={alert.assetsStatus} actorName={lastActorFor(alert, 'assets')} revealActor={hovered} showPendingLabel={false} />
      </div>

      {showArchiveButton && (
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
          sx={{
            position: 'absolute', top: 6, right: 6, padding: '4px',
            background: '#ffffff', boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.2)',
            '&:hover': { background: '#f0eeff' },
          }}
        >
          <MoreVert style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      )}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        {showCardMenuActions && actions.map((action) => (
          <MenuItem key={action.label} onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onMove(action.targetStatus); }}>
            <ListItemIcon><action.icon fontSize="small" /></ListItemIcon>
            {CARD_MENU_ACTION_LABEL[alert.status] ?? action.label}
          </MenuItem>
        ))}
        <MenuItem onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onArchive(); }}>
          <ListItemIcon><Inventory2Outlined fontSize="small" /></ListItemIcon>
          Archive Alert
        </MenuItem>
      </Menu>
    </div>
  );
};

export const AlertsKanbanBoard = () => {
  const { alerts, offers, moveAlert, archiveAlert, currentProject } = useProject();
  const {
    alertsFilterPanelOpen, openAlertsFilterPanel, closeAlertsFilterPanel,
    alertFilterState, updateAlertFilterState, resetAlertFilterState,
  } = useLayout();
  const { showSnackbar } = useSnackbar();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AlertStatus | null>(null);
  const [openAlertId, setOpenAlertId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [archiveMenuAnchor, setArchiveMenuAnchor] = useState<HTMLElement | null>(null);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);

  // One representative preview asset per offer, used to build each alert card's thumbnail
  // from the offers its email actually references (featured + the secondary grid).
  const assetByOfferId = useMemo(() => {
    const previewAssets = computePreviewAssets(
      currentProject.offers, currentProject.templates, currentProject.backgrounds, currentProject.projectName,
    );
    const map = new Map<string, Asset>();
    previewAssets.forEach((asset) => {
      if (!map.has(asset.offerId)) map.set(asset.offerId, asset);
    });
    return map;
  }, [currentProject]);

  const assetsByAlertId = useMemo(() => {
    const map = new Map<string, Asset[]>();
    alerts.forEach((alert) => {
      const offerIds = [alert.featuredOfferId, ...alert.otherOfferIds];
      const assets = offerIds.map((id) => assetByOfferId.get(id)).filter((a): a is Asset => Boolean(a));
      map.set(alert.id, assets);
    });
    return map;
  }, [alerts, assetByOfferId]);

  // Archived alerts are pulled off the board entirely — they only show up in the Archived Alerts dialog.
  const activeAlerts = useMemo(() => alerts.filter((a) => !a.archivedAt), [alerts]);
  const archivedAlerts = useMemo(() => alerts.filter((a) => a.archivedAt), [alerts]);

  const filtered = useMemo(
    () => applyAlertFilters(activeAlerts, offers, alertFilterState),
    [activeAlerts, offers, alertFilterState],
  );

  const activeFilterChips = useMemo(() => getActiveFilterChips(alertFilterState), [alertFilterState]);
  const activeFilterFieldCount = useMemo(() => getActiveFilterFieldCount(alertFilterState), [alertFilterState]);

  const byColumn = useMemo(() => {
    const map: Record<AlertStatus, Alert[]> = { generated: [], rejected: [], approved: [], sent: [] };
    filtered.forEach((a) => map[a.status].push(a));
    return map;
  }, [filtered]);

  const openAlert = alerts.find((a) => a.id === openAlertId) ?? null;

  // Every code path that changes an alert's status (drag-drop, per-card hover actions, bulk actions)
  // routes through here so the moved id never lingers selected in its old column.
  const moveAndDeselect = (id: string, status: AlertStatus) => {
    moveAlert(id, status);
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Mirrors moveAndDeselect: manual archiving also needs to drop the id from any in-progress bulk selection.
  const archiveAndDeselect = (id: string) => {
    archiveAlert(id);
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showSnackbar({ message: 'Alert archived' });
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleBulkAction = (columnAlerts: Alert[], targetStatus: AlertStatus) => {
    columnAlerts.filter((a) => selectedIds.has(a.id)).forEach((a) => moveAndDeselect(a.id, targetStatus));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton
          size="large"
          onClick={() => (alertsFilterPanelOpen ? closeAlertsFilterPanel() : openAlertsFilterPanel())}
          sx={{
            padding: '5px', flexShrink: 0,
            color: alertsFilterPanelOpen || hasActiveAlertFilters(alertFilterState) ? '#473bab' : '#1f1d25',
            '&:hover': { background: '#f0eeff', color: '#473bab' },
          }}
        >
          <FiltersIconWithBadge count={activeFilterFieldCount} />
        </IconButton>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          Alerts Lifecycle
        </span>
        <div style={{ marginLeft: 8 }}>
          <FeedQc />
        </div>
        <IconButton
          size="large"
          onClick={(e) => setArchiveMenuAnchor(e.currentTarget)}
          sx={{ padding: '5px', flexShrink: 0, color: '#1f1d25', '&:hover': { background: '#f0eeff', color: '#473bab' } }}
        >
          <MoreVert style={{ fontSize: 24 }} />
        </IconButton>
        <Menu anchorEl={archiveMenuAnchor} open={!!archiveMenuAnchor} onClose={() => setArchiveMenuAnchor(null)}>
          <MenuItem onClick={() => { setArchiveMenuAnchor(null); setArchivedDialogOpen(true); }}>
            <ListItemIcon><Inventory2Outlined fontSize="small" /></ListItemIcon>
            View archived alerts
          </MenuItem>
        </Menu>
        <div style={{ flex: 1 }} />
        
        {/* If any filters are active, show them as chips with a "Clear Filters" button. */}
        {activeFilterChips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
              Filtering by
            </span>
            {activeFilterChips.map((chip) => (
              <Chip
                key={chip.id}
                label={chip.label}
                onDelete={() => updateAlertFilterState(removeFilterChip(alertFilterState, chip))}
                sx={CHIP_SX}
              />
            ))}
            <button
              onClick={resetAlertFilterState}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px',
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

        <IconButton
          size="large"
          onClick={() => setViewMode((prev) => (prev === 'kanban' ? 'table' : 'kanban'))}
          title={viewMode === 'kanban' ? 'Switch to table view' : 'Switch to Kanban view'}
          sx={{ padding: '5px', flexShrink: 0, color: '#686576', '&:hover': { background: '#f0eeff', color: '#473bab' } }}
        >
          {viewMode === 'kanban' ? <TableViewIcon /> : <KanbanViewIcon />}
        </IconButton>
      </div>

      {viewMode === 'table' ? (
        <AlertsTable alerts={filtered} assetsByAlertId={assetsByAlertId} onOpenAlert={setOpenAlertId} onArchive={archiveAndDeselect} />
      ) : (
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', height: 'fit-content' }}>
        {COLUMNS.map((col) => {
          const columnAlerts = byColumn[col.key];
          const selectedInColumn = columnAlerts.filter((a) => selectedIds.has(a.id));
          const bulkActive = selectedInColumn.length > 0;
          const columnActions = COLUMN_ACTIONS[col.key] ?? [];

          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
              onDragLeave={() => setDragOverColumn((prev) => (prev === col.key ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColumn(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id) moveAndDeselect(id, col.key);
              }}
              style={{
                flex: 1, minWidth: 0, height: '100%', background: '#f4f5f6', borderRadius: 12,
                padding: 8, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden',
                outline: dragOverColumn === col.key ? '2px solid #473bab' : 'none',
                outlineOffset: -2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, padding: '4px 4px 0', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.17px' }}>
                  ({columnAlerts.length})
                </span>
              </div>

              {bulkActive && columnActions.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {columnActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleBulkAction(columnAlerts, action.targetStatus)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        background: '#ffffff', border: `1px solid ${action.borderColor}`, borderRadius: 100,
                        padding: '6px 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                        color: action.color, cursor: 'pointer',
                      }}
                    >
                      <action.icon style={{ fontSize: 16 }} />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {columnAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    assets={assetsByAlertId.get(alert.id) ?? []}
                    dragging={draggingId === alert.id}
                    selected={selectedIds.has(alert.id)}
                    selectable={col.key !== 'sent' && col.key !== 'generated'}
                    bulkActive={bulkActive}
                    onToggleSelect={(checked) => toggleSelect(alert.id, checked)}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', alert.id); setDraggingId(alert.id); }}
                    onDragEnd={() => setDraggingId(null)}
                    onOpen={() => setOpenAlertId(alert.id)}
                    onMove={(status) => moveAndDeselect(alert.id, status)}
                    onArchive={() => archiveAndDeselect(alert.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {archivedDialogOpen && (
        <ArchivedAlertsDialog
          alerts={archivedAlerts}
          offers={offers}
          assetsByAlertId={assetsByAlertId}
          onClose={() => setArchivedDialogOpen(false)}
          onOpenAlert={setOpenAlertId}
        />
      )}

      {openAlert && <AlertDialog alert={openAlert} onClose={() => setOpenAlertId(null)} />}
    </div>
  );
};
