import { Close } from '@mui/icons-material';
import { useTestWidget } from '../../context/TestWidgetContext';

interface SnackbarProps {
  message: string;
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}

export function AppSnackbar({ message, action, onClose }: SnackbarProps) {
  const { widgetWidth } = useTestWidget();
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: widgetWidth + 24,
      zIndex: 9999,
      transition: 'left 0.2s ease',
    }}>
      <div style={{
        background: '#2a2831',
        borderRadius: 4,
        boxShadow: '0px 1px 18px 0px rgba(0,0,0,0.12), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 3px 5px -1px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px 6px 16px',
        gap: 12,
      }}>
        <p style={{
          margin: 0,
          fontSize: 12,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          color: '#ffffff',
          letterSpacing: '0.17px',
          lineHeight: 1.43,
          whiteSpace: 'nowrap',
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {action && (
            <button
              onClick={() => { action.onClick(); onClose(); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 5px',
                fontSize: 13,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 500,
                color: '#acabff',
                letterSpacing: '0.46px',
                lineHeight: '22px',
                borderRadius: 100,
                textTransform: 'capitalize',
              }}
            >
              {action.label}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 100,
              flexShrink: 0,
            }}
          >
            <Close style={{ fontSize: 24, color: '#ffffff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
