import { accountColor } from '../../data/accounts';

interface AccountLogoProps {
  name: string;
  size?: number;
}

export function AccountLogo({ name, size = 24 }: AccountLogoProps) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: Math.max(4, Math.round(size * 0.25)),
        background: accountColor(name), flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.42), fontWeight: 700, color: '#ffffff', fontFamily: 'Roboto, sans-serif',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
