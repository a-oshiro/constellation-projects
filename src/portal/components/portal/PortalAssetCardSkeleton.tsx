// Placeholder cards for while the platform library is being read.
//
// Each one is drawn to PortalAssetCard's measurements — the square thumbnail,
// the two-line name, the measurements line, a row of chips, the 100px footer —
// so when the real cards land they take the same places and nothing jumps.
//
// Every block shimmers on its own (.portal-skeleton in portal.css): the
// highlight sweeps across each item from its left edge to its right.

import { CardViewVertical } from "@portal/components/ui/CardViewVertical";

/** Chip widths, varied per card so the grid does not read as one stamp. */
const CHIP_ROWS = [
  [44, 72, 56],
  [38, 60, 84],
  [52, 46, 68],
  [64, 40, 58],
  [36, 78, 50],
];

/** Second-line widths of the name — names wrap to different lengths. */
const NAME_TAILS = ["62%", "48%", "74%", "55%", "40%"];

export function PortalAssetCardSkeleton({ index = 0 }: { index?: number }) {
  const chips = CHIP_ROWS[index % CHIP_ROWS.length];
  const tail = NAME_TAILS[index % NAME_TAILS.length];
  return (
    <div aria-hidden className="relative w-full min-w-[240px] max-w-[300px]">
      {/* Thumbnail shell — same square, radius and hairline as AssetCard. */}
      <div className="relative aspect-square rounded-xl overflow-hidden">
        <div className="portal-skeleton absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/[0.04]" />
      </div>

      {/* Text area — pt-2 pb-3 and a 100px footer, as on the real card. */}
      <div className="pt-2 pb-3">
        <div className="min-h-[100px]">
          {/* Name: two 13px lines in a 36px box. */}
          <div className="min-h-[36px] flex flex-col gap-[6px] pt-[3px]">
            <div className="portal-skeleton h-[12px] w-[92%] rounded" />
            <div className="portal-skeleton h-[12px] rounded" style={{ width: tail }} />
          </div>
          {/* File type · dimensions · shape */}
          <div className="portal-skeleton h-[10px] w-[46%] rounded mt-1.5" />
          {/* Chips */}
          <div className="flex gap-1 mt-2">
            {chips.map((w, i) => (
              <div key={i} className="portal-skeleton h-[17px] rounded" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A grid of skeleton cards in the real grid's columns. */
export function PortalAssetGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading assets…</span>
      <CardViewVertical>
        {Array.from({ length: count }, (_, i) => (
          <PortalAssetCardSkeleton key={i} index={i} />
        ))}
      </CardViewVertical>
    </div>
  );
}
