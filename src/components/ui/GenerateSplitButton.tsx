import { useState, useRef, useEffect } from 'react';
import { Tune } from '@mui/icons-material';
import { GenerateAssetsIcon } from './GenerateAssetsIcon';

interface GenerateSplitButtonProps {
  disabled?: boolean;
  onClick: () => void;
  onAdvancedGeneration?: () => void;
}

export const GenerateSplitButton = ({
  disabled = false,
  onClick,
  onAdvancedGeneration,
}: GenerateSplitButtonProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const arrowRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bg = disabled ? 'rgba(17,16,20,0.12)' : '#473bab';
  const textColor = disabled ? '#9c99a9' : '#ffffff';

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        arrowRef.current && !arrowRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div style={{ position: 'relative', flexShrink: 0, display: 'inline-flex' }}>
      {/* Split button pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: bg,
          borderRadius: 100,
          overflow: 'hidden',
          pointerEvents: disabled ? 'none' : undefined,
        }}
      >
        {/* Left — main action */}
        <button
          disabled={disabled}
          onClick={onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            padding: '4px 10px',
          }}
        >
          <GenerateAssetsIcon color={textColor} size={16} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              color: textColor,
              letterSpacing: '0.46px',
              lineHeight: '22px',
              whiteSpace: 'nowrap',
            }}
          >
            Generate Assets
          </span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: disabled ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.3)',
            flexShrink: 0,
          }}
        />

        {/* Right — dropdown trigger */}
        <button
          ref={arrowRef}
          disabled={disabled}
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="More generation options"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: disabled ? 'default' : 'pointer',
            padding: '4px 8px',
          }}
        >
          {/* Arrow down chevron */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M4 6L8 10L12 6" stroke={textColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 1300,
            background: '#ffffff',
            borderRadius: 4,
            minWidth: 220,
            boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <button
            onClick={() => {
              setDropdownOpen(false);
              onAdvancedGeneration?.();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 16px',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            {/* Icon slot — 36px min-width to match MUI MenuItem left slot */}
            <span style={{ minWidth: 36, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Tune style={{ fontSize: 20, color: '#1f1d25' }} />
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 400,
                fontFamily: 'Roboto, sans-serif',
                color: '#1f1d25',
                letterSpacing: '0.15px',
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
              }}
            >
              Advanced Generation
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
