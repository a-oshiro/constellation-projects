import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { ArrowBack, Close, Search, Add, FilterList, LocalOfferOutlined, ViewComfyOutlined, ImageOutlined, CheckCircle, PendingOutlined, RadioButtonUnchecked } from '@mui/icons-material';
import bmwLogoSrc from '../../assets/bmw-logo.png';
import { PROJECTS } from '../../data/projects';
import type { Project } from '../../data/projects';
import { useProject } from '../../context/ProjectContext';
import { computePreviewAssets, groupIntoAdShells } from '../../utils/overviewAssets';
import { EvergreenIndicatorIcon } from '../ui/EvergreenProjectBadge';

interface ProjectsPanelProps {
  onClose?: () => void;
  width?: number;
}

function statusDot(project: Project) {
  switch (project.workflowStatus) {
    case 'assets_generated':
    case 'campaign_loaded':
    case 'done':
      return <CheckCircle style={{ fontSize: 16, color: '#2e7d32' }} />;
    case 'in_progress':
      return <PendingOutlined style={{ fontSize: 16, color: '#01579b' }} />;
    default:
      return <RadioButtonUnchecked style={{ fontSize: 16, color: '#9c99a9' }} />;
  }
}

function ProjectListItem({ project, active, locked, onClick }: { project: Project; active: boolean; locked: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  const shellCount = useMemo(() => {
    const assets = computePreviewAssets(project.offers, project.templates, project.backgrounds, project.projectName);
    return groupIntoAdShells(assets, project.templates, project.projectName).length;
  }, [project]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
        width: '100%', border: 'none', borderRadius: 12,
        background: active ? 'rgba(99,86,225,0.08)' : hovered ? '#f9fafa' : 'transparent',
        cursor: 'pointer', textAlign: 'left', padding: 0, flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 4 }}>
        {/* Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
          background: '#ffffff', border: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={bmwLogoSrc} alt="BMW" style={{ width: 48, height: 48, objectFit: 'contain' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {project.accountName} · {project.accountCode}
          </p>
          <p style={{
            margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {project.projectName}
          </p>
          <p style={{
            margin: '2px 0 0', fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
          }}>
            {project.startDate} - {project.endDate}
          </p>

          {/* Stat pill */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 4 }}>
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#f0f2f4', borderRadius: 24, padding: '2px 8px',
            }}>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <LocalOfferOutlined style={{ fontSize: 14, color: '#686576' }} />
                <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{project.offers.length}</span>
              </span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <ViewComfyOutlined style={{ fontSize: 14, color: '#686576' }} />
                <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{project.templates.length}</span>
              </span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <ImageOutlined style={{ fontSize: 14, color: '#686576' }} />
                <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{shellCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, alignSelf: 'flex-start', paddingTop: 4 }}>
          {project.isEvergreen && <EvergreenIndicatorIcon locked={locked} />}
          {statusDot(project)}
        </div>
      </div>
    </button>
  );
}

export const ProjectsPanel = ({ onClose, width = 280 }: ProjectsPanelProps) => {
  const { selectedProjectId, selectProject, locked } = useProject();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) =>
      p.projectName.toLowerCase().includes(q) ||
      p.accountName.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        margin: '8px 0 8px 8px',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, padding: '12px 16px 8px', position: 'relative', flexShrink: 0 }}>
        <IconButton size="small" onClick={onClose} sx={{ padding: '5px', flexShrink: 0 }}>
          <ArrowBack style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5, marginLeft: 4 }}>
          Projects
        </span>
        <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', right: 10, top: 8, padding: '5px', width: 30, height: 30 }}>
          <Close style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>
      </div>

      {/* ── Search + add + filter ─────────────────────────── */}
      <div style={{ padding: '0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
            background: '#f9fafa', border: '1px solid #dddce0', borderRadius: 20,
            padding: '8px 8px', height: 34, boxSizing: 'border-box',
          }}>
            <Search style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find project"
              style={{
                flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px',
              }}
            />
          </div>
          {/* "+" — no functionality yet */}
          <IconButton size="small" sx={{ background: '#473bab', flexShrink: 0, padding: '5px', '&:hover': { background: '#3d3396' } }}>
            <Add style={{ fontSize: 20, color: '#ffffff' }} />
          </IconButton>
          {/* Filter — no functionality yet */}
          <IconButton size="small" sx={{ flexShrink: 0, padding: '5px' }}>
            <FilterList style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>
        </div>

        <div style={{ paddingTop: 12, paddingBottom: 4 }}>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.4px', lineHeight: 1.66 }}>
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            active={project.id === selectedProjectId}
            locked={project.id === selectedProjectId ? locked : (project.locked ?? true)}
            onClick={() => { selectProject(project.id); navigate(`/projects/${project.id}`); }}
          />
        ))}
      </div>
    </div>
  );
};
