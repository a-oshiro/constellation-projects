import { useState } from 'react';
import { Close, Add } from '@mui/icons-material';
import { Checkbox, MenuItem, Select } from '@mui/material';
import type { AdShell } from './AdShellCard';
import { AssetHorizontalCard } from './AssetHorizontalCard';

interface AdShellPanelProps {
  shell: AdShell;
  onClose: () => void;
}

const DISPLAY_ORDER_OPTIONS = ['Display First', 'Display Last'];
const AD_TYPE_OPTIONS = ['Grid', 'Carousel'];

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#686576',
  letterSpacing: '0.4px',
  lineHeight: 1.66,
  marginBottom: 3,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25',
  letterSpacing: '0.17px',
  lineHeight: 1.43,
  background: '#ffffff',
  border: '1px solid #cac9cf',
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
};

const readOnlyInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#f0f2f4',
  color: '#9c99a9',
  cursor: 'default',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#1f1d25',
  letterSpacing: '0.17px',
  lineHeight: 1.43,
};

export const AdShellPanel = ({ shell, onClose }: AdShellPanelProps) => {
  const [name, setName] = useState(shell.name);
  const [folder, setFolder] = useState(shell.folder ?? '');
  const [displayOrder, setDisplayOrder] = useState(DISPLAY_ORDER_OPTIONS[0]);
  const [adType, setAdType] = useState(
    shell.adType === 'Carousel' ? 'Carousel' : 'Grid'
  );
  const [autoTransition, setAutoTransition] = useState(false);
  const [displayTime, setDisplayTime] = useState('5');
  const [transitionTime, setTransitionTime] = useState('1');

  const isCarousel = adType === 'Carousel';

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 320,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        margin: '8px 8px 8px 0',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
            color: '#1f1d25',
            letterSpacing: '0.15px',
            lineHeight: '24px',
          }}
        >
          Edit Ad Shell
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Close style={{ fontSize: 20, color: '#686576' }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Ad Shell Name */}
        <div>
          <p style={labelStyle}>Ad Shell Name</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Destination Folder */}
        <div>
          <p style={labelStyle}>Destination Folder</p>
          <input
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Platform Settings */}
        <div>
          <p style={sectionTitleStyle}>Platform Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>

            {/* Platform — read only */}
            <div>
              <p style={labelStyle}>Platform</p>
              <input
                type="text"
                value="Website"
                readOnly
                style={readOnlyInputStyle}
              />
            </div>

            {/* Display Order */}
            <div>
              <p style={labelStyle}>Display Order</p>
              <Select
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                size="small"
                variant="outlined"
                fullWidth
                sx={{
                  fontSize: 12,
                  fontFamily: 'Roboto, sans-serif',
                  letterSpacing: '0.17px',
                  color: '#1f1d25',
                  height: 36,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                  '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 },
                }}
              >
                {DISPLAY_ORDER_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </div>

            {/* Type */}
            <div>
              <p style={labelStyle}>Type</p>
              <Select
                value={adType}
                onChange={(e) => setAdType(e.target.value)}
                size="small"
                variant="outlined"
                fullWidth
                sx={{
                  fontSize: 12,
                  fontFamily: 'Roboto, sans-serif',
                  letterSpacing: '0.17px',
                  color: '#1f1d25',
                  height: 36,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                  '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 },
                }}
              >
                {AD_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </div>

            {/* Carousel-only options */}
            {isCarousel && (
              <>
                {/* Auto Transition checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => setAutoTransition((v) => !v)}
                >
                  <Checkbox
                    checked={autoTransition}
                    size="small"
                    sx={{
                      padding: '2px',
                      '&.Mui-checked': { color: '#473bab' },
                      '& .MuiSvgIcon-root': { fontSize: 18 },
                    }}
                  />
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
                    Auto transition
                  </span>
                </div>

                {/* Display Time + Transition Time — only when auto transition on */}
                {autoTransition && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={labelStyle}>Display Time (s)</p>
                      <input
                        type="number"
                        min={1}
                        value={displayTime}
                        onChange={(e) => setDisplayTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={labelStyle}>Transition Time (s)</p>
                      <input
                        type="number"
                        min={1}
                        value={transitionTime}
                        onChange={(e) => setTransitionTime(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Assets */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <p style={sectionTitleStyle}>Assets</p>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                color: '#473bab',
                border: '1px solid rgba(99, 86, 225, 0.5)',
                borderRadius: 100,
                padding: '3px 10px',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Roboto, sans-serif',
                letterSpacing: '0.46px',
                lineHeight: '22px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Add style={{ fontSize: 16, color: '#473bab' }} />
              Add Asset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shell.assets.map((asset) => (
              <AssetHorizontalCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#473bab',
            border: '1px solid rgba(99, 86, 225, 0.5)',
            borderRadius: 100,
            padding: '5px 16px',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '0.46px',
            lineHeight: '22px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Close
        </button>
        <button
          style={{
            background: '#473bab',
            color: '#ffffff',
            border: 'none',
            borderRadius: 100,
            padding: '5px 16px',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '0.46px',
            lineHeight: '22px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};
