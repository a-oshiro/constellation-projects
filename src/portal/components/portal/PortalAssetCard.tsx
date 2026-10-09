// The Portal's asset card — one card, drawn identically wherever a grid of
// assets is: the Portal itself, and a signal-driven project's Assets task.
// Extracted from app/portal/page.tsx so the two cannot drift; the screen owns
// the selection, the filters and what opening an asset means, and passes them
// in.

import { useMemo, type ReactNode } from "react";
import { Folder, ImageIcon } from "lucide-react";
import { AssetCard } from "@portal/components/ui/AssetCard";
import { AssetChips } from "@portal/components/portal/AssetChips";
import { Highlight } from "@portal/components/ui/Highlight";
import type { SelectField } from "@portal/components/portal/PortalFilterPanel";
import type { PortalAsset } from "@portal/lib/portal-assets";

/** Whether this asset is a moving picture rather than a still. Read off the
 *  file type the platform reports, which is the only thing that distinguishes
 *  them — the URL is a signed link with no extension to go by. */
export function isVideo(asset: PortalAsset) {
  return /^(mp4|mov|webm|m4v)$/i.test(asset.fileType ?? "");
}

/** Every metadata value an asset carries, as chips.
 *
 *  The card used to show `brands` and `season`. Measured against the live
 *  library that is one field, not two: **season is empty on 100% of 2,234
 *  assets**, so the second slot never produced anything — and brands is missing
 *  on 8%, which left 158 cards with no chip at all.
 *
 *  What is NOT here is as considered as what is. The file type, the dimensions
 *  and the shape already have their own line under the name; the folder has
 *  one of its own in Recents. Repeating them as chips would spend the card's
 *  scarcest room saying what it already says.
 *
 *  Deduped, case-insensitively and in this order: the vehicle identifies the
 *  asset, so it leads. A value appearing twice — an account that is also the
 *  collection, which is the common case here — is one chip, not two. */
const CHIP_FIELDS = [
  "year", "make", "model", "trim", "brands", "platform", "assetTypes",
  "vehicleCondition", "entityType", "entityStatus", "collection", "accounts",
  "tags", "season", "theme",
] as const;

export interface AssetChip {
  text: string;
  /** The filter this value belongs to — every one of CHIP_FIELDS is a filter,
   *  which is what lets a chip be clicked to narrow the grid by itself. */
  field: SelectField;
}

function buildChips(asset: PortalAsset): AssetChip[] {
  const out: AssetChip[] = [];
  const seen = new Set<string>();
  for (const field of CHIP_FIELDS) {
    const raw = (asset as unknown as Record<string, unknown>)[field];
    for (const v of Array.isArray(raw) ? raw : [raw]) {
      const text = typeof v === "string" ? v.trim() : v == null ? "" : String(v);
      const key = text.toLowerCase();
      if (!text || seen.has(key)) continue;
      seen.add(key);
      out.push({ text, field });
    }
  }
  return out;
}

const chipCache = new WeakMap<PortalAsset, AssetChip[]>();

/** An asset's chips, built once per asset.
 *
 *  `buildChips` makes a fresh array every call, and identity is what
 *  `AssetChips` keys its measurement effect on — so a new array on every
 *  render tore down and rebuilt every mounted card's ResizeObserver. Cached
 *  by the asset object: an asset that changes is a new object and gets fresh
 *  chips. */
export function portalChips(asset: PortalAsset): AssetChip[] {
  let chips = chipCache.get(asset);
  if (!chips) {
    chips = buildChips(asset);
    chipCache.set(asset, chips);
  }
  return chips;
}

/** A chip a screen adds over the asset's own fields — a project's origin
 *  alert. It leads the row, and its filter is the screen's. */
const EXTRA = "__extra" as const;
type CardChip = AssetChip | { text: string; field: typeof EXTRA };

export function PortalAssetCard({
  asset, query, selected = false, onSelect, onOpen, chipsOpen, onChipsToggle,
  isChipActive, onChipPick, onFolder, preview, status, extraChips, footer,
}: {
  asset: PortalAsset;
  /** The search term, highlighted in the name, the chips and the folder. */
  query: string;
  selected?: boolean;
  /** Omit it and the card draws no checkbox. */
  onSelect?: (checked: boolean) => void;
  onOpen?: () => void;
  /** Whether this card has its chips expanded. One at a time, the screen's
   *  call: the panel overlays the cards below it. */
  chipsOpen: boolean;
  onChipsToggle: (open: boolean) => void;
  isChipActive: (chip: AssetChip) => boolean;
  /** A chip is a filter you can see: picking one narrows the grid by it. */
  onChipPick: (chip: AssetChip) => void;
  /** Shows the folder line, which goes to that folder. Omit it where every
   *  card comes from the same place and the line would only repeat it. */
  onFolder?: () => void;
  /** Overrides the file preview — for an asset that is drawn, not stored. */
  preview?: ReactNode;
  /** The asset's status, top-right on the thumbnail (StatusIndicator). */
  status?: ReactNode;
  /** Chips the screen adds before the asset's own, each a filter of the
   *  screen's — a signal asset's origin alert. */
  extraChips?: {
    values: readonly string[];
    isActive: (text: string) => boolean;
    onPick: (text: string) => void;
  };
  /** Added under the chips — for a screen where the card is not only something
   *  to look at but something to act on. The approvals queue puts its verdict
   *  buttons here; the Portal passes nothing and the card is unchanged. */
  footer?: ReactNode;
}) {
  const own = portalChips(asset);
  // One array per change, not per render: `AssetChips` re-measures whenever
  // the identity changes (see portalChips).
  const extraKey = extraChips?.values.join("\u0000") ?? "";
  const chips = useMemo<CardChip[]>(
    () => [...(extraKey ? extraKey.split("\u0000").map((text) => ({ text, field: EXTRA })) : []), ...own],
    [own, extraKey],
  );
  return (
      <AssetCard
        onOpen={onOpen}
        raised={chipsOpen}
        status={status}
        selected={selected}
        onSelect={onSelect}
        /* One asset, shown whole. The Background Collection card
         * fans three rotated copies behind its thumbnail to say
         * "collection"; a single asset has nothing to fan. */
        preview={preview ?? (
          /* No file behind the card, no element at all.
           *
           * The platform's `public_url` is nullable and the route maps null to
           * "" (`api/portal-assets/route.ts`), so an asset can reach the grid
           * with no file. It comes and goes with the upstream: one response
           * carried 314 of 2,367 like that, the next two carried none.
           *
           * An empty `src` is not merely blank. The browser resolves it against
           * the current address and re-downloads the PAGE — as an image, and as
           * a video for the video branch, where `#t=0.1` on nothing is the same
           * trap wearing a fragment. Next says so in the console, which is how
           * this surfaced.
           *
           * The card's own ground shows through instead, with a quiet glyph so
           * the square reads as "nothing to show" rather than as still loading. */
          !asset.url ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <ImageIcon size={20} className="text-gray-300" aria-label="No preview" />
            </span>
          ) : /* A fifth of the library is MP4 — 59 of the first 262 assets — and a
           * video in an <img> is a broken-image icon, which is what the grid
           * was showing. `preload="metadata"` fetches only the headers, enough
           * for the browser to paint the first frame as its own poster: the
           * platform stores no separate thumbnail for these, so the frame is
           * the only picture there is. */
          isVideo(asset) ? (
            <video
              /* The #t fragment asks the browser to seek a tenth of a second
               * in, which is what makes it paint that frame instead of a grey
               * box. A fragment never reaches the server, so the signed URL is
               * untouched. */
              src={`${asset.url}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              aria-label={asset.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={asset.url}
              alt={asset.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )
        )}
        footer={
          <>
            {/* The footer holds one height whatever it carries. Nothing is
              * reserved in the middle — a card with no chip shows its folder
              * directly under the measurements — so the slack always falls at
              * the FOOT of the card. That is what keeps every card the same
              * height, which is what lets the grid draw only the rows near the
              * viewport (see WindowedCardGrid). */}
            <div className="min-h-[100px]">
              {/* Two lines, reserved whether or not they are used. Two is what
                * nearly every one of these names takes — the platform builds
                * them out of dealer, vehicle and size — and reserving three
                * left a band of white under most cards. */}
              {/* The name opens the asset, the way a file name does in every
                * file browser. It is the second target for looking closely —
                * the button on the thumbnail is the first — because a reader
                * scanning names should not have to travel back up to the
                * picture to act on the one they just read. */}
              {onOpen ? (
                <button
                  type="button"
                  onClick={onOpen}
                  /* The pointer is the whole of the hover feedback. The card
                    * already answers a hover with its purple stroke, and a name
                    * that also changed colour and underlined made one gesture
                    * look like two different offers. */
                  className="min-w-0 min-h-[36px] block text-left text-[13px] font-medium text-gray-900 leading-snug line-clamp-2 break-words cursor-pointer"
                >
                  <Highlight text={asset.name} query={query} />
                </button>
              ) : (
                <p className="min-w-0 min-h-[36px] text-[13px] font-medium text-gray-900 leading-snug line-clamp-2 break-words">
                  <Highlight text={asset.name} query={query} />
                </p>
              )}

              <p className="text-[11px] text-gray-500 mt-0.5">
                {[asset.fileType, asset.dimensions, asset.shape]
                  .filter(Boolean).join(" · ")}
              </p>

              <AssetChips
                chips={chips}
                query={query}
                open={chipsOpen}
                onToggle={onChipsToggle}
                isActive={(c: CardChip) => (c.field === EXTRA ? !!extraChips?.isActive(c.text) : isChipActive(c as AssetChip))}
                /* A chip is a filter you can see. Clicking one narrows the grid
                 * by that value, and clicking it again lets it go — which is
                 * why an active one is drawn differently: a toggle that looks
                 * the same in both states is a trap. */
                onPick={(c: CardChip) => (c.field === EXTRA ? extraChips?.onPick(c.text) : onChipPick(c as AssetChip))}
              />

              {/* Only in Recents, which is the one view where the cards come
                * from different folders. Inside a folder every card is from
                * it, and the line would repeat the page's own title once per
                * card. */}
              {/* And it is the way there: Recents mixes folders, so the line
                * that says where a card lives also takes you to it. A plain
                * button, not <Button> — the card is uniform-height (see
                * WindowedCardGrid) and this line must keep its 16px. */}
              {onFolder && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFolder(); }}
                  title={`Go to ${asset.folder}`}
                  className="group/folder flex items-center gap-1.5 mt-1.5 max-w-full text-left"
                >
                  <Folder size={11} className="text-indigo-400 shrink-0" />
                  <span className="text-[11px] text-gray-400 truncate group-hover/folder:text-indigo-600 group-hover/folder:underline">
                    <Highlight text={asset.folder} query={query} />
                  </span>
                </button>
              )}
            </div>
            {footer}
          </>
        }
      />
  );
}
