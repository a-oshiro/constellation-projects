import type { DraftVariant } from './AssetCard';

interface DraftVariantPickerProps {
  value: DraftVariant;
  onChange: (v: DraftVariant) => void;
}

const TABS: { value: DraftVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'labeled', label: 'Labeled' },
  { value: 'badge', label: 'Badge' },
];

export const DraftVariantPicker = ({ value, onChange }: DraftVariantPickerProps) => (
  <div
    style={{
      background: '#ffffff',
      border: '1px solid #e7e7e9',
      borderRadius: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      padding: 3,
      gap: 2,
    }}
  >
    <span style={{
      fontSize: 11,
      fontFamily: 'Roboto, sans-serif',
      color: '#9c99a9',
      letterSpacing: '0.4px',
      paddingLeft: 10,
      paddingRight: 6,
      whiteSpace: 'nowrap',
    }}>
      Draft view
    </span>
    {TABS.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        style={{
          background: value === tab.value ? '#473bab' : 'transparent',
          color: value === tab.value ? '#ffffff' : '#686576',
          border: 'none',
          borderRadius: 100,
          padding: '4px 12px',
          fontSize: 12,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: value === tab.value ? 500 : 400,
          letterSpacing: '0.17px',
          lineHeight: '18px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
