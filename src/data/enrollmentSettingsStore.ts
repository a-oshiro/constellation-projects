import { buildDefaultEnrollmentSettings } from './enrollmentSettings';
import type { EnrollmentSettings } from './enrollmentSettings';

/** Module-level, per-project cache of saved Enrollment Settings — lasts for the browser session only. */
const SAVED_SETTINGS = new Map<string, EnrollmentSettings>();

export function getSavedEnrollmentSettings(projectId: string): EnrollmentSettings {
  const existing = SAVED_SETTINGS.get(projectId);
  if (existing) return existing;
  const created = buildDefaultEnrollmentSettings();
  SAVED_SETTINGS.set(projectId, created);
  return created;
}

export function saveEnrollmentSettings(projectId: string, settings: EnrollmentSettings): void {
  SAVED_SETTINGS.set(projectId, settings);
}
