import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { KeyboardArrowDown, OpenInNew } from '@mui/icons-material';
import { GenerateAssetsIcon } from './GenerateAssetsIcon';
import { StatusBadge } from './StatusBadge';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { useProject } from '../../context/ProjectContext';
import { useProgressIndicator } from '../../context/ProgressIndicatorContext';
import { useLayout } from '../../context/LayoutContext';
import { TEMPLATES } from '../../data/mockData';

export const PreviewPanel = () => {
  const [open, setOpen] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [panelCenter, setPanelCenter] = useState<{ left: number; width: number } | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { assets, bulkSetAssetStatus } = useProject();
  const { startProgress } = useProgressIndicator();
  const { mainPanelRef } = useLayout();

  // Track main panel position so the button stays centered within it
  useEffect(() => {
    const el = mainPanelRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPanelCenter({ left: rect.left, width: rect.width });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [mainPanelRef]);

  // Measure the panel content height so we can animate to an exact pixel value
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContentHeight(el.offsetHeight);
    });
    ro.observe(el);
    setContentHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const previewAssets = assets;
  const draftAssets = assets.filter((a) => a.status === 'draft');
  const hasDraftAssets = draftAssets.length > 0;

  const handleOpen = () => { setOpen(true); setButtonHovered(false); };
  const handleClose = () => { setOpen(false); setButtonHovered(false); };

  const handleSubmitForApproval = () => {
    if (draftAssets.length === 0) return;
    const targetIds = new Set(draftAssets.map((a) => a.id));
    startProgress(
      draftAssets.map((a) => ({
        id: a.id,
        name: a.name,
        thumbnailUrl: a.backgroundUrl || a.thumbnailUrl,
      }))
    );
    setTimeout(() => {
      bulkSetAssetStatus(targetIds, 'awaiting_approval');
    }, 5000);
    navigate('/review');
  };

  const hidden = pathname === '/review' || pathname === '/approved' || pathname === '/ads' || pathname === '/campaigns';

  // Close the panel when navigating to a page that doesn't show it
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'P' && !hidden) {
        open ? handleClose() : handleOpen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, hidden]);

  return (
    <>
      {/* Fixed button — only visible when panel is closed and on a panel-enabled page */}
      {!open && !hidden && (
        <div
          style={{
            position: 'fixed',
            bottom: buttonHovered ? 0 : -30,
            left: panelCenter ? panelCenter.left + panelCenter.width / 2 : '50%',
            transform: 'translateX(-50%)',
            transition: 'bottom 0.2s ease',
            zIndex: 100,
            width: 205,
            height: 36,
            cursor: 'pointer',
          }}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          onClick={handleOpen}
        >
          <button
            style={{
              width: '100%',
              height: '100%',
              background: '#473bab',
              borderRadius: '18px 18px 0 0',
              border: 'none',
              cursor: 'pointer',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.4px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Preview Assets (Shift + P)
          </button>
        </div>
      )}

      {/* Animated height wrapper — drives the layout squeeze on the main content above */}
      <div
        style={{
          height: open && !hidden ? contentHeight : 0,
          overflow: 'hidden',
          transition: hidden ? 'none' : 'height 0.3s ease',
          flexShrink: 0,
        }}
      >
        {/* Panel content — always mounted so contentHeight stays accurate */}
        <div ref={contentRef}>
          <div
            style={{
              // background: '#ffffff',
              borderRadius: '16px 16px 0 0',
              margin: '0 8px 8px',
              // boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {/* Panel header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
              }}
            >
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ width: 30, height: 30, padding: '5px', flexShrink: 0 }}
              >
                <KeyboardArrowDown style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>

              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'Roboto, sans-serif',
                  color: '#1f1d25',
                  letterSpacing: '0.1px',
                  lineHeight: 1.5,
                }}
              >
                Preview
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'Roboto, sans-serif',
                  color: '#9c99a9',
                  letterSpacing: '0.17px',
                  lineHeight: 1.43,
                }}
              >
                ({previewAssets.length})
              </span>

              {/* Submit for Approval */}
              <button
                disabled={!hasDraftAssets}
                onClick={handleSubmitForApproval}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: hasDraftAssets ? '#473bab' : 'rgba(17,16,20,0.12)',
                  borderRadius: 100,
                  padding: '4px 10px',
                  border: 'none',
                  cursor: hasDraftAssets ? 'pointer' : 'default',
                  marginLeft: 4,
                  flexShrink: 0,
                }}
              >
                <GenerateAssetsIcon color={hasDraftAssets ? '#ffffff' : '#9c99a9'} size={16} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'Roboto, sans-serif',
                    color: hasDraftAssets ? '#ffffff' : '#9c99a9',
                    letterSpacing: '0.46px',
                    lineHeight: '22px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Generate Assets
                </span>
              </button>

              <div style={{ flex: 1 }} />

              {/* Details link → /review */}
              <button
                onClick={() => navigate('/review')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                <OpenInNew style={{ fontSize: 16, color: '#686576' }} />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'Roboto, sans-serif',
                    color: '#686576',
                    letterSpacing: '0.17px',
                    lineHeight: 1.43,
                  }}
                >
                  Details
                </span>
              </button>
            </div>

            {/* Horizontal thumbnail scroll — 240×240 thumbnails, same as Review task */}
            <div
              style={{
                overflowX: 'auto',
                display: 'flex',
                gap: 12,
                padding: '4px 12px 16px',
                scrollbarWidth: 'thin',
              }}
            >
              {previewAssets.map((asset) => {
                const template = TEMPLATES.find((t) => t.id === asset.templateId);
                const isWide = asset.width > asset.height;
                const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
                const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

                return (
                  <div
                    key={asset.id}
                    style={{
                      flexShrink: 0,
                      position: 'relative',
                      width: 240,
                      height: 240,
                      background: '#ffffff',
                      border: '1px solid #e7e7e9',
                      borderRadius: 8,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {template && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: `${innerWidthPct}%`,
                          height: `${innerHeightPct}%`,
                          opacity: asset.status === 'removed' ? 0.25 : 1,
                        }}
                      >
                        <FilledTemplatePreview
                          template={template}
                          offer={asset.offer}
                          backgroundUrl={asset.backgroundUrl}
                        />
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <StatusBadge status={asset.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
