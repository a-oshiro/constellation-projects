# Bulk actions — what a selection lets you do

> **Ticket:** _to be filled in_ · **This hand-off, rendered:** [Bulk Actions](https://claude.ai/artifact/XjUf6FKV4J4SdAj3ckS1kM)
>
> **Who this is for.** You are building **bulk actions** — the bar that appears where a
> screen's primary action sits once the user has picked several items. Written to be read
> by you and by Claude Code in your session; point it at this file first.
>
> Tags: **[Observed]** = it is in the prototype's code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> **This is a platform component, not a Portal feature.** Portal was its first consumer;
> five screens use it now (§9). Any screen with selectable cards or table rows renders it
> in the same place, and every one follows the same selection rule (§10). Next door:
> `HANDOFF-filters.md` §5.17 is the seam with selection (read it — §5 here enforces it),
> `HANDOFF-portal.md` is the screen it is demonstrated on, and `HANDOFF-grouping.md` owns
> the per-group "Select group".

---

## 1. State

Branch `dev`, and **live** — `dev` and `main` move together, and a push to `main` deploys
to production. [Observed]

| | |
|---|---|
| `588fd32` | First draft: the component and the Portal wiring. Committed and pushed by a parallel session on this checkout, mid-work — see §11, defect 6 |
| `59ac112` | No screen movement (§4), `<Button>` migration (§7), fold + kebab (§4.2), the one-flash entrance (§2.2), the pointer cursor (§7), and Recents' folder line as a link (§8) |
| `c4432a6` | `primary` becomes optional and `idle` arrives (§3); the alerts board and signal Assets adopt it (§9) |
| `5f8687f` | **An action keeps the selection; only a delete drops it** (§10). Alerts, signal Assets and Portal's Move stop clearing |
| `8f7a9e6` | Portal's table view — its rows pick into the same selection as the cards (§9) |
| Oct 8 | Approvals' Set Status stops clearing (§10); the count as a filter (§10.1); this document |

Files: `components/ui/BulkActions.tsx` — `BulkActions` (44), `chooseFit` (133), `Pill`
(158), `OverflowMenu` (268), `BulkActionMenuItem` (333). `components/ui/button.tsx` —
the `neutral` variant (39) and the `toolbar` / `icon-toolbar` sizes (71–72).
`app/globals.css` — `bulk-in` (279) and the button cursor (181). The consumers are in §9.
Portal's: the actions block (`app/portal/page.tsx` 732), the slot (1481), the delete
dialog (1987). The Component Library carries a `BulkActions` entry and preview, and the
`Button` preview shows the toolbar pair. [Observed]

Figma: **AV3 Constellation Design System – Component Library**, section `bulk actions`
(`16819:39382`). The pill is the nested frame **`Line items / Top Bar / Actions`** inside
the second `Canonical UI 2.0` instance. The section node is two whole screens, not the
component. [Observed — read through the Desktop Bridge plugin; the REST token was expired]

---

## 2. Two states, one place

**One slot, and the two states replace each other in it.** [Observed]

```
nothing picked     [ + New ]
something picked   ( ✕  3 selected   [▣ Create Assets] [⤓ Download] [⇪ Move to Folder]   ✎̃  ✎  ⧉  🗑 )
```

### 2.1 The spec

| | Figma | Built |
|---|---|---|
| Idle button | `<Button> Small / Primary / Contained`, 30px, `primary/dark`, 13px Roboto Medium, ls 0.46 | `<Button size="toolbar">` [Observed] |
| Pill | 36px, radius 40, `Surfaces/Container High`, padding 3 / 8 / 3 / 4 | same, measured 674×36 at 1440 [Observed] |
| Selection group | X icon button, then `3 selected` — 11px Roboto Regular, 166% line, ls 0.4, `text/primary`, 4px gap | same [Observed] |
| Group → actions gap | 16px | same [Observed] |
| Labelled actions | `<Button> Small / Primary / Outlined`, 30px, `primary/_states/outlinedBorder`, 18px icon, 8px gap | `variant="outline" size="toolbar"`, transparent fill [Observed] |
| Icon actions | `<IconButton> Small / Default`, 30px, 20px icon, `action/active` | `variant="neutral" size="icon-toolbar"` [Observed] |

The icons are lucide stand-ins for the Figma set: `Images` (multi-media),
`Download` (arrow-inbox), `FolderInput` (folder-upload), `WandSparkles`
(pencil-sparkle), `Pencil`, `Copy` (square-behind-square), `Trash2`. [Observed]

### 2.2 Where it departs from the Figma, and why

- **It arrives with one flash of purple.** The swap-in (a 0.97 scale and a fade) plus a
  single pulse of `indigo-100`, the selected-folder purple at a little more intensity,
  that fades to the Figma grey over 0.9s. It is off under `prefers-reduced-motion`. The
  point is that a selection's actions get noticed the moment they are offered.
  [Observed — designer's direction, given in three steps: a purple fill, then two pulses,
  then **one** pulse on the original grey. The last one is what is built.]
- **`· 2 not shown` after the count**, whenever some of the selection is not on screen.
  The Figma has no such state. §5 says why it has to exist. [Observed]
- **No movement and no wrap.** The Figma pill is 36px and the button it replaces is 30px.
  §4. [Observed]

---

## 3. The API

```tsx
<BulkActions
  count={selected.size}            // everything picked
  hidden={pickedNotOnScreen}       // optional — how many of those are not shown
  onClear={() => setSelected(new Set())}
  primary={{ label: "New", onClick, expanded }}   // the idle state: one filled button…
  idle={<>…</>}                                    // …or any controls, in its place
  onlySelected={only}                              // the count is a filter (§10.1)
  onOnlySelectedChange={setOnly}
  actions={[
    { id: "download", label: "Download", icon: Download, onClick },
    { id: "approve", label: "Approve Assets", icon: CircleCheck, disabled: noneCarryAssets, onClick },
    { id: "move", label: "Move to Folder", icon: FolderInput, menu: (close) => <…/> },
    { id: "delete", label: "Delete", icon: Trash2, iconOnly: true, onClick },
  ]}
/>
```

- **The screen owns the selection and what each action does. The component owns the
  swap, the pill, the folding and the menus.** [Observed]
- **An action that needs one more choice takes `menu`** instead of `onClick`. The
  component opens it under the button (or inside the kebab), and dismisses it on an
  outside click or Escape. Rows are `BulkActionMenuItem`. [Observed]
- `iconOnly` marks the trailing run. Its label becomes the tooltip and the
  `aria-label`. [Observed]
- **The idle state is `primary` or `idle`.** `primary` is the one filled button (Portal's
  New). `idle` is any controls, for a screen whose idle row is more than one button — the
  alerts board keeps **Generate New Offer Alerts** and **Generate Signal Alerts** there,
  signal Assets keeps **Generate Assets**, **Set Status** and **Configure**. Approvals
  passes `idle={null}`: nothing until something is picked. `idle` wins when both are
  given. [Observed]
- **`disabled`** greys an action out without removing it, so the pill keeps its shape —
  Approve/Reject Assets when none of the picked alerts carries assets. [Observed]
- The pill is a `role="toolbar"` labelled with the count. [Observed]

---

## 4. Picking a card must never move the screen

**The rule: selecting, deselecting and clearing leave every pixel below the header row
where it was.** [Observed — the designer's requirement, reported from the screen]

### 4.1 Height

The pill is **36px to the eye and 30px to the layout** (`-my-[3px]`). Its extra 3px top
and bottom hang into the row's padding. Measured at 1440 and 1180: the row stays 42px and
the first card stays at y = 210 through select → clear. [Observed]

> 🔴 **Defect, fixed.** The first draft sized the pill to its Figma 36px. The row grew by
> 6px whenever a card was picked, and the whole grid jumped. [Observed — reported from the
> screen]

### 4.2 Width — fold, then overflow

The slot is **the free space in the header row** (`flex-1 min-w-0`). The pill must fit in
it, because wrapping the row moves the screen down just as surely as growing it.
[Observed]

> 🔴 **Defect, fixed.** At a 1180px window the full pill (674px) did not fit its row, the
> row wrapped, and the grid dropped **35px**. [Observed — measured]

As the slot narrows, the pill gives ground **in a fixed order**: [Observed — designer's
spec]

1. **The labelled actions fold to icons, last first** — Move to Folder, then Download,
   then Create Assets.
2. **Then the actions at the end go into a kebab (`⋮`), last first**, until the kebab
   holds everything.

Measured, pill width by slot: 722 → 674 (full) · 622 → 563 (Move folded) · 522 → 484
(Download folded) · 472 → 378 (all folded) · 342 → 340 (Delete in the kebab) · 302 → 302
(two in the kebab) … 182 → 150 (everything in the kebab). The first card stayed at y = 210
throughout. [Observed]

**How it measures.** An invisible full-size copy of the pill (`aria-hidden`, `inert`) is
measured once per change. `chooseFit` works out every other state's width from those
numbers and picks the first that fits, so no state is rendered just to find out whether
it fits. A `ResizeObserver` on the slot and on the copy re-runs it. [Observed]

**The kebab.** It opens right-aligned, because it is the pill's last control. It lists
what it holds as icon + label rows. An action with a `menu` opens that menu in place —
Move to Folder in the kebab shows its folder search there. [Observed]

> 🟡 **Below about 150px nothing is left to fold.** The minimum pill (X, count, kebab)
> overflows the slot sideways rather than wrapping. It never moves the screen, but it can
> overlap the row's right end. At that width the row is past saving anyway. [Observed]

---

## 5. The selection is wider than the screen

`HANDOFF-filters.md` §5.17: the selection is **deliberately independent of the filters**.
Narrowing the list changes what you can reach, not what you have already chosen. That
makes bulk actions dangerous in one specific way: **they act on picks you cannot see.**
[Observed]

The rule built here: **every action acts on the whole selection, and the UI says so out
loud.** [Observed]

- **The pill counts all of it.** When some of it is off screen — another folder, a
  filter, the search — it adds `· N not shown`, with a tooltip: "Hidden by the folder,
  filters or search. Actions include them." Measured: pick 2 in Recents, open Audi
  Concord, pick 1 → `3 selected · 2 not shown`. [Observed]
- **Delete's confirmation names them.** "Delete 3 assets? 2 of them are not on screen —
  hidden by the current folder, filters or search. They are deleted too." [Observed]
- **X clears all of it**, hidden picks included. [Observed]

[Inferred] The alternative — acting only on what is visible — would contradict §5.17's
promise that clearing a filter hands your earlier picks back. You cannot have both, so
this ticket picked one and labelled it. Confirm with product.

---

## 6. Portal's actions

| Action | What it does | |
|---|---|---|
| **Download** | One file downloads as itself; several go as **one zip** (`jszip`), because a browser asked for N downloads at once blocks all but the first. Duplicate names get ` (1)`. A file that cannot be read is skipped and the toast counts it | **Real.** Measured: 3 assets → `3-assets.zip`, 788 KB, no CORS failure [Observed] |
| **Move to Folder** | A menu of every folder that holds assets, with a find field (126 folders live) | **Session-only** [Observed] |
| **Delete** | Confirmation dialog (§5), then removed | **Session-only** [Observed] |
| Create Assets, AI Enhance, Edit Variables, Create a Copy | A toast: "… isn't wired up yet" | Placeholders; the designer will describe them [Observed] |

- **"Session-only" means the platform is never written.** Moves and deletions are an
  override over what `/api/portal-assets` returned (`movedTo`, `deletedIds`). The grid,
  the counts and the filters all read through it, and a reload puts everything back.
  [Observed]
- **Only Delete clears the selection.** Move keeps it, and so do Download and the
  placeholders — §10. Moved assets that leave the open folder are still picked, and the
  pill counts them under `· N not shown` (§5). [Observed]
- Each action ends in a toast (`components/ui/Toast.tsx`). [Observed]

---

## 7. What it added to the design system

- **`Button`**: the **`toolbar` / `icon-toolbar`** sizes (30px — the Figma `Size=Small`)
  and the **`neutral`** variant (a grey glyph on `action/active`). They exist because the
  repo rule (`AGENTS.md`) is that every button is `<Button>`, `Button`'s smallest regular
  size is 40px (its `sm` is 40 too), and a 40px control would turn this pill into a band.
  [Observed]
- **Every enabled `button` and `[role=button]` shows the hand cursor**, app-wide
  (`globals.css`, base layer, so a `cursor-*` utility still wins). Tailwind v4 dropped it
  from buttons. [Observed — designer's request]
- **Two raw `<button>`s remain on purpose**, and both are exceptions to `AGENTS.md`:
  `BulkActionMenuItem` (a menu row, matching Portal's existing New menu) and Recents' folder
  line (§8). `<Button>` would make each a 40px pill. [Observed — the decision is mine;
  overrule it if the rule is meant to cover rows]

---

## 8. Recents: the folder line goes to the folder

In Recents — the one view whose cards come from different folders, and the only one that
shows a card's folder line — **clicking the line opens that folder.** It stops the click,
so the asset does not also open. It turns indigo with an underline on hover. Measured: the
Audi Montgomery line → `?folder=Audi+Montgomery`, no dialog. [Observed]

It is a plain button so the card keeps its uniform height. `WindowedCardGrid` depends on
that (`HANDOFF-grouping.md` §6). [Observed]

---

## 9. Every screen that uses it

| Screen | File | Picks | Idle state | Actions |
|---|---|---|---|---|
| **Portal** — cards and table | `app/portal/page.tsx` | Asset cards, and the rows of the table view, into one selection | `primary`: **New** (opens its menu) | Create Assets · Download · Move to Folder · AI Enhance · Edit Variables · Create a Copy · Delete (§6) |
| **Alerts** — board and list | `components/projects/alerts/AlertsTimeline.tsx` (on the project overview and the Alerts task) | Alert cards on the board, rows in the list — the same selection, so switching views keeps it | `idle`: **Generate New Offer Alerts**, **Generate Signal Alerts** | Regenerate · Approve Email · Reject Email · Approve Assets · Reject Assets · Delete Alerts |
| **Assets** — signal projects | `components/projects/SignalAssets.tsx` | Portal asset cards | `idle`: **Generate Assets**, **Set Status**, **Configure** | Generate · Set Status (menu) · Configure · Copy Links · Delete |
| **Approvals** | `components/tasks/ApprovalsView.tsx` | Queue rows | `idle={null}` — nothing | Set Status (menu) · Review |
| Component Library | `components/ui/ComponentLibraryDialog.tsx` | — | — | The preview: idle, 3 picked, 5 picked with 2 hidden, and a narrow slot |

[Observed]

- **Alerts' Approve/Reject Assets act only on the picked alerts that carry assets**, and
  are disabled when none does. Approving one half of an alert never rejects the other —
  the other stays pending. [Observed]
- **Generate, Configure** (Assets) and **Create Assets, AI Enhance, Edit Variables, Create
  a Copy** (Portal) are placeholders that toast "… isn't wired up yet". [Observed]
- **Every one of them** acts on the whole selection, says `· N not shown` when some is off
  screen (§5), and keeps the selection after the action (§10). [Observed]

---

## 10. An action keeps the selection

**The rule: running a bulk action never deselects. Only Delete does — what was picked no
longer exists.** It holds on every screen in §9. [Observed — designer's direction, given
for the whole site: "inclusive nos cards do portal"]

Why: the next action is very often on the same set. Approve the e-mails of five alerts,
then their assets. Set a status, then copy the links. Move to a folder, then download.
Clearing after each one made the user pick the same set again. [Observed — reported from
the screen]

- **X in the pill** is the way to let go. [Observed]
- **What an action moves out of view stays picked**, and the pill says so (`· N not
  shown`, §5) — an alert approved into another column, an asset moved to another folder, a
  queue row whose new status filters it out. [Observed]
- **Delete clears** — the ids are gone, so a selection of them would count nothing.
  [Observed]
- Screens that close as they act are not bulk actions and still clear: Browse Offers'
  **Add** closes its dialog; Templates, Offers and Backgrounds' **Remove** deletes.
  [Observed]

> 🔴 **Defect, fixed.** Each screen cleared after its own actions — Portal after Move,
> Alerts after every approval, Assets and Approvals after Set Status. Found from the
> screen: "quando eu seleciono … e executo uma ação, … eu quero que eles continuem
> selecionados". [Observed]

---

### 10.1 The count is a filter

**Click "N selected" and the screen shows only the selection.** The count turns into a
**contained** chip — primary fill, white text, the one filled thing in the pill so the
narrowed state is hard to miss — with an ✕ beside it; the ✕ lifts the filter and **keeps
the selection**. [Observed — designer's request, contained on a second pass "para ficar
mais visível"]

- **It overrides the screen's other narrowing**: the folder (Portal), the filters and the
  search. The point is to see exactly what the next action will touch, so `· N not shown`
  cannot appear while it is on. [Observed]
- **What it overrides is frozen while it is on.** The filters (not the sort or the
  grouping), the top bar's search and Portal's folder list keep their values but grey out
  to 50% and go `inert`; hovering says "Showing only the selected — lift it to filter
  again" (`ONLY_SELECTED_REASON`). Lifting the filter thaws them exactly as they were —
  nothing is cleared. The folder list still scrolls, and its header (Close, New Folder)
  stays live. In Alerts only the search is frozen: the period still applies.
  [Observed — designer's direction]
  - The parts: `FilterBar`/`PortalFilterPanel`/`ApprovalsFilterBar` take
    `disabledReason`; `BackgroundFolderTree` takes `disabledReason`; the screen calls
    `useFreezeGlobalSearch(reason)` (`lib/global-search.tsx`), which the top bar reads.
    [Observed]
- **In Portal it is in the URL**, beside the folder and the filters: while it is on, the
  picked ids ride as repeated `selected=` keys (`lib/portal-url-state.ts`), and a link or
  a reload opens on that selection, already filtered to it. Lift it and the keys go; the
  selection alone is not written — it is only the view while it is shown on its own.
  Measured: 2 picked → `?selected=…&selected=…`; reload → `2 of 5,499 assets`, the chip on;
  ✕ → the query empties, `5,499 of 5,499`, still `2 selected`. The other three screens keep
  no view state in their URL yet. [Observed]
- **It lifts itself when the selection empties** — the screen derives it as
  `onlySelected && selection.size > 0`. Deselecting a card while it is on takes that card
  off screen. [Observed]
- **The screen owns the filter; the component only draws it.** Pass
  `onOnlySelectedChange` to offer it; without it the count is plain text. Wired on all four
  screens in §9. [Observed]
- Measured in Portal: 3 picked at the root → `3 of 5,488 assets`, three cards; ✕ →
  `5,488 of 5,488`, still `3 selected`. On the overview's alerts: 2 of 17 rows, then 17
  again. [Observed]

---

## 11. Defects that showed up on the way

Kept rather than deleted, because each one is a rule.

1. 🔴 **The row grew 6px on selection** (§4.1). Fixed with the overhang.
2. 🔴 **The row wrapped at narrower panes and the grid dropped 35px** (§4.2). Fixed with
   fold-then-overflow.
3. 🟡 **Raw `<button>`s against `AGENTS.md`.** The first draft styled its own. Migrated
   to `<Button>`, which is what produced §7's additions.
4. 🟡 **A keyframe colour can silently be nothing.** Tailwind v4 emits a theme variable
   only when a utility uses it. Written as `--theme(--color-indigo-100)`, so the value is
   resolved at build time. [Observed — `indigo-100` is used by no utility here]
5. 🟡 **The browser pane runs hidden** (`document.hidden === true`). No `ResizeObserver`
   callback and no CSS animation ever fires there, and screenshots time out. So
   **resize-while-selected was verified only by forcing re-renders at set widths, never
   by a live resize**, and the flash was verified as computed keyframes rather than
   watched. Same trap as `HANDOFF-grouping.md` §6.1. [Observed]
6. 🔴 **A parallel session on this checkout committed this work mid-flight and pushed it
   to `main` — production.** `588fd32` is the first draft (raw buttons, the 6px jump).
   It was live from 16:29 until `59ac112` replaced it at 16:50. [Observed — `git log`]

---

## 12. Open questions

1. **Act on hidden picks, or only on visible ones?** Today: all, labelled (§5). [Inferred]
2. **Should Escape clear the selection?** Not built. Escape already closes the asset
   lightbox, and the two would compete. [Inferred]
3. **Live folder counts do not move with a move.** In live mode the rail's numbers come
   from the API, so after Move to Folder the rail still shows the old counts. They are
   right in the local library. A write API would settle it. [Observed]
4. **The flash colour is off-token.** The rail's selected folder is `indigo-50`, a
   Tailwind colour. The nearest Figma token, `primitive/main/100`, is `#FAFAFF` — nearly
   white. Worth a token, or a decision to use one. [Observed]
5. ~~**Table rows**~~ — answered: the alerts list and Portal's table view pick into the
   same selection as their cards (§9). [Observed]
6. **Should a selection survive leaving the screen?** Today it is the screen's state and
   resets on navigation. [Inferred]

---

## 13. First tasks, in order

1. **§4 first, as a test.** Pick a card and assert nothing below the header row moved;
   then repeat at three pane widths. It was broken twice, both times by something that
   looked fine at the width it was built at.
2. **§5** — the `not shown` count and the delete copy. It is the one rule here that
   prevents real harm.
3. **§10, as a test on every consumer.** Pick three, run each non-delete action, assert
   the three are still picked; run Delete, assert the selection is empty. It regressed on
   four screens at once.
4. **§2–§3** — the pill and its API against the Figma.
5. **§6, §9** — wire Move and Delete to the platform's write API, then the placeholders
   as the designer specifies them.
6. **§7–§8** — small, and each was reported from the screen.
