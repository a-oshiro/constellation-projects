import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Asset } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';

interface LargePreviewModalProps {
  asset: Asset;
  onClose: () => void;
}

export const LargePreviewModal = ({ asset, onClose }: LargePreviewModalProps) => {
  const template = TEMPLATES.find((t) => t.id === asset.templateId);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: 600,
          height: 600,
          background: '#ffffff',
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: `${innerWidthPct}%`,
            height: `${innerHeightPct}%`,
            position: 'relative',
          }}
        >
          {template && asset.offer ? (
            <FilledTemplatePreview
              template={template}
              offer={asset.offer}
              backgroundUrl={asset.backgroundUrl}
            />
          ) : (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(17, 16, 20, 0.12)',
            padding: '5px',
            borderRadius: '100px',
            '&:hover': {
              background: 'rgba(17, 16, 20, 0.22)',
            },
          }}
        >
          <Close style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>
      </div>
    </div>,
    document.body
  );
};
