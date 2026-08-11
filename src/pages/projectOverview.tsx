import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { MoreVert, ExpandMore, ChevronRight, OpenInNew, CheckCircle, PendingOutlined } from '@mui/icons-material';
import bmwLogoSrc from '../assets/bmw-logo.png';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { ProjectStatusBadge } from '../components/ui/ProjectStatusBadge';
import { OverviewOfferCard, OverviewTemplateCard, OverviewAssetCard, OverviewAdShellCard, ScrollRow, TemplateThumb } from '../components/ui/OverviewCards';
import { FilledTemplatePreview } from '../components/ui/FilledTemplatePreview';
import { AlertsKanbanBoard } from '../components/ui/AlertsKanbanBoard';
import { ProjectSummary } from '../components/ui/ProjectSummary';
import type { SummaryCardConfig } from '../components/ui/ProjectSummary';
import type { SectionStatus } from '../data/projects';
import { computePreviewAssets, groupIntoAdShells, computeAlertOfferVisibility } from '../utils/overviewAssets';
import { useLayout } from '../context/LayoutContext';
import { useProject } from '../context/ProjectContext';
import { LockableContent } from '../components/ui/LockedOverlay';

type SectionKey = 'offers' | 'templates' | 'themeAndLogos' | 'assets' | 'adShells' | 'campaigns';

const SECTION_ROUTES: Record<SectionKey, string> = {
  offers: '/offers',
  templates: '/templates',
  themeAndLogos: '/theme-and-logos',
  assets: '/approved',
  adShells: '/ads',
  campaigns: '/campaigns',
};

const TagChip = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', borderRadius: 8,
    padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
    color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const ActiveBadge = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', borderRadius: 8, background: 'rgb(232, 245, 233)' }}>
    <CheckCircle style={{ fontSize: 14, color: '#1b5e20' }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1b5e20', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>Active</span>
  </div>
);

const DraftBadge = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', borderRadius: 8, background: 'rgba(2, 136, 209, 0.08)' }}>
    <PendingOutlined style={{ fontSize: 14, color: '#01579b' }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#01579b', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>Draft</span>
  </div>
);

interface SectionProps {
  title: string;
  count: number;
  status: SectionStatus;
  expanded: boolean;
  onToggle: () => void;
  onDetails: () => void;
  /** Shown instead of the header controls + content when count is 0. */
  emptyMessage: string;
  children: React.ReactNode;
}

const Section = ({ title, count, status, expanded, onToggle, onDetails, emptyMessage, children }: SectionProps) => {
  const isEmpty = count === 0;
  const { currentProject, locked } = useProject();
  const isLocked = currentProject.isEvergreen && locked;

  return (
    <div style={{ background: '#f4f5f6', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
      {isEmpty ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 12px' }}>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
              {title}
            </span>
          </div>
          <div style={{ padding: '0 12px 12px' }}>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
              {emptyMessage}
            </span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '4px 12px 4px 4px' }}>
            <IconButton size="small" onClick={onToggle} sx={{ padding: '5px', width: 30, height: 30, flexShrink: 0 }}>
              {expanded ? <ExpandMore style={{ fontSize: 20, color: '#1f1d25' }} /> : <ChevronRight style={{ fontSize: 20, color: '#1f1d25' }} />}
            </IconButton>
            <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
              {title}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.17px', marginLeft: 4, whiteSpace: 'nowrap' }}>
              ({count})
            </span>
            <span style={{ marginLeft: 8, flexShrink: 0 }}>
              <ProjectStatusBadge status={status} />
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={onDetails}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                cursor: 'pointer', color: '#686576', fontSize: 12, fontFamily: 'Roboto, sans-serif',
                fontWeight: 400, letterSpacing: '0.17px', padding: '4px 8px', flexShrink: 0,
              }}
            >
              <OpenInNew style={{ fontSize: 16 }} />
              Details
            </button>
          </div>
          {expanded && (
            <LockableContent locked={isLocked} tint="#f4f5f6" style={{ padding: '4px 16px 12px' }}>
              {children}
            </LockableContent>
          )}
        </>
      )}
    </div>
  );
};

export const ProjectOverviewPage = () => {
  const { tasksPanelOpen, openTasksPanel } = useLayout();
  const { currentProject: project, alerts, selectedProjectId, selectProject } = useProject();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // The URL is the source of truth for which project is shown — keep context in sync with it.
  useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectId);
    }
  }, [projectId, selectedProjectId, selectProject]);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    offers: true, templates: true, themeAndLogos: true, assets: true, adShells: true, campaigns: true,
  });

  const toggle = (key: SectionKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const previewAssets = useMemo(
    () => computePreviewAssets(project.offers, project.templates, project.backgrounds, project.projectName),
    [project],
  );

  // Evergreen only: an offer's preview assets stay hidden from the Project Summary until an
  // Alert featuring it is Approved, and only get grouped into Ad Shells once that Alert is Sent.
  // Offers no alert ever references are outside that lifecycle and stay always-visible.
  const previewOfferIds = useMemo(() => Array.from(new Set(previewAssets.map((a) => a.offerId))), [previewAssets]);
  const alertVisibility = useMemo(() => computeAlertOfferVisibility(alerts, previewOfferIds), [alerts, previewOfferIds]);

  const visibleAssets = useMemo(
    () => (project.isEvergreen ? previewAssets.filter((a) => alertVisibility.unlockedOfferIds.has(a.offerId)) : previewAssets),
    [previewAssets, alertVisibility, project.isEvergreen],
  );

  const adShells = useMemo(() => {
    const shellAssets = project.isEvergreen
      ? previewAssets.filter((a) => alertVisibility.shellOfferIds.has(a.offerId))
      : previewAssets;
    return groupIntoAdShells(shellAssets, project.templates, project.projectName);
  }, [previewAssets, alertVisibility, project]);

  const newAssetsCount = useMemo(
    () => visibleAssets.filter((a) => alertVisibility.newOfferIds.has(a.offerId)).length,
    [visibleAssets, alertVisibility],
  );

  const latestAssets = useMemo(() => {
    if (!project.isEvergreen) return visibleAssets.slice(0, 12);
    return [...visibleAssets]
      .sort((a, b) => (alertVisibility.unlockedAt[b.offerId] ?? 0) - (alertVisibility.unlockedAt[a.offerId] ?? 0))
      .slice(0, 12);
  }, [visibleAssets, alertVisibility, project.isEvergreen]);

  const campaignsActive = project.sectionStatus.campaigns === 'done';

  const thumbImg = (src: string) => <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;

  const summaryCards: SummaryCardConfig[] = [
    {
      key: 'offers', title: 'Offers', count: project.offers.length, route: SECTION_ROUTES.offers,
      previewItems: project.offers.map((o) => ({ node: thumbImg(o.imageUrl), label: o.vehicleName })),
    },
    {
      key: 'templates', title: 'Templates', count: project.templates.length, route: SECTION_ROUTES.templates,
      previewItems: project.templates.map((t) => ({ node: <TemplateThumb key={t.id} template={t} />, label: t.name })),
    },
    {
      key: 'themeAndLogos', title: 'Theme and Logos', count: project.backgrounds.length, route: SECTION_ROUTES.themeAndLogos,
      previewItems: project.backgrounds.map((b) => ({ node: thumbImg(b.url), label: b.name })),
    },
    {
      key: 'assets', title: 'Assets', count: visibleAssets.length, delta: newAssetsCount, route: SECTION_ROUTES.assets,
      previewItems: visibleAssets.map((a) => ({ node: thumbImg(a.backgroundUrl), label: a.name })),
    },
    {
      key: 'adShells', title: 'Ad Shells', count: adShells.length, route: SECTION_ROUTES.adShells,
      previewItems: adShells
        .filter((s) => Boolean(s.assets[0]?.backgroundUrl))
        .map((s) => ({ node: thumbImg(s.assets[0].backgroundUrl), label: s.name })),
    },
    { key: 'campaigns', title: 'Campaign', count: adShells.length, live: campaignsActive, route: SECTION_ROUTES.campaigns },
  ];

  return (
    <div className="flex h-full" style={{ background: '#f0f2f4' }}>
      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
          <div style={{ marginBottom: 6 }}>
            <Breadcrumbs items={['Projects', project.projectName]} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6 }}>
            {!tasksPanelOpen && (
              <IconButton size="small" onClick={openTasksPanel} sx={{ flexShrink: 0, padding: '4px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.75" y="1.75" width="16.5" height="16.5" rx="1.25" stroke="#1f1d25" strokeWidth="1.5"/>
                  <line x1="7.25" y1="1.75" x2="7.25" y2="18.25" stroke="#1f1d25" strokeWidth="1.5"/>
                </svg>
              </IconButton>
            )}

            <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0, whiteSpace: 'nowrap' }}>
              {project.projectName}
            </h1>

            <IconButton size="small" sx={{ padding: '4px' }}>
              <MoreVert style={{ fontSize: 18, color: '#686576' }} />
            </IconButton>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <img src={bmwLogoSrc} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain', background: '#ffffff', border: '1px solid #f0f0f0' }} />
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
                {project.accountName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <img src={project.creatorAvatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
                {project.creator}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10, flexWrap: 'wrap' }}>
            <ProjectStatusBadge status={project.workflowStatus} />
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
              {project.startDate} - {project.endDate}
            </span>
            <TagChip>{project.brandTag}</TagChip>
            <TagChip>Used Offers</TagChip>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
              Last Updated: {project.lastUpdated}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>
              Created: {project.created}
            </span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#473bab', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Expand
            </button>
          </div>
        </div>

        {/* ── Sections ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {project.isEvergreen ? (
            <>
              <AlertsKanbanBoard />
              <ProjectSummary
                cards={summaryCards}
                latestAssets={latestAssets}
                totalAssetsCount={visibleAssets.length}
                assetsRoute={SECTION_ROUTES.assets}
                onNavigate={navigate}
              />
            </>
          ) : (
            <>
              <Section
                title="Offers"
                count={project.offers.length}
                status={project.sectionStatus.offers}
                expanded={expanded.offers}
                onToggle={() => toggle('offers')}
                onDetails={() => navigate(SECTION_ROUTES.offers)}
                emptyMessage="No offers added yet."
              >
                <ScrollRow>
                  {project.offers.map((offer) => <OverviewOfferCard key={offer.id} offer={offer} />)}
                </ScrollRow>
              </Section>

              <Section
                title="Templates"
                count={project.templates.length}
                status={project.sectionStatus.templates}
                expanded={expanded.templates}
                onToggle={() => toggle('templates')}
                onDetails={() => navigate(SECTION_ROUTES.templates)}
                emptyMessage="No templates added yet."
              >
                <ScrollRow>
                  {project.templates.map((tmpl) => <OverviewTemplateCard key={tmpl.id} template={tmpl} />)}
                </ScrollRow>
              </Section>

              <Section
                title="Theme and Logos"
                count={project.backgrounds.length}
                status={project.sectionStatus.themeAndLogos}
                expanded={expanded.themeAndLogos}
                onToggle={() => toggle('themeAndLogos')}
                onDetails={() => navigate(SECTION_ROUTES.themeAndLogos)}
                emptyMessage="No backgrounds or logos added yet."
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {project.backgrounds[0] && (
                    <img
                      src={project.backgrounds[0].url}
                      alt=""
                      style={{ width: 180, height: 130, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                  )}
                  <div style={{
                    width: 130, height: 130, flexShrink: 0, background: '#f8f9fa', border: '1px solid #f0f0f0',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src={bmwLogoSrc} alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                  </div>
                </div>
              </Section>

              <Section
                title="Assets"
                count={previewAssets.length}
                status={project.sectionStatus.assets}
                expanded={expanded.assets}
                onToggle={() => toggle('assets')}
                onDetails={() => navigate(SECTION_ROUTES.assets)}
                emptyMessage="No assets generated yet."
              >
                <ScrollRow>
                  {previewAssets.slice(0, 12).map((asset) => <OverviewAssetCard key={asset.id} asset={asset} />)}
                </ScrollRow>
              </Section>

              <Section
                title="Ad Shells"
                count={adShells.length}
                status={project.sectionStatus.adShells}
                expanded={expanded.adShells}
                onToggle={() => toggle('adShells')}
                onDetails={() => navigate(SECTION_ROUTES.adShells)}
                emptyMessage="No ad shells created yet."
              >
                <ScrollRow>
                  {adShells.slice(0, 12).map((shell) => <OverviewAdShellCard key={shell.id} shell={shell} />)}
                </ScrollRow>
              </Section>

              <Section
                title="Campaigns"
                count={adShells.length}
                status={project.sectionStatus.campaigns}
                expanded={expanded.campaigns}
                onToggle={() => toggle('campaigns')}
                onDetails={() => navigate(SECTION_ROUTES.campaigns)}
                emptyMessage="No campaigns loaded yet."
              >
                <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', height: 40, background: '#fafafa', padding: '0 12px', gap: 16, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Ad Shell</span>
                    <span style={{ width: 90, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Status</span>
                    <span style={{ width: 90, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Start Date</span>
                    <span style={{ width: 90, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>End Date</span>
                    <span style={{ width: 140, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Placement</span>
                  </div>
                  {adShells.slice(0, 4).map((shell, i) => (
                    <div
                      key={shell.id}
                      style={{
                        display: 'flex', alignItems: 'center', height: 52, padding: '0 12px', gap: 16,
                        borderBottom: i < Math.min(adShells.length, 4) - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#f0f2f4' }}>
                          {shell.assets[0] && (
                            <FilledTemplatePreview template={shell.template} offer={shell.assets[0].offer} backgroundUrl={shell.assets[0].backgroundUrl} />
                          )}
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shell.name}
                        </span>
                      </div>
                      <span style={{ width: 90 }}>{campaignsActive ? <ActiveBadge /> : <DraftBadge />}</span>
                      <span style={{ width: 90, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{project.startDate}</span>
                      <span style={{ width: 90, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{project.endDate}</span>
                      <span style={{ width: 140, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                        Specials grid top
                        <OpenInNew style={{ fontSize: 14, color: '#686576' }} />
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
