# Filter system (`FilterBar` + Tasks + Portal + a project's Assets) — hand-off

> **Ticket:** [CP-14060](https://theconstellationagency.atlassian.net/browse/CP-14060) ·
> **Hand-off:** [FilterBar Hand-off](https://claude.ai/code/artifact/777186fe-872f-425f-bff4-b4fc2ce82306)
>
> **Who this is for.** You are picking up the shared filter system **inside this repo**.
> It is written to be read by you and by Claude Code in your session — point it at this
> file first.
>
> Tags: **[Observed]** = it is in the code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> **Sibling tickets.** **Sort and Group by are their own ticket** — `HANDOFF-grouping.md`,
> [CP-14194](https://theconstellationagency.atlassian.net/browse/CP-14194), [hand-off](https://claude.ai/code/artifact/6c1b112f-aef2-4bd9-9d82-a79851c5f38f) — and §5.18 is the seam. The global search is
> `HANDOFF-search.md`, which meets this one at exactly one point, described in §7; read it
> before you touch either side. The header this filter row rides in is
> `HANDOFF-scroll-away-header.md`. The Portal screen these controls sit on is
> `HANDOFF-portal.md`.
>
> **Read §2 before anything else.** The "filters are data, not markup" rule is why every
> other piece of this looks the way it does. **Then run `npm test`** (§14) and keep §15,
> the acceptance checklist, open beside you.
>
> **Code references name a symbol, not a line.** `FilterBar.tsx` → `withPicked` means
> search the file for that name. Line numbers rotted within a week of the first draft of
> this document; names have not. Where a line is given (§4), it is as of `8221f44`.

---

## 0. State of the branch — read this first

Branch `dev`, at `8221f44`, and **all of it is live** — `origin/main` is at the same
commit, and pushing `main` is the deploy. [Observed]

The filter system arrived in `26dd352` and has been worked on heavily since. This
document has been rewritten around the commits that touch it: [Observed]

| | |
|---|---|
| `5ffe838` | the row fits the window; what does not fit goes in the menu (§5.11) |
| `7de38f9` | the strip clips sideways, not downwards (§5.11) |
| `9376c6f` | active filters outrank idle ones for a place in the row (§5.12) |
| `695d870` | reachable option values sort above dead ones (§5.14) |
| `cc17d7a` | Default filters, and values open on click (§5.6, §5.7) |
| `730593b` | the row holds still while the menu is open (§5.13) |
| `8f2b683` | Select all inside the Default filters dialog (§5.7) |
| `0845b28` | the clear badge holds its size (§5.2) |
| `c6d6e34` | a find field at the head of every menu (§5.15) |
| `87ac716` | a range wears a select box (§5.16) |
| `416ad87` | the Owner filter counts and matches the same thing (§5.4) |
| `5c0854f`, `0fd7c0c` | the range ends behave; one list of values in both places that show one |
| `fcc1971`, `efd19cd` | Select all on the dialog's left edge; the menu hangs from the right |
| `a9b3091` | Sort and Group by offer every filter, and the grouping cuts the grid (§5.18) |
| `d6748f9`, `1ea4460` | the seam with the platform search: marks, and the narrowed count (§7) |
| `9180357`, `5bd9fc1`, `5817f3e`, `2145da8` | the grouping's own commits — see `HANDOFF-grouping.md` |
| `daa3587` | the sort and the grouping go in the URL, and a field control can show what it has not heard of (§5.18) |
| `39d4f6a` | Group by moves out into its own ticket |
| `c8d17fc` | a match inside a filter the row could not fit is no longer silent (§7) |
| `a5fc840` | the search keeps its caret when it opens that menu (§5.15) |
| `1de1e0e` | the More filters menu uses the room it has, and values open beside their row (§5.6) |
| `48cc6d4`, `a77a8a1` | a filled control shows its values as chips; the count badge goes (§5.1, §5.2) |
| `67e7551`, `34a4f51` | the sort and group selects take the width of what is chosen (§5.18) |
| `4bc6585` | the row's floor is honest, so the sort gives way instead of being overlapped (§5.11) |
| `da5a621` | a chip is never narrower than its own floating label (§5.1) |
| `be126b3` | the search marks a filter and no longer opens it (§7) |
| `4b35624` | it marks the filter's name too, not only its values (§7) |
| `f6a8870`, `0dc698c`, `2c75ed4` | a value picked in another folder stays removable, and the empty grid says which kind of empty (§5.5) |
| `8f8ec42` | the row corrects itself when it overflows without being resized (§5.11) |
| `0087578`, `d4cf5f9` | a chip on a card is a filter you can see: clicking it toggles that filter (§5.20) |
| `c4432a6` | a screen can lead the row with filters of its own — the Alert filter on a signal project's Assets (§3, §5.19) |
| `c2af873` | a row missing the value sorts last in **both** directions — it did not (§5.18) |
| `ccf7119` | unit tests for the pure rules, `npm test` (§14) |
| `8221f44` | the drifted docs of §11 corrected in the code and the Component Library |

**This document covers the filter system only.** Other work has landed on these same
screens — an asset-selection feature, a notice above the Portal grid, card and frame
work — and is deliberately not here. [Observed]

Deployment, from the project's standing rules: pushing `main` deploys straight to
production on Vercel, and that has already happened — this is not waiting on a review.
[Observed]

The defect this document used to lead with — §5.4, a count of 429 over an empty table —
is fixed. The section is kept, because *why* it happened is the most useful thing in
here: two functions answering the same question differently. [Observed]

---

## 1. Overview

A single filter row, shared by every screen that narrows a list. A screen declares *what*
its filters are; it never draws one. The row carries a chosen subset of filters, keeps
the rest one click away behind **More filters**, shows how many results each option would
leave, and fits itself to the window on one line — what does not fit goes into the menu,
never onto a second row.

Three screens consume the row today: **Tasks** (7 filters, tab-dependent), **Portal**
(23 selects + 4 numeric ranges), and a **signal project's Assets** tab, which reuses the
Portal's whole filter pane and adds one filter of its own (§5.19). Five more screens use
`FilterCount` alone. [Observed]

---

## 2. The core rule: filters are data

`FilterBar` does **not** take `children`. It takes `filters: FilterDescriptor[]`.
[Observed — `components/ui/FilterBar.tsx` → `FilterBar` props]

This is load-bearing. The bar has to *know* its filters, not merely render them, because
it independently needs to:

- show only the pinned subset horizontally, and append any filter that is currently
  active even if unpinned;
- offer every remaining filter — **with that filter's own options** — inside the
  More filters menu, without reaching into a rendered React element;
- drive the Add Filters dialog's grouped checkbox list.

None of that is possible through an opaque `children`. [Observed — the comment above
`FilterDescriptor` in `FilterBar.tsx` says exactly this]

```ts
export interface FilterDescriptor {
  id: string;                   // stable across renders — this is what gets persisted
  label: string;
  group?: string;               // section heading in the dialog
  node: ReactNode;              // the control itself
  active?: boolean;             // is it currently narrowing the list?
  pinnable?: boolean;           // false ⇒ never rides in the horizontal row
  options?: readonly string[];  // lets More filters offer options without reaching in
  value?: string[];
  onChange?: (next: string[]) => void;
  counts?: Record<string, number>;
}
```
[Observed — `FilterBar.tsx` → `FilterDescriptor`]

**Implication for you:** a new filter is a new entry in a screen's descriptor array. If
you find yourself writing filter markup in a page component, you have taken a wrong turn.

---

## 3. Screens & routes

| Route | Screen | Filters | Pinned by default | Source tag |
|---|---|---|---|---|
| `/tasks` | Task Manager | 7, varying by tab | all 7 | [Observed — `app/tasks/page.tsx` → `usePinnedFilters`] |
| `/portal` | Asset Portal | 23 selects + 4 ranges | 5 (`fileType`, `entityType`, `brands`, `collection`, `shape`) | [Observed — `app/portal/page.tsx` → `usePinnedFilters`] |
| `/projects/[id]/assets` | A signal project's Assets (e.g. Penske Honda Evergreen) | the Portal's set + **Alert** | 5 (`alert`, `model`, `trim`, `tags`, `collection`) | [Observed — `components/projects/SignalAssets.tsx` → `usePinnedFilters`] |

`/tasks` has two tabs, `alerts` and `tasks`, and they do not offer the same filters:
`groups` and `recovery` are alerts-only; `relationship` is tasks-only. [Observed —
`components/tasks/TaskFilterBar.tsx` → `TAB_FIELDS`]

The signal project's Assets tab is the first screen to reuse `PortalFilterPanel`
wholesale rather than build a descriptor array of its own. Its pinned set has its own key,
`constellation:signal-assets-pinned-filters:v1`. [Observed]

**`FilterCount` alone** — the `shown / total` line, no row — is used by `/projects`, and by
a project's overview, Offers, Templates and Logos & Backgrounds. [Observed]

The Component Library dialog also renders every primitive in isolation for preview.
[Observed — `components/ui/ComponentLibraryDialog.tsx`]

---

## 4. Components

All in `components/ui/FilterBar.tsx` unless noted.

### 4.1 Exported

| Name | Purpose | Line |
|---|---|---|
| `FilterBar` | The row. Fits controls to the width, overflows the rest to the menu. | 1698 |
| `FilterSelect` | Multi-select: find field, counts, keyboard walk. The workhorse. | 121 |
| `FilterRange` | Numeric span as a select box: From/To boxes and a dual slider. | 687 |
| `FilterSelectAll` | Selects everything a list is showing. See §5.17. | 914 |
| `FilterCount` | `shown / total noun`, with a tooltip. | 955 |
| `FilterSort` | Sort field `<select>` + direction toggle. **CP-14194** — `HANDOFF-grouping.md` §2. | 983 |
| `FilterCategorize` | Group-by field `<select>`. **CP-14194** — `HANDOFF-grouping.md` §2. | 1186 |
| `FilterSectionHeader` | The rule above one section of a grouped list. **CP-14194**. | 1130 |
| `FilterGroup` | Labelled section, used by the dialog. | 893 |
| `FilterSearch` | Per-screen text input. | 42 |
| `usePinnedFilters` | Per-screen pinned set, persisted. | 630 |
| `countFacet<T>` | Generic per-option counting. | 82 |
| `fieldsFromFilters` | Pure: the field list both Sort and Group by offer. **CP-14194**. | 1065 |
| `groupByValue<T>` | Pure: a list cut into sections by one field. **CP-14194**. | 1099 |
| `fitToRow<T>` | Pure: which controls fit a width, which spill. See §5.11. | 596 |

**`FilterSearch` is exported but no screen uses it.** Both screens read the platform
search from context instead. Its only consumer is the Component Library preview.
[Observed — grep of `@/components/ui/FilterBar` imports across `app/`, `components/`,
`lib/`, at `521cc43`]. **`FilterGroup` likewise** is used by the dialog internally and by the preview,
never by a screen. [Observed]

> Note a name collision: `components/competitive-intelligence/CIBrowseView.tsx`
> defines its own local `FilterGroup` with a different signature (`title`, `tag`). It is
> unrelated to this one. [Observed]

### 4.2 Internal

`byAvailability` and `withPicked` are exported only so the tests can reach them; no
screen imports them. [Observed]

- **`FilterOption`** (line 469) — one checkbox row: highlight, count, disabled state,
  keyboard cursor position.
- **`byAvailability`** (line 111) — the option sort of §5.14.
- **`withPicked`** (line 583) — a menu's option list with anything already picked added
  back, so a value the current screen no longer offers is still there to untick. See
  §5.5.
- **`FilterValueList`** (line 343) — a filter's values plus the find field above them, shared by the
  dropdown and the More filters panel. Owns the typed term and the keyboard cursor; the
  caller owns the values. See §5.15.
- **`MoreFiltersMenu`** (line 1278) — the `+ More filters` chip and its side panel.
  Controlled: the bar owns its open state, for the reason in §5.13.
- **`FilterDialog`** (line 1593) — the **Default filters** modal.

### 4.3 Screen configuration modules

- `components/tasks/TaskFilterBar.tsx` — exports `TaskFilterBar`, `TaskFilters`,
  `EMPTY_FILTERS`, `hasAnyFilter`, `matchesTaskFilters`, `deriveTaskCounts`, and
  `compareTaskBy` for its Sort.
- `components/portal/PortalFilterPanel.tsx` — exports `PortalFilterPanel`,
  `PortalFilters`, `EMPTY_PORTAL_FILTERS`, `derivePortalOptions`, `derivePortalCounts`,
  `matchesPortalFilters`, `hasAnyPortalFilter`, `PORTAL_FILTER_LABELS`,
  `derivePortalRangeBounds` (§5.16), `ExtraPortalFilter` (§5.19), and the three that
  serve Sort and Group by: `portalValueOf`, `isPortalField`, `comparePortalBy` (CP-14194).

Both are configuration only. Neither draws a control. [Observed]

---

## 5. Behaviours to preserve

### 5.1 A filled control shows what is picked

Empty, the control is its **label**. Filled, the label rises small onto the stroke and
the **picked values take its place as chips** — the Material outlined-field pattern, for
its reason: a control showing what is chosen has nowhere left to say what it is choosing.
[Observed]

| | |
|---|---|
| Label, floated | 10px, `indigo-700`, `-top-[5px] left-2`, white horizontal padding cutting the border behind it |
| Value chip | 11px, `bg-indigo-50 text-indigo-700`, `rounded`, truncating at 88px |
| Ground, filled | **white** — it was `indigo-50`, which is now the chips' colour, and a chip cannot be read on a ground its own colour |
| Border, filled | `indigo-300` |

**Two chips, then a tally of the rest** — `Square` `Landscape` `+1`. The cap is not
cosmetic: the row measures its controls and refits them (§5.11), so an unbounded chip
would make *what fits* depend on *what is ticked*, and the row would reshuffle under the
pointer as you pick. [Observed]

> 🔴 **A chip must never be narrower than the label riding on its stroke.** Its width
> comes from its *value*, and a short value under a long name — `New` under
> `Vehicle condition` — left the label to wrap onto two lines and spill out of the box,
> over the band above. The label does not wrap, **and the same name is drawn a second
> time in flow at zero height**, so the chip takes whichever of value and label is wider.
> That is why the chip is a grid and its contents share one cell rather than stacking.
> Fixed in `da5a621`. [Observed — measured: the chip goes 84 → 106px for that pair, and
> the label lands on one 10px line inside it]

**A range shows its span in the same chip** — `600–1080`, `600+`, `≤1080`. An open end is
written as open rather than filled in with the bound it does not constrain. [Observed]

**The count badges wear the same light indigo as the chips** — on the More filters chip,
and on each row inside that menu. They count filters doing exactly what the chips show,
out of sight. The search's badges stay yellow: a different thing, a different colour.
[Observed]

> ⚠️ **This section used to be called "the row never changes width", and that promise is
> gone.** It was kept by never showing values: label as placeholder always, picks as a
> count. Showing them costs width — File Type goes **95px idle to 137px** with two values,
> Shape to **204px** with three — and on an 800px window one filled filter was enough to
> push another into More filters. The fitting handles it (§5.11, §5.12); what no longer
> holds is that the row is *stable* while you filter. Taken deliberately, by the designer,
> in exchange for being able to read what is set without opening anything. [Observed —
> measured before and after]

### 5.2 One way out, drawn one way

An active control carries a **plain X** — 18px, round, grey, darkening on hover — which
clears that filter alone. Undoing one filter never requires opening its menu. It is the
same X, in the same hit area, that clears the platform search and the grouping: one
gesture for "undo this control", drawn one way. [Observed]

> **What used to be here, and why it is worth knowing.** The X shared its place with a
> count of the picks and the two swapped on hover. That swap needed care — both sat in one
> grid cell with only their `visibility` changing, because an X is a shade wider than a
> digit and swapping with `hidden` made the whole control twitch under the pointer.
>
> §5.1's chips name the values, so the count was the same fact twice and went. **The
> swap, the grid cell and the twitch went with it** — a whole paragraph of care that
> existed only to serve a thing that is no longer there. Worth remembering when the next
> element earns its place in a control: what it costs is rarely just itself. [Observed]

### 5.3 Picked options stack to the top, frozen on open

Opening a menu snapshots what was already picked (`setPinned(value)`) and renders those
first, above a divider. The snapshot is deliberate: sorting live would make an option
**jump out from under the cursor** as you tick it. [Observed — `FilterSelect` →
`pinned`, `openMenu`]

### 5.4 Faceted counts — and the one place they lie

Each option shows `(N)`: how many items would survive **if you picked it**, counted
against every *other* filter but not against its own. That is why picking Make = BMW does
not drop every other make to `(0)`. [Observed — `FilterBar.tsx` → `countFacet`;
per-filter lifting in `deriveTaskCounts` and `derivePortalCounts`]

An option at `(0)` **stays listed but is disabled** — `cursor-not-allowed opacity-40`,
`title="No results with the filters already applied"`. Knowing a value exists and leads
nowhere beats a list that quietly shortens. A **picked** option is never disabled, so
there is always a way out of a dead combination. [Observed — `FilterOption`]

> #### ✅ FIXED — the counts and the rows now agree
>
> This section recorded a defect: on the **Alerts** tab, `Owner → "Assigned to me"`
> showed **(429)** and returned **0 rows**. Fixed in `416ad87`. [Observed]
>
> The cause was two functions disagreeing about what "Assigned to me" meant. Counting
> bucketed *anything that is not "Unassigned"* as assigned; matching required
> `owner === "John Doe"`. Alerts carry a QC group in `owner` and never a person, so every
> alert counted and none matched. [Observed]
>
> **The fix was the model, not the comparison.** `owner` was carrying two different
> things — a QC group on alerts, a person on tasks — so no single filter could read it
> and mean the same thing on both tabs. `TaskRow` now has a separate `assignee`, and one
> function, `ownerBucket`, is used by the matcher *and* the counter. They cannot drift
> again without someone deleting it. `owner` stays as the column's display string, and
> the Groups filter goes on reading it, which is correct for alerts. [Observed]
>
> Measured after the fix, from a clean state on each tab: [Observed]
>
> | tab | badge | rows returned |
> |---|---|---|
> | Alerts | Assigned to me (265) | 265 / 679 |
> | Alerts | Unassigned (414) | 414 / 679 |
> | Tasks | Assigned to me (160) | 160 / 991 |
> | Tasks | Unassigned (831) | 831 / 991 |
>
> Each pair partitions its tab exactly, and every badge matches what clicking it gives.
>
> The current user is no longer a literal in the filter: both the data and the matcher
> read `CURRENT_USER` from `lib/current-user.ts`, which the top bar and the projects
> screen already used. There is still no real session behind it. [Observed]

### 5.5 An active filter is never *silently* hidden

If a filter is narrowing the list but is not pinned, the bar **appends it anyway**, after
the pinned ones. [Observed]

This used to read "never hidden", and that was true when the row could wrap. It cannot
any more (§5.11), so on a narrow enough window an active filter does leave — after every
idle one has (§5.12). What survives is the promise underneath it: **you are never
filtered by something with no visible sign of it.** When an active filter is in the menu,
its count shows on the More filters chip and again on its own row inside the menu.
[Observed]

Hold that invariant. It is the reason for the chip badge, the per-row badge, and the
ordering rule — three pieces of behaviour that look unrelated until you know what they
are jointly protecting.

#### A pick outliving the options it came from

Options are **derived from what the screen is currently showing**, so a value picked in
one context can outlive the list that offered it — in Portal, a filter set in one folder
follows you into the next, where that folder's assets may offer nothing like it. The
result is a badge reading "1" over an empty grid, with nothing to untick. Two rules
close it: [Observed]

- **`withPicked` keeps a chosen value in the menu** whether or not the current options
  contain it. That is enough to make it removable, since a picked option is never
  disabled. [Observed — `FilterBar.tsx` → `withPicked`, used by `FilterSelect` and
  `MoreFiltersMenu`]
- **A filter that is narrowing is shown even where it has nothing to offer.** A filter
  with no options is otherwise not drawn — an empty select is worse than an absent one —
  but hiding one that is *doing something* removes the only sign on screen that anything
  is filtering, which is precisely the invariant above. [Observed —
  `PortalFilterPanel.tsx` → `has`]

The screen has to carry the other half of this: an empty list must say **which** kind of
empty it is, and a folder emptied by a stray pick has to name that pick and offer to drop
only it. That belongs to the screen rather than the bar — `HANDOFF-portal.md` §8 has the
three cases. [Observed]

### 5.6 More filters

The chip at the end of the controls — **against the last one, not across the row** —
listing every filter the bar is not showing. Clicking one opens **its own values
alongside**, not nested. [Observed]

**Values open on click, not hover.** On hover a list appeared and vanished as the
pointer crossed the menu on its way somewhere else, and there was no way to read one
without keeping the mouse still. Rows carry `aria-expanded`. [Observed]

**The menu hangs from the chip's right edge**, not its left. The values panel opens to the
side of it, so starting further left is what gives that panel room before it has to flip.
[Observed]

**The menu grows to 24px from the foot of the window, and only then scrolls.** It used to
cap at a flat 320px, so it scrolled with half the screen empty below it. The footer keeps
its height outside the scroller — what gives is the list of names. [Observed — measured:
on a 900px window it draws all 17 rows unscrolled; on a 600px window it stops at 24px and
shows 316 of 568px of content]

**The values panel opens beside the row that asked for it**, not at the top of the menu:
the row you clicked and the list that opened should be on one line, or the eye has to go
back and work out which. It leaves that line only when it would run off the bottom, and
then rises exactly far enough to keep its foot 24px clear. [Observed — measured: `Year`,
a short panel, aligns at 706→707; `Trim` and `Model`, 346px tall, both stop with their
foot at 24px rather than following their rows]

**Which side the panel opens on is decided, not fixed.** Right if there is room, left if
there is not and the other side has it, right again when neither does. Opening right
unconditionally ran a filter's whole list 212px past the edge of a 690px pane.
[Observed — measured]

**The values list is keyed by filter id.** Without the key React keeps one instance and
only swaps its props, so moving to a second filter carried the first one's find term into
it — leaving the list looking empty — and never re-ran the effect that puts the caret in
the field. [Observed]

A filter with **no list of values** — a range — shows its **fields** in that panel:
From/To and the slider, `FilterRangeFields`, passed as the descriptor's `panel`. Before
that it opened onto nothing, and then onto the range's *chip*, whose own dropdown opened
inside the panel's scroller and was clipped to a sliver with scrollbars on both axes.
**Anything shown in this panel must not open a popover of its own** — the panel scrolls,
so it clips. [Observed — reported from the screen; fixed in `587841b`]

The chip reads **"More filters"** with a plus. When the row is too narrow to carry any
control at all it reads **"Filters"** with the filter glyph, because then it is not
"more" of anything. It is never hidden: the strip cannot shrink below it. [Observed]

Its footer opens the dialog: settings glyph, **"Default filters"**. [Observed]

### 5.7 The Default filters dialog

Every filter, grouped by `group`, each with a checkbox for "keep in the bar". Ticking
edits a **draft**; only **Save Filters** commits, so a set of changes can be abandoned
with Cancel or by closing. [Observed]

It is called Default filters, under a settings glyph, because it sets what the bar
*starts* with — not what is available. Its copy says the part that is easy to miss: a
filter you switch on shows in the bar whether or not it is ticked here (§5.5).
[Observed]

A **Select all** sits at its head — the same `FilterSelectAll` the Portal's toolbar uses.
It counts only what can be ticked: a filter with `pinnable: false` is disabled and is
not part of what "all" means. Measured as 15 of 19 on the Portal, the four disabled
untouched. [Observed]

Filters with `pinnable: false` render disabled at `opacity-60`. **Nothing sets that flag
any more** — ranges did until they became select boxes (§5.12) — but the rule is still
honoured throughout. [Observed]

**It also sets the order.** Each row carries a grip handle; drag a row, or focus its
handle and press ↑/↓, to move it. **The bar shows the ticked filters left to right in
the dialog's top-to-bottom order** — that is the whole model, and nothing else in the
bar decides where a filter sits. [Observed — `FilterDialog`; measured: moving Entity
Type above File Type and Tags above Brands, then saving, gives the row `Entity Type ·
File Type · Tags · Brands · Shape · Collection`]

- **Rows move within their group, not across.** A filter's group is what the screen
  says it is; a drag over another group's rows is not accepted. So on a screen with
  several groups the bar runs group by group, in the screen's group order. [Observed]
  Whether a filter should be able to cross groups is open (§13). [Inferred]
- **A group the screen names twice is one section.** The signal project's Assets named
  Organization for its Alert filter and again for the Portal's own, and the dialog drew
  two Organization sections. [Observed]
- **On open, each section lists what is in the bar first, in bar order**, then the rest
  in the screen's order. Ticking or unticking does not move a row while the dialog is
  open — rows jumping under the pointer is what §5.3 exists to prevent. [Observed]
- **The drop target shows** as a 2px line in the primary colour on the side the row will
  land, and the dragged row dims. The arrow keys keep focus on the handle as it moves.
  [Observed]
- Only the **ticked** rows' order is kept: `pinned` is an ordered list of ids, and an
  unticked row returns to the screen's order next time. [Observed]

The footer's **Cancel** and **Save Filters** are the library `Button` — outline and
contained, radius 100 — not hand-styled buttons. [Observed]

### 5.8 Pinned sets persist per screen

`usePinnedFilters(storageKey, defaults)` — an **ordered** list of ids (§5.7), in `localStorage`, plus a
`constellation:pinned-filters-changed` window event so two mounted bars stay in sync, plus
the native `storage` event for cross-tab. [Observed — `usePinnedFilters`]

Keys in use: `constellation:tasks-pinned-filters:v1`,
`constellation:portal-pinned-filters:v1`, `constellation:signal-assets-pinned-filters:v1`.
[Observed]

**SSR-safety matters here.** The first render on *both* sides uses `defaults`; what was
stored arrives in an effect. Reading `localStorage` during render would make server and
client disagree the moment anyone changed their set, which is a hydration error. There is
precedent in this repo (`useKickoffReads`) — follow it. [Observed — the comment inside
`usePinnedFilters`]

### 5.9 Clear Filters

`onClear` is passed **only while something is actually filtering**; the link has nothing
to say otherwise. Every screen includes the search term in that test, and the Portal
pane also counts a screen's own filters (§5.19). [Observed — `hasAnyFilter`,
`hasAnyPortalFilter`; `PortalFilterPanel` → `extraActive`]

Clearing also clears the global search term — and, on the signal project's Assets, the
Alert filter. [Observed — `app/portal/page.tsx` → `onClear`; `SignalAssets.tsx` →
`clearAll`]

### 5.10 Portal: empty filters are omitted

A select with zero options is not rendered at all — with the live library some of the
platform's vocabularies come back empty, and an empty select is worse than an absent one.
[Observed — `PortalFilterPanel.tsx` → `has`]

---

### 5.11 The row fits the window

The row is **one line**. It was `flex-wrap`, so a narrow pane stacked controls onto a
second and third line; what does not fit now goes into More filters instead. [Observed]

> 🔴 **The strip's floor has to name what it really cannot go below.** It claimed only
> the More filters chip while the strip's basis was 0 — so flexbox saw the strip as
> costing almost nothing, handed the right-hand slot every pixel it asked for, and
> squeezed the strip narrower than its own contents. **Flexbox cannot see that overflow:
> with a basis of 0, a box's content never enters the calculation.** Clear Filters ran
> straight over the sort — 21px at 940, 61px at 900. The floor now includes Clear
> Filters, so the two compete honestly and the shrinkable side yields. Fixed in
> `4bc6585`. [Observed — reported from the screen, then measured at both widths]
>
> The sort and the grouping shrink to **3rem** and ellipsize. They must not wrap: a value
> on two lines inside a control one line tall overflows its own box. [Observed]

> 🔴 **The strip also corrects itself when it overflows without being resized.** The room
> the fitting works with comes from a `ResizeObserver` on the strip — right when the
> *window* changes, blind when what the strip must carry changes and its box does not:
> Clear Filters appearing, the sort switching to a longer field, a chip widening as it
> fills. No observer fires, the fitting runs on room that no longer covers the contents,
> and what paints is the strip spilling over the sort. It came back twice after the floor
> fix above. Fixed in `8f8ec42`: after every render, if the strip is wider than its box,
> the overflow comes off `room` and the fitting runs again. It converges — each pass sheds
> at least the overflow — and any real resize restores the true width. [Observed —
> `FilterBar` → the effect reading `chipsRef`]
>
> **Do not remove it because the floor looks sufficient.** The floor is right for what it
> can know in advance; this catches what it cannot. [Inferred]

`fitToRow` is exported and pure, so the rule can be checked without a DOM. Widths are
measured off the real controls and kept in state, keyed by id **and by whether the filter
is active**, since an active control carries a badge and is the wider of the two. A ref
callback does the measuring rather than an effect: the width is known at commit, so the
first paint is already fitted. [Observed]

Reserved off the top before anything is fitted: the More filters chip, Clear Filters, and
a flat 26px for the chip's badge. The badge reserve is a constant on purpose — measuring
it would make the reserve depend on what the reserve decided, and that circle can
oscillate as the window moves. [Observed]

The count and the sort **wrap to a second line** when the row cannot hold them beside the
controls. The controls themselves never wrap. [Observed]

> **Do not clip this strip.** Two attempts did, and both were bugs: `overflow-hidden`
> swallowed the dropdowns, which open *below* it, and `overflow-x-clip` then swallowed the
> More filters side panel, which opens *beside* it. The fitting is what keeps controls
> inside the strip; there is nothing left to clip. [Observed]

### 5.12 Active filters outrank idle ones

What leaves when space runs out is the **untouched filter nearest the end**, not simply
the last one. Only when every untouched filter has gone does an active one leave — and
then its count rides on the More filters chip *and* on its own row inside the menu, so a
list narrowed by something out of sight still says so. [Observed]

Verified against the widths measured on `/tasks`: with `owner` active, `recovery` and
`dateRange` spill before it; with nothing active, it falls back to dropping from the end.
[Observed]

### 5.13 The row holds still while the menu is open

Ticking a value inside More filters makes that filter active, and §5.12 then wants it in
the row — so the filter you were picking from jumped out of the menu the instant you
touched it, taking its list of values with it. Picking a second value meant reopening the
menu and finding the filter somewhere else. [Observed]

**The bar owns the menu's open state and freezes the row's contents while it is open.**
The move still happens; it waits until the menu shuts, which is when you are done
choosing. This is why `MoreFiltersMenu` is a controlled component. [Observed]

> 🔴 **A frozen row cannot follow the window, and two things broke on that.** Open the
> menu, narrow the window, click away: **every filter vanished into "Filters".** The
> row, frozen, ran over the sort; §5.11's self-correction saw the overflow and took it
> off the room — but a frozen row sheds nothing, so the overflow stayed and every pass
> took it again, down to zero. Shutting the menu then fitted the row into no room.
> [Observed — reported from the screen]
>
> Fixed by three rules, all in `FilterBar`: the self-correction **does not run while
> frozen**; shutting the menu **re-reads the room** rather than trusting what it held;
> and **resizing the window shuts the menu**, so a frozen row is never left over the
> sort with the menu hanging where its chip used to be. [Observed — measured: open at
> 1600px, narrow to 1150 → menu shuts, row refits to three filters, ending at 742px with
> the sort at 793]

### 5.14 Reachable values sort above dead ones

In a faceted list, values that would still leave results come first, alphabetically, and
values that would leave none follow in their own alphabetical run below. Before this a
menu could open on three greyed rows before the first thing you could pick. [Observed]

**Only faceted lists are reordered.** Without counts there is nothing to sort by and the
caller's own order stands — which matters for a list like Date Range, where alphabetical
would give "Last 24 hours, Last 30 days, Last 7 days". [Observed]

### 5.15 A find field at the head of every list of values

The list opens with a blank line where the first option would be — no border, no ground,
placeholder **"find below"**. Typing narrows the list; arrows walk it; Enter toggles.
[Observed]

**The caret goes there only when a POINTER opened the list.** Opened by the platform
search, the list appears and the caret stays in the header, because that is where the
person is typing — `takeFocus` is the flag, and both surfaces pass it. [Observed —
`FilterBar.tsx`, `takeFocus`]

> 🔴 **Both surfaces got this wrong, a fortnight apart, and for the same reason.** A
> value list that always grabs the caret is correct as long as a click is the only thing
> that can open one. The moment the search could open a filter's dropdown, the next
> keystroke went into the filter instead of the header; that was fixed. When the search
> then learned to open the **More filters** menu too, its list still took focus
> unconditionally — so typing `XDRIVE` left `XDR` in the header and put `IVE` in the
> filter. Fixed in `a5fc840`.
>
> The search no longer opens anything (§7), so a pointer is once again the only way in
> and the flag is gone. **The rule outlives it:** whatever opens a list decides where the
> caret goes. Any new way of opening one inherits the question, and the default answer —
> take focus — is right only for a pointer. [Observed — both reported from the screen]

**Both surfaces that show a filter's values use the same component**,
`FilterValueList`: the control's own dropdown, and the side panel of the More filters
menu. They were the same list drawn twice, which is how the find field came to exist in
one of them and not the other — the panel keeps its own scroll off so the field stays
pinned above the values rather than scrolling away with them. [Observed]

- **The walk skips what cannot be picked.** A dead option stays listed and greyed but is
  not something the arrows should stop on and refuse. Only reachable options carry a
  cursor position. Measured on Collection: 19 of 22 values at zero, all 19 outside the
  walk. [Observed]
- **Enter does not shut the menu**, for the same reason ticking a box does not.
- The field **clears whenever the menu closes**, so it never reopens holding an old term.
- This is local to one menu. The platform search (§7) decides whether a menu opens at
  all; this decides what is listed once it has. Keep them separate.

### 5.16 A range is a select box

The four numeric filters were two loose inputs each, which is why they were barred from
the row: they were not the same shape as a filter. A range is now a chip like any other —
label as placeholder, active state, a badge that clears it — so it pins, spills and
returns on the rules already written. [Observed]

Behind the chip, **two controls for one value**, because they answer different questions.
The boxes are for a figure you already know; the slider is for the ones you do not, where
the point is to see the span and push an end of it. They write to the same value; neither
is a draft of the other. [Observed]

The dual slider is **two range inputs on one drawn track**. Each is a real input, so each
handle is where a keyboard expects it. They are clamped against each other, so dragging
one past the other pushes rather than inverts. The inputs carry `pointer-events: none`
and the thumbs take it back — that is what lets two overlapping inputs both stay
grabbable. The visible track and the filled span are drawn by the component, since only
one of the two inputs could ever own them. [Observed — `app/globals.css`, `.range-thumb`]

**Spans are read off the library in hand, not declared.** `derivePortalRangeBounds` walks
the folder-scoped assets; a width of 0..3000 means nothing when everything present is
between 300 and 2000, which is what the Portal's turned out to be. Without bounds the
control falls back to the boxes alone. [Observed]

Two rules about the ends, both of which were bugs first:

- **A handle at the far end writes nothing, not the boundary figure.** The end of the
  track *is* "no bound on this side", so the box keeps its placeholder rather than filling
  with a number that constrains nothing. Without this, a bare click on a handle filled the
  box and lit the filter up for a range covering everything. Measured: handle at 300 of
  300..2000 leaves the box empty and the filter inactive; dragged to 900 it fills and
  activates; returned to the end it clears again. [Observed]
- **A typed figure outside the span is clamped for the drawing only.** It is still a
  legitimate filter — it just has nowhere to sit on this track. Letting it through drew
  the filled bar off the left edge of the control: `pct(250)` of a 300..2000 span is
  negative. Typing 250 now keeps the value and pins the bar at 0%. [Observed]

Handles and the filled span take `--semantic-primary-main`, the app's own purple, rather
than a Tailwind indigo that was close but not it. [Observed]

### 5.17 The seam with selection

`FilterSelectAll` lives in this file and reads the filter state: it says **"Select all"**
with nothing narrowing the list and **"Select visible"** once a filter or the search is
on, because those are different promises — "all" would claim the rows it cannot see. It
touches only the ids in front of you, so clearing a filter hands back a selection with
the earlier picks still in it. [Observed]

That rule is the filter system's business. **The asset-selection feature it serves is
not part of this ticket.** [Inferred]

### 5.18 Sort and Group by — moved to their own ticket

**Sort and Group by are [CP-14194](https://theconstellationagency.atlassian.net/browse/CP-14194)**,
not this ticket: `HANDOFF-grouping.md`
([Group By & Sort](https://claude.ai/code/artifact/6c1b112f-aef2-4bd9-9d82-a79851c5f38f)).
They answer a different question from the filters — not *which* rows, but *in what order
and under what headings* — and the one rule that binds them (a sort never resizes a
group) is that ticket's to enforce. [Observed]

What stays here is only where they sit: the filter row's `right` slot, after Clear
Filters, and what the row's fitting does to them when the window narrows (§5.11). The
row has to leave them room; it does not have to know what they do. [Observed]

### 5.19 A screen can bring filters of its own

The Portal's pane is a fixed table (§8) of what an **asset** carries. A signal project's
Assets tab needed one more — **Alert**, the alert that produced each asset — which is a
fact about the project, not the asset. `PortalFilterPanel` takes it through `extra`:
[Observed — `c4432a6`]

```ts
export interface ExtraPortalFilter {
  id: string; label: string; group: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  counts?: Record<string, number>;
}
```
[Observed — `PortalFilterPanel.tsx` → `ExtraPortalFilter`]

- **It leads the row**, drawn with the same `FilterSelect` as every other filter, and is
  offered to Sort and Group by like any other — `fieldsFromFilters` reads the descriptors,
  so it is sortable the moment it exists (`HANDOFF-grouping.md` §2.4). [Observed]
- **The screen owns its values and applies it.** The pane only draws it; the screen does
  the matching, the counting and the sorting by it. [Observed — `SignalAssets.tsx` →
  `inAlert`, `alertCounts`, the `ALERT` sort]
- **Its counts are faceted the same way** (§5.4): the Alert counts are taken against every
  other filter but not against itself, and every other filter's counts are taken against
  the Alert pick. Get either half wrong and the numbers lie. [Observed — the comment above
  `counts` in `SignalAssets.tsx`]
- It obeys §5.5 and §5.10 together: not drawn while it has nothing to offer, **unless it
  is filtering**. It counts toward Clear Filters (§5.9). [Observed]

[Inferred] This is the shape for any screen that wants the Portal's filters plus a few of
its own. The alternative — a second, parallel descriptor array per screen — is the
two-lists defect of §5.4 and `HANDOFF-grouping.md` §2.4 again.

### 5.20 A chip on a card is a filter you can see

On the Portal and a signal project's Assets, each card shows the asset's metadata as
chips (two rows, then `+N`). **Clicking a chip toggles that value in the filter it came
from** — a chip reading `2026` adds or removes `2026` from Year. A chip whose value is
filtering is drawn in the active colour, `bg-indigo-100 text-indigo-700`, with
`aria-pressed`. [Observed — `0087578`; `app/portal/page.tsx` → `onChipPick`,
`isChipActive`]

What that means for this ticket: **the filter state has a second writer.** The row is no
longer the only thing that changes it, so anything that assumes it is — the frozen split
of §5.13, the snapshot of §5.3 — has to hold when a filter changes from outside. Both do
today, because both freeze only while a menu is open and a card cannot be clicked through
an open menu. [Observed that both freeze only while open; that this is why they hold is
[Inferred]]

On a signal project the card leads its chips with its origin **alert**, and that chip
toggles the screen's own Alert filter (§5.19). [Observed — `d4cf5f9`;
`PortalAssetCard` → `extraChips`]

The card itself — its chips, their packing, the expanded state — belongs to
`HANDOFF-portal.md`. [Observed]

---

## 6. The header the row sits in

`components/ui/ScrollAwayHeader.tsx` wraps the filter row on both screens. **It is its own
ticket: `HANDOFF-scroll-away-header.md`.** [Observed]

What you need from this side: it is `sticky` only once it has already left the screen, and
it overlays content when it comes back — so **anything the row opens downward, a filter
menu or the More filters panel, opens over content that is itself scrolling.** That
interaction is untested. [Observed — `ScrollAwayHeader.tsx`]; that it is untested is
my reading [Inferred].

The header knows nothing about filters and the row knows nothing about scrolling. Keep it
that way.

---

## 7. Seam with the global search — READ THIS

This is the only coupling between the two tickets.

`FilterSelect` consumes the search context directly:

```ts
const { query } = useGlobalSearch();
const matched = query.trim() ? listed.filter((o) => matchesQuery(o, query)) : [];
// The search MARKS a filter holding matches; it does not open it.
const showing = open;
```
[Observed — `FilterBar.tsx` → `FilterSelect`]

Consequences you must preserve:

**The search marks a filter. It does not open one.** [Observed]

1. A filter holding matches shows a **yellow count badge** (`bg-yellow-200`) saying how
   many of its values match — on its chip in the row, and on the **More filters** chip
   for every matching filter the row could not fit, with per-filter counts on the rows
   inside that menu. Nothing opens; the reader opens the one they meant. [Observed]
2. Opened by hand with a term typed, **the matches lead** the list ahead of the picked
   values — it is why you came. [Observed]
3. Matched runs are marked by `<Highlight>` inside option text **and inside the filter's
   own name** — the chip's placeholder, the label that rides the stroke once something is
   picked, and the filter's row inside the menu. A reader reaching for a filter is as
   likely to know what it is *called* as what is *in* it; typing `asset` used to mark
   every asset name on the grid and leave the **Asset Types** filter untouched. A range
   reads the term for this alone: it has no options for a search to reach, so its name is
   the only thing in it a term can match. [Observed — `4b35624`]

> 🔴 **It used to open every filter whose values matched, and that does not survive 27
> filters.** `"audi"` reached five of them: three panels opened on top of one another
> over the grid, and the More filters menu came up over those. [Observed — reported from
> the screen, with the URL]
>
> **What was cluttered was never the moment they opened — it was how many.** That matters
> for the fix that was considered and dropped: a keystroke to arm the search-inside-filters
> explicitly (`⌘F`) would have moved *when* five panels appear, not *that* five appear —
> and it would have taken the browser's own Find shortcut on the one screen where a reader
> is most likely to want it, since the page is covered in marks. [Designer's call]
>
> **Three pieces of machinery existed only to serve the opening**, and went with it: the
> `dismissed` term on both surfaces, which kept a closed menu from fighting the next
> keystroke; the once-per-term ref that stopped the menu's auto-open looping through
> `onOpenChange`; and the flag that held the caret in the header (§5.15), now that a
> pointer is the only thing that opens a list. Worth knowing before anyone reintroduces
> the opening: it is not one line, and each of those three was written to fix a defect
> the opening had caused. [Observed]

> **An earlier defect in the same place, kept because the shape of it recurs.** This
> section once claimed the yellow badge kept "a filter parked behind More filters
> findable" — but the badge lived on `FilterSelect`'s own chip, and a filter pushed into
> the menu has no chip. Searching for a value that lived in one did **nothing at all**.
> Fixed in `c8d17fc`, and it is what rule 1 now rests on.
>
> **An invariant stated in one component is only true where that component renders.**
> Everything §5.5 says about an active filter never being silently hidden had the same
> hole, and is held up by a second mechanism the menu draws for it — written separately,
> for exactly this reason. [Observed]

**If the search ticket lands first**, `FilterSelect` still works: `useGlobalSearch()`
returns an inert null-object outside the provider. [Observed —
`lib/global-search.tsx` → `useGlobalSearch`]

---

## 8. Data model

```ts
// components/tasks/TaskFilterBar.tsx
interface TaskFilters {
  projects: string[]; groups: string[]; status: string[]; recovery: string[];
  dateRange: string[]; owner: string[]; relationship: string[];
}

// components/portal/PortalFilterPanel.tsx
type PortalFilters = Record<SelectField, string[]> & {
  width: Range; height: Range; components: Range; offerCount: Range;
};
interface Range { min: string; max: string }   // "" at either end = unbounded
```
[Observed]

Portal option values are **derived from the loaded library at runtime**
(`derivePortalOptions`), not hardcoded — sorted with `localeCompare(…, {numeric: true})`
so `Year` reads 2019, 2020, 2021 rather than lexically. [Observed —
`derivePortalOptions`]

Tasks options are hardcoded constants in `lib/task-manager-data.ts`. [Observed]

### Filter → field mapping (Portal)

`GROUPS` in `PortalFilterPanel.tsx` is the single table driving the pane, the
matcher **and** the counts. A filter therefore cannot exist in the UI without narrowing
anything, or narrow something without appearing. Preserve that property. [Observed]

Groups: **Date & Type** (2), **Organization** (4), **Dimensions** (2 + 2 ranges),
**Metadata** (15 + 1 range). [Observed]

### Consolidated duplicates

The live platform Portal lists both *Asset type* and *Asset Types*, both *Brand* and
*Brands*, both *Offer type* and *Offer Types*. Each pair is **one** filter here, matching
over the set, which always contains the asset's primary value. [Observed —
the comment under `GROUPS`]

[Inferred] The live platform's duplication is a data-modelling artefact rather than an
intended distinction. Confirm with whoever owns the Portal's taxonomy before you
replicate either shape.

---

## 9. Performance

`derivePortalCounts` does **one full pass per filter** — 23 walks of the library — because
each facet's own selection must be lifted before its options are counted. It is memoised
at the call site on `[folderScoped, portalFilters, assetSearch, filterOptions]`.
[Observed — `derivePortalCounts`; `app/portal/page.tsx` → `filterCounts`]

[Inferred] At the prototype's ~326 assets this is unmeasurable. Against the real library
— I measured the platform at roughly **341 projects × ~28.7 assets ≈ 9,800 assets** — 23
passes on every keystroke is ~225k predicate evaluations per render. That is the first
thing that will need to move server-side. Treat client-side faceting as a prototype
affordance, not a shipping decision.

---

## 10. Design system

Read from the code, not from a token file. [Observed]

| | |
|---|---|
| Control height | `h-8` (32px), `rounded-lg` |
| Type scale | 13px option text · 12px control labels · 11px counts · 10px group headings |
| Resting border | `border-gray-200`, hover `border-gray-300` |
| Active filter | `border-indigo-300 bg-white text-indigo-700`; label floats at 10px on the stroke (§5.1) |
| Value chip | `bg-indigo-50 text-indigo-700`, 11px, max 88px (ranges 120px), two then `+N` |
| Clear X | 18px round, `text-gray-400`, hover `bg-gray-100` (§5.2) |
| Count badge (filters out of sight) | `bg-indigo-50 text-indigo-700`, 10px bold, 18px tall |
| Focus | `focus:border-indigo-600` |
| Search match | `bg-yellow-200` (`Highlight`), match-count badge `bg-yellow-200 text-yellow-900` |
| Menu surface | `bg-white rounded-xl shadow-lg border-gray-100`, `min-w-[220px]`; a value list scrolls past `max-h-[300px]`; the More filters menu grows to 24px from the window's foot (§5.6) |
| Disabled option | `opacity-40 cursor-not-allowed` |
| z-index | More filters menu `z-40` · option menu and scroll-away header `z-30` · sticky section heading `z-20` · floating label and clear X `z-10` |

Icons are `lucide-react`. The dialog is the repo's own `components/ui/dialog`. [Observed]

---

## 11. Known documentation drift — fixed

Three places described an API that no longer existed: a runtime **orientation switcher**
(`onOrientationChange`, a hover-only kebab, a vertical standing pane) in the
`FilterBar.tsx` file header and in the Component Library, and `FilterGroup` as "a section
of a vertical FilterBar". Corrected in `ccf7119` and `8221f44`. [Observed]

The file header was further off than this section said: it also still described picks as
a count badge, a hover-swap to an X, and a search that opens filters — all three gone.
It now lists the row as it is. So do the Library's entries for `FilterBar`,
`FilterSelect`, `FilterRange` and `FilterGroup`. [Observed]

**The lesson is the repo's standing rule:** a change to a component updates its
Component Library entry in the same commit. These were missed across several commits,
and a Claude session reading the code would have taken them as the spec. [Inferred]

---

## 12. Out of scope / not in the prototype

- **URL state: built on Portal, not on Tasks.** The Portal writes its folder, filters,
  sort and grouping to the query string, so a view is a link — `HANDOFF-portal.md` §8 has
  the rules, and `lib/portal-url-state.ts` the code. Tasks still holds its filters in
  `useState` alone. [Observed]
- **No server-side filtering.** Everything narrows an in-memory array. [Observed]
- **No saved/named filter sets.** "Pinned" is *which controls show*, not *which values are
  selected* — the values themselves reset on reload. [Observed]
- **No debounce on the find field or the platform search.** Every keystroke recomputes the
  facet counts. See §9. [Observed]
- **No multi-user persistence.** Pinned sets are `localStorage`, per browser. [Observed]

---

## 13. Open questions

1. **Should Tasks get URL state too?** Portal has it (§12); Tasks does not. The
   machinery is written and generic enough to follow — the question is whether a task
   list is a thing people send each other the way a folder of assets is. [Observed that
   only Portal has it; the question is [Inferred]]
2. **Faceted counts at real scale** — §9. Do counts stay client-side with a capped
   library, or move to a server that returns facet counts alongside results?
3. **Are the three consolidated duplicate pairs (§8) genuinely one concept each?** Needs
   confirmation from the Portal taxonomy owner.
4. **Pinned-set defaults per role?** Portal pins 5 of 27 by an editorial guess
   (`app/portal/page.tsx` → `usePinnedFilters`). [Inferred] Different roles probably want
   different defaults.
5. **`FilterSearch` — keep or delete?** No screen uses it since the global search landed.
   It is live exported API with one preview consumer.
6. **Screen-owned filters (§5.19) beyond the Portal pane?** `extra` exists only on
   `PortalFilterPanel`. If Tasks or another screen needs the same, decide whether it moves
   down into `FilterBar` or stays a pane-level affordance. [Inferred]
7. **Who is the current user?** Resolved in the data model (`lib/current-user.ts`,
   §5.4) but still a constant — there is no session behind it. The Owner filter will
   need the real identity. [Observed]
8. **Should a filter be able to cross groups in Default filters (§5.7)?** Today a row
   moves only inside its group, so the bar runs group by group. A single flat list would
   give full freedom and lose the headings. [Inferred]

Resolved since the last version, and kept out of this list: what "Assigned to me" means,
and the hardcoded `"John Doe"` — both by `416ad87` (§5.4).

---

## 14. First tasks, in order

1. **`npm test`.** 40 tests over the pure rules, under a second, no browser. They run
   against the screens' own data — the seeded Tasks rows and the Portal's generated
   library — so they check the real option lists, not toy ones. [Observed]

   | File | What it holds |
   |---|---|
   | `components/ui/FilterBar.test.ts` | `countFacet`, `byAvailability`, `withPicked`, `fitToRow`, `fieldsFromFilters`, `groupByValue` |
   | `components/tasks/TaskFilterBar.test.ts` | every count equals the rows clicking it returns, both tabs, with and without filters; Owner partitions each tab |
   | `components/portal/PortalFilterPanel.test.ts` | the same invariant over all 23 Portal filters, with filters, a range and a search on; range ends; Clear Filters. Its `comparePortalBy` tests belong to CP-14194 |

   **The invariant worth keeping above all:** *the number beside an option is the number
   of rows you get by clicking it.* It is tested by brute force — for every option of
   every filter, click it and count — so a new filter is covered the moment it exists.
   Run it against your own matcher and counter, whatever they become. [Observed]
2. Decide §13.1 — whether Tasks joins Portal in the URL. It is structural, and the row
   is full of state (pinned set, find term, frozen split) that has nowhere else to go.
3. Read §5.11 before touching the row's layout, and §5.13 before touching the menu. Both
   record bugs that were shipped and then fixed; both are easy to reintroduce.
4. Walk §15 on your build, then on this one, side by side.

---

## 15. Acceptance checklist

What "done" means for this ticket, one behaviour per line, each with the section that
explains it. The links open the reference build in that exact state — the Portal keeps
its folder, filters, sort and grouping in the URL (`HANDOFF-portal.md` §8). [Observed]

**Reference build:** `https://v3-poc-projects-fine-tune.preview.constech.io` — `main`,
deployed on every push. Links below are paths on it. Run them at **≥1280px** unless the
line says otherwise; the Portal's library is live, so counts in it drift, and only the
Tasks figures (seeded) are fixed.

**Portal URL keys:** a select is its field key, repeated per value
(`?brands=Audi&brands=BMW`); a range is `min-max` with either end empty (`?width=600-`);
`folder`, `sortBy`, `asc=1` (ascending; descending is the default), `categorizeBy` and
`view=table` (cards are the default).
Field keys are the ones in `PortalFilters` (`fileType`, `assetTypes`, `make`, …).
[Observed — `lib/portal-url-state.ts`]

### Controls

- [ ] **Empty, a control is its name; filled, the name rises onto the stroke and the picks
  become chips — two, then `+N`.** §5.1
  `/portal?assetTypes=Misc&assetTypes=Website&assetTypes=Social` → **Asset Types** reads
  `Misc` `Website` `+1`.
- [ ] **A short value under a long name: the name stays on one line, inside the box.** §5.1
  `/portal?vehicleCondition=New` → `Vehicle condition` on one 10px line over `New`.
- [ ] **A range shows its span as a chip, an open end written as open.** §5.1, §5.16
  `/portal?width=600-` → `600+`. `/portal?width=600-1080` → `600–1080`.
- [ ] **The X clears that filter alone**, without opening it, and leaves the others. §5.2
- [ ] **Reopening a menu stacks the picks on top, above a divider, and they do not move
  while you tick.** §5.3
- [ ] **A dragged slider handle back to the end of the track empties the box and the
  filter goes idle.** A typed figure outside the span is kept, and the bar pins to the
  edge rather than drawing off it. §5.16

### Counts

- [ ] **The number beside an option is the number of rows clicking it returns.** §5.4
  `/tasks`, Alerts tab → Owner: **Assigned to me (265)** returns 265 of 679;
  **Unassigned (414)** returns 414. Tasks tab: **160** and **831** of 991. Seeded, so
  these are exact.
- [ ] **Picking a value does not drop the rest of its own filter to (0).** §5.4
  Pick one Make; the other makes keep their counts.
- [ ] **A dead option stays listed, greyed, below the live ones, and the arrow keys skip
  it.** §5.4, §5.14
- [ ] **Date Range keeps its own order** (24 hours, 7 days, 30 days), not alphabetical.
  §5.14

### The row

- [ ] **One line. What does not fit goes into More filters; nothing wraps.** §5.11
  Narrow the window from 1440 to 800 on `/portal`.
- [ ] **An idle filter leaves before an active one.** §5.12
  `/portal?make=Audi` at ~1000px: Make stays in the row while pinned idle filters leave.
- [ ] **Clear Filters never overlaps the sort, at any width** — including when Clear
  Filters appears or the sort changes to a longer field *without* the window moving.
  §5.11. `/portal?make=Audi&sortBy=Vehicle%20condition`, then narrow to 900.
- [ ] **A filter that is filtering but out of sight is never silent:** its count is on
  the More filters chip and on its row in the menu. §5.5, §5.12
  `/portal?assetTypes=Misc&vehicleCondition=New&width=600-` at 800px → **Filters 3**.
- [ ] **Ticking inside More filters does not yank that filter out of the menu**; it moves
  to the row when the menu closes. §5.13
- [ ] **The More filters menu grows to 24px from the bottom of the window before it
  scrolls; a values panel opens beside its own row.** §5.6
- [ ] **A range inside More filters opens on its From/To and slider, whole — no chip, no
  scrollbars.** §5.6 Open More filters on `/portal`, click **Width**.
- [ ] **Open More filters, narrow the window, click away: the row is still there, fitted
  to the new width.** The menu shuts on the resize. §5.13
- [ ] **A pick that outlives its options is still there to untick, and the empty grid says
  so.** §5.5 `/portal?folder=BMW+of+Bellevue&make=Audi` → **0 of 100**, the Make
  control showing `Audi`, and the empty state reading *"Nothing here matches Make Audi.
  That filter came from another folder"* with **Remove Make Audi**, which drops only it.

### Search seam

- [ ] **Typing in the header search marks filters and opens none.** §7
  Type `audi` on `/portal`: yellow badges on the filters holding matches, no panel opens,
  the caret stays in the header.
- [ ] **A term that matches a filter's *name* marks the name.** §7
  Type `asset` → **Asset Types** marked, in the row or in its More filters row.
- [ ] **A match inside a filter the row could not fit shows on the More filters chip.** §7

### Sort and Group by

Moved with the controls: `HANDOFF-grouping.md` §10. The row's share is above — they get
their room and never overlap Clear Filters.

### Screens and writers

- [ ] **A screen's own filter leads the row and behaves like the rest.** §5.19
  `/projects/penske-honda-evergreen/assets` → the row opens on **Alert**, then Tags,
  Collection, Model, Trim; Alert is offered in Sort; Clear Filters clears it.
- [ ] **Clicking a chip on a card toggles that filter, and the chip shows it is on.** §5.20
  On `/portal`, click a card's year chip: Year fills with it and the chip turns indigo;
  click again to undo.

### Persistence

- [ ] **Default filters reorders: drag a row, or ↑/↓ on its handle, and Save — the bar
  follows the new order.** Rows do not cross groups. §5.7
- [ ] **Default filters edits a draft; only Save commits; Cancel and close abandon it.**
  §5.7
- [ ] **The pinned set survives a reload and is per screen**, and two tabs stay in step.
  §5.8
- [ ] **Clear Filters appears only while something filters, and also clears the search.**
  §5.9
- [ ] **No hydration warning** in the console on a reload with a changed pinned set. §5.8
