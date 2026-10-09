
// ─── FilterBar / FilterSelect ────────────────────────────────────────────────
// The app's filter row and the multi-select that lives in it. Nothing here
// knows what is being filtered — a screen supplies the options and owns the
// selected values — so any surface that filters a list can use the same row.
//
// The behaviour worth reusing, and the reason this is a component rather than
// markup copied per screen (HANDOFF-filters.md has the why of each):
//
//  · Filters are data. A screen passes FilterDescriptor[], never children, so
//    the bar can fit a subset to the window and offer the rest in More filters.
//  · One line. What does not fit goes into More filters, untouched filters
//    before ones that are narrowing the list (fitToRow).
//  · Empty, a control is its name. Filled, the name rises onto the stroke and
//    the picks take its place as chips, two then +N; a plain X clears it.
//  · Reopening a menu stacks what is already picked at the top, above a
//    divider. The order is snapshotted when the menu opens, so an option
//    never jumps out from under the cursor while you are ticking boxes.
//  · The platform's one search MARKS filters, it does not open them: a yellow
//    badge counts the matching values, and the matched run is marked in the
//    option's text and in the filter's own name.
//  · FilterCount, FilterSort and FilterCategorize are the row's right-hand
//    furniture. They live here rather than in each screen so that no surface
//    hand-rolls a count or a sort of its own and drifts from the rest.
//
// There is one orientation, horizontal. FilterGroup is the Default filters
// dialog's section heading, and FilterRange is a select box like any other
// control in the row.

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUp, ChevronDown, ChevronRight, GripVertical, ListFilter, Plus, Search, Settings, X } from "lucide-react";
import { Button } from "@portal/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@portal/components/ui/dialog";
import { Tooltip } from "@portal/components/ui/Tooltip";
import { Highlight } from "@portal/components/ui/Highlight";
import { useGlobalSearch, matchesQuery } from "@portal/lib/global-search";

/** Free-text narrowing, first in the row. Filters as you type — the screen
 *  owns the term and decides which fields it matches. */
export function FilterSearch({
  value, onChange, placeholder = "Search", width = 200,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <div className="relative" style={{ width }}>
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-8 pl-8 pr-7 rounded-lg border border-gray-200 hover:border-gray-300 text-[12px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-600"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

/** How many items each option of one filter would leave standing.
 *
 *  Counted against every OTHER filter but not against this one — the standard
 *  facet rule, and the reason picking BMW under Make does not drop the other
 *  makes to zero. `subset` is the caller's items already narrowed by the rest
 *  of its filters; `valuesOf` reads the field this filter is about, which may
 *  hold one value or several. */
export function countFacet<T>(
  subset: readonly T[],
  options: readonly string[],
  valuesOf: (item: T) => string | readonly string[] | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const option of options) counts[option] = 0;
  for (const item of subset) {
    const v = valuesOf(item);
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      // A value can appear twice on one item; the item is still one result.
      for (const x of new Set(v)) if (x in counts) counts[x] += 1;
    } else if (String(v) in counts) {
      counts[String(v)] += 1;
    }
  }
  return counts;
}

/** Options in the order a faceted list should read: everything that would still
 *  leave results first, alphabetically, then everything that would leave none,
 *  alphabetically under it. A dead value is worth keeping on the list — knowing
 *  it exists and leads nowhere is worth more than a list that quietly shortens
 *  — but it has no claim on the top of one.
 *
 *  Without counts there is nothing to sort by, so the caller's own order stands;
 *  that order is meaningful for a list like Date Range, where alphabetical would
 *  be nonsense. */
export function byAvailability(options: readonly string[], counts?: Record<string, number>) {
  if (!counts) return options;
  const live = (o: string) => (counts[o] ?? 0) > 0;
  return [...options].sort((a, b) =>
    live(a) === live(b)
      ? a.localeCompare(b, undefined, { numeric: true })
      : live(a) ? -1 : 1,
  );
}

export function FilterSelect({
  label, options, value, onChange, counts, drop = "down",
}: {
  /** Shown as the placeholder at all times, and names the control. */
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** How many items each option would leave standing, counted against the
   *  OTHER filters rather than this one. An option at zero stays on the list
   *  — knowing a value exists and leads nowhere is worth more than a list
   *  that quietly shortens — but it cannot be picked. */
  counts?: Record<string, number>;
  /** Which way the menu opens. Down by default, which is right for a filter bar
   *  across the top of a page. A control sitting near the bottom of a panel —
   *  the review dialog's asset toolbar — passes "up", or the list is clipped by
   *  whatever scrolls behind it. */
  drop?: "down" | "up";
}) {
  const [open, setOpen] = useState(false);
  // What was already picked when the menu opened — the stacking order comes
  // from this frozen snapshot rather than from the live value.
  const [pinned, setPinned] = useState<readonly string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  /** See withPicked: a value chosen in another folder stays removable here. */
  const listed = useMemo(() => withPicked(options, value), [options, value]);

  const { query } = useGlobalSearch();
  const matched = query.trim() ? listed.filter((o) => matchesQuery(o, query)) : [];

  /** The search MARKS a filter holding matches; it does not open it.
   *
   *  It used to open every filter whose values matched, which was right while
   *  a term reached one or two of them. Across 27 filters it is not: "audi"
   *  reached five, and three panels opened on top of one another over the
   *  grid. What was cluttered was never the moment they opened — it was how
   *  many. So the badge says where the match is and the reader opens the one
   *  they meant.
   *
   *  Gone with the opening: the `dismissed` term, which existed only so that
   *  closing a menu the search had opened did not fight the next keystroke
   *  reopening it. Nothing opens on its own now, so nothing has to be
   *  dismissed. */
  const showing = open;

  function openMenu() {
    setPinned(value);
    setOpen(true);
  }
  function closeMenu() {
    setOpen(false);
    setPinned([]);
  }

  useEffect(() => {
    if (!showing) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) closeMenu();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeMenu(); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showing]);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  const active = value.length > 0;
  /* Opened by hand with a term typed, the matches still lead the list — it is
   * why you came. */
  const pinnedSet = new Set(matched.length > 0 ? matched : pinned);

  return (
    <div ref={ref} className="relative">
      <div
        className={`group relative grid items-center h-8 pl-3 pr-2 rounded-lg border text-[12px] transition ${
          active
            ? /* White behind, not the light indigo it used to fill with: the
               * picked values now wear that indigo, and a chip cannot be read
               * on a ground its own colour. */
              "border-indigo-300 bg-white text-indigo-700"
            : open
              ? "border-gray-300 bg-white text-gray-700"
              // `bg-white` on the unfilled state too: on a white toolbar it
              // reads the same as transparent, and on a grey panel — the review
              // dialog's asset bar — transparent let the panel show through
              // while the select beside it sat on white.
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
        }`}
      >
        {/* Filled, the label rises onto the stroke and the values take its
          * place — the Material pattern, and for its reason: a control showing
          * what is chosen has nowhere left to say what it is choosing. The
          * white padding is what cuts the border behind it. */}
        {active && (
          <>
            <span className="absolute -top-[5px] left-2 z-10 px-1 bg-white text-[10px] leading-none text-indigo-700 whitespace-nowrap pointer-events-none">
              <Highlight text={label} query={query} />
            </span>
            {/* The same name again, in flow and zero-height, so the chip is
              * never narrower than the label riding on its stroke. The chip's
              * width comes from its VALUE, and a short value under a long name
              * — "New" under "Vehicle condition" — left the label to wrap and
              * spill out of the box above it. Both sit in the one grid cell,
              * so the cell takes whichever is wider and the twin costs no
              * height. */}
            <span
              aria-hidden
              className="col-start-1 row-start-1 h-0 pr-2 invisible overflow-hidden whitespace-nowrap text-[10px] leading-none"
            >
              {label}
            </span>
          </>
        )}
        {/* The trigger covers the whole control from underneath, so the badge
          * can be a real button of its own without nesting one inside another. */}
        <button
          type="button"
          onClick={() => (showing ? closeMenu() : openMenu())}
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={showing}
          className="absolute inset-0 rounded-lg cursor-pointer"
        />

        {/* One cell, so the label's twin above can set the width without
          * stacking: a grid with no columns makes every child its own row. */}
        <div className="col-start-1 row-start-1 flex items-center min-w-0">
          {active ? (
            /* The values themselves, up to two, then the tally of the rest. Two
              * because the row's width is measured and refitted (§5.11) — an
              * unbounded control would make what fits depend on what is picked,
              * and the row would reshuffle as you tick. */
            <span className="relative pointer-events-none flex items-center gap-1 min-w-0">
              {value.slice(0, 2).map((v) => (
                <span
                  key={v}
                  title={v}
                  className="max-w-[88px] truncate px-1.5 py-[3px] rounded bg-indigo-50 text-indigo-700 text-[11px] leading-none"
                >
                  {v}
                </span>
              ))}
              {value.length > 2 && (
                <span className="shrink-0 px-1.5 py-[3px] rounded bg-indigo-50 text-indigo-700 text-[11px] leading-none tabular-nums">
                  +{value.length - 2}
                </span>
              )}
            </span>
          ) : (
            /* The filter's own NAME is searchable, not only its values: a
              * reader typing "asset" is as likely to be looking for the Asset
              * Types filter as for a value inside it, and the row said nothing.
              * See the note in §7 of the hand-off. */
            <span className="relative pointer-events-none">
              <Highlight text={label} query={query} />
            </span>
          )}
          {/* Says the filter holds matches without opening it — the whole of
            * what the search does to a filter that is not narrowing anything. */}
          {matched.length > 0 && !active && (
            <span className="relative pointer-events-none ml-1.5 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-200 text-yellow-900 text-[10px] font-bold flex items-center justify-center">
              {matched.length}
            </span>
          )}

          {active && (
            /* Just the way out. The count that used to live here said how many
              * were picked, which the chips beside it now say by naming them —
              * and with it goes the swap-on-hover it needed, and the equal-width
              * grid cell that swap needed to stop the control twitching.
              *
              * The same X, in the same round grey hit area, that clears the
              * platform search and the grouping. One gesture for "undo this
              * control", drawn one way. */
            <button
              type="button"
              onClick={() => onChange([])}
              aria-label={`Clear ${label} filter`}
              title={`Clear ${label} filter`}
              className="relative z-10 ml-1.5 shrink-0 w-[18px] h-[18px] flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
            >
              <X size={11} />
            </button>
          )}

          {/* Pushed to the far edge: in a pane the control fills the width, and
            * a chevron trailing each label left the column ragged. In a row the
            * control is sized to its content, so there is no slack to take and
            * nothing moves. */}
          <ChevronDown
            size={13}
            className={`relative pointer-events-none ml-auto pl-1.5 shrink-0 transition-transform ${
              showing ? "rotate-180" : ""
            } ${active ? "text-indigo-500" : "text-gray-400"}`}
          />
        </div>
      </div>

      {showing && (
        <div className={`absolute z-30 left-0 min-w-[220px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 ${
          drop === "up" ? "bottom-full mb-2" : "top-full mt-2"
        }`}>
          <FilterValueList
            options={listed}
            value={value}
            onToggle={toggle}
            counts={counts}
            label={label}
            query={query}
            stackedSet={pinnedSet}
            takeFocus={open}
          />
        </div>
      )}
    </div>
  );
}

/** A filter's values, with the line you type on above them.
 *
 *  Lives here rather than inside FilterSelect because two surfaces show the
 *  same list: the control's own dropdown, and the side panel of the More
 *  filters menu. They were the same list drawn twice, which is how the find
 *  field came to exist in one of them and not the other.
 *
 *  Owns the typed term and the keyboard cursor. The caller owns the values. */
function FilterValueList({
  options, value, onToggle, counts, label, query = "", stackedSet,
  takeFocus = true,
}: {
  options: readonly string[];
  value: readonly string[];
  onToggle: (option: string) => void;
  counts?: Record<string, number>;
  /** Names the find field for a screen reader. */
  label: string;
  /** The platform search term, for highlighting. */
  query?: string;
  /** Options to draw above a divider — what was already picked when the menu
   *  opened, or what the platform search matched. Absent in the side panel,
   *  which has no such snapshot to keep. */
  stackedSet?: ReadonlySet<string>;
  /** Whether the find field should take the caret as the list appears. False
   *  when the platform search opened this menu rather than a click: the user
   *  is still typing in the top bar, and pulling the caret down here would
   *  send the rest of the word into a field that narrows one menu instead of
   *  the whole screen. */
  takeFocus?: boolean;
}) {
  const [find, setFind] = useState("");
  /** -1 is "none yet", so the first ArrowDown lands on the first option rather
   *  than the second. */
  const [cursor, setCursor] = useState(-1);
  const findRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // The field takes focus as the list appears, so it can be used by typing
  // without reaching for it first — unless the platform search is what opened
  // the menu, in which case the caret belongs where it already is.
  useEffect(() => { if (takeFocus) findRef.current?.focus(); }, [takeFocus]);

  // Follow the keyboard down a list longer than the menu.
  useEffect(() => {
    if (cursor < 0) return;
    listRef.current
      ?.querySelector(`[data-cursor="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const listed = find.trim()
    ? options.filter((o) => matchesQuery(o, find))
    : options;
  const stacked = stackedSet ? listed.filter((o) => stackedSet.has(o)) : [];
  const rest = byAvailability(
    stackedSet ? listed.filter((o) => !stackedSet.has(o)) : listed,
    counts,
  );
  /** The listed options in the order they are drawn — what the arrows walk. An
   *  option that would leave nothing is skipped rather than landed on and
   *  refused. */
  const walkable = [...stacked, ...rest].filter(
    (o) => !(counts?.[o] === 0 && !value.includes(o)),
  );
  const cursorOf = (option: string) => walkable.indexOf(option);

  function moveCursor(step: number) {
    if (walkable.length === 0) return;
    setCursor((c) => {
      const next = c + step;
      if (next < 0) return walkable.length - 1;
      if (next >= walkable.length) return 0;
      return next;
    });
  }

  function onFindKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const target = walkable[cursor] ?? walkable[0];
      if (target) onToggle(target);
    }
  }

  const draw = (option: string) => (
    <FilterOption
      key={option}
      option={option}
      checked={value.includes(option)}
      onToggle={onToggle}
      query={query || find}
      count={counts?.[option]}
      cursor={cursorOf(option)}
      active={cursorOf(option) === cursor}
    />
  );

  return (
    <>
      {/* A line to type on, not a field to fill in: no border, no ground, just
        * the caret sitting where the first option would be. */}
      <input
        ref={findRef}
        type="text"
        value={find}
        onChange={(e) => { setFind(e.target.value); setCursor(-1); }}
        onKeyDown={onFindKey}
        placeholder="find below"
        aria-label={`Find in ${label}`}
        className="w-full px-4 py-1.5 bg-transparent text-[13px] text-gray-800 placeholder:text-gray-400 outline-none"
      />

      <div ref={listRef} role="listbox" className="max-h-[300px] overflow-y-auto">
        {options.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-gray-400">No options</p>
        )}
        {options.length > 0 && stacked.length === 0 && rest.length === 0 && (
          <p className="px-4 py-3 text-[13px] text-gray-400">
            Nothing here matches “{find.trim()}”.
          </p>
        )}
        {stacked.map(draw)}
        {stacked.length > 0 && rest.length > 0 && (
          <div className="my-1.5 border-t border-gray-100" />
        )}
        {rest.map(draw)}
      </div>
    </>
  );
}

function FilterOption({
  option, checked, onToggle, query = "", count, cursor, active = false,
}: {
  option: string;
  checked: boolean;
  onToggle: (o: string) => void;
  query?: string;
  count?: number;
  /** Position in the keyboard walk, so the menu can scroll to it. -1 when the
   *  option is not walkable, and absent where there is no keyboard at all. */
  cursor?: number;
  /** The keyboard is on this one. */
  active?: boolean;
}) {
  // A picked option is never disabled, whatever its count: the way out of a
  // combination that matches nothing has to stay clickable.
  const dead = count === 0 && !checked;
  return (
    <label
      data-cursor={cursor}
      className={`flex items-center gap-3 px-4 py-2 ${
        dead ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-gray-50"
      } ${active ? "bg-gray-100" : ""}`}
      title={dead ? `No results with the filters already applied` : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={dead}
        onChange={() => onToggle(option)}
        className="w-[15px] h-[15px] accent-indigo-600 shrink-0"
      />
      <span className="flex-1 min-w-0 text-[13px] text-gray-800 truncate">
        <Highlight text={option} query={query} />
      </span>
      {count !== undefined && (
        <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">({count})</span>
      )}
    </label>
  );
}

// ─── Filters as data ─────────────────────────────────────────────────────────
// The bar has to know its filters rather than just render them: it shows a
// subset horizontally, offers a checkbox per filter while pinning, and counts
// the ones that are narrowing the list from outside the bar. None of that is
// possible with an opaque `children`.

export interface FilterDescriptor {
  /** Stable across renders — this is what gets persisted as pinned. */
  id: string;
  label: string;
  /** Section heading in the dialog's full list. */
  group?: string;
  /** The control itself, as it appears in the bar and in the dialog. */
  node: ReactNode;
  /** Whether this filter is currently narrowing the list. An active filter is
   *  never hidden: the bar appends it even when it is not pinned. */
  active?: boolean;
  /** Ranges and the like can be left out of the horizontal bar entirely. */
  pinnable?: boolean;
  /** Selects pass these so the More filters menu can offer their options
   *  without the bar having to reach inside the rendered control. Omit them
   *  and the filter is reachable only from the dialog. */
  options?: readonly string[];
  value?: string[];
  onChange?: (next: string[]) => void;
  /** Per-option result counts — see FilterSelect. */
  counts?: Record<string, number>;
  /** What the More filters side panel shows for a filter WITHOUT a list of
   *  values — a range's fields, not its chip. Falls back to `node`. */
  panel?: ReactNode;
}

const PINNED_EVENT = "constellation:pinned-filters-changed";

// ─── Fitting the row to the window ───────────────────────────────────────────
// The row is one line. What does not fit falls into More filters, from the end,
// and comes back from the front as the window widens — so a filter keeps its
// place in the order rather than reshuffling every time the pane resizes.
//
// Widths are measured off the real controls and cached by filter id: a label's
// width does not change with how many neighbours it has. A filter that has
// never been on screen has no measurement yet, so it gets an estimate from its
// label; the estimate errs small, because a chip that is shown and then
// measured corrects itself on the next frame, while one that is never shown is
// never measured and would stay collapsed forever.
const ROW_GAP = 8; // gap-2
const estimateWidth = (label: string) => label.length * 7 + 46;

// More filters and Clear Filters sit in the same measured strip as the
// controls, so their room comes off the top before anything is fitted. They
// are measured like everything else; these are only the first-paint guesses,
// used for the frame before the measurement lands.
const MORE_GUESS = 120;
const CLEAR_GUESS = 90;
// More filters grows a badge when something hidden is filtering. Reserving that
// width unconditionally costs one chip's worth of slack in the worst case, and
// is the price of not making the reserve depend on what the reserve decided —
// that circle can oscillate as the window moves.
const BADGE_SLACK = 26;

/** Which of these fit on one line of `room` pixels, and which spill.
 *
 *  Pure, so the rule can be checked without a DOM: the only hard part is that
 *  it stops at the FIRST filter that does not fit rather than skipping it for a
 *  narrower one behind it. Skipping would reorder the row as the window moves,
 *  and a control that hops places is worse than one that leaves. */
/** The options a menu lists: what the screen offers, plus anything already
 *  picked that is no longer among them.
 *
 *  Vocabularies are derived from what is in front of you, so changing folder
 *  rebuilds them and a value chosen elsewhere can outlive its own list. Dropped
 *  from the menu it left a badge reading "1" over an empty grid with nothing to
 *  untick — the only way out was Clear Filters, which throws away the rest. A
 *  picked option is never disabled, so listing it is enough to make it
 *  removable. */
export function withPicked(
  options: readonly string[] = [],
  picked: readonly string[] = [],
): readonly string[] {
  const missing = picked.filter((v) => !options.includes(v));
  return missing.length ? [...options, ...missing] : options;
}

/** A control's measurement key. Active and inactive are different widths of
 *  the same filter, so they are measured separately rather than one standing
 *  in for the other. */
const chipKey = (f: { id: string; active?: boolean }) => (f.active ? `${f.id}:on` : f.id);

export function fitToRow<T extends { id: string; label: string; active?: boolean }>(
  candidates: readonly T[],
  widthOf: (item: T) => number | undefined,
  room: number,
): { shown: T[]; spilled: T[] } {
  const width = (f: T) => widthOf(f) ?? estimateWidth(f.label);
  const total = (list: readonly T[]) =>
    list.reduce((sum, f) => sum + width(f), 0) + Math.max(0, list.length - 1) * ROW_GAP;

  // Drop from the end, and an untouched filter before one that is narrowing the
  // list: what is doing something earns the room over what is not. Only when
  // every untouched one has gone does an active filter leave, and then its
  // count goes on the chip and on its own row in the menu, so it is still
  // visible that it is working.
  const keep = [...candidates];
  while (keep.length > 0 && total(keep) > room) {
    let i = keep.length - 1;
    for (let j = keep.length - 1; j >= 0; j--) {
      if (!keep[j].active) { i = j; break; }
    }
    keep.splice(i, 1);
  }

  const kept = new Set(keep.map((f) => f.id));
  return { shown: keep, spilled: candidates.filter((f) => !kept.has(f.id)) };
}


/** The filters a screen keeps in its horizontal bar, remembered per screen.
 *
 *  SSR-safe by the same rule as useKickoffReads: the first render on both
 *  sides uses `defaults`, and what was stored arrives in an effect. Reading
 *  localStorage during render would make the server and the browser disagree
 *  about which filters exist the moment anyone changed the set. */
export function usePinnedFilters(storageKey: string, defaults: string[]) {
  const [pinned, setPinned] = useState<string[]>(defaults);

  useEffect(() => {
    function read() {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) setPinned(JSON.parse(raw) as string[]);
      } catch { /* unavailable — the defaults stand */ }
    }
    read();
    window.addEventListener(PINNED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PINNED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [storageKey]);

  const update = useCallback((next: string[]) => {
    setPinned(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(PINNED_EVENT));
    } catch { /* in-memory state still updates */ }
  }, [storageKey]);

  return [pinned, update] as const;
}

/** Switches the bar between its two layouts. Prototype scaffolding — see the
 *  note at the top of this file. Hidden until the bar is hovered, so it stays
 *  out of the way of anyone using the filters rather than studying them. */
/** The kebab on the bar. Two things live behind it, and they are not the same
 *  kind of thing, so the menu says which is which:
 *
 *   · Edit pinned filters — product. Which filters earn a place in the
 *     horizontal bar is a real preference, remembered per screen.
 *   · Filter layout — scaffolding in the enrollment form's sense of the word:
 *     prototype-only, deliberately NOT part of what gets built. It is here so
 *     the two layouts can be compared on the real screen with real data.
 *
 *  Hidden until the bar is hovered, so it stays out of the way of anyone using
 *  the filters rather than configuring them. */

/** A numeric min/max pair, worn as a select box so a range reads as one of the
 *  filters rather than as two stray inputs — which is what let it into the row
 *  alongside the rest.
 *
 *  Two controls for one value, because they answer different questions. The
 *  boxes are for a figure you already know ("1080"); the slider is for the ones
 *  you do not, where the point is to see the span and push an end of it. They
 *  write to the same value, so neither is a draft of the other.
 *
 *  A dual slider is two range inputs stacked on one track. Each is a real
 *  input, so each handle is where a keyboard expects it, and neither can cross
 *  the other. */
export function FilterRange({
  label, value, onChange, bounds,
}: {
  label: string;
  value: { min: string; max: string };
  onChange: (next: { min: string; max: string }) => void;
  /** The span the data actually covers. Without it there is nothing to slide
   *  along, so the control falls back to the boxes alone. */
  bounds?: { min: number; max: number };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value.min !== "" || value.max !== "";
  /* A range has no options for the search to reach, so its NAME is the only
   * thing here a term can match — which is reason enough to read the term. */
  const { query } = useGlobalSearch();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        className={`group relative grid items-center h-8 pl-3 pr-2 rounded-lg border text-[12px] transition ${
          active
            ? /* White behind, not the light indigo it used to fill with: the
               * picked values now wear that indigo, and a chip cannot be read
               * on a ground its own colour. */
              "border-indigo-300 bg-white text-indigo-700"
            : open
              ? "border-gray-300 text-gray-700"
              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800"
        }`}
      >
        {/* Filled, the label rises onto the stroke and the values take its
          * place — the Material pattern, and for its reason: a control showing
          * what is chosen has nowhere left to say what it is choosing. The
          * white padding is what cuts the border behind it. */}
        {active && (
          <>
            <span className="absolute -top-[5px] left-2 z-10 px-1 bg-white text-[10px] leading-none text-indigo-700 whitespace-nowrap pointer-events-none">
              <Highlight text={label} query={query} />
            </span>
            {/* The same name again, in flow and zero-height, so the chip is
              * never narrower than the label riding on its stroke. The chip's
              * width comes from its VALUE, and a short value under a long name
              * — "New" under "Vehicle condition" — left the label to wrap and
              * spill out of the box above it. Both sit in the one grid cell,
              * so the cell takes whichever is wider and the twin costs no
              * height. */}
            <span
              aria-hidden
              className="col-start-1 row-start-1 h-0 pr-2 invisible overflow-hidden whitespace-nowrap text-[10px] leading-none"
            >
              {label}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="absolute inset-0 rounded-lg cursor-pointer"
        />
        {/* One cell — see FilterSelect. */}
        <div className="col-start-1 row-start-1 flex items-center min-w-0">
          {active ? (
            /* The span itself, where a select shows its values — the same chip,
              * because a range is one picked thing and reads as one. An open end
              * is written as open rather than filled in with the bound it does
              * not constrain. */
            <span className="relative pointer-events-none flex items-center min-w-0">
              <span className="max-w-[120px] truncate px-1.5 py-[3px] rounded bg-indigo-50 text-indigo-700 text-[11px] leading-none tabular-nums">
                {value.min !== "" && value.max !== ""
                  ? `${value.min}–${value.max}`
                  : value.min !== ""
                    ? `${value.min}+`
                    : `≤${value.max}`}
              </span>
            </span>
          ) : (
            /* See FilterSelect: the name is searchable too. */
            <span className="relative pointer-events-none">
              <Highlight text={label} query={query} />
            </span>
          )}

          {active && (
            /* Just the way out — the "1" that used to sit here said a range was
              * set, which the span beside it now says by showing it. */
            <button
              type="button"
              onClick={() => onChange({ min: "", max: "" })}
              aria-label={`Clear ${label} filter`}
              title={`Clear ${label} filter`}
              className="relative z-10 ml-1.5 shrink-0 w-[18px] h-[18px] flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
            >
              <X size={11} />
            </button>
          )}

          <ChevronDown
            size={13}
            className={`relative pointer-events-none ml-auto pl-1.5 shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            } ${active ? "text-indigo-500" : "text-gray-400"}`}
          />
        </div>
      </div>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-2 w-[260px] bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <FilterRangeFields label={label} value={value} onChange={onChange} bounds={bounds} />
        </div>
      )}
    </div>
  );
}

/** A range's two controls — From/To boxes over a dual slider — without the
 *  chip that opens them. The chip's dropdown carries this, and so does the
 *  More filters side panel: a range parked in the menu used to show its CHIP
 *  there, whose dropdown then opened inside the panel's scroller and was
 *  clipped to a sliver with scrollbars on both axes. */
export function FilterRangeFields({
  label, value, onChange, bounds,
}: {
  label: string;
  value: { min: string; max: string };
  onChange: (next: { min: string; max: string }) => void;
  bounds?: { min: number; max: number };
}) {
  const lo = bounds?.min ?? 0;
  const hi = bounds?.max ?? 0;
  const span = Math.max(1, hi - lo);
  // An empty end means "no bound on this side", which on a track is its end.
  // Typed figures are clamped for the drawing only — a number outside the span
  // is still a legitimate filter, it just has nowhere to sit on this track, and
  // letting it through drew the filled bar off the left of the control.
  const clamp = (n: number) => Math.min(hi, Math.max(lo, n));
  const from = value.min === "" ? lo : clamp(Number(value.min));
  const to = value.max === "" ? hi : clamp(Number(value.max));
  const pct = (n: number) => ((n - lo) / span) * 100;

  /** Writing a slider end back.
   *
   *  Landing on the far end writes nothing rather than the boundary figure: the
   *  end of the track IS "no bound on this side", so it leaves the box showing
   *  its placeholder instead of filling it with a number that constrains
   *  nothing. Without it, a bare click on a handle filled the box and lit the
   *  filter up for a range covering everything.
   *
   *  The ends are clamped against each other here rather than in the inputs, so
   *  dragging one past the other pushes instead of inverting the range. */
  function slide(end: "min" | "max", raw: number) {
    if (end === "min") {
      const next = Math.min(raw, to);
      onChange({ ...value, min: next <= lo ? "" : String(next) });
    } else {
      const next = Math.max(raw, from);
      onChange({ ...value, max: next >= hi ? "" : String(next) });
    }
  }

  return (
    <>
      <div className="flex items-end gap-3">
        {(["min", "max"] as const).map((end) => (
          <label key={end} className="flex-1 min-w-0">
            <span className="block mb-1 text-[11px] font-medium text-gray-500">
              {end === "min" ? "From" : "To"}
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={value[end]}
              onChange={(e) => onChange({ ...value, [end]: e.target.value })}
              placeholder={String(end === "min" ? lo : hi)}
              aria-label={`${label} ${end === "min" ? "from" : "to"}`}
              className="w-full h-9 px-2.5 rounded-lg border border-gray-200 bg-gray-50 text-[13px] text-gray-800 tabular-nums placeholder:text-gray-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </label>
        ))}
      </div>

      {bounds && hi > lo && (
        <div className="relative h-5 mt-5">
          {/* The track, and the stretch of it the range currently covers. */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-200" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-semantic-primary-main"
            style={{ left: `${pct(from)}%`, right: `${100 - pct(to)}%` }}
          />
          {(["min", "max"] as const).map((end) => (
            <input
              key={end}
              type="range"
              min={lo}
              max={hi}
              value={end === "min" ? from : to}
              onChange={(e) => slide(end, Number(e.target.value))}
              aria-label={`${label} ${end === "min" ? "from" : "to"} slider`}
              className="range-thumb absolute inset-x-0 top-0 w-full h-5 appearance-none bg-transparent pointer-events-none"
            />
          ))}
        </div>
      )}
    </>
  );
}

/** A labelled section of the Default filters dialog's list — Date & Type,
 *  Organization, Dimensions, Metadata. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 pt-1">
        {label}
      </p>
      {children}
    </div>
  );
}

/** Select everything the list is showing.
 *
 *  The word changes with what is on screen, because the two are different
 *  promises: with a filter on, "all" would claim the rows it cannot see. It
 *  says "visible" then, and touches only the ids in front of you — so clearing
 *  the filter hands back a selection with the earlier picks still in it, and a
 *  pass over a different filter adds to them rather than replacing them.
 *
 *  "Visible" means what the filters and the search leave standing, not what has
 *  been scrolled or paged into view — the same rule FilterCount states. */
export function FilterSelectAll({
  visible, selected, onChange, narrowed, scopeLabel,
}: {
  /** Ids the filters leave standing, in the order the list shows them. */
  visible: readonly string[];
  /** Everything picked, including whatever the current filters hide. */
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  /** Whether a filter or the search is narrowing the list. */
  narrowed: boolean;
  /** What "all" means here, when it is not the whole list — a section of a
   *  grouped grid says "group". Two controls both reading "Select all" on one
   *  screen, doing different things, is the ambiguity this avoids. */
  scopeLabel?: string;
}) {
  const allPicked = visible.length > 0 && visible.every((id) => selected.has(id));
  const scope = scopeLabel ?? (narrowed ? "visible" : "all");

  function toggle() {
    const next = new Set(selected);
    for (const id of visible) {
      if (allPicked) next.delete(id);
      else next.add(id);
    }
    onChange(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={visible.length === 0}
      className="shrink-0 text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 disabled:cursor-not-allowed transition"
    >
      {allPicked ? "Deselect" : "Select"} {scope}
    </button>
  );
}

/** How much the search and filters leave standing, over the total the list
 *  holds. Both are full counts — never "what has been scrolled into view". */
export function FilterCount({
  shown, total, noun, nounPlural = `${noun}s`,
}: {
  shown: number;
  total: number;
  /** Singular name of what is being counted, e.g. "alert". */
  noun: string;
  /** Plural, when adding an s is wrong. */
  nounPlural?: string;
}) {
  const narrowed = shown < total;
  return (
    <Tooltip
      label={`The search and filters leave ${shown.toLocaleString()} of ${total.toLocaleString()} showing.`}
      className="mr-1"
    >
      <span className="text-[12px] text-gray-500">
        <span className={narrowed ? "font-semibold text-gray-700" : ""}>
          {shown.toLocaleString()}
        </span>
        <span className="text-gray-300 mx-1">/</span>
        {total.toLocaleString()} {total === 1 ? noun : nounPlural}
      </span>
    </Tooltip>
  );
}

/** Sort field plus its direction, as one control pair. */
export function FilterSort({
  field, fields: own, asc, onField, onToggleDir,
}: {
  field: string;
  fields: readonly string[];
  asc: boolean;
  onField: (next: string) => void;
  onToggleDir: () => void;
}) {
  const fields = useAllFields(own);
  return (
    <>
      <label className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 text-[11px] text-gray-400">Sort</span>
        {/* A <select> sizes itself to its WIDEST option, not to the one
          * chosen — so a list holding "Updated At" and "Dimensions" was as
          * wide as its longest entry whatever you picked, and the row paid for
          * that in every screen width. The invisible twin holds the chosen
          * value and is the only thing in flow, so IT sets the width; the
          * select is lifted out and laid over it. A grid cell was the first
          * attempt and does not work — an auto track still takes the select's
          * max-content, which is the widest option again.
          *
          * Shrinkable to 3rem: past that a shortened field name says nothing.
          * The twin keeps `nowrap` so the value ellipsizes rather than wrapping
          * to a second line inside a control one line tall. */}
        <span className="relative inline-flex items-center min-w-[3rem] overflow-hidden">
          <span
            aria-hidden
            /* Wider than the select's own right padding by 8px. The twin's
              * layout width rounds down against the text's fractional one and
              * the control keeps a reserve of its own, so matching the padding
              * exactly left the select 1-3px short and it clipped the last
              * letter — "Components" came out "Component". */
            className="h-8 pl-2.5 pr-9 invisible whitespace-nowrap text-[12px]"
          >
            {field}
          </span>
          <select
            value={field}
            onChange={(e) => onField(e.target.value)}
            aria-label="Sort by"
            className="absolute inset-0 w-full h-8 pl-2.5 pr-7 truncate rounded-lg border border-gray-200 hover:border-gray-300 text-[12px] text-gray-700 appearance-none bg-white cursor-pointer focus:outline-none focus:border-indigo-600"
          >
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
            {/* Something else on the screen — a sortable column header, say —
              * can set a field this list doesn't offer. Keep it selectable so
              * the control and that header never disagree about the order. */}
            {!fields.includes(field) && <option value={field}>{field}</option>}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </span>
      </label>

      <button
        type="button"
        onClick={onToggleDir}
        title={asc ? "Ascending" : "Descending"}
        aria-label={asc ? "Sort ascending" : "Sort descending"}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition"
      >
        <ArrowUp size={14} className={`transition-transform ${asc ? "" : "rotate-180"}`} />
      </button>
    </>
  );
}

// ─── Naming a field: sorting, and grouping ───────────────────────────────────
// Two controls name a field rather than pick a value: Sort, and Categorize By.
// Both used to carry a hand-written list of field names per screen, which is
// the same drift the counts had — a screen could offer a sort for a filter it
// had dropped, or filter by something it would never group by. The bar already
// knows its filters, so both lists are derived from them here.

/** The screen's own fields first — a date, a name, whatever is not a filter —
 *  then every filter, in the order the bar carries them. Deduped without
 *  regard to case, first spelling kept, so a screen that already sorts by
 *  "Brand" does not gain a second "Brands" beside it. */
export function fieldsFromFilters(
  filters: readonly FilterDescriptor[],
  leading: readonly string[] = [],
): string[] {
  return mergeFields(leading, filters.map((f) => f.label));
}

/** `leading` first, then every label not already there — deduped without
 *  regard to case, first spelling kept. */
function mergeFields(leading: readonly string[], labels: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const name of [...leading, ...labels]) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Every filter the bar carries, by label, handed to the Sort and Group
 *  controls in its `right` slot. They offer ALL of them, whatever list the
 *  screen passed: a screen's `fields` are its own extras and lead the menu,
 *  and the filters follow. A screen that wrote its list by hand offered a
 *  handful — Approvals sorted by 5 of its 10 filters and grouped by 4 — and
 *  a filter you can narrow by but not sort or group by is the two-lists
 *  defect again. */
const BarFieldsContext = createContext<readonly string[]>([]);

function useAllFields(fields: readonly string[]): string[] {
  const all = useContext(BarFieldsContext);
  return useMemo(() => mergeFields(fields, all), [fields, all]);
}

/** The value a section is headed by, and the rows under it. */
export interface FilterSection<T> {
  label: string;
  items: T[];
}

/** Break a list into one section per distinct value of `read`.
 *
 *  Two rules worth keeping. A row with several values — tags, brands — lands
 *  in the section for its FIRST one rather than appearing under each: every
 *  row is in exactly one section, so the section counts still add up to the
 *  count in the toolbar, and a card cannot be ticked in one place and appear
 *  already ticked in another.
 *
 *  A row with no value at all is not dropped. The platform's own Portal drops
 *  them — grouping 44 assets by Asset Type shows 38 — and an asset that
 *  disappears because you grouped the grid is one you cannot get back without
 *  undoing the grouping you wanted. They collect in a trailing section
 *  instead, named for what they are missing. */
export function groupByValue<T>(
  rows: readonly T[],
  read: (row: T) => string | string[] | number | null | undefined,
  emptyLabel = "Not set",
): FilterSection<T>[] {
  const named = new Map<string, T[]>();
  const missing: T[] = [];

  for (const row of rows) {
    const raw = read(row);
    const first = Array.isArray(raw) ? raw[0] : raw;
    const label = first === null || first === undefined ? "" : String(first).trim();
    if (!label) {
      missing.push(row);
      continue;
    }
    const bucket = named.get(label);
    if (bucket) bucket.push(row);
    else named.set(label, [row]);
  }

  const sections = [...named.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([label, items]) => ({ label, items }));

  if (missing.length) sections.push({ label: emptyLabel, items: missing });
  return sections;
}

/** The rule above the rows of one section: the value on the left, how many
 *  rows carry it on the right, and a hairline under both. */
export function FilterSectionHeader({
  label, count, noun = "item", sticky = false, action,
}: {
  label: string;
  count: number;
  noun?: string;
  /** A control belonging to this section — a select-all scoped to it. Sits
   *  with the name and the count, which are one phrase about this group, not
   *  across the pane where it would read as belonging to the grid. */
  action?: ReactNode;
  /** Pin the heading to the top of the scroller while its own section is on
   *  screen. It sticks inside its section, so the next one carries it off
   *  rather than covering it — the two never overlap, which is the whole point
   *  of the arrangement.
   *
   *  `--chrome-offset` is published by ScrollAwayHeader: the height it is
   *  currently covering the top of the scroller with, or 0 when it is away.
   *  Reading it here is what keeps the heading below a header that came back
   *  instead of behind it.
   *
   *  The layers, top to bottom: the scroll-away header at 30, this at 20, a
   *  card's own checkbox and menu at 10. Sharing 10 with the cards put the
   *  checkboxes over the pinned heading, since equal z-index falls back to
   *  document order and the cards come later. */
  sticky?: boolean;
}) {
  return (
    <div
      className={`mb-4 ${
        sticky ? "sticky z-20 top-[var(--chrome-offset,0px)] bg-white pt-2" : ""
      }`}
    >
      {/* The count sits beside the name rather than across the row: the two are
        * one phrase — "330i, four assets" — and a number alone at the far right
        * of a wide pane reads as belonging to the rule rather than to the
        * heading. Lower case for the same reason; it is a sentence, not a
        * label. */}
      <div className="flex items-baseline gap-2 pb-1.5">
        <h3 className="text-sm font-semibold text-gray-800 truncate">{label}</h3>
        <span className="shrink-0 text-[11px] text-gray-500 tabular-nums">
          {count.toLocaleString()} {count === 1 ? noun : `${noun}s`}
        </span>
        {action}
      </div>
      {/* A solid bar rather than a hairline. A section of a grid is a bigger
        * break than a row of a table, and a 1px rule under a heading read as
        * underlining it instead of dividing what came before from what
        * follows. */}
      <div className="h-1 bg-gray-100" />
    </div>
  );
}

/** Which filter the list is broken into sections by. One value rather than a
 *  set, so it is a plain select — the same shape as the sort it sits beside,
 *  and not the multi-select standing in for one. */
export function FilterCategorize({
  value, fields: own, onChange, noneLabel = "None",
}: {
  value: string;
  fields: readonly string[];
  onChange: (next: string) => void;
  noneLabel?: string;
}) {
  const id = useId();
  const fields = useAllFields(own);
  const grouped = value !== noneLabel;
  return (
    /* The label names the select by id rather than wrapping it. A label that
     * wraps forwards every click inside it to its control — the clear below
     * sits inside the box, and wrapped it would reopen the select it had just
     * cleared. */
    <span className="flex items-center gap-1.5 min-w-0">
      <label htmlFor={id} className="shrink-0 text-[11px] text-gray-400">Group</label>
      {/* See FilterSort: shrinks to 3rem, and ellipsizes rather than wrapping. */}
      <span className="relative inline-flex items-center min-w-[3rem] overflow-hidden">
        {/* Same trick as the sort beside it — see FilterSort. The padding on
          * the twin has to track the select's, which changes with the clear. */}
        <span
          aria-hidden
          /* 8px of slack, for the rounding described in FilterSort. */
          className={`h-8 pl-2.5 ${grouped ? "pr-14" : "pr-9"} invisible whitespace-nowrap text-[12px]`}
        >
          {value}
        </span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Categorize by"
          /* Right padding clears the caret, and the clear as well once there
           * is something to clear, so a long field name never runs under
           * either. */
          className={`absolute inset-0 w-full h-8 pl-2.5 ${grouped ? "pr-12" : "pr-7"} truncate rounded-lg border border-gray-200 hover:border-gray-300 text-[12px] text-gray-700 appearance-none bg-white cursor-pointer focus:outline-none focus:border-indigo-600`}
        >
          <option value={noneLabel}>{noneLabel}</option>
          {fields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
          {/* The field can arrive before the list does — a link that names a
            * grouping is read on mount, while the filters it is chosen from are
            * derived from a library that is still loading. A select whose value
            * matches no option falls back to the first one, so the control said
            * "None" over a grid that was visibly grouped. Same fallback
            * FilterSort already carries. */}
          {grouped && !fields.includes(value) && (
            <option value={value}>{value}</option>
          )}
        </select>

        {/* Ungrouping is one click, not a trip through the menu to find "None".
          * Inside the box, left of the caret: it belongs to this control's
          * value, and outside it read as a third thing in the row. The same X
          * in the same round grey hit area that clears the platform search. */}
        {grouped && (
          <button
            type="button"
            onClick={() => onChange(noneLabel)}
            aria-label="Clear grouping"
            title="Clear grouping"
            className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={11} />
          </button>
        )}

        <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </span>
    </span>
  );
}

/** The row the selects sit in. Filters left, Clear Filters right after them,
 *  and whatever the screen wants pinned to the far right — a sort, a view
 *  toggle — in `right`. */
// ─── More filters ────────────────────────────────────────────────────────────

/** The last chip in the bar: every filter the bar is not already showing,
 *  listed by name, with that filter's own options opening alongside on click.
 *  Opening on hover meant a list of values appeared and vanished as the pointer
 *  crossed the menu on its way somewhere else. Picking
 *  an option both sets the filter and brings it into the bar, so a filter
 *  arrives already doing something rather than as one more empty control.
 *
 *  Its footer opens the dialog, which is where the bar's contents are chosen
 *  rather than borrowed for one question. */
/** Both panels are this wide, and the submenu clears its parent by 4px. */
const MENU_W = 220;

function MoreFiltersMenu({
  filters, onOpenDialog, alone = false, open, onOpenChange,
}: {
  filters: FilterDescriptor[];
  onOpenDialog?: () => void;
  /** True when the row is too narrow to carry any control at all, so this chip
   *  is not "more" of anything — it is the filters. It says so, and takes the
   *  filter glyph instead of the plus. */
  alone?: boolean;
  /** Owned by the bar, which holds the row still while this is open — see the
   *  note on the frozen split. */
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  // An active filter in here is one the row could not fit. The bar's rule is
  // that a filter narrowing the list is never out of sight, so when the window
  // takes one away the chip says how many it is holding.
  const activeHidden = filters.filter((f) => f.active).length;
  const [submenu, setSubmenu] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  /** Which filters in here hold a value matching the platform search.
   *
   *  A filter in the row announces its own matches on its own chip. A filter
   *  pushed in here has no chip to announce them on, so the promise that a
   *  match is never hidden from you had nothing carrying it past this point:
   *  typing a value that lives in a filter the window had taken away did
   *  nothing at all. This chip speaks for them. */
  const { query } = useGlobalSearch();
  const term = query.trim();
  const matching = useMemo(
    () => (term
      ? filters.filter((f) => (f.options ?? []).some((o) => matchesQuery(o, term)))
      : []),
    [filters, term],
  );

  /** Like a filter's own chip, this one MARKS and does not open. It used to
   *  open itself once per term, which was the same clutter one level up: with
   *  five filters matching, this panel came up over the three that had already
   *  opened in the row. The badge and the per-row counts below are what the
   *  search leaves here now.
   *
   *  Gone with it: the dismissed term, and the flag that kept the caret in the
   *  header — with a pointer the only thing that opens this, the list inside
   *  takes focus again, which is what a pointer should do. */
  const close = useCallback(() => {
    onOpenChange(false);
    setSubmenu(null);
  }, [onOpenChange]);

  /** Which side the options open on. They went out to the right unconditionally
   *  and ran off a narrow pane — the whole list of a filter's values, gone past
   *  the edge. Decided when the menu is placed: right if there is room, left if
   *  there is not and the other side has it, and right again when neither side
   *  does, because then the choice is between two clipped panels and the
   *  familiar one is less surprising. */
  const [side, setSide] = useState<"right" | "left">("right");

  /** How close either panel may come to the foot of the window. Below this the
   *  menu stops growing and scrolls inside itself instead. */
  const EDGE = 24;

  const menuRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  /** The menu's own ceiling, and the submenu's top, both in px. */
  const [menuMax, setMenuMax] = useState<number>();
  const [subTop, setSubTop] = useState(0);

  /** The menu grows down to {@link EDGE} from the foot of the window and only
   *  then scrolls. A fixed 320px cap made it scroll on a tall screen with half
   *  the window empty below it. */
  const measureMenu = useCallback(() => {
    const el = menuRef.current;
    if (!el) return;
    setMenuMax(Math.max(160, window.innerHeight - el.getBoundingClientRect().top - EDGE));
  }, []);

  /** The values panel opens BESIDE the row that asked for it, not at the top of
   *  the menu — the list you clicked and the list that opened should be on one
   *  line, or the eye has to go back and find which. It only leaves that line
   *  when it would otherwise run off the bottom, and then it rises just enough
   *  to keep its foot {@link EDGE} clear. */
  const alignSub = useCallback(() => {
    const menu = menuRef.current;
    const row = submenu ? rowRefs.current.get(submenu) : null;
    if (!menu || !row) return;
    const menuTop = menu.getBoundingClientRect().top;
    const rowTop = row.getBoundingClientRect().top;
    const h = subRef.current?.offsetHeight ?? 0;
    let top = rowTop;
    if (h) top = Math.max(EDGE, Math.min(top, window.innerHeight - EDGE - h));
    setSubTop(top - menuTop);
  }, [submenu]);

  const placeMenu = useCallback((el: HTMLDivElement | null) => {
    menuRef.current = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const roomRight = window.innerWidth - r.right;
    const roomLeft = r.left;
    setSide(roomRight < MENU_W + 4 && roomLeft >= MENU_W + 4 ? "left" : "right");
    setMenuMax(Math.max(160, window.innerHeight - r.top - EDGE));
  }, []);

  /* Re-measured whenever what it depends on moves: the window, the list's own
   *  scroll (which slides the row the panel is tied to), and the panel's own
   *  height once it has rendered. */
  useEffect(() => {
    if (!open) return;
    alignSub();
    const on = () => { measureMenu(); alignSub(); };
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [open, submenu, menuMax, alignSub, measureMenu]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const openFilter = filters.find((f) => f.id === submenu);

  /** Ticking here is the same act as ticking in the row: the option goes on or
   *  off and the menu stays put. It used to add the value and shut everything,
   *  which made picking a second value a matter of reopening two menus. */
  function toggle(f: FilterDescriptor, option: string) {
    const current = f.value ?? [];
    f.onChange?.(
      current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option],
    );
  }

  if (filters.length === 0 && !onOpenDialog) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => { onOpenChange(!open); setSubmenu(null); }}
        aria-label="More filters"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`h-8 flex items-center gap-1.5 pl-3 pr-2 rounded-lg border border-dashed text-[12px] font-medium transition ${
          open
            ? "border-gray-400 text-gray-700"
            : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
        }`}
      >
        {alone ? <ListFilter size={13} /> : <Plus size={13} />}
        {alone ? "Filters" : "More filters"}
        {activeHidden > 0 ? (
          /* The same light indigo the picked values wear in the row — this
            * badge counts filters that are doing exactly that, out of sight. */
          <span className="ml-0.5 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
            {activeHidden}
          </span>
        ) : matching.length > 0 && (
          /* Yellow, like every other mark the search leaves, and only when
            * nothing in here is narrowing — the same order of precedence a
            * filter's own chip uses. */
          <span className="ml-0.5 shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-200 text-yellow-900 text-[10px] font-bold flex items-center justify-center">
            {matching.length}
          </span>
        )}
      </button>

      {/* Hung from the chip's right edge rather than its left. The values panel
        * opens to the side of this one, so starting further left is what gives
        * that panel room before it has to flip. */}
      {open && (
        <div
          role="menu"
          ref={placeMenu}
          style={{ maxHeight: menuMax }}
          className="absolute z-40 top-full right-0 mt-2 w-[220px] flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 py-1.5"
        >
          {/* The list is the part that gives: the footer keeps its height and
            * the box keeps its ceiling, so what scrolls is the names. */}
          <div className="min-h-0 flex-1 overflow-y-auto" onScroll={alignSub}>
            {filters.length === 0 && (
              <p className="px-4 py-3 text-[12px] text-gray-400">
                Every filter is already in the bar.
              </p>
            )}
            {filters.map((f) => (
              <button
                key={f.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(f.id, el);
                  else rowRefs.current.delete(f.id);
                }}
                type="button"
                role="menuitem"
                aria-expanded={submenu === f.id}
                onClick={() => setSubmenu((s) => (s === f.id ? null : f.id))}
                className={`w-full flex items-center gap-2 px-4 py-2 text-[13px] text-left transition ${
                  submenu === f.id ? "bg-gray-50 text-gray-900" : "text-gray-800 hover:bg-gray-50"
                }`}
              >
                <span className="flex-1 truncate">
                  <Highlight text={f.label} query={query} />
                </span>
                {/* A filter only reaches this menu by being pushed out of the
                  * row, so when one of them is narrowing the list its count has
                  * to be readable here — otherwise the list is being filtered
                  * by something with no visible sign of it. */}
                {f.active && (f.value?.length ?? 0) > 0 ? (
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                    {f.value!.length}
                  </span>
                ) : matching.some((m) => m.id === f.id) && (
                  /* Which of them the search found, and how many values in it.
                    * Without this the menu opens on a list of names and leaves
                    * the reader to click through them one at a time. */
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-200 text-yellow-900 text-[10px] font-bold flex items-center justify-center">
                    {(f.options ?? []).filter((o) => matchesQuery(o, term)).length}
                  </span>
                )}
                <ChevronRight size={13} className="shrink-0 text-gray-400" />
              </button>
            ))}
          </div>

          {onOpenDialog && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { close(); onOpenDialog(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-indigo-600 hover:bg-gray-50 transition"
              >
                <Settings size={14} />
                Default filters
              </button>
            </>
          )}

          {/* The picked filter's own values, alongside rather than nested.
            *
            * A filter with a list shows the list. One without — a numeric range
            * — shows its `panel`: the range's fields themselves, not the chip
            * the row would carry, whose own dropdown would open trapped inside
            * this scroller. */}
          {openFilter && !openFilter.options && (
            <div
              ref={subRef}
              style={{ top: subTop, maxHeight: `calc(100vh - ${EDGE * 2}px)` }}
              className={`absolute w-[260px] overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 p-4 ${
                side === "left" ? "right-full mr-1" : "left-full ml-1"
              }`}
            >
              {openFilter.panel ?? openFilter.node}
            </div>
          )}
          {/* No scroll on this panel: the list inside owns it, which is what
            * keeps the find field pinned above the values instead of scrolling
            * away with them. */}
          {openFilter?.options && (
            <div
              ref={subRef}
              style={{ top: subTop, maxHeight: `calc(100vh - ${EDGE * 2}px)` }}
              className={`absolute w-[220px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 ${
                side === "left" ? "right-full mr-1" : "left-full ml-1"
              }`}
            >
              {/* The same list as the control's own dropdown, find field and
                * all. A filter that happens to be behind this menu is not a
                * different kind of filter, so it should not read as one. */}
              {/* Keyed by filter, so moving to another one remounts the list
                * rather than re-rendering it with new props. Without the key
                * React keeps the same instance: the find term from the filter
                * you just left survives into the next one — leaving it looking
                * empty — and the effect that puts the caret in the field never
                * runs again, so the field never takes focus a second time. */}
              <FilterValueList
                key={openFilter.id}
                /* Same rule as the dropdown: a value picked somewhere else
                  * stays listed here, or the only way to remove it is to clear
                  * every filter. See FilterSelect. */
                options={withPicked(openFilter.options, openFilter.value)}
                value={openFilter.value ?? []}
                onToggle={(o) => toggle(openFilter, o)}
                counts={openFilter.counts}
                label={openFilter.label}
                query={query}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── The dialog ──────────────────────────────────────────────────────────────

/** Every filter the screen has, grouped, each with a checkbox saying whether
 *  it rides in the bar. Ticking edits a draft; Save Filters is what commits
 *  it, so a set of changes can be abandoned. */
function FilterDialog({
  open, filters, pinned, onOpenChange, onPinnedChange,
}: {
  open: boolean;
  filters: FilterDescriptor[];
  pinned: string[];
  onOpenChange: (next: boolean) => void;
  onPinnedChange: (next: string[]) => void;
}) {
  /** What the dialog shows, top to bottom, and what is ticked. The bar shows
   *  the ticked ones left to right in exactly this order, so dragging a row
   *  here is how a filter moves in the bar. Nothing is kept until Save. */
  const [draft, setDraft] = useState<{ order: string[]; checked: string[] } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; after: boolean } | null>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const refocus = useRef<string | null>(null);

  const groupOf = (id: string) => filters.find((f) => f.id === id)?.group ?? null;

  /** One section per group, in the order the screen first names them — a
   *  group the screen names twice is still one section. Inside a section,
   *  what is in the bar comes first, in bar order, then the rest in the
   *  screen's own order. */
  function initialOrder(): string[] {
    const groups: (string | null)[] = [];
    for (const f of filters) if (!groups.includes(f.group ?? null)) groups.push(f.group ?? null);
    return groups.flatMap((g) => {
      const inGroup = filters.filter((f) => (f.group ?? null) === g);
      const onBar = pinned.filter((id) => inGroup.some((f) => f.id === id));
      return [...onBar, ...inGroup.map((f) => f.id).filter((id) => !onBar.includes(id))];
    });
  }

  const working = draft ?? { order: initialOrder(), checked: pinned };
  const byId = new Map(filters.map((f) => [f.id, f]));
  const ordered = working.order.map((id) => byId.get(id)).filter((f): f is FilterDescriptor => !!f);
  const sections: { label: string | null; items: FilterDescriptor[] }[] = [];
  for (const f of ordered) {
    const label = f.group ?? null;
    const last = sections[sections.length - 1];
    if (last && last.label === label) last.items.push(f);
    else sections.push({ label, items: [f] });
  }

  /** Only these can be ticked, so only these are what "all" means here — a
   *  range never rides in the row and its checkbox is disabled. */
  const pinnable = filters.filter((f) => f.pinnable !== false).map((f) => f.id);

  /** Moves a row before or after another in the same section. Sections do
   *  not trade rows: a filter's group is what the screen says it is. */
  function move(id: string, target: string, after: boolean) {
    if (id === target || groupOf(id) !== groupOf(target)) return;
    const order = working.order.filter((x) => x !== id);
    const at = order.indexOf(target) + (after ? 1 : 0);
    order.splice(at, 0, id);
    setDraft({ ...working, order });
  }

  /** Arrow keys on the handle do what a drag does, one place at a time. */
  function nudge(id: string, by: -1 | 1) {
    const section = sections.find((sec) => sec.items.some((f) => f.id === id))!.items;
    const at = section.findIndex((f) => f.id === id);
    const target = section[at + by];
    if (!target) return;
    move(id, target.id, by === 1);
    refocus.current = id;
  }

  // A moved node can drop focus in some browsers; put it back on the handle.
  useEffect(() => {
    if (!refocus.current) return;
    handles.current.get(refocus.current)?.focus();
    refocus.current = null;
  });

  function close(next: boolean) {
    if (!next) setDraft(null);
    onOpenChange(next);
  }

  function save() {
    if (draft) onPinnedChange(draft.order.filter((id) => draft.checked.includes(id)));
    setDraft(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[560px] max-h-[80vh] grid-rows-[auto_auto_1fr_auto] p-0 gap-0"
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-[15px] font-semibold text-gray-900">
            Default filters
          </DialogTitle>
          <DialogDescription className="text-[12px] text-gray-500">
            Pick the filters the bar starts with, and drag them into the order it
            shows them. The rest stay one click away, and a filter you switch on
            is shown whether or not it is in here.
          </DialogDescription>
        </DialogHeader>

        {/* The same control the Portal's toolbar uses, doing the same job on a
          * different list. Nothing is narrowing this one, so it reads "all". */}
        <div className="px-5 pb-3 flex items-center border-b border-gray-100">
          <FilterSelectAll
            visible={pinnable}
            selected={new Set(working.checked)}
            onChange={(next) => setDraft({ ...working, checked: [...next] })}
            narrowed={false}
          />
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {sections.map(({ label, items }, i) => (
            <FilterGroup key={label ?? `group-${i}`} label={label ?? ""}>
              <ul className="flex flex-col -mx-1.5">
                {items.map((f) => {
                  const marker = over && over.id === f.id && drag && drag !== f.id
                    ? over.after
                      ? "shadow-[inset_0_-2px_0_0_var(--color-semantic-primary-main)]"
                      : "shadow-[inset_0_2px_0_0_var(--color-semantic-primary-main)]"
                    : "";
                  return (
                    <li
                      key={f.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", f.id);
                        setDrag(f.id);
                      }}
                      onDragOver={(e) => {
                        if (!drag || groupOf(drag) !== groupOf(f.id)) return;
                        e.preventDefault();
                        const box = e.currentTarget.getBoundingClientRect();
                        const after = e.clientY > box.top + box.height / 2;
                        if (over?.id !== f.id || over.after !== after) setOver({ id: f.id, after });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (drag && over) move(drag, over.id, over.after);
                        setDrag(null);
                        setOver(null);
                      }}
                      onDragEnd={() => { setDrag(null); setOver(null); }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${marker} ${
                        drag === f.id ? "opacity-40" : ""
                      }`}
                    >
                      <Button
                        ref={(el) => { if (el) handles.current.set(f.id, el); else handles.current.delete(f.id); }}
                        variant="neutral"
                        size="icon-xs"
                        aria-label={`Move ${f.label}`}
                        title="Drag to reorder, or use the arrow keys"
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") { e.preventDefault(); nudge(f.id, -1); }
                          if (e.key === "ArrowDown") { e.preventDefault(); nudge(f.id, 1); }
                        }}
                        className="cursor-grab active:cursor-grabbing text-gray-400"
                      >
                        <GripVertical />
                      </Button>
                      <label
                        className={`flex flex-1 items-center gap-2.5 py-1 ${f.pinnable === false ? "opacity-60" : "cursor-pointer"}`}
                      >
                        <input
                          type="checkbox"
                          disabled={f.pinnable === false}
                          checked={working.checked.includes(f.id)}
                          onChange={() => setDraft({
                            ...working,
                            checked: working.checked.includes(f.id)
                              ? working.checked.filter((p) => p !== f.id)
                              : [...working.checked, f.id],
                          })}
                          aria-label={`Keep ${f.label} in the filter bar`}
                          className="w-[15px] h-[15px] shrink-0 accent-indigo-600"
                        />
                        <span className="text-[13px] text-gray-800">{f.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </FilterGroup>
          ))}
        </div>

        <DialogFooter className="mx-0 mb-0 px-5 py-3 border-t border-gray-100 bg-white sm:justify-end">
          <Button variant="outline" onClick={() => close(false)}>Cancel</Button>
          <Button onClick={save}>Save Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── The bar ─────────────────────────────────────────────────────────────────

export function FilterBar({
  filters, leading, onClear, right, pinned, onPinnedChange, disabledReason,
}: {
  /** The filters, as data — the bar carries a subset and the dialog the lot. */
  filters: FilterDescriptor[];
  /** Shown ahead of the filters — the search, normally. */
  leading?: ReactNode;
  /** Pass only while something is actually filtering; the link is what
   *  undoes every filter at once, so it has nothing to say otherwise. */
  onClear?: () => void;
  /** Pinned to the far right — a result count, a sort. */
  right?: ReactNode;
  /** Ids of the filters the bar carries. Omit and it carries all of them. */
  pinned?: string[];
  onPinnedChange?: (next: string[]) => void;
  /** Set while the filters have no say — e.g. the screen is showing only the
   *  selection. The filters, More filters and Clear stay visible with their
   *  values, greyed out and inert, and this is the tooltip that says why. The
   *  sort and the grouping in `right` keep working. */
  disabledReason?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const off = !!disabledReason;
  const [menuOpen, setMenuOpen] = useState(false);
  /** The row's contents, held still while the More filters menu is open.
   *
   *  Ticking a value in there makes that filter active, and an active filter
   *  outranks an idle one for a place in the row — so without this the filter
   *  you were picking from jumped out of the menu the instant you touched it,
   *  taking its own list of values with it. Picking a second value meant
   *  reopening the menu. The move still happens; it waits for the menu to shut,
   *  which is when you are done choosing. */
  const [frozen, setFrozen] = useState<string[] | null>(null);

  // The room the row's controls actually have, and what each one takes. See
  // the note by ROW_GAP above.
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const [room, setRoom] = useState(Number.POSITIVE_INFINITY);
  /** Measured control widths, in state rather than a ref because the fitting
   *  happens during render and a ref may not be read there. Keyed by id AND by
   *  whether the filter is active, since an active control carries a count
   *  badge and is the wider of the two. */
  const [widths, setWidths] = useState<Record<string, number>>({});

  /** Attached as a ref callback rather than watched from an effect, so the
   *  width is known at commit — the first paint is already the fitted row,
   *  without waiting on the observer's first delivery. The observer then keeps
   *  it honest as the window moves. */
  const measureRoom = useCallback((el: HTMLDivElement | null) => {
    chipsRef.current = el;
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    setRoom(el.clientWidth);
    observer.current = new ResizeObserver(([entry]) => setRoom(entry.contentRect.width));
    observer.current.observe(el);
  }, []);

  /* The strip corrects itself when it overflows.
   *
   * `room` comes from a ResizeObserver on the strip, which is right when the
   * WINDOW changes — but not when what the strip must carry changes while its
   * box does not. Clear Filters appearing, a sort growing to a longer field,
   * a chip widening as it fills: the box is still the same width, so no
   * observer fires, and the fitting runs on room that no longer covers the
   * contents. What paints is the strip spilling over the sort beside it.
   *
   * So: if the rendered strip is wider than its box, take the difference off
   * the room and let the fitting run again. It converges — each pass sheds at
   * least the overflow — and any real resize restores the true width.
   *
   * NOT while the row is frozen (the More filters menu is open). A frozen row
   * cannot shed anything, so the overflow never shrinks and every pass took
   * it off the room again — down to zero. Shutting the menu then fitted the
   * row into no room at all, and every filter vanished into "Filters". */
  useEffect(() => {
    const el = chipsRef.current;
    if (!el || frozen) return;
    const over = el.scrollWidth - el.clientWidth;
    if (over > 1) setRoom((r) => Math.max(0, (Number.isFinite(r) ? r : el.clientWidth) - over));
  });

  /** Shutting the menu: thaw the row and re-read the room it really has. */
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setFrozen(null);
    if (chipsRef.current) setRoom(chipsRef.current.clientWidth);
  }, []);

  /* The window moving shuts the menu. A frozen row cannot follow it, so a
   * narrower window left the row running over the sort beside it, with the
   * menu still hanging from where the chip used to be. */
  useEffect(() => {
    if (!menuOpen) return;
    window.addEventListener("resize", closeMenu);
    return () => window.removeEventListener("resize", closeMenu);
  }, [menuOpen, closeMenu]);

  /** One stable callback for every control: it reads its own key off the node,
   *  so React never has to detach and reattach these between renders. The
   *  identity check is what stops a measurement from looping. A control sitting
   *  in More filters keeps the width it had when it was last in the row. */
  const measureChip = useCallback((el: HTMLElement | null) => {
    const key = el?.dataset.filterKey;
    if (!el || !key) return;
    const w = el.offsetWidth;
    setWidths((prev) => (prev[key] === w ? prev : { ...prev, [key]: w }));
  }, []);

  // An active filter is never out of sight: whatever is narrowing the list
  // shows in the bar, appended after the pinned ones if it was not pinned.
  /** Every filter's label, for the Sort and Group in `right`. Keyed on the
   *  labels themselves, since `filters` is a new array every render. */
  const labelKey = filters.map((f) => f.label).join("\u0000");
  const allLabels = useMemo(() => (labelKey ? labelKey.split("\u0000") : []), [labelKey]);

  // In the order the Default filters dialog left them — `pinned` is ordered.
  const pinnedShown = pinned
    ? pinned.map((id) => filters.find((f) => f.id === id)).filter((f): f is FilterDescriptor => !!f)
    : filters;
  const activeExtra = pinned
    ? filters.filter((f) => f.active && !pinned.includes(f.id) && f.pinnable !== false)
    : [];
  const candidates = [...pinnedShown, ...activeExtra];

  // Take from the front until the room runs out. Order is the descriptor order,
  // so widening the window brings back the filter that left last.
  const reserved =
    (widths.__more ?? widths["__more:alone"] ?? MORE_GUESS) + ROW_GAP + BADGE_SLACK +
    (onClear ? (widths.__clear ?? CLEAR_GUESS) + ROW_GAP : 0);

  const fitted = fitToRow(candidates, (f) => widths[chipKey(f)], room - reserved);
  const shown = frozen
    ? candidates.filter((f) => frozen.includes(f.id))
    : fitted.shown;
  const spilled = frozen
    ? candidates.filter((f) => !frozen.includes(f.id))
    : fitted.spilled;

  const rest = [
    ...spilled,
    ...filters.filter(
      (f) => !candidates.some((c) => c.id === f.id) && f.pinnable !== false,
    ),
  ];

  const canPin = Boolean(pinned && onPinnedChange);

  return (
    // flex-wrap so the count and the sort drop to a second line when the row
    // can no longer hold them beside the filters, rather than being squeezed
    // out of readability. The filter controls never wrap: what does not fit
    // there goes into the menu instead.
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 shrink-0">
      {leading}

      {/* The strip the controls live in, and More filters and Clear with them —
        * the menu belongs against the last control, not across the row. `flex-1`
        * with a zero basis is what makes this width independent of how much is
        * in here; sized to content, measuring it would change it. */}
      {/* The floor is the More filters chip itself: however narrow the window
        * gets, the way to reach the filters that left has to stay on screen.
        * Below it the right-hand furniture gives way instead — it is a count
        * and a sort, and neither is the way back to a filter.
        *
        * "Gives way" means the sort and the grouping TRUNCATE, and making that
        * happen took getting the floor honest. With a basis of 0 and a floor
        * of just the More chip, flexbox saw this strip as costing nothing: it
        * handed the right-hand slot everything it asked for, squeezed the
        * strip to a width narrower than its own contents, and the contents ran
        * straight over the sort — at 940px Clear Filters crossed it by 21px,
        * at 900px by 61. Flexbox could not see that overflow, because a box's
        * content does not enter the calculation once the basis is 0.
        *
        * The floor now names what the strip actually cannot go below — the
        * chip AND Clear Filters — so the two really do compete, and the
        * shrinkable side gives. (Giving the strip a real basis instead makes
        * them wrap, which is worse: a second line for a control that could
        * simply be shorter.) */}
      <div
        ref={measureRoom}
        style={{
          minWidth:
            (widths["__more:alone"] ?? widths.__more ?? MORE_GUESS) +
            (onClear ? (widths.__clear ?? CLEAR_GUESS) + ROW_GAP : 0),
        }}
        /* Nothing is clipped here, and both attempts to clip were bugs:
           `overflow-hidden` swallowed the dropdowns, which open BELOW the
           strip, and `overflow-x-clip` then swallowed the More filters
           submenu, which opens to the SIDE. The fitting below is what keeps
           the controls inside the strip, so there is nothing left to clip. */
        /* Frozen: the strip keeps the hover (for the tooltip) while every
           control in it is `inert` — no click, no focus, no hit. */
        title={disabledReason}
        aria-disabled={off || undefined}
        className={`flex-1 min-w-0 flex items-center gap-2 transition-opacity ${off ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {shown.map((f) => (
          <div key={f.id} ref={measureChip} data-filter-key={chipKey(f)} inert={off} className="shrink-0">
            {f.node}
          </div>
        ))}

        <div
          ref={measureChip}
          data-filter-key={shown.length === 0 ? "__more:alone" : "__more"}
          inert={off}
          className="shrink-0"
        >
          <MoreFiltersMenu
            filters={rest}
            onOpenDialog={canPin ? () => setDialogOpen(true) : undefined}
            alone={shown.length === 0}
            open={menuOpen}
            onOpenChange={(next) => {
              // Freeze on the way open, thaw on the way shut — at which point
              // the fitting runs again and whatever you switched on claims its
              // place in the row.
              if (!next) return closeMenu();
              setMenuOpen(true);
              setFrozen(shown.map((f) => f.id));
            }}
          />
        </div>

        {onClear && (
          <button
            type="button"
            ref={measureChip}
            data-filter-key="__clear"
            inert={off}
            onClick={onClear}
            className="shrink-0 px-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Shrinkable, so what gives when the row is tight is the sort and the
        * grouping rather than the filters — and they give by getting shorter,
        * not by wrapping. */}
      {right && (
        <BarFieldsContext.Provider value={allLabels}>
          <div className="ml-auto min-w-0 flex items-center gap-2">{right}</div>
        </BarFieldsContext.Provider>
      )}

      {canPin && (
        <FilterDialog
          open={dialogOpen}
          filters={filters}
          pinned={pinned!}
          onOpenChange={setDialogOpen}
          onPinnedChange={onPinnedChange!}
        />
      )}
    </div>
  );
}
