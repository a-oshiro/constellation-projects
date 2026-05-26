import type { CSSProperties } from 'react';

interface NeedsEditsIconProps {
  style?: CSSProperties;
}

export const NeedsEditsIcon = ({ style }: NeedsEditsIconProps) => {
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
      <g clipPath="url(#needs-edits-clip)">
        <path d="M5.25016 2.625H2.39183C2.06513 2.625 1.90178 2.625 1.777 2.68858C1.66724 2.74451 1.578 2.83374 1.52208 2.94351C1.4585 3.06829 1.4585 3.23164 1.4585 3.55833V10.4417C1.4585 10.7684 1.4585 10.9317 1.52208 11.0565C1.578 11.1663 1.66724 11.2555 1.777 11.3114C1.90178 11.375 2.06513 11.375 2.39183 11.375H6.12516" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.75 11.3747H11.6083C11.935 11.3747 12.0984 11.3747 12.2232 11.3111C12.3329 11.2552 12.4222 11.1659 12.4781 11.0562C12.5417 10.9314 12.5417 10.768 12.5417 10.4413V6.70801" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.375 1.45801L5.54167 2.62467L4.375 3.79134" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.62516 10.208L8.4585 11.3747L9.62516 12.5413" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5415 7.38619V8.45792H6.61324C6.75592 8.45792 6.82725 8.45792 6.89439 8.4418C6.95391 8.42751 7.01081 8.40394 7.063 8.37196C7.12187 8.33589 7.17232 8.28544 7.2732 8.18455L11.5899 3.86789C11.8209 3.63688 11.9364 3.52137 11.9797 3.38818C12.0177 3.27102 12.0177 3.14482 11.9797 3.02766C11.9364 2.89447 11.8209 2.77896 11.5899 2.54795L11.4515 2.40955C11.2205 2.17855 11.105 2.06304 10.9718 2.01976C10.8546 1.98169 10.7284 1.98169 10.6112 2.01976C10.4781 2.06304 10.3625 2.17854 10.1315 2.40955L5.81487 6.72622C5.71398 6.82711 5.66354 6.87755 5.62746 6.93642C5.59548 6.98861 5.57191 7.04551 5.55762 7.10503C5.5415 7.17217 5.5415 7.24351 5.5415 7.38619Z" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.9165 2.91699L11.0832 4.08366" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <defs>
        <clipPath id="needs-edits-clip">
          <rect width="14" height="14" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
};
