import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectBySlugs } from '../data/projects';
import { useProject } from '../context/ProjectContext';

/** Project task pages are reached at /projects/:accountSlug/:projectSlug(/...) — this keeps ProjectContext's selected project in sync with whatever the URL names (e.g. a deep link opened in a new tab). */
export function useSyncProjectFromRoute() {
  const { accountSlug, projectSlug } = useParams<{ accountSlug: string; projectSlug: string }>();
  const { selectedProjectId, selectProject } = useProject();

  useEffect(() => {
    if (!accountSlug || !projectSlug) return;
    const project = getProjectBySlugs(accountSlug, projectSlug);
    if (project && project.id !== selectedProjectId) selectProject(project.id);
  }, [accountSlug, projectSlug, selectedProjectId, selectProject]);
}
