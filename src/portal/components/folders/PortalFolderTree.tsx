import { useMemo, useState } from "react";
import {
  X, Plus, Clock, ChevronRight, ChevronDown,
  Folder,
} from "lucide-react";
import { Highlight } from "@portal/components/ui/Highlight";
import { useGlobalSearch, matchesQuery } from "@portal/lib/global-search";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PortalFolderTreeProps {
  /** Dismisses the pane, from the X in the header. */
  onClose?: () => void;
  /** The platform's folders, derived from the assets it returned. */
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
      className={`flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
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
      <span className="flex-1 min-w-0 text-[11.5px] leading-[18px] line-clamp-2 break-words">
        <Highlight text={label} query={query} />
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-400 shrink-0 self-center">({count})</span>
      )}
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
        className={`flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
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
        <span className="flex-1 min-w-0 text-[11.5px] leading-[18px] line-clamp-2 break-words">
          <Highlight text={node.name} query={query} />
        </span>
        <span className="text-[10px] text-gray-400 shrink-0 self-center">({node.count})</span>
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

// ─── BackgroundFolderTree ─────────────────────────────────────────────────────

export function PortalFolderTree({
  onClose,
  liveFolders = [],
  activeLiveFolder = null,
  onSelectLiveFolder,
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
      <div className="flex-1 overflow-y-auto px-2 py-1 text-xs space-y-0.5">

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
    </>
  );
}
