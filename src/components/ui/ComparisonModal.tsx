import { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Close, ChevronLeft, ChevronRight, Add, Remove, OpenInNew, ArrowBackIosNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Asset, Offer } from '../../data/types';
import type { PendingOfferChange, PendingRemovalChange } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';

interface ComparisonItem {
  asset: Asset;
  previousOffer?: Offer;
  changeType: 'updated' | 'removed';
  changeDescription: string;
  taskPath: string;
}

interface ComparisonModalProps {
  assets: Asset[];
  pendingChanges: PendingOfferChange[];
  pendingRemovals: PendingRemovalChange[];
  onBack: () => void;
  onApply: () => void;
}

const ZOOM_STEPS = [50, 75, 100, 150, 200, 300];
const BASE_SIZE = 220;

function getRemovalMeta(type: 'offer' | 'template' | 'background') {
  switch (type) {
    case 'offer':      return { description: 'Removed offer',      path: '/offers' };
    case 'template':   return { description: 'Removed template',   path: '/templates' };
    case 'background': return { description: 'Removed background', path: '/theme-and-logos' };
  }
}

export const ComparisonModal = ({
  assets,
  pendingChanges,
  pendingRemovals,
  onBack,
  onApply,
}: ComparisonModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(2); // 100%
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  // Attach a non-passive wheel listener so we can call preventDefault and
  // prevent the page from scrolling while the user pans a zoomed asset.
  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;
    const canPan = ZOOM_STEPS[zoomIndex] > 100;
    const onWheel = (e: WheelEvent) => {
      if (!canPan) return;
      e.preventDefault();
      setPan((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomIndex]);

  const items = useMemo<ComparisonItem[]>(() => {
    const result: ComparisonItem[] = [];

    for (const change of pendingChanges) {
      const affected = assets.filter(
        (a) => a.offerId === change.offerId && a.status === 'updated',
      );
      for (const asset of affected) {
        result.push({
          asset,
          previousOffer: change.previousOffer,
          changeType: 'updated',
          changeDescription: 'Updated offer',
          taskPath: '/offers',
        });
      }
    }

    for (const removal of pendingRemovals) {
      const affectedIds = new Set(Object.keys(removal.previousAssetStatuses));
      const affected = assets.filter((a) => affectedIds.has(a.id) && a.status === 'removed');
      const meta = getRemovalMeta(removal.type);
      for (const asset of affected) {
        result.push({
          asset,
          changeType: 'removed',
          changeDescription: meta.description,
          taskPath: meta.path,
        });
      }
    }

    return result;
  }, [assets, pendingChanges, pendingRemovals]);

  const total = items.length;
  const current = items[Math.min(currentIndex, total - 1)];

  if (total === 0 || !current) return null;

  const zoomPct = ZOOM_STEPS[zoomIndex];
  const zoomFactor = zoomPct / 100;

  const renderPreview = (asset: Asset, offerOverride?: Offer) => {
    const template = TEMPLATES.find((t) => t.id === asset.templateId);
    const offer = offerOverride ?? asset.offer;
    const isWide = asset.width > asset.height;
    const previewW = isWide ? BASE_SIZE * zoomFactor : (asset.width / asset.height) * BASE_SIZE * zoomFactor;
    const previewH = !isWide ? BASE_SIZE * zoomFactor : (asset.height / asset.width) * BASE_SIZE * zoomFactor;
    return (
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'relative', width: previewW, height: previewH }}>
          {template && offer ? (
            <FilledTemplatePreview template={template} offer={offer} backgroundUrl={asset.backgroundUrl} />
          ) : (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
          )}
        </div>
      </div>
    );
  };

  const labelStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 20,
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    color: '#1f1d25',
    letterSpacing: '0.15px',
    lineHeight: 1.6,
  };

  const subLabelStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    color: '#686576',
    letterSpacing: '0.14px',
    lineHeight: '20px',
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          width: 860,
          boxShadow:
            '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '16px 16px 8px',
            gap: 4,
          }}
        >
          <IconButton size="small" onClick={onBack} sx={{ padding: '5px', flexShrink: 0, mt: '2px' }}>
            <ArrowBackIosNew style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={labelStyle}>Review Asset Changes</p>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                color: '#686576',
                letterSpacing: '0.1px',
                lineHeight: 1.57,
              }}
            >
              {total} updated {total === 1 ? 'asset' : 'assets'}
            </p>
          </div>

          <IconButton size="small" onClick={onBack} sx={{ padding: '5px', flexShrink: 0, mt: '2px' }}>
            <Close style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* ── Main preview area ───────────────────────────── */}
        <div style={{ padding: '8px 16px 24px' }}>

          {/* Panel titles — above the preview, aligned to each half */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, paddingLeft: 4, paddingRight: 4 }}>
            {current.changeType === 'updated' ? (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={labelStyle}>Previous</p>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ ...labelStyle, flexShrink: 0 }}>Updated</p>
                  <p style={subLabelStyle}>{current.changeDescription}</p>
                  <button
                    onClick={() => navigate(current.taskPath)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <OpenInNew style={{ fontSize: 16, color: '#686576' }} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ ...labelStyle, flexShrink: 0 }}>Removed</p>
                <p style={subLabelStyle}>{current.changeDescription}</p>
                <button
                  onClick={() => navigate(current.taskPath)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <OpenInNew style={{ fontSize: 16, color: '#686576' }} />
                </button>
              </div>
            )}
          </div>

          <div
            ref={previewAreaRef}
            style={{
              position: 'relative',
              display: 'flex',
              borderRadius: 24,
              overflow: 'hidden',
              height: 340,
              background: '#f0f2f4',
            }}
          >
            {current.changeType === 'updated' ? (
              <>
                {/* Previous panel */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {renderPreview(current.asset, current.previousOffer)}
                </div>

                {/* Vertical divider */}
                <div
                  style={{
                    width: 1,
                    background: 'rgba(0,0,0,0.12)',
                    flexShrink: 0,
                    alignSelf: 'stretch',
                  }}
                />

                {/* Updated panel */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {renderPreview(current.asset)}
                </div>
              </>
            ) : (
              /* Removed panel */
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {renderPreview(current.asset)}
              </div>
            )}

            {/* Zoom controls */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 4,
                background: '#ffffff',
              }}
            >
              <IconButton
                size="small"
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                disabled={zoomIndex === 0}
                sx={{ padding: '4px', borderRadius: '100px' }}
              >
                <Remove style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>
              <div
                style={{
                  width: 49,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    color: '#1f1d25',
                    letterSpacing: '0.17px',
                    lineHeight: 1.43,
                  }}
                >
                  {zoomPct}%
                </span>
              </div>
              <IconButton
                size="small"
                onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                sx={{ padding: '4px', borderRadius: '100px' }}
              >
                <Add style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 20px 16px',
            gap: 8,
          }}
        >
          {/* Carousel navigation */}
          <IconButton
            size="small"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            sx={{ padding: '5px' }}
          >
            <ChevronLeft style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              color: '#1f1d25',
              letterSpacing: '0.4px',
              lineHeight: 1.66,
              minWidth: 32,
              textAlign: 'center',
            }}
          >
            {currentIndex + 1} / {total}
          </span>
          <IconButton
            size="small"
            onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
            disabled={currentIndex === total - 1}
            sx={{ padding: '5px' }}
          >
            <ChevronRight style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>

          {/* Action buttons */}
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
              fontSize: 14,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: '#473bab',
              letterSpacing: '0.4px',
              lineHeight: '24px',
              borderRadius: 100,
            }}
          >
            Return
          </button>
          <button
            onClick={onApply}
            style={{
              background: '#473bab',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 16px',
              fontSize: 14,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '0.4px',
              lineHeight: '24px',
              borderRadius: 100,
            }}
          >
            Apply All Changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
