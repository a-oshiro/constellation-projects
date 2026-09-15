import type { CSSProperties } from 'react';

interface InReviewIconProps {
  style?: CSSProperties;
}

export const InReviewIcon = ({ style }: InReviewIconProps) => {
  const color = (style?.color as string) || '#E17613';
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
      <path d="M4.3999 5.24866L5.05615 5.68616L6.14794 4.23044M7.90865 4.9583H9.65865M4.3999 9.18682L5.05615 9.62432L6.14794 8.1686M11.9582 6.70829V2.62496C11.9582 2.30279 11.697 2.04163 11.3748 2.04163H2.62484C2.30267 2.04163 2.0415 2.30279 2.0415 2.62496V11.375C2.0415 11.6971 2.30267 11.9583 2.62484 11.9583H6.70817M11.4456 11.4457C10.7622 12.1291 9.65415 12.1291 8.97073 11.4457C8.28732 10.7623 8.28732 9.65427 8.97073 8.97085C9.31244 8.62914 9.76031 8.45829 10.2082 8.45829C10.656 8.45829 11.1039 8.62914 11.4456 8.97085C12.129 9.65427 12.129 10.7623 11.4456 11.4457ZM11.4456 11.4457L12.5415 12.5416" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
