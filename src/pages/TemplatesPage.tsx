import { useState } from 'react';
import { Button, IconButton, TextField } from '@mui/material';
import { Add, MoreVert, Search } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { TemplateCard } from '../components/ui/TemplateCard';
import { AddTemplatesDialog } from '../components/ui/AddTemplatesDialog';
import { BACKGROUNDS } from '../data/mockData';
import { useProject } from '../context/ProjectContext';

interface TemplatesPageProps {
}

export const TemplatesPage = ({}: TemplatesPageProps) => {
  const { templates, removedTemplateIds, removeTemplate } = useProject();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const visibleTemplates = templates.filter((t) => !removedTemplateIds.has(t.id));

  const filtered = visibleTemplates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pick the first background for each template as preview backdrop
  const getPreviewBg = (templateId: string) =>
    BACKGROUNDS.find((b) => b.templateId === templateId)?.url;

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
    <div
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <PageHeader
        breadcrumbs={['Projects', 'May Offers - Specials', 'Templates']}
        title="Templates"
      >
        <Button
          variant="contained"
          startIcon={<Add />}
          size="small"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            textTransform: 'none',
            background: '#473bab',
            borderRadius: '100px',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.46px',
            boxShadow: 'none',
            '&:hover': { background: '#3d3396', boxShadow: 'none' },
          }}
        >
          Add
        </Button>
        <IconButton size="small"><MoreVert style={{ fontSize: 18 }} /></IconButton>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Find below"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: { startAdornment: <Search style={{ fontSize: 20, color: '#9c99a9', marginRight: 6, flexShrink: 0 }} /> },
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {filtered.map((tmpl) => (
            <TemplateCard
              key={tmpl.id}
              template={tmpl}
              selected={selectedIds.has(tmpl.id)}
              onSelect={handleSelect}
              onClick={() => handleSelect(tmpl.id, !selectedIds.has(tmpl.id))}
              backgroundUrl={getPreviewBg(tmpl.id)}
              onRemove={removeTemplate}
            />
          ))}
        </div>
      </div>

      <TaskFooter currentTask="templates" />
    </div>
    </div>

    <AddTemplatesDialog
      open={addDialogOpen}
      onClose={() => setAddDialogOpen(false)}
      projectTemplateIds={new Set(templates.map((t) => t.id))}
      availableTemplates={visibleTemplates}
    />
    </>
  );
};
