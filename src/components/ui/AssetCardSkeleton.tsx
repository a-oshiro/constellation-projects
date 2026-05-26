export function AssetCardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Thumbnail — 1:1 square */}
      <div style={{
        aspectRatio: '1 / 1',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e7e7e9',
      }}>
        <div className="skeleton-shimmer" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
      </div>

      {/* Content below thumbnail */}
      <div style={{ paddingTop: 8, paddingBottom: 4, width: '100%' }}>
        {/* Title bar */}
        <div className="skeleton-shimmer" style={{ height: 20, width: 164, borderRadius: 3, marginBottom: 6 }} />
        {/* Subtitle bar */}
        <div className="skeleton-shimmer" style={{ height: 14, width: 80, borderRadius: 3, marginBottom: 8 }} />
        {/* Chips */}
        <div style={{ display: 'flex', gap: 4 }}>
          <div className="skeleton-shimmer" style={{ height: 22, width: 58, borderRadius: 8 }} />
          <div className="skeleton-shimmer" style={{ height: 22, width: 58, borderRadius: 8 }} />
          <div className="skeleton-shimmer" style={{ height: 22, width: 35, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
