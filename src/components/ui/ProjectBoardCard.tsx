import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { MoreVert, ContentCopy, LocalOfferOutlined, ViewComfyOutlined, PaletteOutlined, ImageOutlined } from '@mui/icons-material';
import type { Project } from '../../data/projects';
import { EvergreenIndicatorIcon } from './EvergreenProjectBadge';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/** Total assets a project would generate: one per offer x background, per template. Mirrors ProjectContext's computeAssets, but only needs the count. */
export function countAssets(project: Project): number {
  const perOffer = project.templates.reduce(
    (sum, tmpl) => sum + project.backgrounds.filter((bg) => bg.templateId === tmpl.id).length,
    0,
  );
  return perOffer * project.offers.length;
}

const Indicator = ({ icon: Icon, count }: { icon: React.ElementType; count: number }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
    <Icon style={{ fontSize: 16, color: '#686576' }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px' }}>
      {count}
    </span>
  </div>
);

/** The offers/templates/styles/assets count pill — shared by the Kanban card and the table's Components column. */
export const ProjectComponentIndicators = ({ project }: { project: Project }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0f2f4', borderRadius: 24, padding: '2px 8px', flexShrink: 0, width: 'fit-content' }}>
    <Indicator icon={LocalOfferOutlined} count={project.offers.length} />
    <Indicator icon={ViewComfyOutlined} count={project.templates.length} />
    <Indicator icon={PaletteOutlined} count={project.backgrounds.length} />
    <Indicator icon={ImageOutlined} count={countAssets(project)} />
  </div>
);

interface ProjectBoardCardProps {
  project: Project;
  /** Whether this project's Evergreen lock indicator should render locked — irrelevant for non-Evergreen projects. */
  locked: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
}

export const ProjectBoardCard = ({ project, locked, onOpen, onDuplicate }: ProjectBoardCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        outline: hovered ? '2px solid #473bab' : '2px solid transparent',
        outlineOffset: -1,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* ── Wrapper: thumbnail + content ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: 90, flexShrink: 0, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(0,0,0,0.06)' }}>
          <img src={bmwLogoSrc} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25',
              letterSpacing: '0.17px', lineHeight: 1.43, paddingRight: 56,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {project.accountName}
          </span>
          <span
            style={{
              fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576',
              letterSpacing: '0.4px', lineHeight: 1.66, paddingRight: 56,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {project.projectName}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            <ProjectComponentIndicators project={project} />
            <img src={project.creatorAvatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
          </div>
        </div>
      </div>

      {/* ── Last updated ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 8px' }}>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
          Updated {project.lastUpdated}
        </span>
      </div>

      {/* ── Top-right: Evergreen badge + three-dot menu ──────────────── */}
      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        {project.isEvergreen && <EvergreenIndicatorIcon locked={locked} />}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
          sx={{ padding: '5px', '&:hover': { background: '#f0eeff' } }}
        >
          <MoreVert style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={() => { setMenuAnchor(null); onDuplicate(); }}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          Duplicate project
        </MenuItem>
      </Menu>
    </div>
  );
};
