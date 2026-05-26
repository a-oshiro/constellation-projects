import emptyFolderSrc from '../../assets/empty-folder.png';

interface EmptyStateMessageProps {
  message: string | string[];
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStateMessage = ({ message, actionLabel, onAction }: EmptyStateMessageProps) => {
  const lines = Array.isArray(message) ? message : [message];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      flex: 1,
      padding: '40px 16px',
    }}>
      <img
        src={emptyFolderSrc}
        alt=""
        style={{ width: 200, height: 200, objectFit: 'contain', flexShrink: 0 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
        {lines.map((line, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25',
              letterSpacing: '0.15px',
              lineHeight: 1.43,
              textAlign: 'center',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 5px',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            color: '#473bab',
            letterSpacing: '0.46px',
            lineHeight: '22px',
            textTransform: 'capitalize',
            borderRadius: 100,
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
