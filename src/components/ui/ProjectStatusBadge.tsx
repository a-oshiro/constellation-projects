import { CheckCircle, WarningAmber, PendingOutlined } from '@mui/icons-material';
import { InReviewIcon } from './InReviewIcon';
import { LiveIcon } from './LiveIcon';

export type ProjectWorkflowStatus =
  | 'in_progress'
  | 'awaiting_approval'
  | 'assets_generated'
  | 'assets_generated_no_approval'
  | 'pending_changes'
  | 'campaign_loaded'
  | 'live'
  | 'done'
  | 'draft';

interface Config {
  label: string;
  background: string;
  color: string;
  opacity?: number;
  Icon: React.ElementType;
}

export const STATUS_CONFIG: Record<ProjectWorkflowStatus, Config> = {
  in_progress: {
    label: 'In Progress',
    background: 'rgba(2, 136, 209, 0.08)',
    color: '#01579b',
    Icon: PendingOutlined,
  },
  awaiting_approval: {
    label: 'In Review',
    background: 'rgba(225, 118, 19, 0.08)',
    color: '#c45500',
    opacity: 0.75,
    Icon: InReviewIcon,
  },
  assets_generated: {
    label: 'Assets Approved',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: CheckCircle,
  },
  assets_generated_no_approval: {
    label: 'Assets Generated',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: CheckCircle,
  },
  campaign_loaded: {
    label: 'Live',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: LiveIcon,
  },
  pending_changes: {
    label: 'Pending Changes',
    background: 'rgba(225, 118, 19, 0.08)',
    color: '#c45500',
    opacity: 0.75,
    Icon: WarningAmber,
  },
  live: {
    label: 'Live',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: LiveIcon,
  },
  done: {
    label: 'Done',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: CheckCircle,
  },
  draft: {
    label: 'Draft',
    background: '#f0f2f4',
    color: '#686576',
    Icon: PendingOutlined,
  },
};

interface ProjectStatusBadgeProps {
  status: ProjectWorkflowStatus;
}

export const ProjectStatusBadge = ({ status }: ProjectStatusBadgeProps) => {
  const { label, background, color, opacity = 1, Icon } = STATUS_CONFIG[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background,
        borderRadius: 8,
        paddingLeft: 6,
        paddingRight: 8,
        paddingTop: 3,
        paddingBottom: 3,
        flexShrink: 0,
      }}
    >
      <Icon style={{ fontSize: 14, color }} />
      <span
        style={{
          fontSize: 11,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          color,
          opacity,
          letterSpacing: '0.4px',
          lineHeight: 1.66,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </span>
  );
};
