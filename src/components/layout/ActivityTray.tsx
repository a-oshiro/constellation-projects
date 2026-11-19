import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@mui/material';
import { useNotifications } from '../../context/notifications';
import type { AppNotification } from '../../context/notifications';
import { useUserRole } from '../../context/userRole';

/**
 * The top bar bell's "Activity" tray (Figma: Disclosure Builder client flow). Mentions lists the live
 * app notifications for the current role (e.g. a client-submitted disclosure for internal users) above
 * static sample mentions; Tasks has no data source yet.
 */

interface ActivityTrayProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const FONT = 'Roboto, sans-serif';

// Sample mentions so the tray reads like Figma's — static and always read.
const SAMPLE_MENTIONS = [
  {
    id: 'mention-1', author: 'Benjamin Harrison', avatarUrl: 'https://i.pravatar.cc/40?img=59',
    text: 'Jellybeans seem to small on these, maybe we can update the template, @Henry Nova?',
    tags: ['Projects'], context: 'Paragon Honda Evergreen Project', time: '3 min ago',
  },
  {
    id: 'mention-2', author: 'Grace Cosgrove', avatarUrl: 'https://i.pravatar.cc/40?img=44',
    text: '@Henry Nova do we still have room to push this a bit to the right?',
    tags: ['Projects'], context: 'Paragon Honda Evergreen Project', time: 'Yesterday',
  },
];

const TAG_STYLE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 6px', borderRadius: 6,
  background: 'rgba(17,16,20,0.06)', color: '#686576', fontSize: 11, fontFamily: FONT, letterSpacing: '0.16px',
};

const META_STYLE: CSSProperties = { fontSize: 11, fontFamily: FONT, color: '#686576', letterSpacing: '0.4px' };

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Builder-style app icon for system notifications (Figma: the Constellation gradient tile). */
const SourceIcon = () => (
  <span style={{
    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
    background: 'linear-gradient(135deg, #1f1d25 0%, #473bab 55%, #e55e50 100%)',
  }} />
);

const NotificationRow = ({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) => (
  <button
    type="button"
    onClick={onOpen}
    style={{
      display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: 10, borderRadius: 8, textAlign: 'left',
      cursor: 'pointer', fontFamily: FONT, boxSizing: 'border-box',
      border: notification.read ? '1px solid transparent' : '1px solid rgba(99,86,225,0.5)',
      background: notification.read ? 'transparent' : 'rgba(99,86,225,0.04)',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <SourceIcon />
      <span style={{ ...META_STYLE, flex: 1 }}>{notification.source}</span>
      {!notification.read && <span aria-label="Unread" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6356e1' }} />}
    </span>
    <span style={{ fontSize: 13, fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.45 }}>{notification.title}</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      {notification.tags.map((t, i) => (i === 0 ? <span key={t} style={TAG_STYLE}>{t}</span> : <span key={t} style={META_STYLE}>{t}</span>))}
      <span style={{ ...META_STYLE, marginLeft: 'auto' }}>{relativeTime(notification.createdAt)}</span>
    </span>
  </button>
);

export function ActivityTray({ anchorEl, onClose }: ActivityTrayProps) {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { notifications, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState<'tasks' | 'mentions'>('mentions');

  const mine = notifications.filter((n) => n.audience === role);
  // Sample mentions are an internal-user mock; a client user only sees their own notifications.
  const samples = role === 'internal' ? SAMPLE_MENTIONS : [];
  const unread = mine.filter((n) => !n.read).length;
  const read = mine.length - unread + samples.length;

  const open = (n: AppNotification) => {
    markRead(n.id);
    onClose();
    navigate(n.href);
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13,
    fontWeight: 500, color: active ? '#473bab' : '#686576', borderBottom: active ? '2px solid #473bab' : '2px solid transparent',
  });

  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { width: 360, maxHeight: 520, borderRadius: '12px', marginTop: '6px', display: 'flex', flexDirection: 'column' } } }}
    >
      <div style={{ padding: '14px 16px 0' }}>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: FONT, color: '#1f1d25' }}>Activity</span>
        <div role="tablist" style={{ display: 'flex', gap: 4, marginTop: 6, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <button role="tab" aria-selected={tab === 'tasks'} type="button" onClick={() => setTab('tasks')} style={tabStyle(tab === 'tasks')}>
            Tasks (0)
          </button>
          <button role="tab" aria-selected={tab === 'mentions'} type="button" onClick={() => setTab('mentions')} style={tabStyle(tab === 'mentions')}>
            Mentions ({mine.length + samples.length})
          </button>
        </div>
      </div>

      {tab === 'tasks' ? (
        <p style={{ margin: 0, padding: 24, textAlign: 'center', fontSize: 13, fontFamily: FONT, color: '#9c99a9' }}>No tasks assigned to you.</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 6px' }}>
            <span style={{ ...META_STYLE, flex: 1 }}>{unread} unread · {read} read</span>
            <button
              type="button"
              disabled={unread === 0}
              onClick={() => markAllRead(role)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: unread === 0 ? 'default' : 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: FONT, color: unread === 0 ? '#9c99a9' : '#473bab',
              }}
            >
              Mark All As Read
            </button>
          </div>
          <div style={{ overflowY: 'auto', padding: '0 8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mine.map((n) => <NotificationRow key={n.id} notification={n} onOpen={() => open(n)} />)}
            {samples.map((m) => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, fontFamily: FONT }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <img src={m.avatarUrl} alt="" width={16} height={16} style={{ borderRadius: '50%' }} />
                  <span style={META_STYLE}>{m.author} mentioned you</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.45 }}>{m.text}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.tags.map((t) => <span key={t} style={TAG_STYLE}>{t}</span>)}
                  <span style={META_STYLE}>{m.context}</span>
                  <span style={{ ...META_STYLE, marginLeft: 'auto' }}>{m.time}</span>
                </span>
              </div>
            ))}
            {mine.length + samples.length === 0 && (
              <p style={{ margin: 0, padding: 16, textAlign: 'center', fontSize: 13, fontFamily: FONT, color: '#9c99a9' }}>You're all caught up.</p>
            )}
          </div>
        </>
      )}
    </Popover>
  );
}
