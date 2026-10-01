import { LockOutlined } from '@mui/icons-material';

/** Shown above read-only offer/vehicle fields so it's clear why nothing can be edited. */
export const ReadOnlyNotice = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 8,
    background: '#f4f5f6', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576',
  }}>
    <LockOutlined style={{ fontSize: 16, flexShrink: 0 }} />
    Read only. Unlock the project to make changes.
  </div>
);
