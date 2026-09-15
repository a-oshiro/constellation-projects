import type { CSSProperties } from 'react';

interface LiveIconProps {
  style?: CSSProperties;
}

export const LiveIcon = ({ style }: LiveIconProps) => {
  const color = (style?.color as string) || '#4CAF50';
  const size = (style?.fontSize as number) || 14;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style, color: undefined, fontSize: undefined }}
    >
      <path d="M10.9192 3.08142C13.0834 5.24558 13.0834 8.75437 10.9192 10.9185M3.0821 10.9185C0.917946 8.75437 0.917946 5.24558 3.0821 3.08142M9.26929 4.73134C10.5222 5.98427 10.5222 8.01567 9.26929 9.26861M4.73202 9.26861C3.47908 8.01567 3.47908 5.98427 4.73202 4.73134M7.87565 6.99997C7.87565 7.48322 7.4839 7.87497 7.00065 7.87497C6.5174 7.87497 6.12565 7.48322 6.12565 6.99997C6.12565 6.51672 6.5174 6.12497 7.00065 6.12497C7.4839 6.12497 7.87565 6.51672 7.87565 6.99997Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
