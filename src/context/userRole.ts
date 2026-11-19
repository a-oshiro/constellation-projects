import { createContext, useContext } from 'react';

/**
 * Which kind of user the prototype is showing: a Constellation internal user, or a client (dealer) user.
 * Switched from the avatar menu in the top bar. Kept in localStorage so a reload keeps the same view —
 * a per-viewer convenience only, so it falls back to "internal" whenever storage is unavailable.
 */
export type UserRole = 'internal' | 'client';

export interface UserRoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const UserRoleContext = createContext<UserRoleContextValue | null>(null);

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) throw new Error('useUserRole must be inside UserRoleProvider');
  return ctx;
}
