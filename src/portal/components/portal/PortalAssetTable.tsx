
// The Portal's table view — the same library the cards show, one row per asset.
//
// Folders come first, as a list of their own: sorted by the same field and
// direction as the assets wherever a folder carries that field, and divided
// from the assets beneath them, the way a filter's picked values sit above its
// other values. A folder is a different kind of thing from an asset, so the two
// are never interleaved — they share the sort, not the list.
//
// Every row is one height — 64px, room for a name on two lines and two rows of
// chips. That is what lets the rows below the viewport go undrawn
// (WindowedCardGrid, `variant="rows"`), the same reason every card is one
// height; it is also why opening a row's chips lays them OVER the rows below
// instead of growing the row.

import { ArrowDown, ArrowUp, Folder, ImageIcon } from "lucide-react";
import { Checkbox } from "@portal/components/ui/checkbox";
import { Highlight } from "@portal/components/ui/Highlight";
import { isVideo, portalChips, type AssetChip } from "@portal/components/portal/PortalAssetCard";
import { AssetChips } from "@portal/components/portal/AssetChips";
import type { PortalAsset } from "@portal/lib/portal-assets";

/** A folder as the table lists it. `updatedDaysAgo` is its most recent asset,
 *  anywhere beneath it — undefined when nothing beneath it is loaded. */
export interface TableFolder {
  id: string;
  label: string;
  items: number;
  subfolders: number;
  updatedDaysAgo?: number;
}

/** The columns, and the sort field each one sets. One template for the header
 *  and every row, so a cell can never drift out from under its heading. */
const COLUMNS = [
  { key: "name", label: "Name", sort: "Name" },
  { key: "details", label: "Details", sort: null },
  { key: "type", label: "Type", sort: "File Type" },
  { key: "dimensions", label: "Dimensions", sort: "Dimensions" },
  { key: "shape", label: "Shape", sort: "Shape" },
  { key: "folder", label: "Folder", sort: "Folder" },
  { key: "updated", label: "Updated", sort: "Updated At" },
] as const;


/** Checkbox, then the columns. The folder column only exists in Recents — the
 *  one view whose rows come from different folders, as with the cards. */
function template(showFolder: boolean) {
  return showFolder
    ? "40px minmax(200px,1fr) minmax(220px,1.3fr) 72px 110px 96px minmax(120px,180px) 104px"
    : "40px minmax(200px,1fr) minmax(220px,1.3fr) 72px 110px 96px 104px";
}

const ROW = "grid items-center h-16 px-2 border-b border-gray-100 text-[12px] text-gray-600";

export function ago(days: number | undefined): string {
  if (days === undefined) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

/** Folders in the assets' order, where a folder has the field being sorted on.
 *  Name sorts by name and Updated / Created by the most recent asset beneath
 *  the folder, in the sort's direction. A field a folder does not carry —
 *  File Type, Brands — leaves them by name, A to Z: there is nothing of theirs
 *  for that sort to order by. */
export function sortFolders(
  folders: readonly TableFolder[],
  field: string,
  asc: boolean,
): TableFolder[] {
  const dir = asc ? 1 : -1;
  const byName = (a: TableFolder, b: TableFolder) =>
    a.label.localeCompare(b.label, undefined, { numeric: true });
  return [...folders].sort((a, b) => {
    if (field === "Name") return dir * byName(a, b);
    if (field === "Updated At" || field === "Created At") {
      // Same rule as the assets' comparator: a folder with nothing loaded
      // beneath it has no date, and goes last either way.
      if (a.updatedDaysAgo === undefined) return b.updatedDaysAgo === undefined ? byName(a, b) : 1;
      if (b.updatedDaysAgo === undefined) return -1;
      // Newest first is descending, as for the assets.
      return dir * (b.updatedDaysAgo - a.updatedDaysAgo) || byName(a, b);
    }
    return byName(a, b);
  });
}

export function PortalTableHeader({
  showFolder, sortField, sortAsc, onSort, selectAll,
}: {
  showFolder: boolean;
  sortField: string;
  sortAsc: boolean;
  /** A column heading sets the sort: the same field again flips the direction. */
  onSort: (field: string) => void;
  /** The checkbox heading the first column, when the table has one to offer. */
  selectAll?: { checked: boolean; indeterminate: boolean; onChange: (next: boolean) => void };
}) {
  const columns = COLUMNS.filter((c) => showFolder || c.key !== "folder");
  return (
    <div
      role="row"
      className={`${ROW} !h-9 border-gray-200 text-[11px] font-medium text-gray-500`}
      style={{ gridTemplateColumns: template(showFolder) }}
    >
      <span role="columnheader" className="flex items-center justify-center">
        {selectAll && (
          <Checkbox
            checked={selectAll.checked}
            indeterminate={selectAll.indeterminate}
            onCheckedChange={(next) => selectAll.onChange(next)}
            aria-label="Select every asset listed"
          />
        )}
      </span>
      {columns.map((c) => {
        if (!c.sort) {
          return <span key={c.key} role="columnheader" className="min-w-0 px-2 truncate">{c.label}</span>;
        }
        const sort = c.sort;
        const on = sortField === sort;
        return (
          <span
            key={c.key}
            role="columnheader"
            aria-sort={on ? (sortAsc ? "ascending" : "descending") : "none"}
            className="min-w-0 px-2"
          >
            {/* A plain text heading that sorts — not a pill. It reads as part of
              * the table, and the arrow beside the active one is what says the
              * list is ordered by it. */}
            <button
              type="button"
              onClick={() => onSort(sort)}
              className={`inline-flex items-center gap-1 max-w-full truncate cursor-pointer hover:text-gray-800 transition-colors ${
                on ? "text-gray-800" : ""
              }`}
            >
              <span className="truncate">{c.label}</span>
              {on && (sortAsc ? <ArrowUp size={11} className="shrink-0" /> : <ArrowDown size={11} className="shrink-0" />)}
            </button>
          </span>
        );
      })}
    </div>
  );
}

export function PortalFolderRow({
  folder, showFolder, query, onOpen,
}: {
  folder: TableFolder;
  showFolder: boolean;
  query: string;
  onOpen: () => void;
}) {
  return (
    <div
      role="row"
      onClick={onOpen}
      className={`${ROW} cursor-pointer hover:bg-gray-50 transition-colors`}
      style={{ gridTemplateColumns: template(showFolder) }}
    >
      {/* No checkbox: a folder is not an asset, and the bulk actions act on
        * assets. The cell stays so every row's columns line up. */}
      <span role="cell" />
      <span role="cell" className="min-w-0 px-2 flex items-center gap-3">
        <span className="shrink-0 w-10 h-10 bg-indigo-50 flex items-center justify-center">
          <Folder size={16} className="text-indigo-400" />
        </span>
        <span className="min-w-0 line-clamp-2 break-words text-[13px] leading-snug text-gray-900">
          <Highlight text={folder.label} query={query} />
          {/* Right after the name, as in the rail — one phrase, not a column. */}
          <span className="text-gray-400"> ({folder.items.toLocaleString()})</span>
          {folder.subfolders > 0 && (
            <span className="text-[11px] text-gray-500">
              {" · "}{folder.subfolders} subfolder{folder.subfolders === 1 ? "" : "s"}
            </span>
          )}
        </span>
      </span>
      <span role="cell" />
      <span role="cell" className="px-2">Folder</span>
      <span role="cell" className="px-2 text-gray-300">—</span>
      <span role="cell" className="px-2 text-gray-300">—</span>
      {showFolder && <span role="cell" className="px-2 text-gray-300">—</span>}
      <span role="cell" className="px-2">{ago(folder.updatedDaysAgo)}</span>
    </div>
  );
}

export function PortalAssetRow({
  asset, showFolder, query, selected, onSelect, onOpen, onFolder,
  chipsOpen, onChipsToggle, isChipActive, onChipPick,
}: {
  /** The card's chips, all of them: two rows here, the rest behind +N. */
  chipsOpen: boolean;
  onChipsToggle: (next: boolean) => void;
  isChipActive: (chip: AssetChip) => boolean;
  onChipPick: (chip: AssetChip) => void;
  asset: PortalAsset;
  showFolder: boolean;
  query: string;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  /** Opens the asset in the lightbox — the name, as on the card. */
  onOpen: () => void;
  onFolder?: () => void;
}) {
  return (
    <div
      role="row"
      aria-selected={selected}
      className={`${ROW} transition-colors ${selected ? "bg-indigo-50/60" : "hover:bg-gray-50"}`}
      style={{ gridTemplateColumns: template(showFolder) }}
    >
      <span role="cell" className="flex items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={(next) => onSelect(next)}
          aria-label={`Select ${asset.name}`}
        />
      </span>
      <span role="cell" className="min-w-0 px-2 flex items-center gap-3">
        {/* Square-cornered: a thumbnail is a picture of the asset, and the
          * asset has corners. */}
        <span className="relative shrink-0 w-10 h-10 overflow-hidden bg-gray-100">
          {/* The card's three cases, small: no file renders no element (an
            * empty src re-downloads the page), a video paints its own first
            * frame, an image is an image. */}
          {!asset.url ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <ImageIcon size={13} className="text-gray-300" aria-label="No preview" />
            </span>
          ) : isVideo(asset) ? (
            <video
              src={`${asset.url}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              aria-label={asset.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={asset.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </span>
        <button
          type="button"
          onClick={onOpen}
          title={asset.name}
          /* Two lines, then the ellipsis — these names are long, and one line
            * cut most of them before the part that tells them apart. */
          className="min-w-0 line-clamp-2 break-words text-left text-[13px] leading-snug text-gray-900 cursor-pointer hover:text-indigo-700 transition-colors"
        >
          <Highlight text={asset.name} query={query} />
        </button>
      </span>
      <span role="cell" className="relative min-w-0 px-2 self-stretch flex items-center">
        {/* Open, the full list leaves the row and lies over the ones below on a
          * white panel — the row keeps its height, which the windowing needs.
          * The same move the card makes when it is raised. */}
        <div
          className={chipsOpen
            ? "absolute left-0 right-0 top-1.5 z-20 p-2 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(17,16,20,0.25)] border border-gray-100"
            : "w-full"}
        >
          <AssetChips
            chips={portalChips(asset)}
            query={query}
            open={chipsOpen}
            onToggle={onChipsToggle}
            isActive={isChipActive}
            onPick={onChipPick}
            flush
          />
        </div>
      </span>
      <span role="cell" className="px-2 truncate">{asset.fileType}</span>
      <span role="cell" className="px-2 truncate tabular-nums">{asset.dimensions}</span>
      <span role="cell" className="px-2 truncate">{asset.shape}</span>
      {showFolder && (
        <span role="cell" className="min-w-0 px-2">
          <button
            type="button"
            onClick={onFolder}
            title={asset.folder}
            className="max-w-full truncate text-left cursor-pointer hover:text-indigo-700 transition-colors"
          >
            {asset.folder}
          </button>
        </span>
      )}
      <span role="cell" className="px-2 tabular-nums">{ago(asset.updatedDaysAgo)}</span>
    </div>
  );
}

/** The run of folder rows, and the line that ends it. */
export function PortalFolderRows({
  folders, showFolder, query, onOpen,
}: {
  folders: readonly TableFolder[];
  showFolder: boolean;
  query: string;
  onOpen: (id: string) => void;
}) {
  if (folders.length === 0) return null;
  return (
    <div role="rowgroup" className="border-b-4 border-gray-100">
      {folders.map((f) => (
        <PortalFolderRow
          key={`folder:${f.id}`}
          folder={f}
          showFolder={showFolder}
          query={query}
          onOpen={() => onOpen(f.id)}
        />
      ))}
    </div>
  );
}
