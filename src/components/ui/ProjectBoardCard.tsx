import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { MoreVert, ContentCopy, LocalOfferOutlined, ViewComfyOutlined, PaletteOutlined, ImageOutlined } from '@mui/icons-material';
import type { Project } from '../../data/projects';
import { EvergreenIndicatorIcon } from './EvergreenProjectBadge';
import { Tooltip } from './Tooltip';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/** "Show Project overview" hover action icon — content-view glyph, always primary-colored per design. */
const ProjectOverviewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.54167 3.125H9.29167C9.29167 2.71079 8.95588 2.375 8.54167 2.375V3.125ZM8.54167 8.54167V9.29167C8.95588 9.29167 9.29167 8.95588 9.29167 8.54167H8.54167ZM3.125 8.54167H2.375C2.375 8.95588 2.71079 9.29167 3.125 9.29167V8.54167ZM3.58001 3.21583L3.9205 3.88408L3.58001 3.21583ZM3.21583 3.58001L3.88408 3.9205L3.21583 3.58001ZM11.4583 3.125V2.375C11.0441 2.375 10.7083 2.71079 10.7083 3.125H11.4583ZM16.875 8.54167V9.29167C17.2892 9.29167 17.625 8.95588 17.625 8.54167H16.875ZM11.4583 8.54167H10.7083C10.7083 8.95588 11.0441 9.29167 11.4583 9.29167V8.54167ZM16.42 3.21583L16.0795 3.88408L16.42 3.21583ZM16.7842 3.58001L16.1159 3.9205L16.7842 3.58001ZM3.125 11.4583V10.7083C2.71079 10.7083 2.375 11.0441 2.375 11.4583H3.125ZM8.54167 11.4583H9.29167C9.29167 11.0441 8.95588 10.7083 8.54167 10.7083V11.4583ZM8.54167 16.875V17.625C8.95588 17.625 9.29167 17.2892 9.29167 16.875H8.54167ZM3.58001 16.7842L3.9205 16.1159L3.58001 16.7842ZM3.21583 16.42L3.88408 16.0795L3.21583 16.42ZM17.0769 18.1376C17.3698 18.4305 17.8447 18.4305 18.1376 18.1376C18.4305 17.8447 18.4305 17.3698 18.1376 17.0769L17.6072 17.6072L17.0769 18.1376ZM16.085 16.085L15.5538 15.5556L16.085 16.085ZM4.45833 3.125V3.875H8.54167V3.125V2.375H4.45833V3.125ZM8.54167 3.125H7.79167V8.54167H8.54167H9.29167V3.125H8.54167ZM8.54167 8.54167V7.79167H3.125V8.54167V9.29167H8.54167V8.54167ZM3.125 8.54167H3.875V4.45833H3.125H2.375V8.54167H3.125ZM4.45833 3.125V2.375C4.23735 2.375 4.02651 2.37442 3.84993 2.38884C3.66459 2.40399 3.452 2.43931 3.23952 2.54757L3.58001 3.21583L3.9205 3.88408C3.88628 3.90152 3.8795 3.89143 3.97208 3.88386C4.07341 3.87558 4.2126 3.875 4.45833 3.875V3.125ZM3.125 4.45833H3.875C3.875 4.2126 3.87558 4.07341 3.88386 3.97208C3.89143 3.8795 3.90152 3.88628 3.88408 3.9205L3.21583 3.58001L2.54757 3.23952C2.43931 3.452 2.40399 3.66459 2.38884 3.84993C2.37442 4.02651 2.375 4.23735 2.375 4.45833H3.125ZM3.58001 3.21583L3.23952 2.54757C2.94159 2.69937 2.69937 2.94159 2.54757 3.23952L3.21583 3.58001L3.88408 3.9205C3.89207 3.90482 3.90482 3.89207 3.9205 3.88408L3.58001 3.21583ZM11.4583 3.125V3.875H15.5417V3.125V2.375H11.4583V3.125ZM16.875 4.45833H16.125V8.54167H16.875H17.625V4.45833H16.875ZM16.875 8.54167V7.79167H11.4583V8.54167V9.29167H16.875V8.54167ZM11.4583 8.54167H12.2083V3.125H11.4583H10.7083V8.54167H11.4583ZM15.5417 3.125V3.875C15.7874 3.875 15.9266 3.87558 16.0279 3.88386C16.1205 3.89143 16.1137 3.90152 16.0795 3.88408L16.42 3.21583L16.7605 2.54757C16.548 2.43931 16.3354 2.40399 16.1501 2.38884C15.9735 2.37442 15.7626 2.375 15.5417 2.375V3.125ZM16.875 4.45833H17.625C17.625 4.23735 17.6256 4.02651 17.6112 3.84993C17.596 3.66459 17.5607 3.452 17.4524 3.23952L16.7842 3.58001L16.1159 3.9205C16.0985 3.88628 16.1086 3.8795 16.1161 3.97208C16.1244 4.07341 16.125 4.2126 16.125 4.45833H16.875ZM16.42 3.21583L16.0795 3.88408C16.0952 3.89207 16.1079 3.90482 16.1159 3.9205L16.7842 3.58001L17.4524 3.23952C17.3006 2.94159 17.0584 2.69937 16.7605 2.54757L16.42 3.21583ZM3.125 11.4583V12.2083H8.54167V11.4583V10.7083H3.125V11.4583ZM8.54167 11.4583H7.79167V16.875H8.54167H9.29167V11.4583H8.54167ZM8.54167 16.875V16.125H4.45833V16.875V17.625H8.54167V16.875ZM3.125 15.5417H3.875V11.4583H3.125H2.375V15.5417H3.125ZM4.45833 16.875V16.125C4.2126 16.125 4.07341 16.1244 3.97208 16.1161C3.8795 16.1086 3.88628 16.0985 3.9205 16.1159L3.58001 16.7842L3.23952 17.4524C3.452 17.5607 3.66459 17.596 3.84993 17.6112C4.02651 17.6256 4.23735 17.625 4.45833 17.625V16.875ZM3.125 15.5417H2.375C2.375 15.7626 2.37442 15.9735 2.38884 16.1501C2.40399 16.3354 2.43931 16.548 2.54757 16.7605L3.21583 16.42L3.88408 16.0795C3.90152 16.1137 3.89143 16.1205 3.88386 16.0279C3.87558 15.9266 3.875 15.7874 3.875 15.5417H3.125ZM3.58001 16.7842L3.9205 16.1159C3.90482 16.1079 3.89207 16.0952 3.88408 16.0795L3.21583 16.42L2.54757 16.7605C2.69937 17.0584 2.94159 17.3006 3.23952 17.4524L3.58001 16.7842ZM14.1667 16.8815V16.1315C13.0851 16.1315 12.2083 15.2547 12.2083 14.1732H11.4583H10.7083C10.7083 16.0832 12.2567 17.6315 14.1667 17.6315V16.8815ZM11.4583 14.1732H12.2083C12.2083 13.0916 13.0851 12.2148 14.1667 12.2148V11.4648V10.7148C12.2567 10.7148 10.7083 12.2632 10.7083 14.1732H11.4583ZM14.1667 11.4648V12.2148C15.2482 12.2148 16.125 13.0916 16.125 14.1732H16.875H17.625C17.625 12.2632 16.0767 10.7148 14.1667 10.7148V11.4648ZM16.085 16.085L15.5547 16.6153L17.0769 18.1376L17.6072 17.6072L18.1376 17.0769L16.6153 15.5547L16.085 16.085ZM16.875 14.1732H16.125C16.125 14.713 15.9076 15.2006 15.5538 15.5556L16.085 16.085L16.6162 16.6144C17.2388 15.9897 17.625 15.1258 17.625 14.1732H16.875ZM16.085 16.085L15.5538 15.5556C15.1984 15.9122 14.7088 16.1315 14.1667 16.1315V16.8815V17.6315C15.1236 17.6315 15.9909 17.2419 16.6162 16.6144L16.085 16.085Z" fill="#473BAB"/>
  </svg>
);

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

        <div style={{ flex: 1, minWidth: 0, padding: '12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
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

          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap', paddingTop: 4 }}>
            Updated {project.lastUpdated}
          </span>
        </div>
      </div>

      {/* ── Hover: Show Project overview ──────────────────────────────── */}
      {hovered && (
        <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <Tooltip title="Show Project overview">
            <IconButton
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: 30, height: 30, padding: '5px', background: '#ffffff',
                border: '1px solid rgba(99,86,225,0.5)',
                '&:hover': { background: '#f9fafa' },
              }}
            >
              <ProjectOverviewIcon />
            </IconButton>
          </Tooltip>
        </div>
      )}

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
