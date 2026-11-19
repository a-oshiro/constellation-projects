import React, { useCallback, useState } from 'react';
import { NotificationsContext } from './notifications';
import type { AppNotification } from './notifications';
import type { UserRole } from './userRole';
import { ACCOUNTS } from '../data/accounts';
import { buildDisclosureSubmissionNotification } from '../data/enrollmentSettings';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // Every account's default disclosures start as a pending client submission, so their notifications start raised too.
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const createdAt = new Date().toISOString();
    return ACCOUNTS.map((a) => ({ ...buildDisclosureSubmissionNotification(a.id, a.name), createdAt, read: false }));
  });

  const notify = useCallback((notification: Omit<AppNotification, 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      { ...notification, createdAt: new Date().toISOString(), read: false },
      ...prev.filter((n) => n.id !== notification.id),
    ]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback((audience: UserRole) => {
    setNotifications((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, notify, dismiss, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}
