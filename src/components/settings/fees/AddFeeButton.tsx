import plusSmallIcon from '../../../assets/icons/fees/plus-small.svg';

// Figma "Add Fee" small text button: plus-small icon + primary 13px label. Sizes live here.
const FONT_SIZE = 13;
const ICON_SIZE = 18;
const PADDING = '4px 5px';
const GAP = 8;

export const AddFeeButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="hover:bg-[rgba(71,59,171,0.04)]"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: GAP, padding: PADDING, borderRadius: 100, border: 'none',
      background: 'transparent', cursor: 'pointer', alignSelf: 'flex-start',
      fontFamily: 'Roboto, sans-serif', fontSize: FONT_SIZE, fontWeight: 500, lineHeight: '22px', letterSpacing: '0.46px',
      color: '#473bab', textTransform: 'capitalize',
    }}
  >
    <img src={plusSmallIcon} alt="" width={ICON_SIZE} height={ICON_SIZE} />
    {label}
  </button>
);
