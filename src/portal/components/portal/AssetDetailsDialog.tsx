
import { useState, type ReactNode } from "react";
import { Folder, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@portal/components/ui/dialog";
import type { PortalAsset } from "@portal/lib/portal-assets";

/**
 * One asset, looked at closely.
 *
 * The grid is for choosing between assets; this is for reading one. So the
 * picture is given the room and the facts sit beside it as a list rather than
 * as the card's compressed subtitle — the card says `JPEG · 1080 x 1080 ·
 * Square` in one line because it has one line to spare, and that is the wrong
 * shape for something you came here to read.
 */
export function AssetDetailsDialog({
  asset, isVideo, onOpenChange, preview,
}: {
  /** Null closes it — the caller holds which asset is open, not a boolean. */
  asset: PortalAsset | null;
  isVideo: (a: PortalAsset) => boolean;
  onOpenChange: (open: boolean) => void;
  /** For an asset that is DRAWN rather than stored (a signal creative): what
   *  takes the picture's place. It is handed the right pane's controls slot,
   *  so the creative can put its editing controls beside itself. */
  preview?: (controls: HTMLElement | null) => ReactNode;
}) {
  const [controls, setControls] = useState<HTMLDivElement | null>(null);
  const facts: [string, string][] = asset
    ? ([
        ["File type", asset.fileType],
        ["Dimensions", asset.dimensions],
        ["Shape", asset.shape],
        ["Brands", asset.brands.join(", ")],
        ["Season", asset.season ?? ""],
        ["Entity type", (asset as { entityType?: string }).entityType ?? ""],
        ["Collection", (asset as { collection?: string }).collection ?? ""],
      ].filter(([, v]) => v) as [string, string][])
    : [];

  return (
    <Dialog open={asset !== null} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        /* `sm:` as well as the bare utility: DialogContent's own
          * `sm:max-w-sm` is a different key to tailwind-merge, so an unprefixed
          * max-width does not replace it and the responsive one wins above
          * 640px — the dialog came out 384px wide with the picture squeezed to
          * 64. */
        className="w-[min(1100px,92vw)] max-w-[min(1100px,92vw)] sm:max-w-[min(1100px,92vw)] p-0 gap-0 overflow-hidden"
      >
        {asset && (
          <div className="flex flex-col md:flex-row max-h-[86vh]">
            {/* The picture, on the ground the cards use, so an asset with
              * transparency reads the same here as it did in the grid. */}
            <div className="relative flex-1 min-w-0 min-h-[40vh] md:min-h-[86vh] bg-[#f0f2f4] flex items-center justify-center">
              {preview ? (
                /* Square, and as big as the column allows without running past
                  * the dialog's height. */
                <div className="w-full max-w-[min(100%,80vh)] p-6">{preview(controls)}</div>
              ) : !asset.url ? (
                <span className="text-[13px] text-gray-400">No preview</span>
              ) : isVideo(asset) ? (
                <video
                  src={asset.url}
                  controls
                  autoPlay
                  muted
                  playsInline
                  /* `w-full`, not only `max-w-full`: a <video> falls back to
                    * its 300x150 default box until it has metadata, and a cap
                    * never grows anything — it came out 285x143 in a 741px
                    * column. `object-contain` is what keeps the aspect. */
                  className="w-full max-h-[86vh] object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full max-h-[86vh] object-contain"
                />
              )}
            </div>

            <div className="w-full md:w-[320px] shrink-0 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l border-gray-100">
              <div className="flex items-start gap-3 px-5 pt-5 pb-4">
                <DialogTitle className="flex-1 text-[15px] font-semibold text-gray-900 leading-snug break-words">
                  {asset.name}
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* The creative's own controls, when it brought any. */}
              {preview && <div ref={setControls} className="border-t border-gray-100" />}

              <dl className={`${preview ? "" : "flex-1 "}overflow-y-auto px-5 pb-5 text-[13px]`}>
                {facts.map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-2 border-t border-gray-100">
                    <dt className="w-[92px] shrink-0 text-gray-500">{k}</dt>
                    <dd className="min-w-0 text-gray-900 break-words">{v}</dd>
                  </div>
                ))}
                <div className="flex gap-3 py-2 border-t border-gray-100">
                  <dt className="w-[92px] shrink-0 text-gray-500">Folder</dt>
                  <dd className="min-w-0 text-gray-900 break-words flex items-center gap-1.5">
                    <Folder size={12} className="shrink-0 text-indigo-400" />
                    {asset.folder}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
