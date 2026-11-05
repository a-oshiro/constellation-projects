import { createContext, useContext } from 'react';
import type { UserRole } from './userRole';

/**
 * In-memory activity notifications for the top bar's Activity tray — no backend, so they last for the
 * browser session only. Each one is addressed to a role, e.g. client disclosure submissions notify
 * internal users.
 */
export interface AppNotification {
  /** Stable per subject, so re-raising the same event (a resubmission) replaces the old entry. */
  id: string;
  audience: UserRole;
  source: string;
  title: string;
  tags: string[];
  /** Where clicking the notification goes. */
  href: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationsContextValue {
  notifications: AppNotification[];
  /** Adds the notification as unread, replacing any existing one with the same id. */
  notify: (notification: Omit<AppNotification, 'createdAt' | 'read'>) => void;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: (audience: UserRole) => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationsProvider');
  return ctx;
}
