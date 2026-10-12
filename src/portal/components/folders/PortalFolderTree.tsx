
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Plus, Clock, ChevronRight, ChevronDown,
  Folder, MoreVertical, Pencil, FolderInput, Trash2,
} from "lucide-react";
import { Button } from "@portal/components/ui/button";
import { BulkActionMenuItem } from "@portal/components/ui/BulkActions";
import { Highlight } from "@portal/components/ui/Highlight";
import { useGlobalSearch, matchesQuery } from "@portal/lib/global-search";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PortalFolderTreeProps {
  /** Set while the folders have no say (the grid is showing only the
   *  selection): the list greys out and ignores clicks but still scrolls, and
   *  this is its tooltip. The header — Close, New Folder — keeps working. */
  disabledReason?: string;
  /** Dismisses the pane, from the X in the header. */
  onClose?: () => void;
  /** The platform's own folders, derived from the assets it returned. Listed
   *  above the prototype's folders and separated from them, so it is always
   *  clear which half of the tree is real. */
  liveFolders?: { name: string; count: number }[];
  activeLiveFolder?: string | null;
  onSelectLiveFolder?: (name: string | null) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** The height of one line of a folder label. The caret and the icon are
 *  centred in a box this tall, which is what keeps them on the FIRST line of a
 *  name that wraps rather than on the middle of the pair. */
const LINE = "h-[18px]";

/** One step of nesting, and where the first level starts — the chevron and the
 *  icon take that much before the label begins, so a child sits under its
 *  parent's NAME rather than under its chevron. The step is wide enough that
 *  two levels read apart at a glance in a 240px rail. */
const INDENT_BASE = 8;
const INDENT_STEP = 26;
/** Where the guide line falls inside a step — under the parent's chevron, so
 *  it reads as the branch the children hang from. */
const GUIDE_OFFSET = 7;

/** The hairline down a branch, joining a parent to the rows under it. Drawn as
 *  an absolutely placed rule rather than a border on the container, so the
 *  rows keep their own indentation arithmetic and the line can sit inside the
 *  step instead of at its edge. */
function BranchGuide({ depth }: { depth: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0 bottom-0 w-px bg-gray-200"
      style={{ left: INDENT_BASE + depth * INDENT_STEP + GUIDE_OFFSET }}
    />
  );
}

/** Whether a folder row survives the platform search.
 *
 *  The pane narrows, like every other surface that used to carry a field of its
 *  own: a folder whose name does not match is not listed. Everything survives
 *  when nothing is typed, so this is a no-op until someone searches. */
function folderMatches(label: string, query: string) {
  return !query.trim() || matchesQuery(label, query);
}

/** A row's kebab: hidden until the row is hovered (or the kebab is focused or
 *  open), and laid OVER the row's right end rather than given a column of its
 *  own — a reserved slot would truncate every name in the tree by its width
 *  just in case. It sits on a fade in the row's own colour, so whatever it
 *  covers at that moment goes under it cleanly, and nothing moves when it
 *  appears.
 *
 *  The menu is portalled and fixed: the rail scrolls, and a menu positioned
 *  inside it would be clipped by it. It closes on any scroll, since a fixed
 *  menu would otherwise stay put while its row moved away.
 *
 *  MOCK — the three actions do nothing yet; they are here to show the menu. */
/** The menu's height: three 36px items and its 6px padding top and bottom. */
const MENU_H = 3 * 36 + 12;

function RowMenu({ label, active }: { label: string; active: boolean }) {
  const [at, setAt] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const open = at !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setAt(null);
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !button.current?.contains(t)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { close(); button.current?.focus(); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function toggle() {
    if (open) return setAt(null);
    const r = button.current!.getBoundingClientRect();
    const right = window.innerWidth - r.right;
    // Below the kebab, unless that runs past the foot of the window — the rail
    // reaches the bottom of the screen, so its last rows would open off it.
    setAt(r.bottom + 4 + MENU_H > window.innerHeight - 8
      ? { bottom: window.innerHeight - r.top + 4, right }
      : { top: r.bottom + 4, right });
  }

  const pick = () => setAt(null);
  const fade = active
    ? "from-indigo-50 via-indigo-50"
    : "from-white via-white group-hover/row:from-gray-50 group-hover/row:via-gray-50";

  return (
    <span
      /* The row navigates on click; nothing in here should. That includes the
       * portalled menu — React bubbles a portal's events through its owner. */
      onClick={(e) => e.stopPropagation()}
      className={`absolute right-1 top-1 bottom-1 flex items-center pl-4 rounded-r-lg bg-gradient-to-l via-70% to-transparent ${fade} transition-opacity ${
        open ? "opacity-100" : "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100"
      }`}
    >
      <Button
        ref={button}
        variant="neutral"
        size="icon-xs"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <MoreVertical />
      </Button>
      {at && createPortal(
        <div
          ref={menu}
          role="menu"
          aria-label={label}
          style={{ top: at.top, bottom: at.bottom, right: at.right }}
          className="fixed z-50 min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5"
        >
          <BulkActionMenuItem icon={Pencil} onClick={pick}>Rename</BulkActionMenuItem>
          <BulkActionMenuItem icon={FolderInput} onClick={pick}>Move to…</BulkActionMenuItem>
          <BulkActionMenuItem icon={Trash2} onClick={pick}>Delete</BulkActionMenuItem>
        </div>,
        document.body,
      )}
    </span>
  );
}

function FolderItem({
  icon,
  label,
  count,
  active = false,
  indent = false,
  depth = 0,
  caretSlot = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  indent?: boolean;
  /** Hold the space a caret would take, so a folder with children and one
   *  without line up — their icons fall on the same diagonal instead of the
   *  childless ones sliding a caret's width to the left. */
  caretSlot?: boolean;
  /** How deep in the tree, so the row lines up under its own branch. `indent`
   *  is the older one-step version, kept for the hand-written groups. */
  depth?: number;
  onClick?: () => void;
}) {
  const { query } = useGlobalSearch();
  // The folder you are standing in stays listed whatever you type. A tree that
  // hides where you are is worse than a long tree — you would be looking at a
  // pane that does not contain the thing it is describing.
  if (!active && !folderMatches(label, query)) return null;
  return (
    <div
      onClick={onClick}
      className={`group/row relative flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
      } ${indent && depth === 0 ? "pl-7" : ""}`}
      style={depth > 0 ? { paddingLeft: INDENT_BASE + depth * INDENT_STEP } : undefined}
    >
      {caretSlot && (
        /* The caret's own box, rendered empty. Copying the element rather than
         * guessing a width is what keeps the two in step if the chevron ever
         * changes size. */
        <span aria-hidden="true" className={`shrink-0 ${LINE} flex items-center p-0.5 -ml-0.5 invisible`}>
          <ChevronRight size={12} />
        </span>
      )}
      <span className={`shrink-0 ${LINE} flex items-center ${active ? "text-indigo-500" : "text-indigo-400"}`}>{icon}</span>
      {/* The name takes only its own width, so the count sits right after it
        * as one phrase — "Brand Kits (0)" — rather than out at the pane's edge,
        * where it read as a column belonging to nothing in particular. Same in
        * every row of this tree. */}
      <span className="min-w-0 text-[11.5px] leading-[18px] line-clamp-2 break-words">
        <Highlight text={label} query={query} />
      </span>
      {count !== undefined && (
        <span className="-ml-1 text-[10px] text-gray-400 shrink-0 self-center">({count})</span>
      )}
      {/* Recents is a view, not a folder — nothing to rename or move. */}
      {count !== undefined && <RowMenu label={label} active={active} />}
    </div>
  );
}

// ─── The folder tree, derived from the names the library carries ─────────────
// The platform exposes no hierarchy: `/projects/{id}/folders` answers 403 for
// this key, an asset carries a single `folder_name` and no parent, so the API
// route builds the folder list from the leaves. What the names DO carry is a
// path — the generated library names 36 of its 41 folders `backgrounds/Beach
// Sunset` and the like — so the tree is read out of the name rather than
// declared anywhere.
//
// That is why this is a derivation and not a table: a flat name simply yields a
// flat row, which is what the live platform gives today, and the same code
// nests the moment those names carry paths.

interface FolderNode {
  /** The segment this row shows. */
  name: string;
  /** The full path — unique, so it keys the row. */
  path: string;
  /** What to select when this row is picked. The library addresses a folder by
   *  its own flat name, which is the leaf of the path and not the path. */
  selectId: string;
  /** Assets directly in this folder, plus everything under it. */
  count: number;
  /** True when the library actually has a folder at this path — a node that is
   *  only a common prefix groups its children without being selectable. */
  real: boolean;
  children: FolderNode[];
}

export function buildFolderTree(
  folders: readonly { name: string; count: number; id?: string }[],
): FolderNode[] {
  const roots: FolderNode[] = [];
  const byPath = new Map<string, FolderNode>();

  for (const folder of folders) {
    const segments = folder.name.split("/").map((x) => x.trim()).filter(Boolean);
    let parentList = roots;
    let path = "";
    segments.forEach((segment, i) => {
      path = path ? `${path}/${segment}` : segment;
      let node = byPath.get(path);
      if (!node) {
        node = { name: segment, path, selectId: path, count: 0, real: false, children: [] };
        byPath.set(path, node);
        parentList.push(node);
      }
      // Every ancestor counts what is under it, so a collapsed parent still
      // says how much it is hiding.
      node.count += folder.count;
      if (i === segments.length - 1) {
        node.real = true;
        node.selectId = folder.id ?? folder.name;
      }
      parentList = node.children;
    });
  }

  const sort = (list: FolderNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
}

/** Does this node, or anything under it, survive the search? */
function subtreeMatches(node: FolderNode, query: string): boolean {
  return folderMatches(node.name, query)
    || node.children.some((c) => subtreeMatches(c, query));
}

/** One row of the derived tree — a leaf, or a branch that opens.
 *
 *  A branch opens itself when something beneath it matched, at any depth: the
 *  point of searching a tree is to be shown where the hit is, not to be told
 *  that it is somewhere. Derived rather than stored, so clearing the term hands
 *  the branch back the state you had left it in. */
function FolderTreeNode({
  node, depth, activePath, onPick,
}: {
  node: FolderNode;
  depth: number;
  activePath: string | null;
  onPick: (path: string) => void;
}) {
  // The top of the derived tree is the client the key belongs to — one row
  // holding the whole library — so it opens with the pane. Closed, the rail
  // would say nothing but the client's own name.
  const [open, setOpen] = useState(depth === 0);
  const { query } = useGlobalSearch();
  const active = activePath === node.selectId;

  if (!active && !subtreeMatches(node, query)) return null;

  if (node.children.length === 0) {
    return (
      <FolderItem
        icon={<Folder size={13} />}
        label={node.name}
        count={node.count}
        active={active}
        depth={depth}
        caretSlot
        onClick={() => onPick(node.selectId)}
      />
    );
  }

  const searching = query.trim().length > 0;
  const hitInside = searching && node.children.some((c) => subtreeMatches(c, query));
  const showChildren = open || hitInside;

  return (
    <div>
      <div
        /* The row opens the folder in the pane AND unfolds it here, so the
         * rail follows you down rather than making you find the caret to see
         * where you just went. It only ever opens: the caret is what closes a
         * branch, and a row that toggled would shut the tree under the cursor
         * of anyone clicking a folder they were already inside.
         *
         * Every branch is a place you can stand, including one that is only a
         * common prefix and holds no assets of its own — it still has folders
         * to show, and the grid draws those as cards. */
        onClick={() => { setOpen(true); onPick(node.selectId); }}
        className={`group/row relative flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          active ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"
        }`}
        style={depth > 0 ? { paddingLeft: INDENT_BASE + depth * INDENT_STEP } : undefined}
      >
        <span
          className={`shrink-0 ${LINE} flex items-center text-gray-400 hover:text-gray-600 p-0.5 -ml-0.5`}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          {showChildren ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
        <span className={`shrink-0 ${LINE} flex items-center ${active ? "text-indigo-500" : "text-indigo-400"}`}>
          <Folder size={13} />
        </span>
        <span className="min-w-0 text-[11.5px] leading-[18px] line-clamp-2 break-words">
          <Highlight text={node.name} query={query} />
        </span>
        <span className="-ml-1 text-[10px] text-gray-400 shrink-0 self-center">({node.count})</span>
        <RowMenu label={node.name} active={active} />
      </div>
      {showChildren && (
        <div className="relative mt-0.5">
          <BranchGuide depth={depth} />
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onPick={onPick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PortalFolderTree ─────────────────────────────────────────────────────

export function PortalFolderTree({
  onClose,
  liveFolders = [],
  activeLiveFolder = null,
  onSelectLiveFolder,
  disabledReason,
}: PortalFolderTreeProps) {

  /** The platform's folders as a tree, read out of the paths their names
   *  carry — see buildFolderTree. */
  const folderTree = useMemo(() => buildFolderTree(liveFolders), [liveFolders]);

  return (
    <>
      {/* Header. Add sits beside Close rather than on a row of its own — the
        * row it used to share is gone with the search field, and one button
        * does not earn a band of its own. */}
      <div className="flex items-center gap-2 px-4 py-3.5 shrink-0">
        <span className="text-sm font-semibold text-gray-800 truncate">Folders</span>
        {/* Named, not a bare +: in a rail that is all folders, a naked glyph
          * said nothing about which folder it meant.
          *
          * Outlined, where the main pane's New is filled. Same shape and size,
          * one step quieter — this pane is a place you navigate and that button
          * is the page's own primary action; two filled pills on one screen
          * would compete for it. The colours are the design system's outline
          * variant (`components/ui/button.tsx`), read from the Figma tokens
          * rather than picked by eye.
          *
          * The label yields last: the heading truncates before the button
          * does. */}
        <button
          type="button"
          title="New folder"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-semantic-primary-main bg-white border border-semantic-primary-states-outlinedborder px-3 py-1.5 rounded-full hover:bg-semantic-primary-states-hover transition shrink-0"
        >
          <Plus size={12} />
          New Folder
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close folders"
          title="Close"
          className="text-gray-400 hover:text-gray-600 transition shrink-0"
        >
          <X size={13} />
        </button>
      </div>

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 text-xs" title={disabledReason} aria-disabled={!!disabledReason || undefined}>
        {/* The rows are inert, the list is not: hovering lands on it (the
          * tooltip) and the wheel still scrolls it. */}
        <div inert={!!disabledReason} className={`space-y-0.5 transition-opacity ${disabledReason ? "opacity-50" : ""}`}>

        {/* Recents */}
        <FolderItem
          icon={<Clock size={13} />}
          label="Recents"
          active={!activeLiveFolder}
          onClick={() => onSelectLiveFolder?.(null)}
        />

        {/* ── The platform's folders, nested by the paths their names carry ── */}
        {folderTree.map((node) => (
          <FolderTreeNode
            key={node.path}
            node={node}
            depth={0}
            activePath={activeLiveFolder}
            onPick={(path) => onSelectLiveFolder?.(activeLiveFolder === path ? null : path)}
          />
        ))}

        </div>
      </div>
    </>
  );
}
