import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { Alert, Asset } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { CATEGORY_STYLE } from '../../utils/alertReview';
import { LIFECYCLE_STEP_LABELS, getModelType } from '../../utils/alertFilters';
import { AlertThumbnail, ReviewRow, lastActorFor } from './AlertsKanbanBoard';

const HEADER_CELL_SX = {
  fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  color: '#686576', letterSpacing: '0.17px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap',
} as const;

const BODY_CELL_SX = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', verticalAlign: 'top',
} as const;

interface ArchivedAlertsTableProps {
  alerts: Alert[];
  assetsByAlertId: Map<string, Asset[]>;
  onOpenAlert: (id: string) => void;
}

/** Table (list) view for the Archived Alerts dialog — same row anatomy as AlertsTable, with a Status column and an Archival Date instead of Last Update. */
export const ArchivedAlertsTable = ({ alerts, assetsByAlertId, onOpenAlert }: ArchivedAlertsTableProps) => {
  return (
    <TableContainer style={{ flex: 1, minHeight: 0 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }} />
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Alert Subject</TableCell>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Status</TableCell>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Category</TableCell>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Model Type</TableCell>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Approvals</TableCell>
            <TableCell sx={{ ...HEADER_CELL_SX, background: '#ffffff' }}>Archival Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alerts.map((alert) => {
            const categoryStyle = CATEGORY_STYLE[alert.category];

            return (
              <TableRow
                key={alert.id}
                hover
                onClick={() => onOpenAlert(alert.id)}
                sx={{ cursor: 'pointer', '& td': { borderBottom: '1px solid #f0f0f0' } }}
              >
                <TableCell sx={BODY_CELL_SX}>
                  <AlertThumbnail assets={assetsByAlertId.get(alert.id) ?? []} size={40} />
                </TableCell>
                <TableCell sx={{ ...BODY_CELL_SX, maxWidth: 280 }}>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.43 }}>
                    {alert.subject}
                  </span>
                </TableCell>
                <TableCell sx={BODY_CELL_SX}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', color: '#1f1d25', borderRadius: 8, padding: '2px 8px', fontSize: 11, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {LIFECYCLE_STEP_LABELS[alert.status]}
                  </span>
                </TableCell>
                <TableCell sx={BODY_CELL_SX}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: categoryStyle.background, color: categoryStyle.color, borderRadius: 8, padding: '2px 8px', fontSize: 11, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {alert.category}
                  </span>
                </TableCell>
                <TableCell sx={BODY_CELL_SX}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', color: '#1f1d25', borderRadius: 8, padding: '2px 8px', fontSize: 11, letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                    {getModelType(alert)}
                  </span>
                </TableCell>
                <TableCell sx={{ ...BODY_CELL_SX, minWidth: 200 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <ReviewRow label="Email content" status={alert.emailStatus} actorName={lastActorFor(alert, 'email')} />
                    <ReviewRow label="Assets" status={alert.assetsStatus} actorName={lastActorFor(alert, 'assets')} />
                  </div>
                </TableCell>
                <TableCell sx={{ ...BODY_CELL_SX, whiteSpace: 'nowrap' }}>
                  {formatRelativeTime(alert.archivedAt ?? alert.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
