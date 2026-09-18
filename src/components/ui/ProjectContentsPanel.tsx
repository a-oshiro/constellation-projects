import { useState } from 'react';
import { IconButton } from '@mui/material';
import { ViewComfyOutlined, PaletteOutlined, BrandingWatermarkOutlined, VolumeUpOutlined, DataObjectOutlined, OpenInNew, ExpandMore, ChevronRight } from '@mui/icons-material';
import type { Project } from '../../data/projects';
import { getProjectPath } from '../../data/projects';
import { TemplateThumb } from './OverviewCards';
import bmwLogoSrc from '../../assets/bmw-logo.png';

const THUMB_SIZE = 120;

/** No real custom-variables persistence layer in this app (same caveat as the Models tab's Enrollment Form
 * list) — every project's templates share this one CTA variable, so it's just hardcoded here. */
const CUSTOM_VARIABLES: { name: string; type: string; defaultValue: string }[] = [
  { name: 'CTA', type: 'Text', defaultValue: 'VIEW INVENTORY' },
];

/** Backgrounds named "<dimension> Background N" across different template sizes are the same creative rendered at
 * different sizes — group them into one "Collection" per N so the same background isn't listed once per dimension. */
function backgroundCollectionKey(name: string): string {
  const match = name.match(/Background\s*(\d+)$/i);
  return match ? `Background ${match[1]}` : name;
}

interface BackgroundCollection {
  key: string;
  thumbnailUrl: string;
  assetCount: number;
}

function groupBackgroundsIntoCollections(backgrounds: Project['backgrounds']): BackgroundCollection[] {
  const map = new Map<string, BackgroundCollection>();
  backgrounds.forEach((bg) => {
    const key = backgroundCollectionKey(bg.name);
    const existing = map.get(key);
    if (existing) {
      existing.assetCount += 1;
    } else {
      map.set(key, { key, thumbnailUrl: bg.url, assetCount: 1 });
    }
  });
  return Array.from(map.values());
}

const ThumbCard = ({ image, title, subtitle }: { image: React.ReactNode; title: string; subtitle: string }) => (
  <div style={{ width: THUMB_SIZE, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{
      width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12, overflow: 'hidden',
      background: '#f0f2f4', border: '1px solid #e7e7e9',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {image}
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
        {subtitle}
      </p>
    </div>
  </div>
);

const OverlineLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 2.66 }}>
    {children}
  </p>
);

const NoSelection = () => (
  <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>No selection</span>
);

const variableColStyle: React.CSSProperties = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/** Read-only Name/Type/Default Value table — the Custom Variables section's content. */
const CustomVariablesTable = ({ variables }: { variables: typeof CUSTOM_VARIABLES }) => (
  <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', background: '#f4f5f6' }}>
      <span style={{ ...variableColStyle, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Name</span>
      <span style={{ ...variableColStyle, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Type</span>
      <span style={{ ...variableColStyle, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Default Value</span>
    </div>
    {variables.map((v) => (
      <div key={v.name} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <span style={{ ...variableColStyle, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{v.name}</span>
        <span style={{ ...variableColStyle, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{v.type}</span>
        <span style={{ ...variableColStyle, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{v.defaultValue}</span>
      </div>
    ))}
  </div>
);

interface ContentSectionProps {
  icon: React.ElementType;
  title: string;
  count: number;
  description: string;
  onEditInProject: () => void;
  expanded: boolean;
  onToggle: () => void;
  isFirst?: boolean;
  children: React.ReactNode;
}

const ContentSection = ({ icon: Icon, title, count, description, onEditInProject, expanded, onToggle, isFirst, children }: ContentSectionProps) => (
  <div style={{ borderTop: isFirst ? 'none' : '1px solid rgba(0,0,0,0.12)', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onToggle}>
        <Icon style={{ fontSize: 24, color: '#1f1d25', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
          {title} ({count})
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onEditInProject(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#473bab', fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', padding: 0, flexShrink: 0 }}
        >
          <OpenInNew style={{ fontSize: 16 }} />
          Edit in Project
        </button>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle(); }} sx={{ padding: '2px', flexShrink: 0 }}>
          {expanded ? <ExpandMore style={{ fontSize: 20, color: '#1f1d25' }} /> : <ChevronRight style={{ fontSize: 20, color: '#1f1d25' }} />}
        </IconButton>
      </div>
      <p style={{ margin: '2px 0 0 32px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
        {description}
      </p>
    </div>
    {expanded && <div style={{ paddingLeft: 32 }}>{children}</div>}
  </div>
);

interface ProjectContentsPanelProps {
  project: Project;
  onEditInProject: (path: string) => void;
}

/** Read-only summary of everything the project draws from (Templates/Backgrounds/Logos/Audio) — no editing here. */
export const ProjectContentsPanel = ({ project, onEditInProject }: ProjectContentsPanelProps) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['customVariables', 'templates', 'backgrounds', 'logos', 'audio']));
  const toggle = (key: string) => setExpandedKeys((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const collections = groupBackgroundsIntoCollections(project.backgrounds);
  const themeAndLogosPath = getProjectPath(project, 'theme-and-logos');

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <ContentSection
        icon={DataObjectOutlined}
        title="Custom Variables"
        count={CUSTOM_VARIABLES.length}
        description="Named values templates can reference in place of hardcoded text, e.g. a shared CTA."
        onEditInProject={() => onEditInProject(getProjectPath(project, 'templates'))}
        expanded={expandedKeys.has('customVariables')}
        onToggle={() => toggle('customVariables')}
        isFirst
      >
        <CustomVariablesTable variables={CUSTOM_VARIABLES} />
      </ContentSection>

      <ContentSection
        icon={ViewComfyOutlined}
        title="Templates"
        count={project.templates.length}
        description="What every entry renders from — and what decides the background sizes and logo slots below."
        onEditInProject={() => onEditInProject(getProjectPath(project, 'templates'))}
        expanded={expandedKeys.has('templates')}
        onToggle={() => toggle('templates')}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {project.templates.map((t) => (
            <ThumbCard
              key={t.id}
              image={<div style={{ width: THUMB_SIZE, height: THUMB_SIZE }}><TemplateThumb template={t} /></div>}
              title={t.name}
              subtitle={`${t.width} x ${t.height}`}
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        icon={PaletteOutlined}
        title="Backgrounds"
        count={project.backgrounds.length}
        description="The pool entries draw their backgrounds from, reviewed against every template size."
        onEditInProject={() => onEditInProject(themeAndLogosPath)}
        expanded={expandedKeys.has('backgrounds')}
        onToggle={() => toggle('backgrounds')}
      >
        <OverlineLabel>Collections ({collections.length})</OverlineLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {collections.map((c) => (
            <ThumbCard
              key={c.key}
              image={<img src={c.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              title={c.key}
              subtitle={`${c.assetCount} asset${c.assetCount === 1 ? '' : 's'}`}
            />
          ))}
        </div>
      </ContentSection>

      <ContentSection
        icon={BrandingWatermarkOutlined}
        title="Logos"
        count={1}
        description="The logo pool each placeholder may draw from, matched per entry by vehicle model."
        onEditInProject={() => onEditInProject(themeAndLogosPath)}
        expanded={expandedKeys.has('logos')}
        onToggle={() => toggle('logos')}
      >
        <OverlineLabel>Primary Logo (1)</OverlineLabel>
        <ThumbCard
          image={<img src={bmwLogoSrc} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />}
          title={`${project.brandTag.toLowerCase()}_logo.png`}
          subtitle="480 x 390"
        />
        <div style={{ marginTop: 16 }}>
          <OverlineLabel>Event Logo (0)</OverlineLabel>
          <NoSelection />
        </div>
      </ContentSection>

      <ContentSection
        icon={VolumeUpOutlined}
        title="Audio"
        count={0}
        description="Template defaults and vehicle matched Lifestyle audio for each audio placeholder."
        onEditInProject={() => onEditInProject(themeAndLogosPath)}
        expanded={expandedKeys.has('audio')}
        onToggle={() => toggle('audio')}
      >
        <NoSelection />
      </ContentSection>
    </div>
  );
};
