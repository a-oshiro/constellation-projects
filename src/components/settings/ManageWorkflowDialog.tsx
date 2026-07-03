import { Fragment, useState } from 'react';
import type { DragEvent } from 'react';
import {
  Dialog, IconButton, FormControl, InputLabel, Select, MenuItem, Menu, TextField,
} from '@mui/material';
import { Add, Close, DragIndicator, DeleteOutlineOutlined } from '@mui/icons-material';
import { AppTextField } from '../ui/AppTextField';
import {
  REPLACEMENT_METHODS, FILTER_CATALOG, STRATEGY_CATALOG, FALLBACK_STEP, createDefaultStep,
} from './workflowTypes';
import type { WorkflowStepConfig, WorkflowFilter } from './workflowTypes';

interface ManageWorkflowDialogProps {
  workflowName: string;
  initialSteps: WorkflowStepConfig[];
  onClose: () => void;
  onSave: (steps: WorkflowStepConfig[]) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', marginBottom: 2,
};
const valueStyle: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', marginBottom: 8,
};

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({
  step, index, selected, dragging, dragOver, onSelect, onRemove, onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  step: WorkflowStepConfig;
  index: number;
  selected: boolean;
  dragging: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const method = REPLACEMENT_METHODS.find((m) => m.value === step.replacementMethod);
  const showDelete = hovered || selected;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: selected ? '1.5px solid #473bab' : '1px solid #dddce0',
        boxShadow: selected ? '0 0 0 1px #473bab' : 'none',
        outline: dragOver ? '1px dashed #6356e1' : 'none',
        outlineOffset: 2,
        opacity: dragging ? 0.5 : 1,
        borderRadius: 12, padding: 16, background: '#ffffff', cursor: 'grab',
      }}
    >
      {showDelete && (
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          sx={{
            position: 'absolute', top: 8, right: 8, padding: '4px',
            background: '#ffffff', border: '1px solid #dddce0',
            '&:hover': { background: '#fdf7f8', borderColor: '#d2323f' },
          }}
        >
          <DeleteOutlineOutlined style={{ fontSize: 16, color: '#686576' }} />
        </IconButton>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: '#473bab', color: '#ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
          {step.name || 'Untitled step'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, paddingLeft: 42 }}>
        <div>
          <div style={labelStyle}>Replacement Method</div>
          <div style={valueStyle}>{method?.shortLabel}</div>
        </div>
        <div>
          <div style={labelStyle}>Strategy</div>
          <div style={valueStyle}>{step.strategy.length ? step.strategy.join(' → ') : '—'}</div>
        </div>
        <div>
          <div style={labelStyle}>Filters</div>
          {step.filters.length === 0 ? (
            <div style={valueStyle}>&mdash;</div>
          ) : (
            step.filters.map((f) => (
              <div key={f.id} style={{ ...valueStyle, fontWeight: 600 }}>{f.label}: {f.value}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Connector between steps ("If no matches are found" / hover-to-add) ────────

function StepConnector({ interactive, onAddStep }: { interactive: boolean; onAddStep?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const showAdd = interactive && hovered;
  return (
    <div
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 62 }}
    >
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: '#dddce0' }} />
      {showAdd ? (
        <button
          onClick={onAddStep}
          style={{
            position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 100, border: 'none', background: '#473bab', color: '#ffffff',
            fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer',
          }}
        >
          <Add style={{ fontSize: 14 }} />
          Add Step
        </button>
      ) : (
        <span style={{
          position: 'relative', zIndex: 1, background: '#ffffff', border: '1px solid #dddce0', borderRadius: 8,
          padding: '4px 10px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576',
        }}>
          If no matches are found
        </span>
      )}
    </div>
  );
}

// ── Fallback card (static, always last) ────────────────────────────────────────

function FallbackCard() {
  return (
    <div style={{ border: '1px solid #dddce0', borderRadius: 12, padding: 16, display: 'flex', gap: 12, background: '#ffffff' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#d2323f', color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0,
      }}>
        F
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', marginBottom: 4 }}>
          {FALLBACK_STEP.title}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', marginBottom: 10 }}>
          {FALLBACK_STEP.description}
        </div>
        <div style={labelStyle}>Admins</div>
        <div style={valueStyle}>{FALLBACK_STEP.admins.join(', ')}</div>
      </div>
    </div>
  );
}

// ── Filter row (Edit Step panel) ───────────────────────────────────────────────

function FilterRow({ filter, onChangeValue, onRemove }: {
  filter: WorkflowFilter;
  onChangeValue: (value: string) => void;
  onRemove: () => void;
}) {
  const catalogEntry = FILTER_CATALOG.find((c) => c.key === filter.filterKey);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 12 }}>
      <FormControl size="small" fullWidth>
        <InputLabel sx={{ fontSize: 13 }}>{filter.label}</InputLabel>
        <Select
          label={filter.label}
          value={filter.value}
          onChange={(e) => onChangeValue(e.target.value)}
          sx={{ fontSize: 13 }}
        >
          {(catalogEntry?.options ?? [filter.value]).map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton size="small" onClick={onRemove} sx={{ padding: '4px', marginBottom: '2px' }}>
        <Close style={{ fontSize: 16, color: '#686576' }} />
      </IconButton>
    </div>
  );
}

// ── Strategy row (Edit Step panel, draggable to reorder) ───────────────────────

function StrategyRow({
  label, index, isLast, dragging, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, onRemove,
}: {
  label: string;
  index: number;
  isLast: boolean;
  dragging: boolean;
  dragOver: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
        background: dragOver ? 'rgba(99,86,225,0.08)' : '#ffffff',
        opacity: dragging ? 0.5 : 1, cursor: 'grab',
      }}
    >
      <DragIndicator style={{ fontSize: 18, color: '#9c99a9' }} />
      <span style={{ fontSize: 12, color: '#686576', width: 16, flexShrink: 0 }}>{index}</span>
      <span style={{ flex: 1, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{label}</span>
      <IconButton size="small" onClick={onRemove} sx={{ padding: '2px' }}>
        <Close style={{ fontSize: 14, color: '#9c99a9' }} />
      </IconButton>
    </div>
  );
}

// ── Search menu (shared by Add Filter / Add Strategy) ──────────────────────────

function SearchMenu({ anchorEl, onClose, search, onSearchChange, options, onPick, placeholder }: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  options: string[];
  onPick: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      autoFocus={false}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      sx={{ zIndex: 10001 }}
      slotProps={{
        list: { autoFocusItem: false, sx: { paddingTop: 0 } },
        paper: { style: { width: 260, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 8 } },
      }}
    >
      <div style={{ padding: 8, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
        <TextField
          autoFocus
          size="small"
          fullWidth
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          sx={{ '& .MuiOutlinedInput-input': { fontSize: 13 } }}
        />
      </div>
      {options.length === 0 ? (
        <MenuItem disabled sx={{ fontSize: 13 }}>No matches</MenuItem>
      ) : (
        options.map((opt) => (
          <MenuItem key={opt} onClick={() => onPick(opt)} sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
            {opt}
          </MenuItem>
        ))
      )}
    </Menu>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

export const ManageWorkflowDialog = ({ workflowName, initialSteps, onClose, onSave }: ManageWorkflowDialogProps) => {
  const [steps, setSteps] = useState<WorkflowStepConfig[]>(initialSteps);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const [dragStepIndex, setDragStepIndex] = useState<number | null>(null);
  const [dragOverStepIndex, setDragOverStepIndex] = useState<number | null>(null);

  const [dragStrategyIndex, setDragStrategyIndex] = useState<number | null>(null);
  const [dragOverStrategyIndex, setDragOverStrategyIndex] = useState<number | null>(null);

  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const [strategyMenuAnchor, setStrategyMenuAnchor] = useState<HTMLElement | null>(null);
  const [strategySearch, setStrategySearch] = useState('');

  const selectedStep = selectedStepId ? steps.find((s) => s.id === selectedStepId) ?? null : null;

  const updateStep = (id: string, patch: Partial<WorkflowStepConfig>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const insertStepAt = (index: number) => {
    const newStep = createDefaultStep();
    setSteps((prev) => {
      const next = [...prev];
      next.splice(index, 0, newStep);
      return next;
    });
    setSelectedStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    setSelectedStepId((prev) => (prev === id ? null : prev));
  };

  // ── Step card drag/drop ──────────────────────────────────────────────────────
  const stepDragHandlers = (index: number) => ({
    onDragStart: (e: DragEvent) => { setDragStepIndex(index); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragOverStepIndex(index); },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragStepIndex === null || dragStepIndex === index) { setDragStepIndex(null); setDragOverStepIndex(null); return; }
      setSteps((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragStepIndex, 1);
        next.splice(index, 0, moved);
        return next;
      });
      setDragStepIndex(null);
      setDragOverStepIndex(null);
    },
    onDragEnd: () => { setDragStepIndex(null); setDragOverStepIndex(null); },
  });

  // ── Strategy row drag/drop (within selected step) ───────────────────────────
  const strategyDragHandlers = (index: number) => ({
    onDragStart: (e: DragEvent) => { setDragStrategyIndex(index); e.dataTransfer.effectAllowed = 'move'; },
    onDragOver: (e: DragEvent) => { e.preventDefault(); setDragOverStrategyIndex(index); },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (!selectedStep || dragStrategyIndex === null || dragStrategyIndex === index) {
        setDragStrategyIndex(null); setDragOverStrategyIndex(null); return;
      }
      const next = [...selectedStep.strategy];
      const [moved] = next.splice(dragStrategyIndex, 1);
      next.splice(index, 0, moved);
      updateStep(selectedStep.id, { strategy: next });
      setDragStrategyIndex(null);
      setDragOverStrategyIndex(null);
    },
    onDragEnd: () => { setDragStrategyIndex(null); setDragOverStrategyIndex(null); },
  });

  const currentMethod = selectedStep
    ? REPLACEMENT_METHODS.find((m) => m.value === selectedStep.replacementMethod)
    : null;

  const availableFilters = selectedStep
    ? FILTER_CATALOG.filter((c) =>
        !selectedStep.filters.some((f) => f.filterKey === c.key) &&
        c.label.toLowerCase().includes(filterSearch.toLowerCase()))
    : [];

  const availableStrategies = selectedStep
    ? STRATEGY_CATALOG.filter((s) =>
        !selectedStep.strategy.includes(s) &&
        s.toLowerCase().includes(strategySearch.toLowerCase()))
    : [];

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth={false}
      sx={{
        zIndex: 10000,
        '& .MuiDialog-paper': {
          width: 'calc(100vw - 32px)', height: 'calc(100vh - 32px)',
          maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)',
          margin: 0, borderRadius: 6, boxShadow: '0px 24px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          {workflowName || 'New Workflow'}
        </span>
        <IconButton size="small" onClick={onClose}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {steps.length === 0 ? (
              <>
                <div style={{
                  border: '1.5px dashed #cac9cf', borderRadius: 12, minHeight: 100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <button
                    onClick={() => insertStepAt(0)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 16px 6px 12px', borderRadius: 100, border: 'none',
                      background: '#473bab', color: '#ffffff', fontSize: 14, fontWeight: 500,
                      fontFamily: 'Roboto, sans-serif', letterSpacing: '0.4px', cursor: 'pointer',
                    }}
                  >
                    <Add style={{ fontSize: 18 }} />
                    Add Step
                  </button>
                </div>
                <StepConnector interactive={false} />
              </>
            ) : (
              steps.map((step, i) => (
                <Fragment key={step.id}>
                  <StepCard
                    step={step}
                    index={i}
                    selected={selectedStepId === step.id}
                    dragging={dragStepIndex === i}
                    dragOver={dragOverStepIndex === i && dragStepIndex !== i}
                    onSelect={() => setSelectedStepId(step.id)}
                    onRemove={() => removeStep(step.id)}
                    {...stepDragHandlers(i)}
                  />
                  <StepConnector interactive onAddStep={() => insertStepAt(i + 1)} />
                </Fragment>
              ))
            )}
            <FallbackCard />
          </div>
        </div>

        {/* Edit Step panel */}
        {selectedStep && (
          <div style={{
            width: 400, flexShrink: 0, borderLeft: '1px solid #f0f0f0',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
                Edit Step
              </span>
              <IconButton size="small" onClick={() => setSelectedStepId(null)}>
                <Close style={{ fontSize: 18, color: '#686576' }} />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AppTextField
                label="Step Name"
                value={selectedStep.name}
                onChange={(e) => updateStep(selectedStep.id, { name: e.target.value })}
              />

              <div>
                <FormControl size="small" fullWidth>
                  <InputLabel sx={{ fontSize: 13 }}>Replacement Method</InputLabel>
                  <Select
                    label="Replacement Method"
                    value={selectedStep.replacementMethod}
                    onChange={(e) => updateStep(selectedStep.id, { replacementMethod: e.target.value as WorkflowStepConfig['replacementMethod'] })}
                    sx={{ fontSize: 14 }}
                  >
                    {REPLACEMENT_METHODS.map((m) => (
                      <MenuItem key={m.value} value={m.value} sx={{ fontSize: 14 }}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {currentMethod && (
                  <div style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', marginTop: 6 }}>
                    {currentMethod.helper}
                  </div>
                )}
              </div>

              <div>
                <div style={sectionTitleStyle}>Additional Filters</div>
                {selectedStep.filters.map((f) => (
                  <FilterRow
                    key={f.id}
                    filter={f}
                    onChangeValue={(value) => updateStep(selectedStep.id, {
                      filters: selectedStep.filters.map((sf) => (sf.id === f.id ? { ...sf, value } : sf)),
                    })}
                    onRemove={() => updateStep(selectedStep.id, {
                      filters: selectedStep.filters.filter((sf) => sf.id !== f.id),
                    })}
                  />
                ))}
                <button
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
                    color: '#473bab', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', padding: 0,
                  }}
                >
                  <Add style={{ fontSize: 16 }} /> Add Filter
                </button>
                <SearchMenu
                  anchorEl={filterMenuAnchor}
                  onClose={() => { setFilterMenuAnchor(null); setFilterSearch(''); }}
                  search={filterSearch}
                  onSearchChange={setFilterSearch}
                  placeholder="Search filters"
                  options={availableFilters.map((c) => c.label)}
                  onPick={(label) => {
                    const entry = FILTER_CATALOG.find((c) => c.label === label);
                    if (entry) {
                      updateStep(selectedStep.id, {
                        filters: [...selectedStep.filters, {
                          id: `filter-${Date.now()}-${entry.key}`, filterKey: entry.key, label: entry.label, value: entry.options[0],
                        }],
                      });
                    }
                    setFilterMenuAnchor(null);
                    setFilterSearch('');
                  }}
                />
              </div>

              <div>
                <div style={sectionTitleStyle}>Strategy</div>
                <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', marginBottom: 8 }}>
                  If multiple matches are found, define replacement through:
                </div>
                <div style={{ border: '1px solid #dddce0', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                  {selectedStep.strategy.map((s, i) => (
                    <StrategyRow
                      key={s}
                      label={s}
                      index={i + 1}
                      isLast={i === selectedStep.strategy.length - 1}
                      dragging={dragStrategyIndex === i}
                      dragOver={dragOverStrategyIndex === i && dragStrategyIndex !== i}
                      onRemove={() => updateStep(selectedStep.id, {
                        strategy: selectedStep.strategy.filter((_, si) => si !== i),
                      })}
                      {...strategyDragHandlers(i)}
                    />
                  ))}
                </div>
                <button
                  onClick={(e) => setStrategyMenuAnchor(e.currentTarget)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent',
                    color: '#473bab', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', padding: 0,
                  }}
                >
                  <Add style={{ fontSize: 16 }} /> Add
                </button>
                <SearchMenu
                  anchorEl={strategyMenuAnchor}
                  onClose={() => { setStrategyMenuAnchor(null); setStrategySearch(''); }}
                  search={strategySearch}
                  onSearchChange={setStrategySearch}
                  placeholder="Search strategies"
                  options={availableStrategies}
                  onPick={(s) => {
                    updateStep(selectedStep.id, { strategy: [...selectedStep.strategy, s] });
                    setStrategyMenuAnchor(null);
                    setStrategySearch('');
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '12px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '6px 20px', borderRadius: 100, border: '1px solid #473bab', background: 'transparent',
            color: '#473bab', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', letterSpacing: '0.4px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(steps)}
          style={{
            padding: '6px 20px', borderRadius: 100, border: 'none', background: '#473bab', color: '#ffffff',
            fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', letterSpacing: '0.4px',
          }}
        >
          Save
        </button>
      </div>
    </Dialog>
  );
};
