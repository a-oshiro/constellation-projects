# The Portal — hand-off for Alessandro

> **What this is.** The whole Portal screen from Fabio's Constellation prototype: the
> folder rail, the asset grid **and the asset table**, cards and their chips, the filter
> row with Sort and Group by, the platform search, bulk actions, the asset lightbox, the
> Background Collections folder, and the server route that reads the real asset library
> from the platform API. You have your own build of the platform; this is meant to be
> **read by you and by Claude Code** and carried into it, not dropped in as-is.
>
> **Point Claude Code at this file first.** It is the map. The detailed specs are in
> `docs/` — every behaviour, why it is that way, the defects each rule came from, and the
> acceptance checklists. This file says what is where, what to take, and in what order.
>
> Source: branch `dev` at `a688932` of `Constellation-Engineering/v3-poc-projects-fine-tune`,
> taken from the **committed** tree. Tags in `docs/`: **[Observed]** = in the code or
> measured; **[Inferred]** = reasoning, check before relying on it.

---

## 1. What is in the box

```
HANDOFF.md            ← you are here
README.md             ← one screen: how to open and check it
docs/                 ← the specs, one per ticket
src/                  ← code, at the paths it has in the prototype — typechecks as a unit
reference/            ← app chrome the Portal sits in, for reading
```

`src/` **typechecks on its own and its 40 unit tests pass** — five files in it are stubs
standing in for app chrome (§1.3), each marked at the top.

### 1.1 `docs/` — read in this order

| File | Ticket | Covers |
|---|---|---|
| `HANDOFF-portal.md` | — | **The screen.** Rail header and rows (count after the name, the hover kebab), opening and closing panes, searching the tree, the trail and title, folders as contents, asset cards, **the table view**, the URL as state, the three empty states. |
| `HANDOFF-filters.md` | CP-14060 | The filter row: filters as data, fitting to the window, More filters, Default filters (pinning **and order**), faceted counts, ranges. §15 is its checklist. |
| `HANDOFF-grouping.md` | CP-14194 | **Group by & Sort**: the field controls (every filter, always), *the sort never resizes a group*, sections, pinned headings, the next group pinned to the foot, windowing. §10 is its checklist. |
| `HANDOFF-bulk-actions.md` | — | Selecting and acting: the pill that replaces `+ New`, picking never moves the screen, a selection wider than the filters show, **the count as a filter that freezes what it overrides** (§10.1). |
| `HANDOFF-search.md` | — | The one platform search: narrows the screen that used to have its own field, *marks* everywhere else. |
| `HANDOFF-scroll-away-header.md` | — | The header that scrolls off with the content and returns pinned; publishes `--chrome-offset`. |
| `HANDOFF-left-rail.md` | — | Context only: the app's global left rail (`GlobalNav`), which is stubbed here. |

The checklists link to the prototype's deployed build. That host may sit behind Vercel
deployment protection; if a link asks you to sign in, ask Fabio for access.

### 1.2 `src/` — the code

| Path | Take it? | What it is |
|---|---|---|
| `app/portal/page.tsx` | **Core, adapt** | The screen (2,076 lines). Layout and panes, folder state, reading the library, filtering → sorting → grouping, cards or table (`viewMode`), the grouped view (`groupedSections`, `NextGroupBar`, `scrollToGroup`), selection and bulk actions, the lightbox, URL sync. |
| `app/api/portal-assets/route.ts` | **Core, adapt** | Server-side proxy to the platform API. See §5. |
| `components/portal/PortalAssetCard.tsx` | Core | The asset card: thumb (selects), name and hover button (open the lightbox), subtitle, chips, folder line in Recents. |
| `components/portal/PortalAssetTable.tsx` | Core | **The table**: header whose columns sort, folder rows as their own list, asset rows with every chip. `sortFolders` orders folders by the assets' sort. |
| `components/portal/AssetChips.tsx` | Core | An asset's metadata chips: two rows, measured `+N`, a chip click toggles its filter. Used by the card and the table. |
| `components/portal/AssetDetailsDialog.tsx` | Core | The lightbox. |
| `components/portal/PortalFilterPanel.tsx` (+ test) | Core | The Portal's filter **configuration**: one table driving controls, matcher and counts; the reader-by-label Sort and Group use. |
| `components/ui/FilterBar.tsx` (+ test) | Core | The filter row and every control in it, the Default filters dialog (with reordering), and the pure rules. |
| `components/ui/BulkActions.tsx` | Core | The selection pill; also used outside the Portal. |
| `components/ui/AssetCard.tsx`, `CardViewVertical.tsx` | Core | The card frame the Portal card is built on, and its grid cell. |
| `components/ui/WindowedCardGrid.tsx` | Core | Draws only what is near the viewport — cards, or table rows with `variant="rows"`. Needs one height per item. |
| `components/ui/ScrollAwayHeader.tsx` | Core | The main pane's header wrapper. |
| `components/logos-backgrounds/BackgroundFolderTree.tsx` | Core | The folder rail: tree, search, counts after the names, the hover kebab, `+ New Folder`, frozen while only the selection is shown. |
| `components/layout/PaneResizeHandle.tsx`, `lib/use-persisted-pane-size.ts` | Core | Drag-to-resize between panes, remembered. |
| `lib/portal-folder-paths.ts` | Core | Folder paths and children, derived from the assets' folder names. |
| `lib/portal-url-state.ts` (+ test) | Core | The view as a link: folder, filters, `sortBy`, `asc`, `categorizeBy`, `view=table`, and `selected=` while only the selection is shown. |
| `lib/global-search.tsx`, `lib/search-marks.tsx`, `components/ui/Highlight.tsx` | Core | The search context (and `useFreezeGlobalSearch`), marks on controls, marks inside text. |
| `components/logos-backgrounds/BackgroundCollectionCard.tsx`, `ImageReviewDialog.tsx`, `lib/bg-thumbnail.ts` | Optional | The **Background Collections** folder — a prototype data folder with its own card and review dialog. Skip if your platform has no such folder. |
| `components/ui/Toast.tsx`, `lib/export-docx.ts` | Small | The confirmation toast, and `downloadBlob` (bulk download zips with `jszip`). |
| `components/ui/button.tsx`, `checkbox.tsx`, `dialog.tsx`, `Tooltip.tsx`, `lib/utils.ts` | Swap | The prototype's primitives (shadcn-style on `@base-ui/react`). Use yours. |
| `app/portal.css` | Merge | The design tokens the code uses (Tailwind v4 `@theme` colours), the toast and pill animations, the range-slider CSS. |
| `lib/portal-assets.ts` | Sample | 82 of the prototype's 326 generated assets — the shape the filters read, and the fallback when the API is not configured. |
| `vitest.config.mts` | Tooling | `vitest run`, node environment, `@` aliased to the root. |

### 1.3 Stubs in `src/` — replace with yours

Each starts with a `STUB — not the prototype's code` banner.

| Stub | Stands in for |
|---|---|
| `components/layout/GlobalNav.tsx` | The app's left rail — renders nothing. Real one in `reference/`. |
| `components/layout/TopBar.tsx` | The top bar — renders nothing. **The real one holds the search input**, and greys it out while only the selection is shown (`reference/`). |
| `components/chat/EntityChat.tsx`, `lib/chat-store.ts` | The chat button in a card's corner — renders nothing; only its type is kept. |
| `lib/mock-data.ts` | Only `backgroundCollections` (data) and `templates` (ad sizes) — what the Portal and `bg-thumbnail.ts` read. Image paths point at the prototype's `/public`, which you will not have. |

### 1.4 `reference/` — read, do not copy

- `app/layout.tsx` — where `GlobalSearchProvider` wraps the app and `<SearchMarks />` is
  mounted once.
- `components/layout/TopBar.tsx` — the search input (`setQuery` while typing, `submit` on
  Enter), the platform-wide results, and the frozen state.
- `components/layout/GlobalNav.tsx`, `components/chat/EntityChat.tsx` — the real chrome
  behind the stubs.

---

## 2. Dependencies

- **React 19, Next.js (App Router, `next/image`, `next/navigation`), TypeScript, Tailwind v4.**
- **npm:** `lucide-react`, `jszip` (bulk download), `@base-ui/react` +
  `class-variance-authority` + `clsx` + `tailwind-merge` (the primitives), `vitest` (dev).
- **Tokens:** `semantic-primary-*`, `semantic-action-*`, `semantic-success-*`,
  `semantic-error-*`, `semantic-surfaces-container-high`, `semantic-text-*` — values in
  `app/portal.css`. The rest is stock Tailwind.
- **Browser APIs:** `ResizeObserver`, CSS Custom Highlight API (search marks; degrades
  to none), HTML5 drag and drop (Default filters order), the `inert` attribute (frozen
  controls).

---

## 3. The screen in one page

1. **Three panes**: global rail · folder rail (resizable, closable) · main pane. The main
   pane's header — trail, title, `+ New` or the bulk pill, the filter row — scrolls away
   with the content and comes back pinned on the way up. (portal §2–§5, scroll-away doc)
2. **Folders come from the assets.** The tree is derived from each asset's folder name.
   A row reads `name (count)`, the count right after the name; on hover a kebab lies
   **over** the row's end (Rename, Move to…, Delete — mock) without taking a column.
   **Recents** shows every folder at once. (portal §2, §6)
3. **The library is filtered, then sorted, then grouped — in that order, on the whole
   set.** Nothing caps the list above the grouping; the grid windows instead. (grouping §3, §6)
4. **Cards or a table, same library.** A card's thumb selects; the name and the hover
   "Asset Details" button open the lightbox. The table has the same two targets, every
   chip, names on two lines, and headings that sort. In both, a chip is a filter you can
   click. (portal §7, filters §5.20)
5. **In the table, folders are a list of their own**, above the assets and ended by a
   heavier line, in the assets' sort where a folder has the field (name; newest asset
   beneath it). (portal §7, "The table view")
6. **Sort and Group offer every filter, always**, and Default filters sets which filters
   the row starts with **and in what order**. (grouping §2.4, filters §5.7)
7. **Selecting replaces `+ New` with a pill of bulk actions**, and picking never moves the
   screen. **Clicking the count shows only the selection**, freezing — not clearing — the
   filters, the search and the folder list until it is lifted. (bulk-actions §2, §4, §10.1)
8. **The search narrows this screen** and marks matches in the filters. (search doc,
   filters §7)
9. **The URL is the state** — folder, filters, sort, direction, grouping, cards or table,
   and the selection while it is shown alone — and an empty result says *which* kind of
   empty it is. (portal §8)

---

## 4. Order of work

Run `vitest` after each step.

1. **Merge `app/portal.css`, swap the primitives, replace the stubs** with your chrome
   and chat (or nothing).
2. **The data path** (§5): your library behind a route, mapped to the `PortalAsset`
   shape. Until then the page falls back to the sample.
3. **The folder rail and panes** — `BackgroundFolderTree`, `portal-folder-paths`,
   `PaneResizeHandle`. (portal §2–§4)
4. **Cards and the grid** — `PortalAssetCard`, `AssetChips`, `WindowedCardGrid`, the
   lightbox. Keep the card a single height; windowing depends on it. (portal §7,
   grouping §6)
5. **The table** — `PortalAssetTable` on the same data, rows a single height (64px), the
   chips' `+N` opening over the rows below rather than growing the row. (portal §7)
6. **Filters, then Sort and Group** — configuration and the count test first.
   (filters §14, grouping §9)
7. **Bulk actions**, then the count as a filter and the freeze. (bulk-actions §13)
8. **Search, URL state, the scroll-away header.**

---

## 5. Pulling assets and folders from your API

`app/api/portal-assets/route.ts` is the prototype's answer, and its comments carry the
measurements. What it does and why:

- **Server-side proxy.** The key and client id stay on the server (`OFFERS_API_URL`,
  `OFFERS_API_KEY`, `OFFERS_CLIENT_ID` env; nothing is hard-coded). Without them it
  answers `source: "unconfigured"` and the page uses the local sample.
- **Not a snapshot.** `public_url` is a signed CloudFront link with an expiry, so a
  library written into the repo rots into broken images. Read it live.
- **Most recent 200 projects**, each project's assets read **in parallel** (sequential
  was 2s vs 20s). 200 is the platform's page cap for `/projects`; measured, 200 projects
  gave 2,402 assets and 126 folders in 2.4s.
- **Folders are derived from `folder_name`** on each asset: `/projects/{id}/folders`
  answered 403 for this key. The same tree, seen from the leaves. A folder's "Updated" in
  the table is its newest asset anywhere beneath it.
- **`fields` is a name/value list** with lower-case, spaced names (`"vehicle condition"`)
  — look values up by name, do not destructure.
- **A missing `public_url` renders no media element at all** — an empty `src` makes the
  browser fetch the page again. About a fifth of the library is MP4: render
  `<video muted playsInline preload="metadata">` with `#t=0.1`, or it paints a grey box —
  the platform stores no poster. Card and table row alike. (portal §7)
- **Faceted counts are one pass per filter on every keystroke.** Fine at a few thousand
  assets; past that, have the API return facets. (filters §9)

---

## 6. Must-holds

Each was shipped wrong at least once, or was a direct call from the designer; the doc
section tells the story.

- [ ] Selecting, deselecting or clearing never moves anything below the header. (bulk-actions §4)
- [ ] The number beside a filter option is what clicking it returns. (filters §5.4)
- [ ] A filter picked in another folder stays removable, and the empty grid names it.
      (filters §5.5, portal §8)
- [ ] Flipping the sort never changes a group's size; blanks sort last both ways.
      (grouping §2.1, §3)
- [ ] No asset or folder disappears because you grouped. (grouping §4)
- [ ] Every card is one height, every table row is one height; the folder line and
      column only in Recents. (grouping §6, portal §7)
- [ ] Opening a row's chips never moves another row. (portal §7)
- [ ] The rail's kebab never truncates a name to make room for itself. (portal §2)
- [ ] Showing only the selection freezes the filters, search and folders — and lifting it
      gives them back exactly as they were. (bulk-actions §10.1)
- [ ] A link reproduces the view — folder, filters, sort, grouping, cards or table.
      (portal §8)

---

## 7. What not to copy

- **The sample data** (`portal-assets.ts`, `mock-data.ts`) and the **stubs**.
- **The kebab's three actions** — they are mock and do nothing yet.
- **`localStorage`** for pane sizes and the pinned filter set — per browser; a real build
  probably stores per user. If you keep it: render with defaults first, read storage in
  an effect, or the server and client disagree.
- **The Background Collections folder**, unless your platform has one.
- **Line numbers.** The docs name symbols; search for them.

## 8. Open questions worth settling first

- Faceted counts at real scale: client-side or server-side facets? (filters §13)
- More than 200 projects: the platform exposes no cursor to this key. (route comments)
- Should the card view's folder tiles follow the sort too, as the table's do? Today they
  stay alphabetical. (portal §7)
- May a filter cross groups in Default filters? (filters §13)
- The remaining open items per area: portal §9, grouping §8, bulk-actions §12.
