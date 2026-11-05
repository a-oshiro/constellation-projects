import React, { useCallback, useState } from 'react';
import { UserRoleContext } from './userRole';
import type { UserRole } from './userRole';

const STORAGE_KEY = 'constellation.userRole';

function readStoredRole(): UserRole {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'client' ? 'client' : 'internal';
  } catch {
    return 'internal';
  }
}

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(readStoredRole);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private window etc.) — the role still applies for this session.
    }
  }, []);

  return <UserRoleContext.Provider value={{ role, setRole }}>{children}</UserRoleContext.Provider>;
}
