import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { Project } from '../../data/projects';
import bmwLogoSrc from '../../assets/bmw-logo.png';
import { ProjectComponentIndicators } from './ProjectBoardCard';

const HEADER_CELL_SX = {
  fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  color: '#686576', letterSpacing: '0.17px', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap', background: '#ffffff',
} as const;

const BODY_CELL_SX = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', verticalAlign: 'middle',
} as const;

/** Board-column status a project currently falls in — same icon/color as the Kanban column header. */
export interface ProjectStatusInfo {
  label: string;
  color: string;
  background: string;
  Icon: React.ElementType;
}

const StatusChip = ({ status }: { status: ProjectStatusInfo }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: status.background, color: status.color,
      borderRadius: 8, padding: '3px 8px 3px 6px', fontSize: 11, fontFamily: 'Roboto, sans-serif',
      letterSpacing: '0.4px', whiteSpace: 'nowrap',
    }}
  >
    <status.Icon style={{ fontSize: 14, color: status.color }} />
    {status.label}
  </span>
);

interface ProjectsTableProps {
  projects: Project[];
  /** The Kanban column a project's workflow status currently maps to, with that column's icon/color. */
  statusFor: (project: Project) => ProjectStatusInfo;
  onOpenProject: (project: Project) => void;
}

export const ProjectsTable = ({ projects, statusFor, onOpenProject }: ProjectsTableProps) => (
  <TableContainer style={{ flex: 1, minHeight: 0 }}>
    <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={HEADER_CELL_SX} />
          <TableCell sx={HEADER_CELL_SX}>Project Name</TableCell>
          <TableCell sx={HEADER_CELL_SX}>Account</TableCell>
          <TableCell sx={HEADER_CELL_SX}>Status</TableCell>
          <TableCell sx={HEADER_CELL_SX}>Components</TableCell>
          <TableCell sx={HEADER_CELL_SX}>Owner</TableCell>
          <TableCell sx={HEADER_CELL_SX}>Last Updated</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects.map((project) => (
          <TableRow
            key={project.id}
            hover
            onClick={() => onOpenProject(project)}
            sx={{ cursor: 'pointer', '& td': { borderBottom: '1px solid #f0f0f0' } }}
          >
            <TableCell sx={{ ...BODY_CELL_SX, width: 64 }}>
              <img src={bmwLogoSrc} alt="" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }} />
            </TableCell>
            <TableCell sx={{ ...BODY_CELL_SX, maxWidth: 240 }}>
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.43 }}>
                {project.projectName}
              </span>
            </TableCell>
            <TableCell sx={{ ...BODY_CELL_SX, whiteSpace: 'nowrap' }}>{project.accountName}</TableCell>
            <TableCell sx={BODY_CELL_SX}>
              <StatusChip status={statusFor(project)} />
            </TableCell>
            <TableCell sx={BODY_CELL_SX}>
              <ProjectComponentIndicators project={project} />
            </TableCell>
            <TableCell sx={{ ...BODY_CELL_SX, whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={project.creatorAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <span>{project.creator}</span>
              </div>
            </TableCell>
            <TableCell sx={{ ...BODY_CELL_SX, color: '#686576', whiteSpace: 'nowrap' }}>{project.lastUpdated}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
