import { useState } from 'react';
import bmwLogoSrc from '../assets/bmw-logo.png';
import { IconButton } from '@mui/material';
import { Add, Delete, MoreVert, Settings, ViewComfy } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { useProject } from '../context/ProjectContext';
import { LockableContent } from '../components/ui/LockedOverlay';
import type { Background } from '../data/types';

interface ThemeAndLogosPageProps {
}

// ── Template Mini-Icon ───────────────────────────────────────────────────────
// Shows the template aspect ratio as a tiny proportional preview
function TemplateMiniIcon({ width, height }: { width: number; height: number }) {
  const isWide = width > height;
  const aspectW = isWide ? 33 : Math.round(33 * (width / height));
  const aspectH = !isWide ? 33 : Math.round(33 * (height / width));

  return (
    <div style={{
      width: aspectW,
      height: aspectH,
      borderRadius: 3,
      overflow: 'hidden',
      flexShrink: 0,
      background: 'repeating-linear-gradient(-45deg, #e0e3e8 0px, #e0e3e8 3px, #edf0f3 3px, #edf0f3 8px)',
      border: '1px solid #d0d3d8',
      position: 'relative',
    }}>
      {/* Simulate header bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isWide ? 5 : 6, background: 'rgba(71,59,171,0.25)' }} />
    </div>
  );
}

// ── Background Group Card ────────────────────────────────────────────────────
interface BackgroundGroupProps {
  templateWidth: number;
  templateHeight: number;
  backgrounds: Background[];
  onDelete: (id: string) => void;
}

function BackgroundGroup({ templateWidth, templateHeight, backgrounds, onDelete }: BackgroundGroupProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const count = backgrounds.length;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      flex: 1,
    }}>
      {/* Card header: mini template icon + size + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TemplateMiniIcon width={templateWidth} height={templateHeight} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 600,
            color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
          }}>
            {templateWidth} x {templateHeight}
          </span>
          <span style={{
            fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66,
          }}>
            {count} {count === 1 ? 'template' : 'templates'}
          </span>
        </div>
      </div>

      {/* Thumbnails row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Add button */}
        <div style={{
          width: 88, height: 88, flexShrink: 0,
          border: '2px dashed #473bab',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(71,59,171,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Add style={{ color: '#473bab', fontSize: 24 }} />
        </div>

        {/* Background thumbnails */}
        {backgrounds.map((bg) => (
          <div
            key={bg.id}
            style={{
              width: 88, height: 88, flexShrink: 0,
              borderRadius: 8, overflow: 'hidden',
              position: 'relative', cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredId(bg.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <img
              src={bg.url}
              alt={bg.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {hoveredId === bg.id && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconButton
                  size="small"
                  onClick={() => onDelete(bg.id)}
                  sx={{
                    background: 'rgba(255,255,255,0.92)',
                    '&:hover': { background: '#fff' },
                    width: 28, height: 28,
                  }}
                >
                  <Delete style={{ fontSize: 16, color: '#d32f2f' }} />
                </IconButton>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BmwSvg({ size }: { size: number }) {
  return <img src={bmwLogoSrc} alt="BMW" width={size} height={size} style={{ objectFit: 'contain' }} />;
}

// ── Logo Card ────────────────────────────────────────────────────────────────
function LogoCard() {
  return (
    <div style={{
      width: 114,
      border: '1px solid #e0e0e0',
      borderRadius: 12,
      overflow: 'hidden',
      background: '#ffffff',
    }}>
      {/* "Primary" label row */}
      <div style={{
        padding: '4px 8px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <span style={{
          fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600,
          color: '#1f1d25', letterSpacing: '0.4px', lineHeight: 1.66,
        }}>
          Primary
        </span>
      </div>

      {/* Type row: icon + "Square" */}
      <div style={{
        padding: '6px 8px 4px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: 3, flexShrink: 0,
          background: 'rgba(99,86,225,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ViewComfy style={{ fontSize: 11, color: '#473bab' }} />
        </div>
        <span style={{
          fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
          color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66,
        }}>
          Square
        </span>
      </div>

      {/* Brand row: "BMW" + settings icon */}
      <div style={{
        padding: '0 8px 8px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{
          fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
          color: '#1f1d25', letterSpacing: '0.17px', flex: 1,
        }}>
          BMW
        </span>
        <Settings style={{ fontSize: 14, color: '#9e9e9e', cursor: 'pointer' }} />
      </div>

      {/* Logo preview area */}
      <div style={{
        margin: '0 8px 8px',
        background: '#f8f9fa',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        aspectRatio: '1 / 1',
        border: '1px solid #f0f0f0',
      }}>
        <BmwSvg size={64} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export const ThemeAndLogosPage = ({}: ThemeAndLogosPageProps) => {
  const { backgrounds, removedBgIds, removeBackground, templates, removedTemplateIds, currentProject, locked } = useProject();

  const visibleBackgrounds = backgrounds.filter((b) => !removedBgIds.has(b.id));
  const visibleTemplates = templates.filter((t) => !removedTemplateIds.has(t.id));

  const handleDelete = (id: string) => {
    removeBackground(id);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <PageHeader
        breadcrumbs={['Projects', currentProject.projectName, 'Theme and Logos']}
        title="Theme and Logos"
      >
        <IconButton size="small"><MoreVert style={{ fontSize: 18 }} /></IconButton>
      </PageHeader>

      <LockableContent locked={currentProject.isEvergreen && locked} className="flex-1 overflow-y-auto" style={{ padding: '20px 24px' }}>

        {/* ── Backgrounds section ───────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          {/* Section heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 16, height: 3, background: '#4caf50', borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{
              margin: 0, fontSize: 15, fontFamily: 'Roboto, sans-serif',
              fontWeight: 600, color: '#1f1d25', letterSpacing: '0.15px',
            }}>
              Backgrounds
            </h2>
          </div>

          {/* Background group cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {visibleTemplates.map((tmpl) => (
              <BackgroundGroup
                key={tmpl.id}
                templateWidth={tmpl.width}
                templateHeight={tmpl.height}
                backgrounds={visibleBackgrounds.filter((b) => b.templateId === tmpl.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* ── Logos section ─────────────────────────────────── */}
        <div>
          {/* Section heading */}
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 15, fontFamily: 'Roboto, sans-serif',
            fontWeight: 600, color: '#1f1d25', letterSpacing: '0.15px',
          }}>
            Logos
          </h2>

          <LogoCard />
        </div>

      </LockableContent>

      <TaskFooter currentTask="theme_and_logos" />
    </div>
    </div>
  );
};
