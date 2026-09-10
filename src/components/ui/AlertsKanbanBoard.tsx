import { useMemo, useState } from 'react';
import { Button, Checkbox, IconButton, InputAdornment, Menu, MenuItem, ListItemIcon, TextField } from '@mui/material';
import {
  Close, Check, Replay, Search, Send, CheckCircleOutlined, PendingOutlined, MoreVert, Inventory2Outlined, PlayArrow,
  WarningAmberOutlined, ImageNotSupportedOutlined,
} from '@mui/icons-material';
import type { Alert, AlertStatus, ReviewStatus, Asset } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { useLayout } from '../../context/LayoutContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { computePreviewAssets, backgroundForOffer } from '../../utils/overviewAssets';
import { CATEGORY_STYLE } from '../../utils/alertReview';
import { applyAlertFilters, getActiveFilterFieldCount } from '../../utils/alertFilters';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { AlertDialog } from './AlertDialog';
import { AlertsTable } from './AlertsTable';
import { FeedQc } from './FeedQc';
import { ArchivedAlertsDialog } from './ArchivedAlertsDialog';
import { AlertsFilterRow } from './AlertsFilterRow';

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
  { key: 'rejected', label: 'Changes Requested' },
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

/** Icon + color per review track status — mirrors the Figma "QC Chip" states (pending/approved/rejected). */
const APPROVAL_CHIP_STYLE: Record<ReviewStatus, { Icon: React.ElementType; color: string }> = {
  pending: { Icon: PendingOutlined, color: '#9c99a9' },
  approved: { Icon: CheckCircleOutlined, color: '#4caf50' },
  rejected: { Icon: Replay, color: '#e65100' },
};

const ApprovalStatusChip = ({ icon: Icon, color, label }: { icon: React.ElementType; color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
    <Icon style={{ fontSize: 18, color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  </div>
);

/**
 * Email/Assets approval status, shown side by side — collapses into a single "Sent" chip once the
 * alert has gone out, since the two tracks no longer matter individually at that point. Never shows
 * who made the approval/change request (not even on hover) — only the current status.
 */
export const AlertApprovalChips = ({ alert }: { alert: Alert }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {alert.status === 'sent' ? (
      <ApprovalStatusChip icon={Send} color="#4caf50" label="Sent" />
    ) : (
      <>
        <ApprovalStatusChip icon={APPROVAL_CHIP_STYLE[alert.emailStatus].Icon} color={APPROVAL_CHIP_STYLE[alert.emailStatus].color} label="Email" />
        <ApprovalStatusChip icon={APPROVAL_CHIP_STYLE[alert.assetsStatus].Icon} color={APPROVAL_CHIP_STYLE[alert.assetsStatus].color} label="Assets" />
      </>
    )}
  </div>
);

/** Red pill shown in place of the Email/Assets approval chips whenever an alert's generation failed outright — used by both the card and the table row's Approvals cell. */
export const GenerationFailedChip = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
    <WarningAmberOutlined style={{ fontSize: 18, color: '#d32f2f', flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#d32f2f', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap' }}>
      Generation Failed
    </span>
  </div>
);

/** Amber "N QC Findings" pill shown on a card/row whose alert carries non-blocking QC findings. */
export const QcFindingsChip = ({ count }: { count: number }) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
      background: 'rgba(225,118,19,0.08)', borderRadius: 8, padding: '3px 8px',
    }}
  >
    <WarningAmberOutlined style={{ fontSize: 14, color: '#c45500', flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#c45500', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
      {count} QC Finding{count === 1 ? '' : 's'}
    </span>
  </div>
);

/** Red-tinted broken-image placeholder shown instead of AlertThumbnail whenever an alert's generation failed outright. */
export const FailedThumbnail = ({ size = 72 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: 12, flexShrink: 0,
    background: 'rgba(211,47,47,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <ImageNotSupportedOutlined style={{ fontSize: size * 0.45, color: '#d32f2f' }} />
  </div>
);

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
  const failed = !!alert.generationFailure;
  const qcFindingCount = alert.qcFindings?.length ?? 0;

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
        border: highlighted ? '2px solid #473bab' : failed ? '1px solid #d32f2f' : '1px solid rgba(0,0,0,0.08)',
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
      {failed ? <FailedThumbnail /> : <AlertThumbnail assets={assets} />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
          {!failed && qcFindingCount > 0 && <QcFindingsChip count={qcFindingCount} />}
        </div>
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
        {failed ? <GenerationFailedChip /> : <AlertApprovalChips alert={alert} />}
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
  const { alerts, offers, moveAlert, archiveAlert, generateAlerts, currentProject } = useProject();
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
  const [searchTerm, setSearchTerm] = useState('');

  // One representative preview asset per offer, used to build each alert card's thumbnail
  // from the offers its email actually references (featured + the secondary grid). Each offer's
  // background is picked via backgroundForOffer so it stays consistent with the Alert Dialog.
  const assetByOfferId = useMemo(() => {
    const previewAssets = computePreviewAssets(
      currentProject.offers, currentProject.templates, currentProject.backgrounds, currentProject.projectName,
    );
    const map = new Map<string, Asset>();
    currentProject.offers.forEach((offer) => {
      const bg = backgroundForOffer(offer, currentProject.offers, currentProject.backgrounds);
      const asset = previewAssets.find((a) => a.offerId === offer.id && a.backgroundId === bg?.id);
      if (asset) map.set(offer.id, asset);
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

  // Search narrows down within whatever the field filters already produced — it isn't itself part
  // of the persisted filter state.
  const searched = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return filtered;
    return filtered.filter((a) => a.subject.toLowerCase().includes(query) || a.category.toLowerCase().includes(query));
  }, [filtered, searchTerm]);

  const activeFilterFieldCount = useMemo(() => getActiveFilterFieldCount(alertFilterState), [alertFilterState]);

  const byColumn = useMemo(() => {
    const map: Record<AlertStatus, Alert[]> = { generated: [], rejected: [], approved: [], sent: [] };
    searched.forEach((a) => map[a.status].push(a));
    return map;
  }, [searched]);

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

  const handleGenerateAlerts = () => {
    const count = generateAlerts();
    if (count > 0) showSnackbar({ message: `Generated ${count} new alert${count === 1 ? '' : 's'}.` });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Actions row — left-aligned CTAs, archive menu, and search, all above the (separate) Filter Row. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button
          variant="contained"
          disableElevation
          size="small"
          startIcon={<PlayArrow style={{ fontSize: 16 }} />}
          onClick={handleGenerateAlerts}
          sx={{
            background: '#473bab',
            color: '#ffffff',
            borderRadius: '100px',
            padding: '4px 10px',
            fontSize: 13,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            lineHeight: '22px',
            letterSpacing: '0.46px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            '&:hover': { background: '#3d3396', boxShadow: 'none' },
          }}
        >
          Generate Alerts
        </Button>
        <FeedQc />
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
        <TextField
          size="small"
          placeholder="Search alerts"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> },
          }}
          sx={{
            width: 200,
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              background: '#f9fafa',
              borderRadius: '100px',
              minHeight: 36,
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              '& fieldset': { borderColor: '#cac9cf' },
              '&:hover fieldset': { borderColor: '#9b96b0' },
              '&.Mui-focused fieldset': { borderColor: '#473bab' },
            },
            '& .MuiOutlinedInput-input': { fontSize: 13, fontFamily: 'Roboto, sans-serif', padding: '8px 12px' },
          }}
        />
      </div>

      <AlertsFilterRow
        alerts={activeAlerts}
        offers={offers}
        state={alertFilterState}
        onChange={updateAlertFilterState}
        onReset={resetAlertFilterState}
        filterPanelOpen={alertsFilterPanelOpen}
        onToggleFilterPanel={() => (alertsFilterPanelOpen ? closeAlertsFilterPanel() : openAlertsFilterPanel())}
        activeFilterFieldCount={activeFilterFieldCount}
        leading={null}
        trailing={(
          <IconButton
            size="large"
            onClick={() => setViewMode((prev) => (prev === 'kanban' ? 'table' : 'kanban'))}
            title={viewMode === 'kanban' ? 'Switch to table view' : 'Switch to Kanban view'}
            sx={{ padding: '5px', flexShrink: 0, color: '#686576', '&:hover': { background: '#f0eeff', color: '#473bab' } }}
          >
            {viewMode === 'kanban' ? <TableViewIcon /> : <KanbanViewIcon />}
          </IconButton>
        )}
      />

      {viewMode === 'table' ? (
        <AlertsTable alerts={searched} assetsByAlertId={assetsByAlertId} onOpenAlert={setOpenAlertId} onArchive={archiveAndDeselect} />
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
