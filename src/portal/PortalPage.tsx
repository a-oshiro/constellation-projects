import { Fragment, useState, useRef, useEffect, useMemo, type RefObject } from "react";
import {
  Folder, LayoutGrid, ImageIcon,
  Download, List, ChevronDown, ChevronRight,
  Images, FolderInput, WandSparkles, Pencil, Copy, Trash2,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PaneResizeHandle } from "@portal/components/layout/PaneResizeHandle";
import { usePersistedPaneSize } from "@portal/lib/use-persisted-pane-size";
import { PortalFolderTree } from "@portal/components/folders/PortalFolderTree";
import { CardViewVertical } from "@portal/components/ui/CardViewVertical";
import { WindowedCardGrid } from "@portal/components/ui/WindowedCardGrid";
import { AssetDetailsDialog } from "@portal/components/portal/AssetDetailsDialog";
import { PortalAssetCard, isVideo } from "@portal/components/portal/PortalAssetCard";
import {
  PortalFilterPanel, EMPTY_PORTAL_FILTERS, derivePortalOptions, derivePortalCounts,
  matchesPortalFilters, hasAnyPortalFilter, derivePortalRangeBounds, PORTAL_FILTER_LABELS,
  comparePortalBy, portalValueOf, isPortalField, type PortalFilters,
} from "@portal/components/portal/PortalFilterPanel";
import { PORTAL_ASSETS, type PortalAsset } from "@portal/lib/portal-assets";
import {
  usePinnedFilters, FilterSelectAll, FilterSectionHeader, groupByValue,
} from "@portal/components/ui/FilterBar";
import { ScrollAwayHeader } from "@portal/components/ui/ScrollAwayHeader";
import { useGlobalSearch } from "@portal/lib/global-search";
import { portalFolderPath, portalChildFolders } from "@portal/lib/portal-folder-paths";
import { readPortalUrl, portalUrlQuery } from "@portal/lib/portal-url-state";
import { Highlight } from "@portal/components/ui/Highlight";
import { BulkActions, BulkActionMenuItem, type BulkAction } from "@portal/components/ui/BulkActions";
import { Toast, useToast } from "@portal/components/ui/Toast";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@portal/components/ui/dialog";
import { Button } from "@portal/components/ui/button";
import { downloadBlob } from "@portal/lib/export-docx";
import JSZip from "jszip";

// ─── Types ────────────────────────────────────────────────────────────────────


// ─── Main Portal Page ─────────────────────────────────────────────────────────

/** How tall the next-group bar's band is. The real heading has arrived once it
 *  reaches this far up from the foot of the scroller. */
const BAR_BAND = 52;

/** The next group's heading, pinned to the foot of the scroller while you are
 *  inside a long group — and the way into it.
 *
 *  It shows ONLY while the real heading is off screen. Sticky alone was not
 *  enough: at the end of its section the box comes unstuck and lands in flow,
 *  a few pixels above the very heading it stands in for, so the same title
 *  appeared twice. An observer on that heading is what retires the stand-in
 *  the moment the real one arrives.
 *
 *  The sticky box is zero-height and the bar hangs off it, so it costs the
 *  section no layout at all and nothing shifts when it goes. */
function NextGroupBar({
  label, count, noun, scrollerRef, onJump,
}: {
  label: string;
  count: number;
  /** "asset" or "folder" — the folder band is a group like any other. */
  noun: string;
  scrollerRef: RefObject<HTMLDivElement | null>;
  onJump: () => void;
}) {
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    /* The stand-in retires once the real heading reaches the band it occupies
     * — not when the heading first peeks in underneath it, which would show
     * the same title twice. */
    const read = () => {
      const heading = scroller.querySelector(
        `[data-group="${CSS.escape(label)}"] h3`,
      );
      if (!heading) return;
      setArrived(
        heading.getBoundingClientRect().top
          <= scroller.getBoundingClientRect().bottom - BAR_BAND,
      );
    };
    read();

    /* A scroll listener coalesced on a timer, and deliberately NOT an
     * IntersectionObserver: its callbacks ride the frame lifecycle, and this
     * screen has already been caught out twice by work that never runs in a
     * tab the browser is not painting. A timer runs either way. */
    let timer = 0;
    const later = () => {
      if (timer) return;
      timer = window.setTimeout(() => { timer = 0; read(); }, 50);
    };
    scroller.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    return () => {
      scroller.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      if (timer) clearTimeout(timer);
    };
  }, [label, scrollerRef]);

  return (
    <div className="sticky bottom-0 z-20 h-0">
      <div
        className={`absolute inset-x-0 bottom-0 pt-6 pb-2 bg-gradient-to-t from-white via-white to-transparent transition-opacity duration-150 ${
          arrived ? "opacity-0 pointer-events-none" : ""
        }`}
        aria-hidden={arrived}
      >
        <button
          type="button"
          onClick={onJump}
          tabIndex={arrived ? -1 : undefined}
          className="w-full flex items-baseline gap-2 px-2 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition text-left"
        >
          <ChevronDown size={13} className="shrink-0 self-center text-gray-400" />
          <span className="text-sm font-semibold text-gray-800 truncate">{label}</span>
          <span className="shrink-0 text-[11px] text-gray-500 tabular-nums">
            {count.toLocaleString()} {count === 1 ? noun : `${noun}s`}
          </span>
        </button>
      </div>
    </div>
  );
}

/* How many a collapsed card shows is not a number any more — AssetChips
 * rations two ROWS of space and measures what that buys, which differs with
 * the chips' own widths and with the column. */

/** Past this many, a section is long enough that scrolling out of it is worth
 *  a control of its own — see the next-group bar in the grouped grid. */
const LONG_SECTION = 12;

export default function PortalPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  /** Read once, on mount. After that the screen owns the state and the URL
   *  follows it — re-reading would fight the writes below. */
  const fromUrl = useMemo(() => readPortalUrl(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [leftWidth,  setLeftWidth]  = usePersistedPaneSize("pane:left-width",  260);


  // ── Filters ───────────────────────────────────────────────────────────────
  // The funnel swaps the left pane from the folder tree to the filter pane,
  // the way the platform's Portal does. While that pane is open the grid
  // shows every asset in the library rather than the current folder, because
  // filtering across folders is the whole point of opening it.
  // The rail is the folder tree and nothing else — the filters live in the row
  // over the grid, and their full set in the dialog behind More filters.
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [portalFilters, setPortalFilters] = useState<PortalFilters>(fromUrl.filters);
  /** Picked assets, by id. Deliberately independent of the filters: narrowing
   *  the list changes what you can reach, never what you have already chosen,
   *  so clearing a filter hands the earlier picks back rather than dropping
   *  them. */
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  // The platform's search is the only one — the screen no longer keeps a field
  // of its own, and the folder rail's "Find folder" reads from it too.
  const { query: assetSearch, clear: clearSearch } = useGlobalSearch();
  const [assetSort, setAssetSort] = useState(fromUrl.sort);
  /** Ten tiles is two rows at the usual width; the rest are one click away. */
  const [allFoldersShown, setAllFoldersShown] = useState(false);
  /** Which asset the lightbox is showing — the asset, not a boolean, so the
   *  dialog never has to guess which one it opened on. */
  const [detailAsset, setDetailAsset] = useState<PortalAsset | null>(null);
  /** Which card has its chips open, by id. One at a time: the panel overlays
   *  the cards below it, and two of them open would overlap each other. */
  const [chipsOpen, setChipsOpen] = useState<string | null>(null);
  const [assetSortAsc, setAssetSortAsc] = useState(fromUrl.sortAsc);
  const [categorizeBy, setCategorizeBy] = useState(fromUrl.group);
  // ── The library ───────────────────────────────────────────────────────────
  // Real assets come from the platform, through /api/portal-assets. The local
  // generated set is a fallback, but never an automatic one: falling back
  // silently would leave the screen showing invented dealers that look exactly
  // like real ones. When the platform cannot be read, the grid says so and
  // waits for the fallback to be asked for.
  type LibrarySource = "loading" | "live" | "unavailable" | "local";
  const [librarySource, setLibrarySource] = useState<LibrarySource>("loading");
  const [liveAssets, setLiveAssets] = useState<PortalAsset[]>([]);
  const [liveMeta, setLiveMeta] = useState<{ projects: number; folders: number; reason: string }>(
    { projects: 0, folders: 0, reason: "" },
  );
  const [liveFolders, setLiveFolders] = useState<{ name: string; count: number }[]>([]);
  /** What the bulk actions have done to the library this session — moves by
   *  id, and deletions. Prototype-only: the platform is read, never written,
   *  so a reload puts everything back where the platform has it. */
  const [movedTo, setMovedTo] = useState<ReadonlyMap<string, string>>(new Map());
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(new Set());
  /** The platform folder the rail has selected, if any. The tree navigates;
   *  the bar filters. Keeping them apart means picking a folder does not
   *  leave a filter chip behind that has to be found and cleared. */
  const [activeLiveFolder, setActiveLiveFolder] = useState<string | null>(fromUrl.folder);

  /** The chrome over the grid scrolls off with the content and comes back
   *  pinned over it — see ScrollAwayHeader. */
  const gridScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal-assets", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (json.source === "live" && json.assets?.length) {
          // The platform carries fewer fields than the generated set; the ones
          // it does not have simply produce no options, and their filters are
          // left out of the bar.
          setLiveAssets((json.assets as Partial<PortalAsset>[]).map((a) => ({
            sizeKb: 0, componentCount: 0, assetType: "", brand: "",
            fluencyReady: "", holidays: [], offerCount: 0, offerType: "",
            offerTypes: [], textColor: "", usageYears: [],
            ...a,
          }) as PortalAsset));
          setLiveMeta({
            projects: json.projectsRead ?? 0,
            folders: json.folders?.length ?? 0,
            reason: "",
          });
          setLiveFolders(json.folders ?? []);
          setLibrarySource("live");
        } else {
          setLiveMeta({ projects: 0, folders: 0, reason: json.error ?? json.source ?? "no data" });
          setLibrarySource("unavailable");
        }
      } catch (e) {
        if (!cancelled) {
          setLiveMeta({ projects: 0, folders: 0, reason: String(e).slice(0, 120) });
          setLibrarySource("unavailable");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Memoised because deriving the filter vocabularies walks every asset, and
  // a new array identity each render would make that run on every keystroke.
  const library: PortalAsset[] = useMemo(() => {
    const base = librarySource === "live" ? liveAssets
      : librarySource === "local" ? PORTAL_ASSETS
      : [];
    if (movedTo.size === 0 && deletedIds.size === 0) return base;
    return base
      .filter((a) => !deletedIds.has(a.id))
      .map((a) => (movedTo.has(a.id) ? { ...a, folder: movedTo.get(a.id)! } : a));
  }, [librarySource, liveAssets, movedTo, deletedIds]);

  /** The folders the rail lists, always read off the library actually in hand.
   *
   *  The API's list only describes the live library, so when the local one is
   *  in use the rail was describing a set of assets the grid was not showing.
   *  Counting the leaves is what the API route does upstream anyway — the
   *  platform exposes no folder endpoint to this key — so doing it here for
   *  the local library is the same derivation, one step closer to home. */
  const railFolders = useMemo(() => {
    // Live folders arrive flat — the REST API has no hierarchy to give — so
    // each one is placed under the ancestry the platform actually has for it.
    // See lib/portal-folder-paths.ts for where that came from and what it
    // costs (it is a snapshot).
    if (librarySource === "live") {
      return liveFolders.flatMap((f) => [
        { id: f.name, name: portalFolderPath(f.name), count: f.count },
        // The level below, which REST never names — see portalChildFolders.
        // No count: our assets all sit at the dealership, so claiming a number
        // here would be claiming rows we did not read.
        ...portalChildFolders(f.name).map((child) => ({
          id: `${f.name}/${child}`,
          name: `${portalFolderPath(f.name)}/${child}`,
          count: 0,
        })),
      ]);
    }
    const counts = new Map<string, number>();
    for (const a of library) counts.set(a.folder, (counts.get(a.folder) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [librarySource, liveFolders, library]);

  /** The folder narrows before the filters do, so the filter vocabularies and
   *  the "N of M" both describe the folder you are actually looking at. */
  const folderScoped = useMemo(
    () => (activeLiveFolder ? library.filter((a) => a.folder === activeLiveFolder) : library),
    [library, activeLiveFolder],
  );

  const filterOptions = useMemo(() => derivePortalOptions(folderScoped), [folderScoped]);
  /** The span each slider covers. Off the folder-scoped library, not the whole
   *  one, so the handles bracket what is actually in front of you. */
  const rangeBounds = useMemo(() => derivePortalRangeBounds(folderScoped), [folderScoped]);
  /** Recomputed whenever a filter or the search moves — that is the point:
   *  the numbers beside every other option change with each pick. */
  const filterCounts = useMemo(
    () => derivePortalCounts(folderScoped, portalFilters, assetSearch, filterOptions),
    [folderScoped, portalFilters, assetSearch, filterOptions],
  );

  // With 23 filters the bar can only carry a few — these are the ones that
  // earn the room until someone says otherwise.
  const [pinnedFilters, setPinnedFilters] = usePinnedFilters(
    "constellation:portal-pinned-filters:v1",
    ["fileType", "entityType", "brands", "shape", "collection"],
  );

  const filteredAssets = folderScoped
    .filter((a) => matchesPortalFilters(a, portalFilters, assetSearch))
    .sort((a, b) => {
      const dir = assetSortAsc ? 1 : -1;
      switch (assetSort) {
        case "Name":        return dir * a.name.localeCompare(b.name);
        // The pair and not either side of it: 1080 x 1350 is a bigger asset
        // than 1280 x 320, which sorting the label as text would not say.
        case "Dimensions":  return dir * (a.width * a.height - b.width * b.height);
        case "Updated At":
        case "Created At":  return dir * (b.updatedDaysAgo - a.updatedDaysAgo);
        // Every filter is a sort field too, and reads its value off the same
        // table the grouping reads — so the order the sort puts the cards in
        // and the sections the grouping cuts them into cannot disagree.
        default:            return comparePortalBy(a, b, assetSort, assetSortAsc);
      }
    });

  // ── Bulk actions ──────────────────────────────────────────────────────────
  // The selection is wider than the screen on purpose (see `selectedAssets`),
  // so every action works on ALL of it, and the pill says how many of those
  // are not in front of you.
  const [toast, setToast] = useToast(3200);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [moveQuery, setMoveQuery] = useState("");
  const pickedAssets = useMemo(
    () => library.filter((a) => selectedAssets.has(a.id)),
    [library, selectedAssets],
  );
  const shownIds = new Set(filteredAssets.map((a) => a.id));
  const hiddenPicked = pickedAssets.filter((a) => !shownIds.has(a.id)).length;
  const plural = (n: number) => `${n.toLocaleString()} ${n === 1 ? "asset" : "assets"}`;

  async function downloadPicked() {
    const files = pickedAssets.filter((a) => a.url);
    if (files.length === 0) {
      setToast("None of the selected assets has a file to download");
      return;
    }
    setDownloading(true);
    try {
      // One file goes as itself; several go as one zip, because a browser
      // asked for N downloads at once blocks all but the first.
      const fetched = await Promise.all(files.map(async (a) => {
        try {
          const res = await fetch(a.url);
          if (!res.ok) return null;
          return { asset: a, blob: await res.blob() };
        } catch {
          return null;
        }
      }));
      const got = fetched.filter((f): f is { asset: PortalAsset; blob: Blob } => f !== null);
      if (got.length === 0) {
        setToast(`Couldn't read ${files.length === 1 ? "the file" : "any of the files"}`);
        return;
      }
      const fileName = (a: PortalAsset) => {
        const ext = a.url.split("?")[0].split(".").pop() ?? a.fileType.toLowerCase();
        return a.name.toLowerCase().endsWith(`.${ext.toLowerCase()}`) ? a.name : `${a.name}.${ext}`;
      };
      if (got.length === 1) {
        downloadBlob(got[0].blob, fileName(got[0].asset));
      } else {
        const zip = new JSZip();
        const used = new Map<string, number>();
        for (const { asset, blob } of got) {
          // Two assets can share a name; a zip silently keeps only the last.
          const name = fileName(asset);
          const n = used.get(name) ?? 0;
          used.set(name, n + 1);
          zip.file(n === 0 ? name : name.replace(/(\.[^.]*)?$/, ` (${n})$1`), blob);
        }
        downloadBlob(await zip.generateAsync({ type: "blob" }), `${plural(got.length).replace(/[ ,]/g, "-")}.zip`);
      }
      const missed = selectedAssets.size - got.length;
      setToast(missed > 0
        ? `Downloaded ${got.length.toLocaleString()} of ${plural(selectedAssets.size)} — ${missed.toLocaleString()} couldn't be read`
        : `Downloaded ${plural(got.length)}`);
    } finally {
      setDownloading(false);
    }
  }

  function movePicked(folder: string) {
    setMovedTo((prev) => {
      const next = new Map(prev);
      for (const id of selectedAssets) next.set(id, folder);
      return next;
    });
    // The moved assets stay picked: a bulk action never drops the selection
    // (only a delete does, with nothing left to pick).
    setToast(`Moved ${plural(selectedAssets.size)} to ${folder.split("/").pop()}`);
  }

  function deletePicked() {
    const n = selectedAssets.size;
    setDeletedIds((prev) => new Set([...prev, ...selectedAssets]));
    setSelectedAssets(new Set());
    setConfirmDelete(false);
    setToast(`Deleted ${plural(n)}`);
  }

  /** Folders that hold assets — the only places an asset can be moved to. */
  const moveTargets = railFolders
    .filter((f) => f.count > 0)
    .map((f) => ("id" in f ? f.id : f.name) as string);

  const notYet = (label: string) => () => setToast(`${label} isn't wired up yet`);
  const bulkActions: BulkAction[] = [
    { id: "create", label: "Create Assets", icon: Images, onClick: notYet("Create Assets") },
    {
      id: "download", label: downloading ? "Downloading…" : "Download", icon: Download,
      disabled: downloading, onClick: downloadPicked,
    },
    {
      id: "move", label: "Move to Folder", icon: FolderInput,
      menu: (close) => {
        const q = moveQuery.trim().toLowerCase();
        const targets = moveTargets.filter((f) => !q || f.toLowerCase().includes(q));
        return (
          <>
            <div className="px-3 pb-1.5">
              <input
                autoFocus
                value={moveQuery}
                onChange={(e) => setMoveQuery(e.target.value)}
                placeholder="Find folder"
                className="w-full h-8 px-2.5 text-[12px] rounded-lg border border-gray-200 outline-none focus:border-indigo-600"
              />
            </div>
            {targets.length === 0 ? (
              <p className="px-4 py-2 text-[12px] text-gray-400">No folder matches</p>
            ) : targets.map((f) => (
              <BulkActionMenuItem
                key={f}
                icon={Folder}
                onClick={() => { movePicked(f); setMoveQuery(""); close(); }}
              >
                {f.split("/").pop()}
              </BulkActionMenuItem>
            ))}
          </>
        );
      },
    },
    { id: "enhance", label: "AI Enhance", icon: WandSparkles, iconOnly: true, onClick: notYet("AI Enhance") },
    { id: "edit", label: "Edit Variables", icon: Pencil, iconOnly: true, onClick: notYet("Edit Variables") },
    { id: "copy", label: "Create a Copy", icon: Copy, iconOnly: true, onClick: notYet("Create a Copy") },
    { id: "delete", label: "Delete", icon: Trash2, iconOnly: true, onClick: () => setConfirmDelete(true) },
  ];

  // Mirror the shareable view into the query string, so copying the address bar
  // is all it takes to hand someone this folder with these filters already set —
  // and so a bookmark reopens it. Debounced because dragging a range slider
  // fires on every frame and each one would otherwise be its own replace.
  //
  // `replace` rather than `push`: a filter is not a place you navigated to, and
  // pushing would make Back undo one chip at a time instead of leaving the
  // screen.
  useEffect(() => {
    const t = setTimeout(() => {
      const query = portalUrlQuery({
        folder: activeLiveFolder,
        filters: portalFilters,
        sort: assetSort,
        sortAsc: assetSortAsc,
        group: categorizeBy,
      });
      navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
    }, 200);
    return () => clearTimeout(t);
  }, [activeLiveFolder, portalFilters, assetSort, assetSortAsc, categorizeBy, navigate, pathname]);

  /** Where you are, from the Portal down. Every crumb but the last walks back
   *  to that level — which is the only way out of a folder three deep besides
   *  hunting for its parent in the rail. */
  const breadcrumb = useMemo(() => {
    const trail: { label: string; id: string | null }[] = [{ label: "Portal", id: null }];
    if (!activeLiveFolder) return trail;
    let path = "";
    for (const segment of portalFolderPath(activeLiveFolder).split("/")) {
      path = path ? `${path}/${segment}` : segment;
      // A crumb selects what the rail would select for that row: the flat name
      // the library addresses a folder by, or the path itself for a level that
      // is only a common prefix.
      const match = railFolders.find((f) => f.name === path) as { id?: string } | undefined;
      trail.push({ label: segment, id: match?.id ?? path });
    }
    return trail;
  }, [activeLiveFolder, railFolders]);

  /** Picked values this folder has never heard of.
   *
   *  Each filter's vocabulary is derived from the folder in front of you, so a
   *  value chosen in one folder can travel into another that has nothing of
   *  the kind — and then narrows it to nothing while looking like the folder is
   *  simply empty. These are the ones worth naming when that happens. */
  const strandedPicks = useMemo(() => {
    const out: { field: string; label: string; value: string }[] = [];
    for (const [field, picked] of Object.entries(portalFilters)) {
      if (!Array.isArray(picked)) continue;
      const available: readonly string[] = filterOptions[field as keyof typeof filterOptions] ?? [];
      for (const value of picked) {
        if (!available.includes(value)) {
          out.push({
            field,
            label: PORTAL_FILTER_LABELS[field as keyof typeof PORTAL_FILTER_LABELS] ?? field,
            value,
          });
        }
      }
    }
    return out;
  }, [portalFilters, filterOptions]);

  /** Drop exactly those, leaving every other filter where it was — the whole
   *  point is not having to clear the lot. */
  function dropStrandedPicks() {
    const next = { ...portalFilters };
    for (const { field, value } of strandedPicks) {
      const key = field as keyof typeof next;
      const picked = next[key];
      if (Array.isArray(picked)) {
        (next as unknown as Record<string, string[]>)[field] = picked.filter((v) => v !== value);
      }
    }
    setPortalFilters(next);
  }

  /** The folders inside the one the rail has selected.
   *
   *  A folder that holds folders is not empty, and the grid used to show it as
   *  though it were: our assets all sit at the dealership level, so opening the
   *  level below it drew nothing at all. They are drawn as cards, the way a
   *  file browser does, so a folder always shows what it contains. */
  const childFolderCards = useMemo(() => {
    if (!activeLiveFolder) return [];
    const prefix = `${portalFolderPath(activeLiveFolder)}/`;
    const direct = railFolders.filter(
      (f) => f.name.startsWith(prefix) && !f.name.slice(prefix.length).includes("/"),
    );
    const rows = direct.map((f) => ({
      id: (f as { id?: string }).id ?? f.name,
      label: f.name.slice(prefix.length),
      items: f.count,
      // What each of them holds in turn, so a tile can say "1 subfolder"
      // rather than making you open it to find out.
      subfolders: railFolders.filter(
        (g) => g.name.startsWith(`${f.name}/`) && !g.name.slice(f.name.length + 1).includes("/"),
      ).length,
    }));
    // Alphabetical, with no control of its own: a folder list is read by name,
    // and the row above already carries the sort for what is in the grid.
    return rows.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [activeLiveFolder, railFolders]);

  /** Categorize By names a filter; the grid is cut into one section per value
   *  of it. Assets carrying no value at all end in a trailing section rather
   *  than dropping out of the grid.
   *
   *  Cut from the WHOLE filtered library, never from a capped slice of it.
   *  The cap used to come first, and the grouping ran on whatever 120 assets
   *  survived it — so changing the sort changed which 120 those were, and
   *  with them how many assets each group appeared to hold. Grouped by Brands
   *  at the root, Name descending showed two groups (BMW 115, No Brands 5) and
   *  Name ascending showed six (BMW 90, Audi 3, Volkswagen 10 …). Whole brands
   *  appeared and vanished with the sort.
   *
   *  The group is sovereign: it holds what belongs to it, and the sort only
   *  decides the order of the cards inside it. */
  const assetSections = isPortalField(categorizeBy)
    ? groupByValue(
        filteredAssets,
        (a) => portalValueOf(a, categorizeBy),
        `No ${categorizeBy}`,
      )
    : null;

  /** Scroll a group's heading to the top of the grid, clearing whatever the
   *  scroll-away header is currently covering it with. `scrollIntoView` cannot
   *  be used here: it would put the heading under that header. */
  const scrollToGroup = (label: string) => {
    const scroller = gridScrollerRef.current;
    if (!scroller) return;

    /** Where the group would have to sit for its heading to clear the chrome.
     *  Measured fresh each time, because the scroll itself moves the goalposts:
     *  going down sends the scroll-away header away, which takes its height out
     *  of the layout and shifts every section up by it. */
    const distance = () => {
      const target = scroller.querySelector<HTMLElement>(
        `[data-group="${CSS.escape(label)}"]`,
      );
      if (!target) return 0;
      const chrome = parseFloat(
        getComputedStyle(scroller).getPropertyValue("--chrome-offset"),
      ) || 0;
      return target.getBoundingClientRect().top
        - scroller.getBoundingClientRect().top - chrome;
    };

    /* Smooth only for a hop you can follow with your eyes. Skipping a group of
     * two thousand assets is 800,000px, and animating that is either a long
     * blur or — in a tab the browser is not painting — no movement at all,
     * since the animation is driven by frames that never come. */
    const first = distance();
    const far = Math.abs(first) > scroller.clientHeight * 3;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      top: scroller.scrollTop + first,
      behavior: far || still ? "auto" : "smooth",
    });

    /* One correction pass, for the header that left on the way down. A timer
     * rather than a frame: this screen has already been caught out by rAF
     * never firing in a tab the browser is not painting. */
    if (far || still) {
      setTimeout(() => {
        const left = distance();
        if (Math.abs(left) > 2) scroller.scrollTop += left;
      }, 60);
    }
  };

  /** What the grouped grid draws, in order: the folders this one holds, then
   *  one section per value of the field named by Categorize By. `assets` is
   *  what marks a section as a grid of cards rather than the folder band. */
  const groupedSections = assetSections && [
    ...(childFolderCards.length > 0
      ? [{ label: "Folders", count: childFolderCards.length, noun: "folder", assets: null }]
      : []),
    ...assetSections.map((section) => ({
      label: section.label,
      count: section.items.length,
      noun: "asset",
      assets: section.items,
    })),
  ];

  /** Why there is nothing here, in the three ways it can be true.
   *
   *  A folder that holds nothing and a folder emptied by something you set
   *  elsewhere look identical, and the second is the one that reads as the app
   *  being broken. Each case says which it is, and the two that are somebody's
   *  doing offer the way out.
   *
   *  Keyed off the ASSETS being empty rather than the grid: a folder with
   *  subfolders still has cards to draw, so a grid-level check never fires
   *  where it is needed most. */
  const emptyNotice = filteredAssets.length > 0 ? null : (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400 text-center">
      <ImageIcon size={32} className="opacity-30" />

      {strandedPicks.length > 0 ? (
        // Narrowed to nothing by a pick this folder has never heard of.
        <>
          <p className="text-sm font-medium text-gray-500">
            Nothing here matches{" "}
            {strandedPicks.map((pick, i) => (
              <Fragment key={`${pick.field}:${pick.value}`}>
                {i > 0 && (i === strandedPicks.length - 1 ? " and " : ", ")}
                <span className="text-gray-700">{pick.label} {pick.value}</span>
              </Fragment>
            ))}
            .
          </p>
          <p className="text-[12px] max-w-[46ch]">
            {strandedPicks.length === 1 ? "That filter" : "Those filters"} came from
            another folder — this one has no assets like that.
          </p>
          <button
            type="button"
            onClick={dropStrandedPicks}
            className="mt-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            {strandedPicks.length === 1
              ? `Remove ${strandedPicks[0].label} ${strandedPicks[0].value}`
              : "Remove them and keep the rest"}
          </button>
        </>
      ) : hasAnyPortalFilter(portalFilters, assetSearch) ? (
        // Narrowed to nothing by filters that do belong here.
        <>
          <p className="text-sm font-medium text-gray-500">
            No assets here match the filters.
          </p>
          <p className="text-[12px] max-w-[46ch]">
            This folder holds {folderScoped.length.toLocaleString()}{" "}
            {folderScoped.length === 1 ? "asset" : "assets"} — none of them match what is
            set.
          </p>
          <button
            type="button"
            onClick={() => { setPortalFilters(EMPTY_PORTAL_FILTERS); clearSearch(); }}
            className="mt-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            Clear the filters
          </button>
        </>
      ) : (
        // Genuinely empty. Nothing to undo, so nothing is offered.
        <p className="text-sm font-medium text-gray-500">This folder contains no assets.</p>
      )}
    </div>
  );

  /** The Folders band above the grid, in the platform's own shape: a compact
   *  tile per folder rather than an asset-sized card, five across, with the
   *  rest behind one click. A folder is a different kind of thing from an
   *  asset and a square thumbnail of a folder icon says nothing — the tile
   *  spends its room on what you actually choose by: the name, what is in it,
   *  and whether it goes deeper. */
  const folderTiles = childFolderCards.length > 0 && (
    <div>

      {/* The same grid the asset cards use, so a folder sits in the same
        * column as the card under it and the two bands reflow together as the
        * pane resizes. CardViewVertical owns those numbers — going through it
        * is what keeps them from drifting apart. */}
      <CardViewVertical>
        {(allFoldersShown ? childFolderCards : childFolderCards.slice(0, 10)).map((folder) => (
          <button
            key={`folder:${folder.id}`}
            type="button"
            onClick={() => setActiveLiveFolder(folder.id)}
            className="flex items-center gap-3 text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition"
          >
            <Folder size={18} className="shrink-0 text-indigo-400" />
            <span className="min-w-0">
              <span className="block text-[13px] text-gray-900 leading-snug">
                <Highlight text={folder.label} query={assetSearch} />
                {folder.items > 0 && (
                  <span className="text-gray-400"> ({folder.items})</span>
                )}
              </span>
              {folder.subfolders > 0 && (
                <span className="block text-[11px] text-gray-500 mt-0.5">
                  {folder.subfolders} subfolder{folder.subfolders === 1 ? "" : "s"}
                </span>
              )}
            </span>
          </button>
        ))}
      </CardViewVertical>

      {childFolderCards.length > 10 && (
        /* Expanded, the way out sticks to the bottom of the scroller. With 126
          * tiles open the collapse sat several screens down, which made the
          * expand a one-way door unless you scrolled back for it. Collapsed
          * there is nothing to escape from, so it rides with the content. */
        <div
          className={
            allFoldersShown
              ? "sticky bottom-0 z-10 pt-3 pb-2 bg-gradient-to-t from-white via-white to-transparent"
              : "mt-3"
          }
        >
          <button
            type="button"
            onClick={() => setAllFoldersShown((v) => !v)}
            className="mx-auto flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            {allFoldersShown
              ? "Show fewer"
              : `Show all ${childFolderCards.length.toLocaleString()} folders`}
            <ChevronDown
              size={13}
              className={`transition-transform ${allFoldersShown ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}
    </div>
  );

  /** One asset card — the shared PortalAssetCard, which a signal-driven
   *  project's Assets task draws too. Written once here because the grid draws
   *  it either flat or inside a section, and two copies of it would drift. */
  const assetCard = (asset: PortalAsset) => (
    <PortalAssetCard
      key={asset.id}
      asset={asset}
      query={assetSearch}
      onOpen={() => setDetailAsset(asset)}
      selected={selectedAssets.has(asset.id)}
      onSelect={(checked) =>
        setSelectedAssets((prev) => {
          const next = new Set(prev);
          if (checked) next.add(asset.id);
          else next.delete(asset.id);
          return next;
        })
      }
      chipsOpen={chipsOpen === asset.id}
      onChipsToggle={(next) => setChipsOpen(next ? asset.id : null)}
      isChipActive={(c) => (portalFilters[c.field] ?? []).includes(c.text)}
      onChipPick={(c) =>
        setPortalFilters((prev) => {
          const picked = prev[c.field] ?? [];
          return {
            ...prev,
            [c.field]: picked.includes(c.text)
              ? picked.filter((v) => v !== c.text)
              : [...picked, c.text],
          };
        })
      }
      /* Only in Recents, which is the one view where the cards come from
       * different folders. Inside a folder every card is from it, and the line
       * would repeat the page's own title once per card. */
      onFolder={activeLiveFolder ? undefined : () => setActiveLiveFolder(asset.folder)}
    />
  );

  /** Recents is the whole asset library, and the filters narrow it. It used to
   *  be shown only while the filter pane was open, which meant opening the
   *  pane swapped one library (6 collections) for another (326 assets) and the
   *  count jumped. One library, one count. */
  const showingLibrary = true;

  const filterRow = (
    <PortalFilterPanel
      bounds={rangeBounds}
      filters={portalFilters}
      options={filterOptions}
      counts={filterCounts}
      search={assetSearch}
      sortField={assetSort}
      sortAsc={assetSortAsc}
      categorizeBy={categorizeBy}
      pinned={pinnedFilters}
      onFilters={setPortalFilters}
      onSortField={setAssetSort}
      onToggleSortDir={() => setAssetSortAsc((a) => !a)}
      onCategorizeBy={setCategorizeBy}
      onClear={() => { setPortalFilters(EMPTY_PORTAL_FILTERS); clearSearch(); }}
      onPinnedChange={setPinnedFilters}
    />
  );

  // ── Breadcrumb ────────────────────────────────────────────────────────────
  /** Where you are, in one name. It replaced a Portal › Folder › Collection
   *  trail on the right of the toolbar: with the folder tree one click away on
   *  the left, the trail spent three words saying what one says, and said it
   *  at the far end of the row from the control that changes it. */
  function currentFolderName(): string {
    // The last segment only. A folder below a dealership is addressed as
    // "Audi Concord/Audi Concord", which is the path and not the name — the
    // trail above already says the rest of it.
    if (activeLiveFolder) return activeLiveFolder.split("/").pop() ?? activeLiveFolder;
    return "Recents";
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden p-2 bg-[#f0f2f4]">

          {/* ── Left pane: the filter pane when it is open, otherwise the
               folder tree — and nothing at all when neither is wanted. ── */}
          {foldersOpen && (
          <div
            style={{ width: leftWidth }}
            className="shrink-0 rounded-2xl overflow-hidden bg-white flex flex-col"
          >
            {(
              <PortalFolderTree
                onClose={() => setFoldersOpen(false)}
                liveFolders={railFolders}
                activeLiveFolder={activeLiveFolder}
                onSelectLiveFolder={setActiveLiveFolder}
              />
            )}
          </div>
          )}

          {/* Resize handle between left pane and main */}
          {foldersOpen && (
            <PaneResizeHandle side="left" size={leftWidth} onResize={setLeftWidth} />
          )}

        {/* ── Main pane ── */}
        <main className="flex-1 min-w-0 rounded-2xl bg-white flex flex-col overflow-hidden">

          {/* The chrome scrolls off with the content and comes back pinned
            * over it — see ScrollAwayHeader. It lives inside the scroller for
            * exactly that reason: kept outside, showing it again changed the
            * scroller's height and shunted the row you were reading. */}
          <div ref={gridScrollerRef} className="flex-1 overflow-y-auto">
            <ScrollAwayHeader scrollerRef={gridScrollerRef}>
            {/* Toolbar. It wraps for the same reason the filter row does: when
              * the pane is too narrow to hold the right-hand trio beside New,
              * they drop to a second line rather than running off the edge. */}
            <div className="shrink-0">

            {/* The trail above the name, so a folder three levels down says
              * where it sits and offers the way back up. Hidden at the root,
              * where "Portal" alone would be a crumb to nowhere. */}
            {breadcrumb.length > 1 && (
              <nav
                aria-label="Breadcrumb"
                /* One line, always. The crumbs are flat children of the flex
                  * row rather than each wrapped in a box, which is what lets
                  * the middle ones shrink on their own. Clipped rather than
                  * scrolled: hovering a shortened crumb lets it have its full
                  * width back, and what that pushes off the right-hand end is
                  * meant to go. */
                className="flex items-center gap-1.5 px-5 pt-3 text-[12px] min-w-0 overflow-hidden"
              >
                {breadcrumb.map((crumb, i) => {
                  const last = i === breadcrumb.length - 1;
                  /* The ends keep their full text: the first says where the
                   * trail starts and the last is where you are. Everything
                   * between shortens instead — a trail that swapped its middle
                   * for one ellipsis would stop saying how deep you are, and
                   * depth is most of what a breadcrumb is for. A shortened
                   * name still counts as a level. */
                  const edge = i === 0 || last;
                  return (
                    <Fragment key={`${crumb.id ?? "root"}:${i}`}>
                      {i > 0 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
                      {last ? (
                        /* Same weight and colour as the rest: the trail is one
                          * line of text, and `aria-current` already says which
                          * end of it you are at for anyone who cannot see it. */
                        <span
                          aria-current="page"
                          className="shrink-0 whitespace-nowrap text-gray-500"
                        >
                          {crumb.label}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveLiveFolder(crumb.id)}
                          title={edge ? undefined : crumb.label}
                          /* A shortened crumb opens on hover: flex-shrink
                            * goes 1 → 0 over 300ms, which the browser
                            * interpolates as width, so the crumb grows into
                            * its own text and walks the ones after it off the
                            * end rather than wrapping. */
                          className={`text-left text-gray-500 hover:text-gray-800 ${
                            edge
                              ? "shrink-0 whitespace-nowrap transition-colors"
                              : "min-w-[3rem] truncate hover:shrink-0 [transition:flex-shrink_300ms,color_150ms]"
                          }`}
                        >
                          {crumb.label}
                        </button>
                      )}
                    </Fragment>
                  );
                })}
              </nav>
            )}

            {/* 10px above and 2px below: the trail and the title are one
              * block, and the filters read as the next thing rather than a
              * separate band. */}
            <div className="flex flex-wrap items-center gap-2 px-5 pt-2.5 pb-0.5">

              {/* Folders toggle — the platform's Portal opens this row with it. */}
              {/* No filled state while the panel is open: the panel itself is
                * the answer to "is it open", sitting right beside this, and a
                * grey square behind the icon only competed with it. The `pane`
                * button is this control, made the pattern for every pane icon. */}
              <Button
                variant="pane"
                size="icon-sm"
                onClick={() => setFoldersOpen((o) => !o)}
                title={foldersOpen ? "Hide Folders panel" : "Show Folders panel"}
                aria-label="Toggle Folders panel"
                aria-pressed={foldersOpen}
              >
                <Folder className="size-3.5" />
              </Button>

              {/* Where you are — beside the control that changes it. */}
            {/* Same type as the Folders heading across the gap — the two name
              * the two halves of the screen and were a pixel apart, which read
              * as an accident rather than a hierarchy. */}
            <span className="text-sm font-semibold text-gray-800 truncate shrink min-w-0">
              {currentFolderName()}
            </span>

            {/* New, or — once anything is picked — the bulk actions in its
              * place. One slot, two states: see components/ui/BulkActions. */}
              {/* Fills the free space so the pill can tell how much room it
                * has — it folds rather than wrap the row (BulkActions). */}
              <div className="relative min-w-0 flex-1 flex">
                <BulkActions
                  count={selectedAssets.size}
                  hidden={hiddenPicked}
                  onClear={() => setSelectedAssets(new Set())}
                  actions={bulkActions}
                  primary={{
                    label: "New",
                    onClick: notYet("New"),
                  }}
                />
              </div>

              {/* Count + view toggle, at the end of the row the filter bar used
                * to have to itself. */}
              {/* The right-hand end of the row, as one piece: it carries the
                * auto margin that puts it there, and when the pane is too
                * narrow the three wrap together rather than splitting up. */}
              <div className="ml-auto shrink-0 flex items-center gap-2">
                {showingLibrary && (
                  <FilterSelectAll
                    visible={filteredAssets.map((a) => a.id)}
                    selected={selectedAssets}
                    onChange={setSelectedAssets}
                    narrowed={hasAnyPortalFilter(portalFilters, assetSearch)}
                  />
                )}
                <span className="text-xs text-gray-400 shrink-0">
                  {showingLibrary
                    ? `${filteredAssets.length.toLocaleString()} of ${folderScoped.length.toLocaleString()} assets`
                    : ""}
                </span>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 transition ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <LayoutGrid size={13} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 transition ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>


            </div>
            </div>

            {/* No banner for Recents. Two things already say it, and they say
              * it where the reader is looking: Recents is the row selected in
              * the rail, and every card carries its own folder — which is the
              * line a card shows ONLY here, for exactly this reason. A
              * sentence across the top repeated what the screen had covered.
              * (`RecentsNotice` is still used by the background picker, where
              * the cards carry no folder.) */}

            {/* Grid */}
            {showingLibrary && (
              <>
                {/* Only the sample library announces itself. Live data is the
                  * normal case and needs no banner; the generated set does,
                  * because its dealers and brands read exactly like real ones. */}
                {librarySource === "local" && (
                  <div className="flex items-center gap-2 mx-5 mt-4 px-3 py-2 rounded-lg border bg-amber-50 border-amber-100 text-amber-800 text-[12px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500" />
                    <span>
                      <strong className="font-semibold">Local sample library</strong>
                      {" — "}
                      {PORTAL_ASSETS.length.toLocaleString()} generated assets. The dealers,
                      brands and tags here are invented.
                    </span>
                    <button
                      onClick={() => setLibrarySource("unavailable")}
                      className="ml-auto text-[12px] font-medium text-amber-900 hover:underline shrink-0"
                    >
                      Back
                    </button>
                  </div>
                )}
                <div className="shrink-0">{filterRow}</div>
              </>
            )}
            </ScrollAwayHeader>

            <div className="p-5">
              {showingLibrary && librarySource !== "live" && librarySource !== "local" ? (
                /* ── Nothing loaded yet, or the platform could not be read ──
                 * The fallback is a decision, not a default: the generated set
                 * looks exactly like the real one, so switching to it silently
                 * would leave no way to tell which is on screen. */
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                  {librarySource === "loading" ? (
                    <>
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-indigo-500 animate-spin" />
                      <p className="text-[13px] text-gray-500">Reading the platform library…</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-1">
                        <ImageIcon size={26} className="text-amber-400" />
                      </div>
                      <p className="text-[14px] font-semibold text-gray-700">
                        Couldn&apos;t read the platform library
                      </p>
                      <p className="text-[12px] text-gray-400 max-w-[320px] leading-relaxed">
                        {liveMeta.reason === "unconfigured"
                          ? "No platform credentials are configured for this environment."
                          : `The API answered: ${liveMeta.reason}`}
                      </p>
                      <button
                        onClick={() => setLibrarySource("local")}
                        className="flex items-center gap-1.5 mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-medium rounded-lg transition"
                      >
                        Use the local sample library
                      </button>
                      <p className="text-[11px] text-gray-400 max-w-[320px] leading-relaxed">
                        {PORTAL_ASSETS.length.toLocaleString()} generated assets with invented
                        metadata — for exercising the filters, not for reading as real.
                      </p>
                    </>
                  )}
                </div>
              ) : showingLibrary ? (
                /* ── Filtered library ──
                 * The filter pane reaches across folders, so while it is open
                 * the grid shows the whole library narrowed by it, not the
                 * folder the tree had selected. */
                filteredAssets.length === 0 && childFolderCards.length === 0 ? (
                  emptyNotice
                ) : groupedSections ? (
                  /* One section per value of the filter named by Categorize
                   * By, in the same shape the platform uses: the value on the
                   * left, how many cards carry it on the right, a hairline
                   * under both.
                   *
                   * Folders come first, as a group of their own. They used to
                   * be drawn only on the ungrouped path, so turning grouping on
                   * made a folder's subfolders VANISH — the one thing a grid
                   * must never do to what it contains. Grouped or not, folders
                   * before files is the order every file browser uses; what
                   * changes under grouping is that they are a named, counted
                   * section like the rest. */
                  <div className="flex flex-col gap-8">
                    {groupedSections.map((section, i) => {
                      const next = groupedSections[i + 1];
                      const bar = next && section.count > LONG_SECTION && (
                        /* The way out of a group of two thousand is past it,
                         * not a collapse that hides what you came to see. */
                        <NextGroupBar
                          label={next.label}
                          count={next.count}
                          noun={next.noun}
                          scrollerRef={gridScrollerRef}
                          onJump={() => scrollToGroup(next.label)}
                        />
                      );
                      return (
                      <section key={section.label} data-group={section.label}>
                        <FilterSectionHeader
                          /* The count is the group's own size, not how many of
                           * it are drawn: it is what tells you the sort did not
                           * move assets between groups. */
                          label={section.label}
                          count={section.count}
                          noun={section.noun}
                          sticky
                          action={
                            section.assets && (
                              <FilterSelectAll
                                visible={section.assets.map((a) => a.id)}
                                selected={selectedAssets}
                                onChange={setSelectedAssets}
                                narrowed
                                scopeLabel="group"
                              />
                            )
                          }
                        />
                        {section.assets ? (
                          <WindowedCardGrid
                            items={section.assets}
                            renderItem={assetCard}
                            scrollerRef={gridScrollerRef}
                          />
                        ) : (
                          /* The folder band, which pages itself rather than
                           * windowing — it is ten tiles until you ask for the
                           * rest. No select-all: a folder is not an asset and
                           * "Select group" would promise something the toolbar
                           * cannot act on. */
                          folderTiles
                        )}
                        {bar}
                      </section>
                      );
                    })}
                  </div>
                ) : (
                  /* Folders first, then what is loose in this one — the order
                   * every file browser uses. */
                  <>
                    <div className="mb-6">{folderTiles}</div>
                    {emptyNotice}
                    <WindowedCardGrid
                      items={filteredAssets}
                      renderItem={assetCard}
                      scrollerRef={gridScrollerRef}
                    />
                  </>
                )
              ) : null}
            </div>
          </div>
        </main>

      <AssetDetailsDialog
        asset={detailAsset}
        isVideo={isVideo}
        onOpenChange={(open) => { if (!open) setDetailAsset(null); }}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {plural(selectedAssets.size)}?</DialogTitle>
            <DialogDescription>
              {hiddenPicked > 0
                ? `${hiddenPicked.toLocaleString()} of them ${hiddenPicked === 1 ? "is" : "are"} not on screen — hidden by the current folder, filters or search. They are deleted too.`
                : "They are removed from every folder and project that uses them."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="error" onClick={deletePicked}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && <Toast message={toast} />}
    </div>
  );
}

