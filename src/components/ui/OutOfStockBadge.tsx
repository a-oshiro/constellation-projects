const OutOfStockIcon = ({ size = 14, color = '#BE0E1C' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M9.04155 4.37467V3.49967C9.04155 2.37209 8.12747 1.45801 6.99988 1.45801C5.8723 1.45801 4.95822 2.37209 4.95822 3.49967V4.37467M5.54155 12.5413H3.00581C2.65082 12.5413 2.37813 12.2269 2.42834 11.8755L3.42834 4.87551C3.46939 4.58813 3.71551 4.37467 4.00581 4.37467H9.99396C10.2843 4.37467 10.5304 4.58813 10.5714 4.87551L10.7499 6.12467M11.7727 12.3558C12.7978 11.3307 12.7978 9.66865 11.7727 8.64352C10.7476 7.61839 9.08552 7.61839 8.06039 8.64352M11.7727 12.3558C10.7476 13.381 9.08552 13.381 8.06039 12.3558C7.03527 11.3307 7.03527 9.66865 8.06039 8.64352M11.7727 12.3558L8.06039 8.64352" stroke={color} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const OutOfStockBadge = () => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: '#FBEFF0', borderRadius: 8,
    padding: '3px 8px 3px 6px',
    backdropFilter: 'blur(2px)',
    flexShrink: 0,
    width: 'fit-content',
  }}>
    <OutOfStockIcon />
    <span style={{
      fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
      color: '#BE0E1C', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
    }}>
      Out of Stock
    </span>
  </div>
);

export function isAssetOutOfStock(offer: { inventory?: number; inStock: number }): boolean {
  return (offer.inventory ?? offer.inStock) === 0;
}
