import { useState } from 'react';
import type { DragEvent } from 'react';
import { Checkbox } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
import type { EnrollmentSettings } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE } from './shared';

interface VinPrioritiesTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

export const VinPrioritiesTab = ({ settings, onChange }: VinPrioritiesTabProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const activeCount = settings.vinPriorities.filter((c) => c.active).length;

  const toggleActive = (id: string, active: boolean) => {
    if (!active && activeCount <= 1) return; // at least one must remain active
    onChange({ vinPriorities: settings.vinPriorities.map((c) => (c.id === id ? { ...c, active } : c)) });
  };

  const dragHandlers = (index: number) => ({
    onDragStart: (e: DragEvent) => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragOverIndex(index); },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) { setDragIndex(null); setDragOverIndex(null); return; }
      const next = [...settings.vinPriorities];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      onChange({ vinPriorities: next });
      setDragIndex(null);
      setDragOverIndex(null);
    },
    onDragEnd: () => { setDragIndex(null); setDragOverIndex(null); },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={BODY_TEXT_STYLE}>
        Rank the following criteria to determine which VINs are prioritized for advertising. The order below reflects our
        default prioritization, but you may reorder, select, or deselect any criteria — at least one must remain active.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {settings.vinPriorities.map((criterion, index) => (
          <div
            key={criterion.id}
            draggable
            {...dragHandlers(index)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8,
              background: dragOverIndex === index && dragIndex !== index ? 'rgba(99,86,225,0.08)' : '#f9fafa',
              opacity: dragIndex === index ? 0.5 : 1,
              cursor: 'grab', border: '1px solid transparent',
            }}
          >
            <DragIndicator style={{ fontSize: 20, color: '#9c99a9', flexShrink: 0 }} />
            <Checkbox
              size="small"
              checked={criterion.active}
              onChange={(e) => toggleActive(criterion.id, e.target.checked)}
              disabled={criterion.active && activeCount <= 1}
              sx={{ padding: '2px', '&.Mui-checked': { color: '#473bab' }, '&.Mui-disabled': { color: '#cac9cf' } }}
            />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
                {index + 1}. {criterion.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                {criterion.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
