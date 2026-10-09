
// Bulk actions — the header slot that changes with the selection.
//
// Two states in ONE place, one replacing the other:
//
//   nothing picked   [ + New ]                       ← one filled button
//   something picked ( ✕  3 selected  [Create] [Download] [Move]  ✎ ⧉ 🗑 )
//   narrow           ( ✕  3 selected  ▣ ⤓ ⧉  ✎  ⋮ )     ← folds, then a kebab
//   only selected    ( ✕  (3 selected ✕)  [Create] … )  ← the count, clicked,
//                                                         is a filter chip
//
// Spec from the Figma `Line items / Top Bar / Actions` pill in "AV3
// Constellation Design System - Component Library" (section "bulk actions",
// 16819:39382): 36px tall, fully rounded, `Surfaces/Container High` fill,
// 3/8/3/4 padding, 16px between the selection group and the actions. The
// actions are Small outlined primary buttons (30px, 18px icon, 13px medium)
// 8px apart, then 30px icon-only buttons in `action/active`.
//
// Platform-wide by design: any screen with selectable cards or table rows
// renders this where its primary action sits. The screen owns the selection
// and what each action does; this owns the swap, the pill and the menus.

import {
  useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject,
} from "react";
import type { LucideIcon } from "lucide-react";
import { MoreVertical, Plus, X } from "lucide-react";
import { Tooltip } from "@portal/components/ui/Tooltip";
import { Button } from "@portal/components/ui/button";

export interface BulkAction {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Icon-only button with the label as its tooltip — the Figma's trailing
   *  run (enhance, edit, duplicate, delete). */
  iconOnly?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** An action that needs one more choice (a folder, a status) opens a menu
   *  under its button instead of acting. `close` dismisses it. */
  menu?: (close: () => void) => ReactNode;
}

/** What a frozen filter, search or folder says while the screen shows only
 *  the selection — the same words everywhere it is frozen. */
export const ONLY_SELECTED_REASON = "Showing only the selected — lift it to filter again";

export function BulkActions({
  count, hidden = 0, onClear, actions, primary, idle, onlySelected = false, onOnlySelectedChange,
}: {
  /** Everything picked — including any the current filters hide. */
  count: number;
  /** How many of `count` the screen is not showing right now. Said out loud
   *  because every action here acts on them too. */
  hidden?: number;
  onClear: () => void;
  actions: readonly BulkAction[];
  /** The one filled action shown while nothing is picked. */
  primary?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    /** For a primary that opens a menu of its own, e.g. Portal's New. */
    expanded?: boolean;
  };
  /** What the slot holds while nothing is picked, when it is more than one
   *  filled button — the alerts board's Generate and Download CSV. Takes the
   *  place of `primary`. */
  idle?: ReactNode;
  /** The count is also a filter: click it and the screen shows only what is
   *  picked; it turns into a chip with an ✕ that lifts the filter (and keeps
   *  the selection). Pass the change handler to offer it; the screen applies
   *  the filter. */
  onlySelected?: boolean;
  onOnlySelectedChange?: (on: boolean) => void;
}) {
  // The slot is the free space in the header row, and the pill must fit in it
  // — wrapping the row would move the whole screen down. So as the slot
  // narrows the pill gives ground in a fixed order:
  //
  //   1. the labelled actions fold to icons, LAST first
  //      (Move to Folder, then Download, then Create Assets);
  //   2. then the actions at the end go into a kebab, LAST first, until the
  //      kebab holds everything.
  //
  // An invisible full-size copy is measured once per change; every other
  // state's width is arithmetic on those measurements, so no state has to be
  // rendered to find out whether it fits.
  const slotRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>({ folded: 0, overflow: 0 });
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot || count === 0) return;
    const check = () => {
      const full = fullRef.current;
      if (!full) return;
      const group = full.querySelector<HTMLElement>("[data-actions]");
      const widths = [...full.querySelectorAll<HTMLElement>("[data-action]")].map((el) => el.offsetWidth);
      if (!group || widths.length !== actions.length) return;
      const next = chooseFit(actions, widths, full.offsetWidth - group.offsetWidth, slot.clientWidth);
      setFit((prev) => (prev.folded === next.folded && prev.overflow === next.overflow ? prev : next));
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(slot);
    if (fullRef.current) ro.observe(fullRef.current);
    return () => ro.disconnect();
  }, [count, hidden, actions, onlySelected]);

  if (count === 0) {
    const Icon = primary?.icon ?? Plus;
    return (
      <div ref={slotRef} className="flex-1 min-w-0 flex items-center gap-2">
        {idle ?? (primary && (
          <Button size="toolbar" onClick={primary.onClick} aria-expanded={primary.expanded}>
            <Icon strokeWidth={2} />
            {primary.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div ref={slotRef} className="relative flex-1 min-w-0 flex">
      <div ref={fullRef} aria-hidden inert className="absolute left-0 top-0 invisible pointer-events-none">
        <Pill count={count} hidden={hidden} onClear={onClear} actions={actions} fit={{ folded: 0, overflow: 0 }} only={onlySelected} onOnly={onOnlySelectedChange} />
      </div>
      <Pill count={count} hidden={hidden} onClear={onClear} actions={actions} fit={fit} only={onlySelected} onOnly={onOnlySelectedChange} />
    </div>
  );
}

/** How far the pill has given ground: how many labelled actions are folded to
 *  icons, and how many actions (from the end) sit in the kebab. */
interface Fit { folded: number; overflow: number }

const ICON_W = 30;
const GAP = 8;

/** The first state, in the order above, whose width fits `room`. */
function chooseFit(
  actions: readonly BulkAction[], fullWidths: number[], chrome: number, room: number,
): Fit {
  const labelled = actions.filter((a) => !a.iconOnly).length;
  const width = ({ folded, overflow }: Fit) => {
    const shown = actions.length - overflow;
    let w = 0;
    let labelIndex = 0;
    for (let i = 0; i < shown; i++) {
      const a = actions[i];
      const isFolded = !a.iconOnly && labelIndex++ >= labelled - folded;
      w += a.iconOnly || isFolded ? ICON_W : fullWidths[i];
    }
    const items = shown + (overflow > 0 ? 1 : 0);
    return chrome + w + (overflow > 0 ? ICON_W : 0) + GAP * Math.max(0, items - 1);
  };
  for (let folded = 0; folded <= labelled; folded++) {
    if (width({ folded, overflow: 0 }) <= room) return { folded, overflow: 0 };
  }
  for (let overflow = 1; overflow < actions.length; overflow++) {
    if (width({ folded: labelled, overflow }) <= room) return { folded: labelled, overflow };
  }
  return { folded: labelled, overflow: actions.length };
}

function Pill({
  count, hidden, onClear, actions, fit, only, onOnly,
}: {
  count: number;
  hidden: number;
  onClear: () => void;
  actions: readonly BulkAction[];
  fit: Fit;
  only: boolean;
  onOnly?: (on: boolean) => void;
}) {
  const labelled = actions.filter((a) => !a.iconOnly).length;
  const shown = actions.slice(0, actions.length - fit.overflow);
  const kebab = actions.slice(actions.length - fit.overflow);
  let labelIndex = 0;
  return (
    <div
      role="toolbar"
      aria-label={`${count} selected`}
      /* Arrives with one flash of the rail's selected-folder purple
       * (`animate-bulk-in`) and settles on the Figma's grey.
       *
       * 36px tall to the eye, 30px to the layout — the height of the button it
       * replaces. The extra 3px top and bottom hang into the row's padding, so
       * picking a card never moves the screen under you. */
      className="animate-bulk-in shrink-0 h-9 -my-[3px] flex items-center gap-4 pl-1 pr-2 py-[3px] rounded-full bg-semantic-surfaces-container-high"
    >
      <div className="flex items-center gap-1">
        <IconButton label="Clear selection" icon={X} onClick={onClear} />
        {only && onOnly ? (
          /* Filtering by the selection: the count is a contained chip — the
           * one filled thing in the pill, so the screen's narrowed state is
           * hard to miss — and its ✕ lifts the filter, not the selection. */
          <span className="flex h-6 items-center gap-0.5 rounded-full bg-semantic-primary-main pl-2 pr-0.5 text-[11px] font-medium leading-[18px] tracking-[0.4px] text-semantic-primary-contrast whitespace-nowrap">
            <span><span className="tabular-nums">{count.toLocaleString()}</span> selected</span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Show everything again"
              title="Show everything again"
              onClick={() => onOnly(false)}
              className="size-5 text-semantic-primary-contrast hover:bg-white/20 hover:text-semantic-primary-contrast [&_svg:not([class*='size-'])]:size-3"
            >
              <X />
            </Button>
          </span>
        ) : (
          <span className="flex items-center text-[11px] leading-[18px] tracking-[0.4px] text-semantic-text-primary whitespace-nowrap pr-1">
            {onOnly ? (
              <Tooltip label="Show only the selected">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onOnly(true)}
                  className="h-6 px-1.5 text-[11px] font-normal tracking-[0.4px] text-semantic-text-primary hover:bg-black/[0.06] hover:text-semantic-text-primary"
                >
                  <span><span className="tabular-nums">{count.toLocaleString()}</span> selected</span>
                </Button>
              </Tooltip>
            ) : (
              <span><span className="tabular-nums">{count.toLocaleString()}</span> selected</span>
            )}
            {hidden > 0 && (
              <Tooltip label="Hidden by the folder, filters or search. Actions include them.">
                <span className="text-semantic-text-secondary"> · {hidden.toLocaleString()} not shown</span>
              </Tooltip>
            )}
          </span>
        )}
      </div>
      <div data-actions className="flex items-center gap-2">
        {shown.map((a) => {
          const folded = !a.iconOnly && labelIndex++ >= labelled - fit.folded;
          return <ActionButton key={a.id} action={a} folded={folded} />;
        })}
        {kebab.length > 0 && <OverflowMenu actions={kebab} />}
      </div>
    </div>
  );
}

/** Closes a popover on a click outside `ref` or on Escape. */
function useDismiss(open: boolean, close: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, ref]);
}

const POPOVER =
  "absolute top-full mt-2 z-30 min-w-[220px] max-h-[320px] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 py-1.5";

function ActionButton({ action, folded }: { action: BulkAction; folded: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  const onClick = action.menu ? () => setOpen((o) => !o) : action.onClick;
  const Icon = action.icon;

  return (
    <div ref={ref} data-action className="relative">
      {action.iconOnly || folded ? (
        <IconButton
          label={action.label}
          icon={Icon}
          onClick={onClick}
          disabled={action.disabled}
          expanded={action.menu ? open : undefined}
        />
      ) : (
        <Button
          variant="outline"
          size="toolbar"
          onClick={onClick}
          disabled={action.disabled}
          aria-expanded={action.menu ? open : undefined}
          /* The pill is the surface; a white fill per button would read as
           * cards sitting on it. */
          className="bg-transparent"
        >
          <Icon strokeWidth={1.5} />
          {action.label}
        </Button>
      )}
      {open && action.menu && (
        <div className={`${POPOVER} left-0`}>{action.menu(close)}</div>
      )}
    </div>
  );
}

/** The kebab: the actions there was no room for, as a menu. An action that
 *  has a menu of its own (Move to Folder) opens it in place. */
function OverflowMenu({ actions }: { actions: readonly BulkAction[] }) {
  const [open, setOpen] = useState(false);
  const [drill, setDrill] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => { setOpen(false); setDrill(null); }, []);
  useDismiss(open, close, ref);
  const drilled = actions.find((a) => a.id === drill);

  return (
    <div ref={ref} className="relative">
      <IconButton
        label="More actions"
        icon={MoreVertical}
        onClick={() => (open ? close() : setOpen(true))}
        expanded={open}
      />
      {open && (
        /* Right-aligned: the kebab is the pill's last control, and a menu
         * opening rightwards from it would run off the pane. */
        <div className={`${POPOVER} right-0`}>
          {drilled?.menu ? drilled.menu(close) : actions.map((a) => (
            <BulkActionMenuItem
              key={a.id}
              icon={a.icon}
              disabled={a.disabled}
              onClick={() => {
                if (a.menu) setDrill(a.id);
                else { close(); a.onClick?.(); }
              }}
            >
              {a.label}
            </BulkActionMenuItem>
          ))}
        </div>
      )}
    </div>
  );
}

function IconButton({
  label, icon: Icon, onClick, disabled, expanded,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  expanded?: boolean;
}) {
  return (
    <Tooltip label={label}>
      <Button
        variant="neutral"
        size="icon-toolbar"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-expanded={expanded}
      >
        <Icon strokeWidth={1.5} />
      </Button>
    </Tooltip>
  );
}

/** One row of an action's menu — a folder, a status. */
export function BulkActionMenuItem({
  children, onClick, icon: Icon, disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none text-left"
    >
      {Icon && <Icon size={15} className="text-gray-400 shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
}
