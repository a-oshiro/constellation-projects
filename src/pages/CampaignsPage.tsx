import { useState, useMemo } from 'react';
import { MenuItem, Select, IconButton, Tooltip } from '@mui/material';
import { WarningAmber, ChevronRight, ExpandMore, PendingOutlined, EditOutlined, OpenInNew, CheckCircle, Sync } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { FilledTemplatePreview } from '../components/ui/FilledTemplatePreview';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { AdShell } from '../components/ui/AdShellCard';
import type { AssetStatus } from '../data/types';
import bmwLogoSrc from '../assets/bmw-logo.png';
import { PROJECT_INFO, TEMPLATES, BACKGROUNDS } from '../data/mockData';
import { useProject } from '../context/ProjectContext';
import { useSnackbar } from '../context/SnackbarContext';

function toInputDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const AD_TYPE_MAP: Record<string, string> = {
  'Facebook Cover': 'Carousel',
  'Facebook Post': 'Grid',
};

const PLACEMENT_OPTIONS = [
  'Specials grid A',
  'Specials grid B',
  'Homepage banner',
  'Specials banner',
  'Model page hero',
  'Offers page',
];

// Column widths — must match exactly between header, campaign row, and ad shell rows
const COL_CHEVRON = 24;
const COL_LOGO = 54;      // 16px left pad + 38px image
const COL_NAME = 300;     // campaign name cell
const COL_STATUS = 160;
const COL_DATE = 140;
const COL_SHELL_INDENT = COL_CHEVRON + COL_LOGO;  // 78px — aligns thumbnail with campaign logo
const COL_SHELL_NAME = COL_NAME - COL_LOGO;        // 246px — right edge aligns with campaign name

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25',
  letterSpacing: '0.17px',
  lineHeight: '1.43',
  background: '#ffffff',
  border: '1px solid #cac9cf',
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
};

const readOnlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#F9FAFA',
  color: 'rgba(0,0,0,0.38)',
  cursor: 'default',
};

const DraftBadge = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px 3px 6px', borderRadius: 8,
    background: 'rgba(2, 136, 209, 0.08)',
  }}>
    <PendingOutlined style={{ fontSize: 14, color: '#01579b' }} />
    <span style={{
      fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
      color: '#01579b', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
    }}>
      Draft
    </span>
  </div>
);

const ActiveBadge = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 8px 3px 6px', borderRadius: 8,
    background: 'rgb(232, 245, 233)',
  }}>
    <CheckCircle style={{ fontSize: 14, color: '#1b5e20' }} />
    <span style={{
      fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
      color: '#1b5e20', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
    }}>
      Active
    </span>
  </div>
);

const HeaderCell = ({
  children, width, flex, minWidth,
}: {
  children: React.ReactNode;
  width?: number;
  flex?: boolean;
  minWidth?: number;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12, height: '100%',
    paddingRight: 12, paddingTop: 16, paddingBottom: 16,
    width: flex ? undefined : width,
    flex: flex ? '1 0 0' : undefined,
    minWidth: minWidth,
    flexShrink: 0,
  }}>
    <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
    <span style={{
      fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
      color: '#1f1d25', letterSpacing: '0.17px', lineHeight: '24px', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  </div>
);

/** Mini 38×38 stacked-card thumbnail for Ad Shell rows */
const MiniShellThumbnail = ({ shell }: { shell: AdShell }) => {
  const { assets, template } = shell;
  const isWide = template.width > template.height;
  const innerWidthPct = isWide ? 100 : (template.width / template.height) * 100;
  const innerHeightPct = !isWide ? 100 : (template.height / template.width) * 100;

  const layer = (asset: typeof assets[0], style?: React.CSSProperties) => (
    <div key={asset.id} style={{
      position: 'absolute', inset: 4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
        <FilledTemplatePreview template={template} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
      </div>
    </div>
  );

  return (
    <div style={{
      width: 38, height: 38, position: 'relative', overflow: 'hidden',
      flexShrink: 0, borderRadius: 2,
    }}>
      {assets[2] && layer(assets[2], { opacity: 0.4, transform: 'rotate(-5deg)' })}
      {assets[1] && layer(assets[1], { opacity: 0.4, transform: 'rotate(5deg)' })}
      {assets[0] && layer(assets[0])}
    </div>
  );
};

export const CampaignsPage = () => {
  const { assets, everApprovedIds, campaignLoaded, loadCampaign } = useProject();
  const { showSnackbar } = useSnackbar();

  const approvedAssets = assets.filter((a) =>
    a.status === 'approved' ||
    a.status === 'updated' ||
    (a.status === 'awaiting_approval' && everApprovedIds.has(a.id)) ||
    (a.status === 'removed' && everApprovedIds.has(a.id))
  );

  const adShells = useMemo<AdShell[]>(() => {
    const shellMap = new Map<string, typeof approvedAssets>();
    approvedAssets.forEach((asset) => {
      const key = `${asset.templateId}__${asset.backgroundId}`;
      if (!shellMap.has(key)) shellMap.set(key, []);
      shellMap.get(key)!.push(asset);
    });
    return Array.from(shellMap.values()).map((shellAssets) => {
      const first = shellAssets[0];
      const template = TEMPLATES.find((t) => t.id === first.templateId)!;
      const templateBgs = BACKGROUNDS.filter((b) => b.templateId === first.templateId);
      const bgNum = templateBgs.findIndex((b) => b.id === first.backgroundId) + 1;
      return {
        id: `${first.templateId}__${first.backgroundId}`,
        assets: shellAssets,
        template,
        bgNum,
        name: `${PROJECT_INFO.projectName}_${first.width} x ${first.height}_BG_${bgNum}`,
        platform: first.platform,
        adType: AD_TYPE_MAP[template.type] ?? 'Grid',
        folder: first.folder,
      };
    });
  }, [approvedAssets]);

  const hasAdShells = adShells.length > 0;

  const [expanded, setExpanded] = useState(true);
  const [campaignName, setCampaignName] = useState(PROJECT_INFO.projectName);
  const [campaignStartDate, setCampaignStartDate] = useState(toInputDate(PROJECT_INFO.startDate));
  const [campaignEndDate, setCampaignEndDate] = useState(toInputDate(PROJECT_INFO.endDate));

  // Per-shell overrideable dates and placement
  const [shellData, setShellData] = useState<Record<string, {
    startDate: string; endDate: string; placement: string;
  }>>({});

  const getShellData = (id: string, idx?: number) => {
    const defaultPlacement = idx !== undefined
      ? PLACEMENT_OPTIONS[idx % PLACEMENT_OPTIONS.length]
      : PLACEMENT_OPTIONS[0];
    return shellData[id] ?? { startDate: campaignStartDate, endDate: campaignEndDate, placement: defaultPlacement };
  };

  const updateShell = (id: string, patch: Partial<{ startDate: string; endDate: string; placement: string }>) => {
    const idx = adShells.findIndex((s) => s.id === id);
    setShellData((prev) => ({ ...prev, [id]: { ...getShellData(id, idx), ...patch } }));
  };

  const shellStatus = (shell: AdShell): AssetStatus | null => {
    const statuses = shell.assets.map((a) => a.status);
    if (statuses.some((s) => s === 'awaiting_approval')) return 'awaiting_approval';
    if (statuses.some((s) => s === 'updated' || s === 'removed')) return 'updated';
    return null;
  };

  const allShellsApproved = hasAdShells && adShells.every((shell) =>
    shell.assets.every((a) => a.status === 'approved')
  );
  const requiredFieldsFilled = campaignName.trim() !== '' && campaignStartDate !== '' && campaignEndDate !== '';
  const canLoad = allShellsApproved && requiredFieldsFilled && !campaignLoaded;

  const tooltipMessage = !hasAdShells
    ? 'Add at least one Ad Shell to load campaign.'
    : !allShellsApproved
      ? 'Unable to load campaign. One or more Ad Shells contain unapproved assets'
      : !requiredFieldsFilled
        ? 'Unable to load campaign. One or more required fields below are missing'
        : '';

  // Derive overall campaign row status from shells (when loaded)
  const campaignRowStatus = useMemo<AssetStatus | null>(() => {
    if (!hasAdShells) return null;
    const shellStatuses = adShells.map((s) => shellStatus(s));
    if (shellStatuses.some((s) => s === 'awaiting_approval')) return 'awaiting_approval';
    if (shellStatuses.some((s) => s === 'updated')) return 'updated';
    return null;
  }, [adShells]);

  const anyShellHasIssue = hasAdShells && adShells.some((s) => shellStatus(s) !== null);
  const refreshDisabled = campaignLoaded && anyShellHasIssue;
  const refreshTooltip = 'One or more Ad Shells contain unapproved assets. Update and approve assets before refreshing the Website';

  const handleLoadCampaign = () => {
    loadCampaign();
    showSnackbar({ message: 'Campaign loaded to website.' });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#F9FAFA' }}>
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <PageHeader breadcrumbs={['Projects', 'May Offers - Specials', 'Campaigns']} title="Campaigns">
          {campaignLoaded ? (
            <Tooltip title={refreshDisabled ? refreshTooltip : ''} disableHoverListener={!refreshDisabled} arrow>
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                <button
                  onClick={refreshDisabled ? undefined : () => showSnackbar({ message: 'Website ads refreshed.' })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'transparent',
                    color: refreshDisabled ? 'rgba(0,0,0,0.38)' : '#473bab',
                    border: refreshDisabled ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(99, 86, 225, 0.5)',
                    borderRadius: 100, padding: '4px 10px', fontSize: 13, fontWeight: 500,
                    fontFamily: 'Roboto, sans-serif', letterSpacing: '0.46px',
                    lineHeight: '22px',
                    cursor: refreshDisabled ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    pointerEvents: refreshDisabled ? 'none' : 'auto',
                  }}
                >
                  <Sync style={{ fontSize: 18, color: refreshDisabled ? 'rgba(0,0,0,0.38)' : '#473bab' }} />
                  Refresh Website
                </button>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title={tooltipMessage} disableHoverListener={canLoad} arrow>
              <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                <button
                  disabled={!canLoad}
                  onClick={canLoad ? handleLoadCampaign : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: canLoad ? '#473bab' : 'rgba(0,0,0,0.12)',
                    color: canLoad ? '#ffffff' : 'rgba(0,0,0,0.38)',
                    border: 'none', borderRadius: 20, padding: '5px 16px',
                    fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                    letterSpacing: '0.46px', lineHeight: '22px',
                    cursor: canLoad ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap', pointerEvents: canLoad ? 'auto' : 'none',
                  }}
                >
                  Load Campaign
                </button>
              </span>
            </Tooltip>
          )}
        </PageHeader>

        <div className="flex-1 overflow-y-auto flex flex-col" style={{ padding: '0 16px' }}>

          {/* Warning alert — only when no Ad Shells yet */}
          {!hasAdShells && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 4,
              padding: '6px 16px', marginTop: 16,
              background: '#fff4e5', borderRadius: 4,
            }}>
              <WarningAmber style={{ fontSize: 22, color: '#ed6c02', flexShrink: 0, marginTop: 1 }} />
              <span style={{
                fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                color: '#663c00', letterSpacing: '0.17px', lineHeight: 1.43, paddingTop: 2,
              }}>
                Please add at least one Ad Shell to load campaigns
              </span>
            </div>
          )}

          {/* Campaign table */}
          <div style={{ marginTop: 16 }}>

            {/* ── Table header row ─────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', height: 56,
              borderBottom: '1px solid rgba(0,0,0,0.12)',
            }}>
              <div style={{ width: COL_CHEVRON, flexShrink: 0 }} />
              <div style={{ width: COL_LOGO, flexShrink: 0 }} />
              <HeaderCell width={COL_NAME}>Campaign Name</HeaderCell>
              <HeaderCell width={COL_STATUS}>Status</HeaderCell>
              <HeaderCell width={COL_DATE}>Start Date</HeaderCell>
              <HeaderCell width={COL_DATE}>End Date</HeaderCell>
              <HeaderCell flex minWidth={200}>Website Placement</HeaderCell>
            </div>

            {/* ── Campaign row ──────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', height: 72,
              borderBottom: '1px solid rgba(0,0,0,0.12)',
            }}>
              {/* Chevron — expand/collapse */}
              <div
                style={{ width: COL_CHEVRON, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: hasAdShells ? 'pointer' : 'default' }}
                onClick={() => hasAdShells && setExpanded((v) => !v)}
              >
                {hasAdShells
                  ? (expanded
                    ? <ExpandMore style={{ fontSize: 24, color: '#1f1d25' }} />
                    : <ChevronRight style={{ fontSize: 24, color: '#1f1d25' }} />)
                  : <ChevronRight style={{ fontSize: 24, color: 'rgba(0,0,0,0.26)' }} />
                }
              </div>

              {/* Project logo */}
              <div style={{ width: COL_LOGO, paddingLeft: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 4, border: '1px solid #f0f0f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#ffffff', overflow: 'hidden',
                }}>
                  <img src={bmwLogoSrc} alt="BMW" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                </div>
              </div>

              {/* Campaign Name */}
              <div style={{ width: COL_NAME, paddingLeft: 16, paddingRight: 12, flexShrink: 0 }}>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => !campaignLoaded && setCampaignName(e.target.value)}
                  readOnly={campaignLoaded}
                  style={campaignLoaded ? readOnlyInputStyle : inputStyle}
                />
              </div>

              {/* Status */}
              <div style={{ width: COL_STATUS, paddingLeft: 16, paddingRight: 12, flexShrink: 0 }}>
                {campaignLoaded
                  ? (campaignRowStatus ? <StatusBadge status={campaignRowStatus} /> : <ActiveBadge />)
                  : <DraftBadge />}
              </div>

              {/* Start Date */}
              <div style={{ width: COL_DATE, paddingLeft: 12, paddingRight: 12, flexShrink: 0 }}>
                <input
                  type="date"
                  value={campaignStartDate}
                  onChange={(e) => !campaignLoaded && setCampaignStartDate(e.target.value)}
                  readOnly={campaignLoaded}
                  style={campaignLoaded ? readOnlyInputStyle : inputStyle}
                />
              </div>

              {/* End Date */}
              <div style={{ width: COL_DATE, paddingLeft: 12, paddingRight: 12, flexShrink: 0 }}>
                <input
                  type="date"
                  value={campaignEndDate}
                  onChange={(e) => !campaignLoaded && setCampaignEndDate(e.target.value)}
                  readOnly={campaignLoaded}
                  style={campaignLoaded ? readOnlyInputStyle : inputStyle}
                />
              </div>

              {/* Account URL */}
              <div style={{ flex: '1 0 0', paddingLeft: 16, paddingRight: 16, minWidth: 200, overflow: 'hidden' }}>
                <a
                  href={PROJECT_INFO.accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                    color: '#473bab', letterSpacing: '0.17px', lineHeight: 1.43,
                    textDecoration: 'none', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}
                >
                  {PROJECT_INFO.accountUrl}
                </a>
              </div>
            </div>

            {/* ── Ad Shell child rows (expanded) ────────────── */}
            {hasAdShells && expanded && adShells.map((shell, idx) => {
              const data = getShellData(shell.id, idx);
              const status = shellStatus(shell);

              return (
                <div
                  key={shell.id}
                  style={{
                    display: 'flex', alignItems: 'center', height: 60,
                    borderBottom: '1px solid rgba(0,0,0,0.12)',
                    background: '#f9fafa',
                    paddingLeft: COL_SHELL_INDENT,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ paddingLeft: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <MiniShellThumbnail shell={shell} />
                  </div>

                  {/* Ad Shell name — primary color, truncated */}
                  <div style={{
                    width: COL_SHELL_NAME, paddingLeft: 16, paddingRight: 10,
                    overflow: 'hidden', flexShrink: 0,
                  }}>
                    <span style={{
                      fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                      color: '#473bab', letterSpacing: '0.17px', lineHeight: 1.43,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {shell.name}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ width: COL_STATUS, paddingLeft: 16, paddingRight: 12, flexShrink: 0 }}>
                    {campaignLoaded
                      ? (status ? <StatusBadge status={status} /> : <ActiveBadge />)
                      : (status && <StatusBadge status={status} />)
                    }
                  </div>

                  {/* Start Date */}
                  <div style={{ width: COL_DATE, paddingLeft: 12, paddingRight: 12, flexShrink: 0 }}>
                    <input
                      type="date"
                      value={data.startDate}
                      onChange={(e) => !campaignLoaded && updateShell(shell.id, { startDate: e.target.value })}
                      readOnly={campaignLoaded}
                      style={campaignLoaded ? readOnlyInputStyle : inputStyle}
                    />
                  </div>

                  {/* End Date */}
                  <div style={{ width: COL_DATE, paddingLeft: 12, paddingRight: 12, flexShrink: 0 }}>
                    <input
                      type="date"
                      value={data.endDate}
                      onChange={(e) => !campaignLoaded && updateShell(shell.id, { endDate: e.target.value })}
                      readOnly={campaignLoaded}
                      style={campaignLoaded ? readOnlyInputStyle : inputStyle}
                    />
                  </div>

                  {/* Website Placement — Select */}
                  <div style={{ flex: '1 0 0', paddingLeft: 12, paddingRight: 8, minWidth: 160 }}>
                    <Select
                      value={data.placement}
                      onChange={(e) => !campaignLoaded && updateShell(shell.id, { placement: e.target.value })}
                      size="small"
                      variant="outlined"
                      fullWidth
                      disabled={campaignLoaded}
                      sx={{
                        fontSize: 12,
                        backgroundColor: '#ffffff',
                        fontFamily: 'Roboto, sans-serif',
                        letterSpacing: '0.17px',
                        color: '#1f1d25',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                        '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 },
                        '&.Mui-disabled': { background: '#F9FAFA' },
                        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                        height: 36,
                      }}
                    >
                      {PLACEMENT_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>
                          {opt}
                        </MenuItem>
                      ))}
                    </Select>
                  </div>

                  {/* Actions — Edit + Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 8, flexShrink: 0 }}>
                    <IconButton size="small" sx={{ padding: '5px' }}>
                      <EditOutlined style={{ fontSize: 20, color: 'rgb(71, 59, 171)' }} />
                    </IconButton>
                    <IconButton size="small" sx={{ padding: '5px' }}>
                      <OpenInNew style={{ fontSize: 20, color: '#686576' }} />
                    </IconButton>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        <TaskFooter currentTask="campaigns" />
      </div>
    </div>
  );
};
