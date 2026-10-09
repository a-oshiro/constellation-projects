# Group by & Sort — ordering a list and cutting it into sections

> **Ticket:** [CP-14194](https://theconstellationagency.atlassian.net/browse/CP-14194) · **This hand-off, rendered:** [Group By](https://claude.ai/code/artifact/6c1b112f-aef2-4bd9-9d82-a79851c5f38f)
>
> **Who this is for.** You are building **Group by** — the control that cuts a grid or a
> table into one section per value of a field — and **Sort**, the control beside it that
> orders the rows. Written to be read by you and by Claude Code in your session; point it
> at this file first.
>
> Tags: **[Observed]** = it is in the prototype's code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> **This was split out of `HANDOFF-filters.md` deliberately, and Sort came with it.**
> Both ride in the filter row's right-hand slot and borrow its plumbing, but they answer
> a different question from the filters — not *which* rows, but *in what order and under
> what headings* — and one rule binds the two of them (§3). So they are one ticket. The
> filter row itself — chips, faceted counts, More filters, the Default filters dialog — is
> [CP-14060](https://theconstellationagency.atlassian.net/browse/CP-14060)
> ([FilterBar Hand-off](https://claude.ai/code/artifact/777186fe-872f-425f-bff4-b4fc2ce82306)).
> Where the row's fitting squeezes these two controls is §5.11 there.
>
> Also next door: `HANDOFF-portal.md` is the screen this is demonstrated on, and
> `HANDOFF-scroll-away-header.md` is what §5's pinned headings have to agree with.

---

## 1. State

Branch `dev`, at `e61d684`, and **live** — `origin/main` is at the same commit. [Observed]

| | |
|---|---|
| `a9b3091` | Sort and Group by offer every filter; the grouping cuts the grid |
| `9180357` | one treatment for the three headings that name a place |
| `5bd9fc1` | a group's heading pins while its section is on screen, and carries its own select-all |
| `daa3587` | the grouping goes in the URL, and the control can show a field it has not heard of |
| `5817f3e` | **the group is sovereign**; the next group pins to the foot; the control gains an X |
| `2145da8` | the next-group bar stands down when the real heading arrives |
| `be8b143` | the grid draws only the rows near the viewport; one card, one height |
| `e61d684` | **folders are the first group**, not a band that vanishes when you group |
| `67e7551`, `34a4f51` | the Sort and Group selects take the width of what is chosen |
| `c2af873` | a row missing the value sorts last in **both** directions — it did not |
| `ccf7119` | unit tests for the shared pure rules (`npm test`) |

Files: `components/ui/FilterBar.tsx` — `FilterSort`, `FilterCategorize`,
`groupByValue`, `FilterSectionHeader`, `fieldsFromFilters`; `components/portal/PortalFilterPanel.tsx`
— `comparePortalBy`, `portalValueOf`, `READ_BY_LABEL`; `components/tasks/TaskFilterBar.tsx`
— `compareTaskBy`. Consumers: `app/portal/page.tsx`, `app/tasks/page.tsx` (Sort only),
`components/projects/SignalAssets.tsx`. References name a symbol, not a line — search the
file for it. [Observed]

Tests: `components/ui/FilterBar.test.ts` (`fieldsFromFilters`, `groupByValue`) and
`components/portal/PortalFilterPanel.test.ts` (`comparePortalBy`). Run `npm test`.
[Observed]

---

## 2. The two controls

Every other control in the row picks **values** of one filter. These two pick **a field**
— which is why both are a plain `<select>` rather than the multi-select every filter
uses. They sit in the filter row's `right` slot, after Clear Filters: Sort, then Group.
Portal and a signal project's Assets carry both; Tasks carries Sort only. [Observed —
`PortalFilterPanel` and `TaskFilterBar`, the `right` prop]

```
Sort [ Updated At ⌄ ] [↓]      Group [ Brands  ✕ ⌄ ]
```

| | |
|---|---|
| Labels | `Sort`, `Group` — 11px, `gray-400` |
| Selects | `h-8`, 12px, `gray-700`, `rounded-lg`, `gray-200` border; focus `indigo-600` |
| Sort direction | a **button with an arrow that rotates 180°**, not a second select |
| Group clear | an **X inside the box, left of the caret**, only while something is grouped |

**Every field reads as its filter is labelled — nothing is re-cased.** The four ranges
used to be labelled in lower case (`width`, `components`) and the selects and chips
carried `capitalize` to dress them up; it also turned `Vehicle condition` into `Vehicle
Condition` in the select while the filter beside it said otherwise. The labels are now
`Width`, `Height`, `Components`, `Offers`, and `capitalize` is gone. The URL carries the
label as written: `sortBy=Components`. [Observed]

### 2.1 Sort

`FilterSort` — the field and its direction. The Portal opens on **Updated At,
descending** (newest first, arrow down). [Observed — `PORTAL_VIEW_DEFAULTS`]

**The comparator owns the direction.** `comparePortalBy(a, b, label, asc)` — the caller
passes `asc` and does **not** multiply the result. [Observed — `c2af873`]

- **A row missing the value sorts last in either direction.** Reversing should not bring
  a column of blanks to the top. [Observed — `comparePortalBy`]

  > 🔴 **This was claimed and untrue for weeks.** The comparator put blanks last, then
  > both callers multiplied its result by −1 for descending — which flipped the blanks
  > too. Sorting the live library by Brands, descending, opened on the **252 assets with
  > no brand**. The unit tests caught it on their first run. Fixed in `c2af873` by moving
  > the direction inside, applied only after the blanks are placed. **A caller that
  > multiplies the result reintroduces the bug.** [Observed — measured on localhost before
  > and after: descending now opens on Volkswagen, ascending on Acura]
- **Numbers compare as numbers, text with `numeric: true`**, so `1080 x 1350` lands after
  `1080 x 1080` and before `1280 x 320`. [Observed — tested]
- **`Dimensions` compares the product**, not either side: 1080 × 1350 is a bigger asset
  than 1280 × 320, which sorting the label as text would not say. The Portal handles it
  as a case of its own before the comparator. [Observed — `app/portal/page.tsx`]
- **A label that names no field returns 0**, so the screen's own cases — `Name`, `Updated
  At` — win. [Observed — tested]

[Observed] Tasks sorts with its own `compareTaskBy`, reading the same `FIELD_OF` table its
counts read. It has no blanks to place today; if it ever has, it needs the same rule.
[the last sentence is Inferred]

### 2.2 Group

`FilterCategorize` — one field, or None. [Observed]

**The X clears to None in one click**, rather than sending you into the menu to find it.
It is the same X, in the same round grey hit area, that clears the platform search — the
gesture for "undo this control" should not be two different things on one screen.
[Observed]

Two details that are easy to lose:

- **The select's right padding changes with the X** — so a long field name never runs
  under either. [Observed]
- **The label names the select by `id`; it does not wrap it.** A `<label>` that wraps
  forwards every click inside it to its control, and the X sits inside the box: wrapped,
  clearing the grouping would reopen the select it had just cleared. [Observed]

### 2.3 Both are as wide as what is chosen, not as their longest option

**A `<select>` sizes itself to its widest option.** Sort and Group therefore both sat at
**134px** whatever they were showing, paying for `Vehicle condition` — 90px of text — at
every screen width, on every screen. [Observed — measured]

An **invisible twin** carrying the chosen value is the only thing in flow and sets the
width; the select is taken out of flow and laid over it. `Name` goes 134 → **70px**,
`None` → **66px**, growing back to 98 and 116 for `Updated At` and `Entity Type`.
[Observed — measured]

Two things a re-implementation will hit in this order: [Observed]

- **A grid cell does not work.** The obvious shape — twin and select in one `auto` track
  — leaves the track taking the select's `max-content`, which is the widest option again.
  `min-width: 0` does not help: it lowers the minimum, not the contribution. The select
  has to leave the flow.
- **The twin needs slack.** Matching the select's padding exactly left it **1–3px short**
  — the twin's layout width rounds down against the text's fractional width, and the
  control keeps a small reserve of its own — and the select clipped its last letter:
  `Components` came out `Component`. 8px past the select's right padding leaves ~6px of
  measured slack.

When the row is narrow, both shrink to **3rem** and ellipsize rather than wrap — that is
the filter row's fitting, `HANDOFF-filters.md` §5.11. [Observed]

### 2.4 The field list is derived, never written out

**Every filter, always — the base component guarantees it.** Inside a `FilterBar`, the
Sort and Group controls in its `right` slot offer every filter the bar carries, whatever
list the screen passed: the screen's `fields` are its own extras (`Updated At`, `Folder`)
and lead the menu, and the filters follow, deduped. The bar hands its labels down through
a context, so no screen can leave one out. [Observed — `FilterBar` → `BarFieldsContext`,
`useAllFields`]

> 🔴 **Why it moved into the base.** A screen that wrote its list by hand offered a
> handful: Approvals sorted by 5 of its 10 filters and grouped by 4. A filter you can
> narrow by but not sort or group by is the two-lists defect below, and leaving it to
> each screen to remember is how it happened. [Observed — reported from the screen]
>
> **What the screen still owns: the comparator and the grouping read.** The control can
> now offer a field the screen has never handled, so the screen's sort and group must
> read *any* filter by its label — the Portal does, through `READ_BY_LABEL`. A screen
> that maps a few labels by hand and falls back to one field groups by the wrong thing
> without a sound. [Observed for the Portal; the warning is [Inferred]]

`fieldsFromFilters(descriptors, leading)` is the same merge as a pure function — the
screen's own fields first, then every filter in the order the row carries them.
[Observed — `fieldsFromFilters`, tested]

| Screen | `leading` | Then |
|---|---|---|
| Portal, Sort | `Updated At`, `Created At`, `Name` | every Portal filter |
| Portal, Group by | `Folder` | every Portal filter |
| Tasks, Sort | `Created`, `Due`, `Work`, `Type`, `Brand`, `Account`, `Project`, `Client` | every Task filter |

[Observed — `lib/portal-assets.ts` → `PORTAL_SORT_FIELDS`, `PORTAL_CATEGORIZE_BY`;
`lib/task-manager-data.ts` → `SORT_FIELDS`]

**A filter added to a screen becomes sortable and groupable the moment it exists** — that
is the property to preserve, not the lists. Two hand-written lists drift: a screen could
offer a sort for a filter it had dropped, or filter by something it would never group by,
and nothing would catch it. It is the same defect class as a count that disagrees with
its rows (`HANDOFF-filters.md` §5.4). A screen's own filter — the Alert filter on a
signal project's Assets (`HANDOFF-filters.md` §5.19) — is offered to both the same way.
[Observed that it is derived; the reasoning is [Inferred]]

Dedupe is **case-insensitive, first spelling kept**, so a screen whose `leading` already
has `Brand` does not gain a second `Brands` beside it. [Observed — tested]

**Both read a field off the same table** — `READ_BY_LABEL` in `PortalFilterPanel.tsx`,
through `portalValueOf` for the grouping and `comparePortalBy` for the sort. A field that
sorts by one thing and groups by another would put the cards in an order that disagrees
with the sections they fall into. [Observed]

### 2.5 A field control must be able to show a field it has not heard of yet

Both selects keep the current value selectable **whether or not the list contains it**.
[Observed — `FilterSort` and `FilterCategorize`, the `!fields.includes(…)` option]

In Sort this covers a real case: something else on the screen — a sortable column header
— can set a field the list does not offer, and the control must not disagree with it.
[Observed]

> 🔴 **In Group by it was a live defect, and it read as "the feature was not built."** The
> URL is parsed on mount; the field list is derived from a library that is still loading.
> A `<select>` whose `value` matches no `<option>` silently falls back to the first one —
> so the control said **None** over a grid that was visibly cut into ten sections, and the
> person reading the control reported the grouping as missing. [Observed]

It is the same principle as the filter row's `withPicked` (`HANDOFF-filters.md` §5.5), one
level up: that keeps a **value** removable when its options have moved on; this keeps a
**field** visible when its list has not arrived yet. [Inferred]

---

## 3. The group is sovereign

**The sort orders the cards inside a group. It must never change how many are in it.**
[Observed — this is the rule; it was broken and is now enforced]

> 🔴 **The defect.** The prototype capped the grid at 120 cards and grouped *what
> survived the cap*. So the sort decided which 120 those were, and the groups inherited
> that. Same folder, same filters, same grouping — only the sort direction flipped:
>
> | `sortBy=Name` (descending) | `sortBy=Name&asc=1` |
> |---|---|
> | BMW **115**, No Brands **5** | Audi 3, BMW **90**, INFINITI 1, Subaru 5, Volkswagen 10, No Brands **11** |
>
> Whole brands appeared and vanished with the sort. [Observed — measured on both URLs]

The fix is one line of order: **group the whole filtered set, never a capped slice of
it.** Measured after: ascending and descending now give byte-identical section counts —
BMW 2,086, Volkswagen 58, Toyota 13, Honda 10, Subaru 5, Acura 4, Kia 3, INFINITI 3, MINI
3, No Brands 173 — and every one matches what the library actually holds. [Observed —
measured both directions and against the API's own totals]

**The heading's count is the group's own size, always** — not how many of it are drawn.
It is what tells a reader the sort did not move assets between groups. [Observed]

[Inferred] The general rule, worth stating because it will come up again: **anything that
caps rendering must be applied inside a group, never above it.** A cap above the grouping
silently makes the grouping a function of the cap.

---

## 4. What a group is

`groupByValue(rows, read, emptyLabel)`. [Observed — `groupByValue`]

- **A row with several values lands in the section for its FIRST one**, not in each.
  Every row is then in exactly one section, which is what keeps the section counts adding
  up to the toolbar's count — and what stops a card being ticked in one place and turning
  up already ticked in another. [Observed — `groupByValue`, tested]
- **A row with no value at all is not dropped.** It collects in a trailing section named
  for what it is missing — `No Brands`. [Observed — `groupByValue`, tested]
- Sections are ordered by label, `localeCompare` with `numeric: true`. The unnamed
  section is always last. [Observed]

> **The platform's own Portal drops the unnamed rows, and that is the behaviour not to
> copy.** Grouping 44 assets by Asset Type there shows 38. An asset that disappears
> because you *grouped* the grid is one you cannot get back without undoing the grouping
> you wanted. [Observed on the live platform]

[Inferred] Section order does **not** follow the sort direction — reversing the sort does
not reverse the sections. A group is a place, and places are listed by name. Worth
confirming; the platform may differ.

### Folders are the first group

**Whenever the folder you are in holds folders, they are the first section** — headed
`Folders`, counted in folders, before every section the grouping produced. [Observed —
measured: BMW Concord grouped by Entity Type reads `Folders · 1 folder`, then
`Design Composites · 26 assets`]

> 🔴 **Grouping used to make them disappear.** The folder band was drawn only on the
> ungrouped path, so turning Group by on removed a folder's subfolders from the screen
> entirely — not moved to the end, not collapsed into a section: gone. That is the one
> thing a grid must never do to what it contains, and it is the same failure as the
> platform dropping its unnamed rows, one level up. [Observed — reported from the screen]

Ungrouped, folders already came before files — the order every file browser uses. What
grouping changes is only that they become a **named, counted section like the rest**
rather than a loose band above the grid. The rule to build is therefore not "add folders
to the grouped view"; it is **folders are a group, and they sort first**. [Observed]

Three things follow from a folder group not being a group of assets: [Observed]

- **No select-all on it.** A folder is not a selectable asset, and "Select group" there
  would promise the toolbar something it cannot act on — see §5.
- **Its noun is `folder`.** The heading and the next-group bar both say folders, not
  assets; the bar takes the noun from the section rather than assuming.
- **It pages rather than windows.** Ten tiles and then `Show all N folders`, which is the
  band's own behaviour and unrelated to §6's row windowing — a folder tile is a compact
  row, not a card, and there are never thousands of them in one folder.

[Inferred] If folders ever become selectable, the select-all comes back and this becomes
an ordinary group. Nothing else about it would change.

---

## 5. The section heading

`FilterSectionHeader` draws **name · count · action**, then the divider. [Observed —
`FilterSectionHeader`]

| | |
|---|---|
| Name | 14px semibold `gray-800`, truncates |
| Count | 11px `gray-500`, `tabular-nums`, **beside the name**, lower case |
| Divider | **4px solid `gray-100`** — a bar, not a hairline |
| Gap below | 16px |

- The count sits **beside the name** because the two are one phrase — "330i, 4 assets".
  A number alone at the far right of a wide pane reads as belonging to the rule rather
  than to the heading. Lower case for the same reason: it is a sentence, not a label.
  [Observed]
- The divider is a **solid bar**. A section of a grid is a bigger break than a row of a
  table, and a 1px rule under a heading read as underlining the heading rather than
  dividing what came before from what follows. [Observed]
- This heading, the main pane's title, and the rail's "Folders" are **one treatment**.
  They were within a pixel of each other, which reads as an accident rather than a
  hierarchy. [Observed]

### It pins while its own section is on screen

**Sticky, offset by `--chrome-offset`.** It sticks *inside* its section, so the next
section carries it off rather than covering it — two headings can never overlap.
`--chrome-offset` is published by `ScrollAwayHeader` on the scroller: the height it is
currently covering the top with, or 0 when it is away. That contract is
`HANDOFF-scroll-away-header.md`, and the two have to be built to agree. [Observed —
measured: scrolled 900px, the current heading sits at 0 in the scroller while the one
above it has left at −318]

> 🟡 **The z-index ladder, top to bottom: scroll-away header 30, pinned heading 20, a
> card's own checkbox and menu 10.** The heading first shared 10 with the cards and the
> checkboxes painted straight over it — equal z-index falls back to document order, and
> the cards come later. [Observed — reported from the screen]

### Each group selects its own

The heading carries a `FilterSelectAll` scoped to the group, reading **Select group**
rather than Select all. Two controls on one screen both saying "Select all" and meaning
different things is the ambiguity `scopeLabel` exists to avoid. It sits with the name and
the count — across the pane it would read as belonging to the grid. [Observed —
`FilterSelectAll`, `scopeLabel`]

It selects **the whole group**, not the cards currently drawn. "Select group" that
selected some of a group would be the §3 defect wearing a different hat. [Observed]

---

## 6. A group holds everything; the grid draws almost none of it

**Nothing is capped, and the grid is cheap anyway.** Grouping the root library by Brands
mounted **2,367 cards, 2,367 media elements and 46,823 DOM nodes** at once, and the
browser offered to kill the page. Capping was not available as the answer — a cap above a
grouping makes the grouping a function of the cap, which is §3. So the whole library still
reaches the grid and the grid draws only the rows near the viewport: **5,364 nodes and 170
media elements** for the same view, every group still holding exactly what it holds.
[Observed — measured before and after]

`WindowedCardGrid` (`components/ui/WindowedCardGrid.tsx`) is the whole of it:

- **Two spacers stand in for the rows above and below**, sized from the row count, so the
  scrollbar and every offset are exactly what they would be if all the cards were there.
  Nothing jumps as you scroll, and a jump to a group below still lands where it should.
  [Observed]
- **Columns and row height are read off the real grid**, not declared — the tracks are
  `auto-fill minmax(240px, 1fr)` and the count changes with the pane. [Observed]
- **Three rows of overscan** on each side, so a fast scroll does not reach the edge of the
  drawn window before the next measurement lands. [Observed]
- **A pass that changes the window schedules one more.** Drawing different rows moves this
  grid's contents and every grid below it, so one pass is not enough after a jump; it
  converges, because a pass that changes nothing schedules nothing. Without it, jumping to
  the end of a long grouping landed on a blank screen. [Observed — reproduced and fixed]

> **This is only sound because every card is one height.** The asset name reserves two
> lines whether or not it uses them; the chips and the folder line take the room they
> need; and the footer holds one height whatever it carries, so the slack always falls at
> the **foot** of the card rather than in the middle of it. A variable card makes a row's
> height a thing to measure per row, and the spacers stop being exact. [Observed —
> measured: every card 398px inside a folder, 400px in Recents]
>
> Two details of that card, since they are load-bearing here rather than decorative: the
> chips sit **between** the measurements and the folder, and nothing is reserved for them
> — an asset with no chip shows its folder directly under the measurements. And **the
> folder line shows only in Recents**, the one view whose cards come from different
> folders; inside a folder it repeated the page's own title once per card. [Observed]

## 6.1 Getting past a long group

A group can be enormous — grouping the root library by Brands puts 2,086 assets under
BMW. **A long group keeps the NEXT group's heading pinned to the foot of the scroller,
and clicking it goes there.** [Observed]

```
┌──────────────────────────────┐
│ BMW   2,086 assets  Select group   ← pinned at the top
│ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢ │
│ ⌄ Cadillac   2 assets         │  ← pinned at the foot
└──────────────────────────────┘
```

- It appears only on a group of **more than 12**, and only when there is a next group.
  [Observed — `LONG_SECTION`, `app/portal/page.tsx`]
- It is **sticky inside its own section**, the mirror of the heading at the top, so it
  leaves with the section instead of being carried into the next one. [Observed]
- It carries the next group's **name and true count**, in the heading's own type. The
  pair then reads as a place: the group you are in at the top, the one you are heading
  for at the bottom. [Observed]

> 🔴 **It must show only while the real heading is off screen.** Sticky alone does not
> do this: at the end of its section the box comes unstuck and lands in flow, a few
> pixels above the very heading it stands in for — so the same title appeared twice,
> stacked. The stand-in retires once the real heading reaches the band it occupies, 52px
> up from the foot of the scroller. [Observed — reported from the screen]

Two details that keep it from costing anything:

- **The sticky box is zero-height and the bar hangs off it**, so it takes no layout from
  the section and nothing shifts when it goes. [Observed]
- **A scroll listener coalesced on a 50ms timer, deliberately not an
  `IntersectionObserver`.** Both are correct for a reader with the tab in front of them;
  the observer's callbacks ride the frame lifecycle, and this screen has been caught out
  three times now by work that never runs in a tab the browser is not painting — the
  search marks' repaint, a smooth scroll, and this. A timer runs either way. [Observed —
  `document.hidden === true` in the pane, where no observer callback, no scroll event and
  no CSS transition ever fired]

**This replaced a "Show all N / Show fewer" per group.** A collapse is the wrong shape
here: the way out of a group of two thousand is *past* it, not a control that hides what
you came to look at. (The Folders band keeps its Show all — a folder list is short and
collapsing it is genuinely useful. Different problem.) [Observed — designer's decision]

Two things the jump has to get right, both learned the hard way: [Observed]

- **Not `scrollIntoView`.** It puts the heading under the scroll-away header. Scroll the
  scroller by hand and subtract `--chrome-offset`.
- **Instant past three screens, smooth under.** 800,000px of smooth scrolling is either a
  long blur or — in a tab the browser is not painting — no movement at all, because the
  animation runs on frames that never come. `prefers-reduced-motion` is always instant.
- **One correction pass afterwards, on a timer.** Going down sends the scroll-away header
  away, which takes its height out of the layout and shifts every section up by it — so
  the distance measured before the scroll is wrong by exactly that much once it lands. A
  timer and not a frame, for the reason above. [Observed — measured: three consecutive
  jumps each land the heading at 8px from the top of the scroller]

---

## 7. In the URL

`sortBy`, `asc` and `categorizeBy` are shareable, spelled the way the platform's own
Portal spells them. Only departures from the default are written: Updated At writes no
`sortBy`, descending writes no `asc` (ascending writes `asc=1`), None writes no
`categorizeBy`. Cards or table travels beside them as `view=table`. The full rule set — read
once on mount, `replace` not `push`, debounced 200ms — is `HANDOFF-portal.md` §8; it is
the same URL and one decision. [Observed — `lib/portal-url-state.ts`]

```
/portal?folder=BMW+Concord&categorizeBy=Brands&sortBy=Name&asc=1
```

---

## 8. Open questions

1. **Does section order follow the sort direction?** Today it does not — sections are
   alphabetical whatever the sort. §4. [Inferred]
2. **Is 12 the right threshold** for "long enough to want the next group pinned"? It is
   two rows at the usual width. [Inferred]
3. **Grouping by Folder at the root** produces a section per folder — over a hundred of
   them. Nothing caps the *number* of sections, only the cards inside each (§6). Worth
   deciding before it is met. [Observed]

---

## 9. First tasks, in order

1. **§3 first, and build it as a test.** Group a list, sort it both ways, assert the
   section counts are identical. It is the defect this ticket exists to prevent, and it
   is invisible until someone flips a sort.
2. **§4** — the first-value rule, the trailing unnamed section, and folders as the first
   group. All three are the same principle: nothing the grid held before you grouped may
   go missing because you grouped.
3. **§5** — the heading, the divider, the pinning, and the z-ladder.
4. **§6** — the windowing, then the next-group bar. The bar needs §5 built first, since
   it borrows the heading's type and its offset; the windowing needs the uniform card.
5. **§2** — the two selects: the width twin, the Group X, the unknown-field fallback,
   and the Sort comparator owning its direction. Small, and each was reported from the
   screen.

---

## 10. Acceptance checklist

Paths on the reference build, `https://v3-poc-projects-fine-tune.preview.constech.io`
(`main`, deployed on every push), at ≥1280px. The library is live, so its counts drift.
[Observed]

### Sort

- [ ] **The Portal opens on Updated At, newest first** (arrow down). §2.1
- [ ] **A row missing the value sorts last, in both directions.** §2.1
  `/portal?sortBy=Brands` opens on brands near Z, **not** on assets with none;
  `/portal?sortBy=Brands&asc=1` opens on Acura.
- [ ] **Sort and Group offer every filter on every screen** — the screen's own fields
  first, then all the filters, a screen's own filter included
  (`/projects/penske-honda-evergreen/assets` offers **Alert**). §2.4
- [ ] **Sorting or grouping by any of them does what it says** — no field silently
  falls back to another. §2.4
- [ ] **A select is as wide as its value, and the last letter is never clipped.** §2.3
  `/portal?sortBy=Components` → `Components`, whole.

### Group

- [ ] **The X clears to None in one click and does not reopen the select.** §2.2
- [ ] **A URL grouping shows in the control before the library has loaded.** §2.5
  Open `/portal?categorizeBy=Brands` cold: the control reads Brands, never None.
- [ ] **Flipping the sort never changes a group's size.** §3
  `/portal?categorizeBy=Brands&sortBy=Name` and the same with `&asc=1`: identical
  section counts.
- [ ] **Rows with no value collect in a trailing section; none disappear.** §4
  The section counts add up to the toolbar's count.
- [ ] **Inside a folder that holds folders, Folders is the first section.** §4
- [ ] **The heading pins while its section is on screen; the next group pins to the foot
  of a long one and shows only while the real heading is off screen.** §5, §6.1
- [ ] **Grouping the whole library does not freeze the page.** §6
  `/portal?categorizeBy=Brands` at the root, scroll to the end.
