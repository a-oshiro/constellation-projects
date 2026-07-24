import { useState, useMemo } from 'react';
import { IconButton, TextField, Switch } from '@mui/material';
import { Search, MoreVert, Add, ArrowDropDown, InfoOutlined } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { AdShellCard } from '../components/ui/AdShellCard';
import { AddDestinationUrlsDialog } from '../components/ui/AddDestinationUrlsDialog';
import { useLayout } from '../context/LayoutContext';
import emptyFolderSrc from '../assets/empty-folder.png';
import { useProject } from '../context/ProjectContext';
import { TEMPLATES, BACKGROUNDS } from '../data/mockData';

const AD_TYPE_MAP: Record<string, string> = {
  'Facebook Cover': 'Carousel',
  'Facebook Post': 'Grid',
};

const CreateAdShellSplitButton = () => (
  <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', flexShrink: 0 }}>
    <button
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: '#473bab', color: '#ffffff', border: 'none',
        padding: '5px 12px 5px 10px', fontSize: 13, fontWeight: 500,
        fontFamily: 'Roboto, sans-serif', letterSpacing: '0.46px',
        lineHeight: '22px', cursor: 'pointer',
        borderRight: '1px solid rgba(255,255,255,0.3)',
      }}
    >
      <Add style={{ fontSize: 18 }} />
      Create Ad Shell
    </button>
    <button
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#473bab', color: '#ffffff', border: 'none',
        padding: '5px 6px', cursor: 'pointer',
      }}
    >
      <ArrowDropDown style={{ fontSize: 20 }} />
    </button>
  </div>
);

export const AdsPage = () => {
  const { assets, everApprovedIds, approvalEnabled, currentProject } = useProject();
  const { openAdShellPanel, editingShell, shellCustomizations } = useLayout();
  const [search, setSearch] = useState('');
  const [autoFill, setAutoFill] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [urlsDialogOpen, setUrlsDialogOpen] = useState(false);

  const allHtmlAssets = useMemo(
    () => assets.filter((a) => a.status !== 'draft' && a.status !== 'removed' && a.imageType === 'HTML'),
    [assets]
  );
  const allHtmlTemplateIds = useMemo(
    () => Array.from(new Set(allHtmlAssets.map((a) => a.templateId))),
    [allHtmlAssets]
  );

  // In approval mode: include approved/updated/awaiting/removed assets that have been approved before.
  // In no-approval mode: include generated/updated/removed assets (all were generated at some point).
  const approvedAssets = approvalEnabled
    ? assets.filter((a) =>
        a.status === 'approved' ||
        (a.status === 'updated' && everApprovedIds.has(a.id)) ||
        (a.status === 'awaiting_approval' && everApprovedIds.has(a.id)) ||
        (a.status === 'removed' && everApprovedIds.has(a.id))
      )
    : assets.filter((a) =>
        a.status === 'generated' ||
        a.status === 'updated' ||
        a.status === 'removed'
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
      const id = `${first.templateId}__${first.backgroundId}`;
      const base: AdShell = {
        id,
        assets: shellAssets,
        template,
        bgNum,
        name: `${currentProject.projectName}_${first.width} x ${first.height}_BG_${bgNum}`,
        platform: first.platform,
        adType: AD_TYPE_MAP[template.type] ?? 'Grid',
        folder: first.folder,
      };
      // Apply any saved customizations on top of the computed base
      return { ...base, ...(shellCustomizations[id] ?? {}) };
    });
  }, [approvedAssets, shellCustomizations, currentProject.projectName]);

  const filteredShells = adShells.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      >
        <PageHeader
          breadcrumbs={['Projects', currentProject.projectName, 'Ads']}
          title="Ads"
          rightExtras={
            adShells.length > 0 ? (
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
                {filteredShells.length} Items
              </span>
            ) : undefined
          }
        >
          {/* Create Ad Shell split button */}
          <CreateAdShellSplitButton />

          {/* Auto-fill Disclaimers toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Switch
              size="small"
              checked={autoFill}
              onChange={(e) => setAutoFill(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#473bab' },
              }}
            />
            <span style={{
              fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
              letterSpacing: '0.17px', lineHeight: 1.43, whiteSpace: 'nowrap',
            }}>
              Auto-fill Disclaimers
            </span>
            <IconButton size="small" sx={{ padding: '2px', flexShrink: 0 }}>
              <InfoOutlined style={{ fontSize: 16, color: '#686576' }} />
            </IconButton>
          </div>

          {/* Three-dots menu */}
          <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
            <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>

          {/* Search */}
          <TextField
            size="small"
            placeholder="Find below"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <Search style={{ fontSize: 20, color: '#9c99a9', marginRight: 6, flexShrink: 0 }} />
                ),
              },
            }}
            sx={{
              minWidth: 160,
              maxWidth: 211,
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                background: '#f9fafa',
                height: 34,
                '& fieldset': { borderColor: '#cac9cf' },
                '&:hover fieldset': { borderColor: '#9c99a9' },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: 14, color: '#9c99a9', letterSpacing: '0.15px',
                padding: '6px 8px 6px 0',
                '&::placeholder': { color: '#9c99a9', opacity: 1 },
              },
            }}
          />
        </PageHeader>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {approvedAssets.length === 0 ? (
            /* Empty state — no approved assets yet */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 16, flex: 1, padding: '40px 16px',
            }}>
              <img
                src={emptyFolderSrc}
                alt=""
                style={{ width: 200, height: 200, objectFit: 'contain', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
                <p style={{
                  margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                  color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.43, textAlign: 'center',
                }}>
                  No Ad Shells Added yet.
                </p>
                <p style={{
                  margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                  color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.43, textAlign: 'center',
                }}>
                  {approvalEnabled
                    ? 'Ad Shells are created automatically once Assets are approved.'
                    : 'Ad Shells are created automatically once Assets are generated.'}
                </p>
              </div>
              <CreateAdShellSplitButton />
            </div>
          ) : (
            /* Ad Shell grid */
            <div
              className="p-4"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}
            >
              {filteredShells.map((shell) => (
                <AdShellCard
                  key={shell.id}
                  shell={shell}
                  selected={selectedIds.has(shell.id)}
                  isEditing={editingShell?.id === shell.id}
                  onSelect={handleSelect}
                  onEdit={openAdShellPanel}
                  onOpenUrlsDialog={() => setUrlsDialogOpen(true)}
                />
              ))}
            </div>
          )}
        </div>

        <TaskFooter currentTask="ads" />
      </div>

      <AddDestinationUrlsDialog
        open={urlsDialogOpen}
        onClose={() => setUrlsDialogOpen(false)}
        allAssets={allHtmlAssets}
        selectedTemplateIds={allHtmlTemplateIds}
        warningMode
      />
    </div>
  );
};
