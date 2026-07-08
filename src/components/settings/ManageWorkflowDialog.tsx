import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  Dialog, IconButton, FormControl, InputLabel, Select, MenuItem, Menu, TextField, Switch, Divider, Autocomplete,
  Chip, Tooltip,
} from '@mui/material';
import {
  Add, Close, DragIndicator, DeleteOutlineOutlined, East, ZoomIn, ZoomOut, FitScreen,
  DirectionsCarFilled, Autorenew, Code, AccountTree,
} from '@mui/icons-material';
import { AppTextField } from '../ui/AppTextField';
import {
  REPLACEMENT_METHODS, FILTER_CATALOG, STRATEGY_CATALOG, ADMIN_OPTIONS,
  createDefaultStep, createDefaultFallbackStep, getFallbackTitle, getFallbackDescription, extractAdminEmail,
  ACCOUNTS, accountById, StatusChip, formatDateTime,
} from './workflowTypes';
import type {
  WorkflowStepConfig, WorkflowFilter, FallbackStepConfig, ReplacementMethod,
  OfferReplacementWorkflow, WorkflowStatus, DealerAccount,
} from './workflowTypes';

// Replacement Method tag styling — colors/icons per Figma (node 4526:64989 / 4526:64988).
const REPLACEMENT_METHOD_TAGS: Record<ReplacementMethod, {
  label: string; color: string; background: string; textOpacity?: number; Icon: typeof DirectionsCarFilled;
}> = {
  'same-ymmt': { label: 'Same YMMT', color: '#6356e1', background: 'rgba(99, 86, 225, 0.12)', Icon: DirectionsCarFilled },
  'different-ymmt': { label: 'Different YMMT', color: '#c45500', background: 'rgba(225, 118, 19, 0.08)', textOpacity: 0.75, Icon: Autorenew },
};

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#473bab' },
};

// Horizontal diagram layout: cards are narrow + tall, connected by fixed-width arrow connectors.
const CARD_WIDTH = 320;
const CONNECTOR_WIDTH = 120;
const CANVAS_PADDING = 24;

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1;
const ZOOM_STEP = 0.1;
const ZOOM_TRANSITION_MS = 250;
const ZOOM_TICK_MS = 16;

interface ManageWorkflowDialogProps {
  workflow: OfferReplacementWorkflow | null;
  onClose: () => void;
  onSave: (patch: { name: string; status: WorkflowStatus; accountIds: string[]; steps: WorkflowStepConfig[] }) => void;
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
  step, index, selected, dragging, dragOver, onSelect, onRemove, onDragStart, onDragOver, onDrop, onDragEnd, cardRef,
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
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const showDelete = hovered || selected;
  const tag = REPLACEMENT_METHOD_TAGS[step.replacementMethod];
  const visibleStrategy = step.strategy.slice(0, 2);
  const remainingStrategy = step.strategy.length - visibleStrategy.length;
  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', zIndex: 2,
        width: CARD_WIDTH, minHeight: 180, flexShrink: 0,
        display: 'flex', alignItems: 'flex-start', gap: 12,
        border: selected ? '1px solid #473bab' : '1px solid #dddce0',
        boxShadow: selected ? 'inset 0 0 0 1px #473bab' : 'none',
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
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#473bab', color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 12, flexShrink: 0,
      }}>
        {index + 1}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
          {step.name || 'Untitled step'}
        </div>

        {tag && (
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 4,
            padding: '3px 8px 3px 6px', borderRadius: 8, background: tag.background,
          }}>
            <tag.Icon style={{ fontSize: 14, color: tag.color, opacity: tag.textOpacity }} />
            <span style={{
              fontSize: 11, fontFamily: 'Roboto, sans-serif', color: tag.color, letterSpacing: '0.4px',
              lineHeight: 1.66, whiteSpace: 'nowrap', opacity: tag.textOpacity,
            }}>
              {tag.label}
            </span>
          </div>
        )}

        {step.filters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {step.filters.map((f) => (
              <Chip
                key={f.id}
                label={`${f.label}: ${f.value}`}
                size="small"
                sx={{
                  height: 'auto', borderRadius: '8px', background: 'rgba(17,16,20,0.04)',
                  '& .MuiChip-label': {
                    fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
                    letterSpacing: '0.16px', lineHeight: '18px', padding: '3px 6px',
                  },
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={labelStyle}>Strategy</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ ...valueStyle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {visibleStrategy.length ? visibleStrategy.join(' → ') : '—'}
            </span>
            {remainingStrategy > 0 && (
              <Tooltip title={step.strategy.join(' → ')} slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
                <span style={{ ...labelStyle, marginBottom: 0, flexShrink: 0, cursor: 'default' }}>
                  +{remainingStrategy} more
                </span>
              </Tooltip>
            )}
          </div>
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
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: CONNECTOR_WIDTH, flexShrink: 0, alignSelf: 'center',
      }}
    >
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#dddce0' }} />
      <East style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        fontSize: 18, color: '#9c99a9', background: '#ffffff', zIndex: 1,
      }} />
      {showAdd ? (
        <button
          onClick={onAddStep}
          style={{
            position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 12px', borderRadius: 100, border: 'none', background: '#473bab', color: '#ffffff',
            fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <Add style={{ fontSize: 14 }} />
          Add Step
        </button>
      ) : (
        <span style={{
          position: 'relative', zIndex: 1, background: '#ffffff', border: '1px solid #dddce0', borderRadius: 8,
          padding: '4px 10px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', whiteSpace: 'nowrap',
        }}>
          No matches
        </span>
      )}
    </div>
  );
}

// ── Fallback card (always last, editable) ───────────────────────────────────────

function FallbackCard({ fallback, selected, onSelect, cardRef }: {
  fallback: FallbackStepConfig;
  selected: boolean;
  onSelect: () => void;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      style={{
        position: 'relative', zIndex: 2,
        width: CARD_WIDTH, minHeight: 180, flexShrink: 0,
        border: selected ? '1px solid #473bab' : '1px solid #dddce0',
        boxShadow: selected ? 'inset 0 0 0 1px #473bab' : 'none',
        borderRadius: 12, padding: 16, display: 'flex', gap: 12, background: '#ffffff', cursor: 'pointer',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', background: '#d2323f', color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0,
      }}>
        F
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', marginBottom: 4 }}>
          {getFallbackTitle(fallback)}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', marginBottom: 10 }}>
          {getFallbackDescription(fallback)}
        </div>
        {fallback.notifyAdmins && fallback.admins.length > 0 && (
          <>
            <div style={labelStyle}>Admins</div>
            <div style={valueStyle}>{fallback.admins.map(extractAdminEmail).join(', ')}</div>
          </>
        )}
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
          MenuProps={{ sx: { zIndex: 10001 } }}
          sx={{ fontSize: 13 }}
        >
          {(catalogEntry?.options ?? [filter.value]).map((opt) => (
            <MenuItem key={opt} value={opt} sx={{ fontSize: 13 }}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <IconButton size="small" onClick={onRemove} sx={{ padding: '4px', marginBottom: '2px' }}>
        <DeleteOutlineOutlined style={{ fontSize: 16, color: '#686576' }} />
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
        <DeleteOutlineOutlined style={{ fontSize: 14, color: '#9c99a9' }} />
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

// ── Side panel vertical tab (Metadata / Step) ──────────────────────────────────

function VerticalTab({ active, Icon, label, onClick }: {
  active: boolean;
  Icon: typeof Code;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 56, height: 56, borderRadius: 5, border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        background: active ? 'rgba(99,86,225,0.08)' : 'transparent',
      }}
    >
      <Icon style={{ fontSize: 20, color: active ? '#473bab' : '#686576' }} />
      <span style={{
        fontSize: 11, fontFamily: 'Roboto, sans-serif', color: active ? '#473bab' : '#686576',
        letterSpacing: '0.4px', lineHeight: 1.66,
      }}>
        {label}
      </span>
    </button>
  );
}

// ── Read-only metadata row (Created at / Created By / Last Modified / Modified By) ──

function MetadataDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ width: 90, flexShrink: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
        {value}
      </div>
    </div>
  );
}

// ── Main dialog ────────────────────────────────────────────────────────────────

export const ManageWorkflowDialog = ({ workflow, onClose, onSave }: ManageWorkflowDialogProps) => {
  const [steps, setSteps] = useState<WorkflowStepConfig[]>(workflow?.steps ?? []);
  const [activeTab, setActiveTab] = useState<'metadata' | 'step'>('metadata');
  const [draftName, setDraftName] = useState(workflow?.name ?? '');
  const [draftStatus, setDraftStatus] = useState<WorkflowStatus>(workflow?.status ?? 'active');
  const [draftAccountIds, setDraftAccountIds] = useState<string[]>(workflow?.accountIds ?? []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [fallbackSelected, setFallbackSelected] = useState(false);
  const [fallback, setFallback] = useState<FallbackStepConfig>(createDefaultFallbackStep());

  const [dragStepIndex, setDragStepIndex] = useState<number | null>(null);
  const [dragOverStepIndex, setDragOverStepIndex] = useState<number | null>(null);

  const [dragStrategyIndex, setDragStrategyIndex] = useState<number | null>(null);
  const [dragOverStrategyIndex, setDragOverStrategyIndex] = useState<number | null>(null);

  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(null);
  const [filterSearch, setFilterSearch] = useState('');

  const [strategyMenuAnchor, setStrategyMenuAnchor] = useState<HTMLElement | null>(null);
  const [strategySearch, setStrategySearch] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  // Mirrors scrollContainerRef as state so effects can react once the node is actually
  // attached — the MUI Dialog/Portal mounts its content one tick after this component's
  // own first render, so a plain ref read during the initial layout effect is still null.
  const [scrollContainerEl, setScrollContainerEl] = useState<HTMLDivElement | null>(null);
  const setScrollContainerRef = (el: HTMLDivElement | null) => {
    scrollContainerRef.current = el;
    setScrollContainerEl(el);
  };
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeCardId = selectedStepId ?? (fallbackSelected ? 'fallback' : null);

  // Zoom: defaults to a "fit the whole diagram in the available width" level, computed
  // purely from the known card/connector widths (no DOM measurement needed). Once the
  // user takes control (manual zoom, or selecting a card zooms to 100%), auto-fit stops
  // so it doesn't fight their choice on subsequent container resizes.
  const [zoom, setZoom] = useState(ZOOM_MAX);
  const [userZoomed, setUserZoomed] = useState(false);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  // Non-null while a JS-driven zoom animation (see animateZoomTo) is in flight, so the
  // resize-triggered recenter effect below knows to stand down instead of fighting it.
  const zoomAnimRef = useRef<number | null>(null);

  const cardCount = steps.length + 1; // + fallback card
  const connectorCount = Math.max(steps.length, 1); // placeholder row still has one connector
  const naturalContentWidth = cardCount * CARD_WIDTH + connectorCount * CONNECTOR_WIDTH;

  useLayoutEffect(() => {
    if (userZoomed || !scrollContainerEl) return;
    const container = scrollContainerEl;

    const fitToWidth = () => {
      if (zoomAnimRef.current !== null) return; // an explicit zoom animation is already driving zoom
      const available = container.clientWidth - CANVAS_PADDING * 2;
      const fit = Math.min(ZOOM_MAX, available / naturalContentWidth);
      setZoom(Math.max(ZOOM_MIN, fit));
    };

    fitToWidth();
    const observer = new ResizeObserver(fitToWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [userZoomed, naturalContentWidth, scrollContainerEl]);

  // The natural (zoom = 1) left offset of a card within the row — computed purely from the
  // fixed layout constants (no DOM measurement) so the eventual scroll target at any given
  // zoom level can be computed analytically, up front, before the animation even starts.
  const naturalCardLeft = (cardId: string): number => {
    if (cardId === 'fallback') return steps.length * (CARD_WIDTH + CONNECTOR_WIDTH);
    const index = steps.findIndex((s) => s.id === cardId);
    return index * (CARD_WIDTH + CONNECTOR_WIDTH);
  };

  // CSS `zoom` isn't an animatable/interpolable property (transitions on it are a no-op in
  // browsers), so a smooth zoom has to be driven step-by-step in JS. Uses setInterval (tick
  // counted, not wall-clock-timed) rather than requestAnimationFrame — rAF is fully paused
  // for backgrounded/hidden tabs, which would silently freeze the animation. The scroll
  // position is interpolated independently (from its current value to the analytically
  // computed target at the final zoom level) on the same eased timeline as the zoom, so
  // switching between cards animates smoothly even when the zoom level itself isn't changing.
  const animateZoomTo = (target: number, focusCardId: string | null, snapToStartIfUnfocused: boolean) => {
    const container = scrollContainerRef.current;
    const startZoom = zoomRef.current;
    const targetZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, target));
    const startScroll = container?.scrollLeft ?? 0;

    let targetScroll = startScroll;
    if (container) {
      if (focusCardId) {
        const idealLeft = CANVAS_PADDING + naturalCardLeft(focusCardId) * targetZoom - (container.clientWidth - CARD_WIDTH * targetZoom) / 2;
        const scrollWidthAtTarget = naturalContentWidth * targetZoom + CANVAS_PADDING * 2;
        const max = Math.max(0, scrollWidthAtTarget - container.clientWidth);
        targetScroll = Math.max(0, Math.min(idealLeft, max));
      } else if (snapToStartIfUnfocused) {
        targetScroll = 0;
      }
    }

    if (zoomAnimRef.current !== null) clearInterval(zoomAnimRef.current);

    const totalTicks = Math.max(1, Math.round(ZOOM_TRANSITION_MS / ZOOM_TICK_MS));
    let tick = 0;
    const intervalId = window.setInterval(() => {
      tick += 1;
      const t = Math.min(1, tick / totalTicks);
      const eased = 1 - (1 - t) ** 3; // ease-out cubic
      const currentZoom = startZoom + (targetZoom - startZoom) * eased;
      setZoom(currentZoom);
      zoomRef.current = currentZoom;
      if (container) container.scrollLeft = startScroll + (targetScroll - startScroll) * eased;
      if (t >= 1) {
        clearInterval(intervalId);
        zoomAnimRef.current = null;
      }
    }, ZOOM_TICK_MS);

    zoomAnimRef.current = intervalId;
  };

  useEffect(() => () => {
    if (zoomAnimRef.current !== null) clearInterval(zoomAnimRef.current);
  }, []);

  // Focuses a step (or the fallback) card: selects it, switches the side panel to the
  // Step tab, and zooms/scrolls the diagram to center it — shared by card clicks, the
  // Step tab's auto-select-first-step behavior, and the initial-open auto-focus below.
  const focusCard = (id: string, isFallback: boolean) => {
    if (isFallback) { setFallbackSelected(true); setSelectedStepId(null); }
    else { setSelectedStepId(id); setFallbackSelected(false); }
    setActiveTab('step');
    setUserZoomed(true);
    animateZoomTo(ZOOM_MAX, isFallback ? 'fallback' : id, false);
  };

  const handleStepTabClick = () => {
    setActiveTab('step');
    if (!selectedStepId && !fallbackSelected && steps.length > 0) focusCard(steps[0].id, false);
  };

  const zoomIn = () => {
    setUserZoomed(true);
    animateZoomTo(Math.round((zoomRef.current + ZOOM_STEP) * 100) / 100, activeCardId, false);
  };
  const zoomOut = () => {
    setUserZoomed(true);
    animateZoomTo(Math.round((zoomRef.current - ZOOM_STEP) * 100) / 100, activeCardId, false);
  };
  // Hands control back to the auto-fit effect above's computed value, animating there. When
  // no card is focused, also glides back to the start of the diagram instead of leaving the
  // scroll position wherever the user last panned to. `overrideCardId` lets a caller force
  // "nothing focused" behavior even before a state update (e.g. deselecting) has re-rendered.
  const focusFit = (overrideCardId) => {
    const cardId = overrideCardId !== undefined ? overrideCardId : activeCardId;
    setUserZoomed(false);
    const container = scrollContainerRef.current;
    const available = (container?.clientWidth ?? 0) - CANVAS_PADDING * 2;
    const fit = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, available / naturalContentWidth));
    animateZoomTo(fit, cardId, true);
  };

  // Switching back to Metadata should clear any focused step/fallback and zoom the
  // diagram back out to show it in full, rather than leaving a card selected off-tab.
  const handleMetadataTabClick = () => {
    setActiveTab('metadata');
    setSelectedStepId(null);
    setFallbackSelected(false);
    focusFit(null);
  };

  // Keeps the focused card centered if the container resizes for reasons outside an
  // explicit zoom animation (e.g. the browser window itself being resized).
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeCardId) return;

    const recenter = () => {
      if (zoomAnimRef.current !== null) return; // an explicit animation is already driving scroll
      const card = cardRefs.current[activeCardId];
      if (!card) return;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const cardOffsetWithinContainer = (cardRect.left - containerRect.left) + container.scrollLeft;
      const target = cardOffsetWithinContainer - (container.clientWidth - cardRect.width) / 2;
      const max = container.scrollWidth - container.clientWidth;
      container.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' });
    };

    recenter();
    const observer = new ResizeObserver(recenter);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeCardId]);

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
    setFallbackSelected(false);
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
          {draftName || 'New Workflow'}
        </span>
        <IconButton size="small" onClick={onClose}>
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </IconButton>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Canvas wrapper — provides a positioning context for the floating zoom control */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          {/* Canvas — horizontal flow: steps left to right, connected by arrows */}
          <div
            ref={setScrollContainerRef}
            style={{ height: '100%', overflow: 'auto', padding: CANVAS_PADDING, marginRight: 24, boxSizing: 'border-box' }}
          >
            <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', zoom }}>
                {steps.length === 0 ? (
                  <>
                    <div style={{
                      width: CARD_WIDTH, flexShrink: 0, minHeight: 180,
                      border: '1.5px dashed #cac9cf', borderRadius: 12,
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
                        onSelect={() => focusCard(step.id, false)}
                        onRemove={() => removeStep(step.id)}
                        cardRef={(el) => { cardRefs.current[step.id] = el; }}
                        {...stepDragHandlers(i)}
                      />
                      <StepConnector interactive onAddStep={() => insertStepAt(i + 1)} />
                    </Fragment>
                  ))
                )}
                <FallbackCard
                  fallback={fallback}
                  selected={fallbackSelected}
                  onSelect={() => focusCard('fallback', true)}
                  cardRef={(el) => { cardRefs.current.fallback = el; }}
                />
              </div>
            </div>
          </div>

          {/* Zoom control */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 3,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              background: '#ffffff', border: '1px solid #dddce0', borderRadius: 100,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: 4,
            }}>
              <IconButton size="small" onClick={zoomOut} disabled={zoom <= ZOOM_MIN}>
                <ZoomOut style={{ fontSize: 18, color: '#686576' }} />
              </IconButton>
              <button
                onClick={() => { setUserZoomed(true); animateZoomTo(ZOOM_MAX, activeCardId, false); }}
                title="Reset to 100%"
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576',
                  width: 44, textAlign: 'center',
                }}
              >
                {Math.round(zoom * 100)}%
              </button>
              <IconButton size="small" onClick={zoomIn} disabled={zoom >= ZOOM_MAX}>
                <ZoomIn style={{ fontSize: 18, color: '#686576' }} />
              </IconButton>
            </div>
            <Tooltip title="Fit entire diagram" slotProps={{ popper: { sx: { zIndex: 10001 } } }}>
              <IconButton
                size="small"
                onClick={focusFit}
                sx={{
                  background: '#ffffff', border: '1px solid #dddce0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  '&:hover': { background: '#f5f4fa' },
                }}
              >
                <FitScreen style={{ fontSize: 18, color: '#686576' }} />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Side panel — Metadata / Step tabs */}
        <div style={{ display: 'flex', flexShrink: 0, borderLeft: '1px solid #f0f0f0' }}>
          {/* Vertical tabs */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            paddingTop: 12, paddingLeft: 8, paddingRight: 8, width: 72, flexShrink: 0,
          }}>
            <VerticalTab active={activeTab === 'metadata'} Icon={Code} label="Metadata" onClick={handleMetadataTabClick} />
            <VerticalTab active={activeTab === 'step'} Icon={AccountTree} label="Step" onClick={handleStepTabClick} />
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: '#f0f0f0', flexShrink: 0 }} />

          {/* Panel */}
          <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '14px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
                {activeTab === 'metadata' ? 'Metadata' : fallbackSelected ? 'Edit Fallback Step' : 'Edit Step'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTab === 'metadata' ? (
                <>
                  <AppTextField
                    label="Workflow Name"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />

                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
                    <Select
                      label="Status"
                      value={draftStatus}
                      onChange={(e) => setDraftStatus(e.target.value as WorkflowStatus)}
                      renderValue={(value) => <StatusChip status={value as WorkflowStatus} />}
                      MenuProps={{ sx: { zIndex: 10001 } }}
                      sx={{ fontSize: 14 }}
                    >
                      <MenuItem value="active"><StatusChip status="active" /></MenuItem>
                      <MenuItem value="inactive"><StatusChip status="inactive" /></MenuItem>
                    </Select>
                  </FormControl>

                  <Autocomplete
                    multiple
                    size="small"
                    limitTags={3}
                    options={ACCOUNTS}
                    getOptionLabel={(opt) => opt.name}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    value={draftAccountIds.map(accountById).filter((a): a is DealerAccount => !!a)}
                    onChange={(_, newValue) => setDraftAccountIds(newValue.map((a) => a.id))}
                    slotProps={{ popper: { sx: { zIndex: 10001 } } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Accounts"
                        sx={{
                          '& .MuiInputLabel-root': { fontSize: 13 },
                          '& .MuiOutlinedInput-input': { fontSize: 14 },
                          '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
                        }}
                      />
                    )}
                  />

                  {workflow && (
                    <div>
                      <MetadataDetailRow label="Created at" value={formatDateTime(workflow.createdAt)} />
                      <MetadataDetailRow label="Created By" value={workflow.createdBy} />
                      <MetadataDetailRow label="Last Modified" value={formatDateTime(workflow.updatedAt)} />
                      <MetadataDetailRow label="Modified By" value={workflow.updatedBy} />
                    </div>
                  )}
                </>
              ) : selectedStep ? (
                <>
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
                        MenuProps={{ sx: { zIndex: 10001 } }}
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
                </>
              ) : fallbackSelected ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
                      Pause Ads
                    </span>
                    <Switch
                      checked={fallback.pauseAds}
                      onChange={(e) => setFallback((f) => ({ ...f, pauseAds: e.target.checked }))}
                      sx={switchSx}
                    />
                  </div>

                  <Divider />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px' }}>
                      Notify Admins
                    </span>
                    <Switch
                      checked={fallback.notifyAdmins}
                      onChange={(e) => setFallback((f) => ({ ...f, notifyAdmins: e.target.checked }))}
                      sx={switchSx}
                    />
                  </div>

                  {fallback.notifyAdmins && (
                    <Autocomplete
                      multiple
                      size="small"
                      options={ADMIN_OPTIONS}
                      value={fallback.admins}
                      onChange={(_, newValue) => setFallback((f) => ({ ...f, admins: newValue }))}
                      slotProps={{ popper: { sx: { zIndex: 10001 } } }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Admins"
                          sx={{
                            '& .MuiInputLabel-root': { fontSize: 13 },
                            '& .MuiOutlinedInput-input': { fontSize: 12 },
                            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
                          }}
                        />
                      )}
                      sx={{
                        '& .MuiChip-root': { fontSize: 11, fontFamily: 'Roboto, sans-serif' },
                      }}
                    />
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', textAlign: 'center', marginTop: 24 }}>
                  Add a step in the diagram to configure it.
                </div>
              )}
            </div>
          </div>
        </div>
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
          onClick={() => onSave({ name: draftName, status: draftStatus, accountIds: draftAccountIds, steps })}
          disabled={!draftName.trim()}
          style={{
            padding: '6px 20px', borderRadius: 100, border: 'none',
            background: draftName.trim() ? '#473bab' : '#cac9cf', color: '#ffffff',
            fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
            cursor: draftName.trim() ? 'pointer' : 'default', letterSpacing: '0.4px',
          }}
        >
          Save
        </button>
      </div>
    </Dialog>
  );
};
