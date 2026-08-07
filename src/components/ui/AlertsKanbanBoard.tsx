import { useMemo, useState } from 'react';
import { Checkbox } from '@mui/material';
import { Close, Check, Replay, Send, CheckCircle, Cancel, CheckCircleOutlined } from '@mui/icons-material';
import type { Alert, AlertStatus, ReviewStatus, Asset } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { computePreviewAssets } from '../../utils/overviewAssets';
import { CATEGORY_STYLE, formatReviewerName } from '../../utils/alertReview';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { AlertDialog } from './AlertDialog';

const DAY = 24 * 60 * 60 * 1000;

type FilterKey = 'month' | 'quarter' | 'all';

const FILTERS: { key: FilterKey; label: string; withinDays: number | null }[] = [
  { key: 'month', label: 'This Month', withinDays: 31 },
  { key: 'quarter', label: 'Last 3 Months', withinDays: 92 },
  { key: 'all', label: 'All', withinDays: null },
];

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

/** Most recent activity entry for a given review track, used to attribute its row on the card. */
function lastActorFor(alert: Alert, track: 'email' | 'assets'): string | undefined {
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
}

const ReviewRow = ({ label, status, actorName }: ReviewRowProps) => {
  const { Icon, color } = REVIEW_ROW_STYLE[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon style={{ fontSize: 16, color, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ flexShrink: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px', whiteSpace: 'nowrap', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {status === 'pending' ? 'Pending' : formatReviewerName(actorName ?? '')}
      </span>
    </div>
  );
};

const THUMB_SIZE = 72;

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
const AlertThumbnail = ({ assets }: { assets: Asset[] }) => {
  if (assets.length === 0) {
    return <div style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, background: '#f0f2f4', flexShrink: 0 }} />;
  }

  if (assets.length === 1) {
    return (
      <div style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
        <ThumbTile asset={assets[0]} />
      </div>
    );
  }

  const overflow = assets.length > 4 ? assets.length - 3 : 0;
  const gridAssets = overflow > 0 ? assets.slice(0, 3) : assets.slice(0, 4);

  return (
    <div style={{
      width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
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
}

const AlertCard = ({
  alert, assets, dragging, selected, selectable, bulkActive, onToggleSelect, onDragStart, onDragEnd, onOpen, onMove,
}: AlertCardProps) => {
  const [hovered, setHovered] = useState(false);
  const categoryStyle = CATEGORY_STYLE[alert.category];
  const actions = COLUMN_ACTIONS[alert.status] ?? [];
  const highlighted = hovered || selected;
  const showActions = hovered && !bulkActive && actions.length > 0;

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
          style={{ padding: 4, marginTop: -2, flexShrink: 0 }}
        />
      ) : (
        <div style={{ width: 28, flexShrink: 0 }} />
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
        <ReviewRow label="Email content" status={alert.emailStatus} actorName={lastActorFor(alert, 'email')} />
        <ReviewRow label="Assets" status={alert.assetsStatus} actorName={lastActorFor(alert, 'assets')} />
      </div>

      {showActions && (
        <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', gap: 4 }}>
          {actions.map((action) => (
            <button
              key={action.label}
              title={action.label}
              onClick={(e) => { e.stopPropagation(); onMove(action.targetStatus); }}
              style={{
                width: 28, height: 28, borderRadius: '50%', padding: 0,
                background: '#ffffff', border: `1px solid ${action.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <action.icon style={{ fontSize: 16, color: action.color }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AlertsKanbanBoard = () => {
  const { alerts, moveAlert, currentProject } = useProject();
  const [filter, setFilter] = useState<FilterKey>('month');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<AlertStatus | null>(null);
  const [openAlertId, setOpenAlertId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const filtered = useMemo(() => {
    const withinDays = FILTERS.find((f) => f.key === filter)!.withinDays;
    if (withinDays == null) return alerts;
    const cutoff = Date.now() - withinDays * DAY;
    return alerts.filter((a) => a.createdAt >= cutoff);
  }, [alerts, filter]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
          Alerts Lifecycle
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          Show alerts from:
        </span>
        <div style={{ display: 'inline-flex', background: '#f0f2f4', borderRadius: 8, padding: 2 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 10px',
                fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
                background: filter === f.key ? '#473bab' : 'transparent',
                color: filter === f.key ? '#ffffff' : '#1f1d25',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', height: 400 }}>
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
                    selectable={col.key !== 'sent'}
                    bulkActive={bulkActive}
                    onToggleSelect={(checked) => toggleSelect(alert.id, checked)}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', alert.id); setDraggingId(alert.id); }}
                    onDragEnd={() => setDraggingId(null)}
                    onOpen={() => setOpenAlertId(alert.id)}
                    onMove={(status) => moveAndDeselect(alert.id, status)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {openAlert && <AlertDialog alert={openAlert} onClose={() => setOpenAlertId(null)} />}
    </div>
  );
};
