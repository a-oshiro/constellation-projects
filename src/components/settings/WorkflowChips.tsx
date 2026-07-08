import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import type { WorkflowStatus } from './workflowTypes';

export function StatusChip({ status }: { status: WorkflowStatus }) {
  const active = status === 'active';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px 3px 6px', borderRadius: 8,
        background: active ? '#e8f5e9' : '#f0f2f4',
        color: active ? '#1b5e20' : '#686576',
        fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
      }}
    >
      {active ? <CheckCircle style={{ fontSize: 14 }} /> : <RadioButtonUnchecked style={{ fontSize: 14 }} />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function AccountsChip({ count }: { count: number }) {
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
      {count} Accounts
    </span>
  );
}
