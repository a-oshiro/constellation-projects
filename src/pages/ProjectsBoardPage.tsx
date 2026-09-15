import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Tabs, Tab, TextField, InputAdornment } from '@mui/material';
import { Add, Replay, Search } from '@mui/icons-material';
import { PROJECTS, getProjectPath } from '../data/projects';
import type { Project } from '../data/projects';
import { CURRENT_USER } from '../data/mockData';
import { useProject } from '../context/ProjectContext';
import { STATUS_CONFIG } from '../components/ui/ProjectStatusBadge';
import type { ProjectWorkflowStatus } from '../components/ui/ProjectStatusBadge';
import { ProjectBoardCard } from '../components/ui/ProjectBoardCard';
import { ProjectsTable } from '../components/ui/ProjectsTable';
import type { ProjectStatusInfo } from '../components/ui/ProjectsTable';
import { KanbanViewIcon, TableViewIcon } from '../components/ui/AlertsKanbanBoard';

type BoardTab = 'all' | 'mine';
type ViewMode = 'kanban' | 'table';

interface BoardColumn {
  label: string;
  statuses: ProjectWorkflowStatus[];
}

/** The board's seven fixed columns, in display order — each maps to one or more of the existing per-project workflow statuses. */
const BOARD_COLUMNS: BoardColumn[] = [
  { label: 'In Progress', statuses: ['in_progress'] },
  // { label: 'Needs Edits', statuses: ['needs_edits'] },
  { label: 'Changes Made', statuses: ['pending_changes'] },
  { label: 'Assets Created', statuses: ['assets_generated_no_approval'] },
  { label: 'Awaiting Approval', statuses: ['awaiting_approval'] },
  { label: 'Approved', statuses: ['assets_generated'] },
  { label: 'Live', statuses: ['live', 'campaign_loaded'] },
];

const COLUMN_WIDTH = 360;

const tabSx = {
  textTransform: 'none' as const,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.4px',
  minHeight: 42,
  padding: '9px 16px',
  color: '#686576',
  '&.Mui-selected': { color: '#473bab' },
};

const BoardColumnView = ({
  column, projects, locked, selectedProjectId, onOpenProject, onDuplicateProject,
}: {
  column: BoardColumn;
  projects: Project[];
  locked: boolean;
  selectedProjectId: string;
  onOpenProject: (project: Project) => void;
  onDuplicateProject: (project: Project) => void;
}) => {
  const config = STATUS_CONFIG[column.statuses[0]];

  return (
    <div style={{ width: COLUMN_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f5f6', borderRadius: 12, borderTop: `3px solid ${config.color}`, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px' }}>
        <config.Icon style={{ fontSize: 20, color: config.color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {column.label}
        </span>
        <span style={{ background: '#ffffff', color: '#686576', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', flexShrink: 0 }}>
          {projects.length}
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px 12px' }}>
        {projects.map((project) => (
          <ProjectBoardCard
            key={project.id}
            project={project}
            locked={project.id === selectedProjectId ? locked : (project.locked ?? true)}
            onOpen={() => onOpenProject(project)}
            onDuplicate={() => onDuplicateProject(project)}
          />
        ))}
      </div>
    </div>
  );
};

export const ProjectsBoardPage = () => {
  const navigate = useNavigate();
  const { selectProject, selectedProjectId, locked } = useProject();
  const [tab, setTab] = useState<BoardTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');

  const myProjectCount = useMemo(() => PROJECTS.filter((p) => p.creator === CURRENT_USER.name).length, []);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) => p.accountName.toLowerCase().includes(q) || p.projectName.toLowerCase().includes(q));
  }, [search]);

  const visibleProjects = useMemo(
    () => (tab === 'mine' ? searched.filter((p) => p.creator === CURRENT_USER.name) : searched),
    [searched, tab],
  );

  const byColumn = useMemo(() => {
    const map = new Map<string, Project[]>();
    BOARD_COLUMNS.forEach((col) => map.set(col.label, []));
    visibleProjects.forEach((project) => {
      const col = BOARD_COLUMNS.find((c) => c.statuses.includes(project.workflowStatus));
      if (col) map.get(col.label)!.push(project);
    });
    return map;
  }, [visibleProjects]);

  const statusFor = (project: Project): ProjectStatusInfo => {
    const col = BOARD_COLUMNS.find((c) => c.statuses.includes(project.workflowStatus));
    const config = STATUS_CONFIG[col?.statuses[0] ?? project.workflowStatus];
    return { label: col?.label ?? '—', color: config.color, background: config.background, Icon: config.Icon };
  };

  const handleOpenProject = (project: Project) => {
    selectProject(project.id);
    navigate(getProjectPath(project));
  };

  return (
    <div className="flex h-full" style={{ background: '#f0f2f4' }}>
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        {/* ── Title + Tabs ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: '0 0 8px' }}>
            Projects
          </h1>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            slotProps={{ indicator: { style: { background: '#473bab', height: 2 } } }}
            sx={{ minHeight: 42, borderBottom: '1px solid rgba(0,0,0,0.12)' }}
          >
            <Tab value="all" label={`All (${PROJECTS.length})`} disableRipple sx={tabSx} />
            <Tab value="mine" label={`Created by me (${myProjectCount})`} disableRipple sx={tabSx} />
          </Tabs>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={<Add style={{ fontSize: 16 }} />}
            sx={{
              background: '#473bab', color: '#ffffff', borderRadius: '100px', padding: '4px 12px',
              fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
              textTransform: 'none', whiteSpace: 'nowrap', lineHeight: '22px',
              '&:hover': { background: '#3d3396', boxShadow: 'none' },
            }}
          >
            New project
          </Button>
          <Button
            variant="text"
            size="small"
            startIcon={<Replay style={{ fontSize: 16 }} />}
            sx={{
              color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
              letterSpacing: '0.46px', textTransform: 'none', whiteSpace: 'nowrap',
            }}
          >
            Recent Activity
          </Button>

          <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />

          <TextField
            size="small"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> },
            }}
            sx={{
              width: 220, flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                background: '#f9fafa', borderRadius: '100px', height: 34, fontSize: 13, fontFamily: 'Roboto, sans-serif',
                '& fieldset': { borderColor: '#cac9cf' },
                '&:hover fieldset': { borderColor: '#9c99a9' },
                '&.Mui-focused fieldset': { borderColor: '#473bab' },
              },
              '& .MuiOutlinedInput-input': { fontSize: 13, fontFamily: 'Roboto, sans-serif', padding: '8px 12px' },
            }}
          />

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
            {visibleProjects.length} item{visibleProjects.length === 1 ? '' : 's'}
          </span>

          <IconButton
            size="large"
            onClick={() => setViewMode((prev) => (prev === 'kanban' ? 'table' : 'kanban'))}
            title={viewMode === 'kanban' ? 'Switch to table view' : 'Switch to Kanban view'}
            sx={{ padding: '5px', flexShrink: 0, color: '#686576', '&:hover': { background: '#f0eeff', color: '#473bab' } }}
          >
            {viewMode === 'kanban' ? <TableViewIcon /> : <KanbanViewIcon />}
          </IconButton>
        </div>

        {viewMode === 'table' ? (
          <div className="flex-1 overflow-hidden" style={{ padding: '0 16px 16px', minHeight: 0, display: 'flex' }}>
            <ProjectsTable projects={visibleProjects} statusFor={statusFor} onOpenProject={handleOpenProject} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto" style={{ padding: '0 16px 16px', minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 16, height: '100%', minHeight: 0 }}>
              {BOARD_COLUMNS.map((column) => (
                <BoardColumnView
                  key={column.label}
                  column={column}
                  projects={byColumn.get(column.label) ?? []}
                  locked={locked}
                  selectedProjectId={selectedProjectId}
                  onOpenProject={handleOpenProject}
                  onDuplicateProject={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
