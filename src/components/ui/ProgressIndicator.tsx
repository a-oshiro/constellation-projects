import { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { CheckCircle, Close, KeyboardArrowDown } from '@mui/icons-material';
import { useProgressIndicator } from '../../context/ProgressIndicatorContext';

export function ProgressIndicator() {
  const { visible, items, done, dismiss } = useProgressIndicator();
  const [collapsed, setCollapsed] = useState(false);

  if (!visible || items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 100,
      zIndex: 9999,
      width: 340,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px 16px 0 0',
      overflow: 'hidden',
      border: '3px solid #473bab',
      borderBottom: 'none',
      boxShadow: '0px 8px 24px rgba(0,0,0,0.16)',
    }}>
      {/* Header */}
      <div style={{
        background: '#f0f2f4',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 8px 8px 16px',
        flexShrink: 0,
      }}>
        <span style={{
          flex: 1,
          fontSize: 12,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          color: '#1f1d25',
          letterSpacing: '0.17px',
          lineHeight: 1.43,
        }}>
          {done ? 'Assets generated.' : 'Generating assets...'}
        </span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 100, color: '#686576',
            transition: 'transform 0.2s',
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          <KeyboardArrowDown style={{ fontSize: 20 }} />
        </button>
        <button
          onClick={dismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 100, color: '#686576',
          }}
        >
          <Close style={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Item list */}
      {!collapsed && (
        <div style={{
          background: '#ffffff',
          overflowY: 'auto',
          maxHeight: 260,
        }}>
          {items.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 8px 8px 16px',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
            }}>
              {/* Thumbnail */}
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: 2, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 24, height: 24, borderRadius: 2,
                    background: '#e0e0e0',
                  }} />
                )}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <p style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 400,
                  color: '#686576',
                  letterSpacing: '0.17px',
                  lineHeight: 1.43,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.name}
                </p>
              </div>

              {/* Status icon */}
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done ? (
                  <CheckCircle style={{ fontSize: 24, color: '#4caf50' }} />
                ) : (
                  <CircularProgress size={16} sx={{ color: '#473bab' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
