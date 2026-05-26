import {
  CheckCircle, HourglassEmpty,
  DoNotDisturb, WarningAmber,
  PendingOutlined,
} from '@mui/icons-material';
import type { AssetStatus } from '../../data/types';
import { NeedsEditsIcon } from './NeedsEditsIcon';

interface Config {
  label: string;
  background: string;
  color: string;
  textOpacity?: number;
  Icon: React.ElementType;
}

const STATUS_CONFIG: Record<AssetStatus, Config> = {
  draft: {
    label: 'Draft',
    background: '#EBF5FB',
    color: '#01579b',
    Icon: PendingOutlined,
  },
  approved: {
    label: 'Approved',
    background: '#e8f5e9',
    color: '#1b5e20',
    Icon: CheckCircle,
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    background: '#FDF4EC',
    color: '#c45500',
    textOpacity: 0.75,
    Icon: HourglassEmpty,
  },
  needs_edits: {
    label: 'Needs Edits',
    background: '#FDF4EC',
    color: '#c45500',
    textOpacity: 0.75,
    Icon: NeedsEditsIcon,
  },
  denied: {
    label: 'Denied',
    background: '#FBEFF0',
    color: '#be0e1c',
    Icon: DoNotDisturb,
  },
  updated: {
    label: 'Updated',
    background: '#FDF4EC',
    color: '#c45500',
    textOpacity: 0.75,
    Icon: WarningAmber,
  },
  removed: {
    label: 'Removed',
    background: '#FBEFF0',
    color: '#be0e1c',
    Icon: DoNotDisturb,
  },
};

interface StatusBadgeProps {
  status: AssetStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const { label, background, color, textOpacity = 1, Icon } = config;

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
          opacity: textOpacity,
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
