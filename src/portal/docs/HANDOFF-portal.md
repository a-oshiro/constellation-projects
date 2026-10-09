# Portal — folders, the rail, and the main pane

> **Who this is for.** You are building the Portal's folder navigation in the real
> product. Written to be read by you and by Claude Code in your session — point it at
> this file first.
>
> Tags: **[Observed]** = it is in the prototype's code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> **Three things on this screen are separate tickets.** The filter row is
> `HANDOFF-filters.md`; the platform search is `HANDOFF-search.md`, which this one meets
> at one point — what the search does to a *tree*, in §4; and the header that scrolls
> away and comes back when you scroll up is `HANDOFF-scroll-away-header.md`. That last
> one is not described here at all, but §6's pinned section headings depend on it: it is
> what publishes `--chrome-offset`, and the two have to be built to agree.

---

## 0. Read this before anything else

**Where the files come from is not part of this ticket.** The prototype reads a REST
proxy and reconstructs a hierarchy it is not given, because that is what a prototype
could reach. In production there is no API in between: there are folders and files, and
they already have parents, children and counts. **Every number, rule and workaround the
prototype uses to invent that structure is scaffolding — ignore all of it.** What is
specified here is what the interface does once the tree exists. [Observed for the
prototype's side; the production shape is the project's own premise]

Two consequences worth stating plainly, because they are the only places the scaffolding
shows through when you run the prototype:

- Folders one level below a dealership open **empty**, and their counts read `(0)`. That
  is the prototype not knowing what is in them, not a behaviour to reproduce. [Observed]
- The library is a slice, not the whole thing, so the tree is shallower than the real
  one. [Observed]
- **Assets arrive with no file, intermittently.** That is the proxy, not the library —
  but the rule §7 draws from it is not scaffolding and is meant to be built: a card with
  no file renders no media element. [Observed]

Everything else below is behaviour and design, and all of it is meant to be built.

---

## 1. State

Branch `dev`, at `e61d684`. **All of it is live**: `origin/main` is at the same commit,
and pushing `main` is the deploy. [Observed]

| | |
|---|---|
| `e61d684` | folders are the first group when the grid is grouped |
| `82a9f1b` | the resize seam is a full-height bright purple line |
| `29f0e0a`, `6438f88` | the Folders pane gets a named, outlined New Folder button |
| `c55fa7e` | an asset with no file gets no media element |
| `be8b143` | the grid draws only the rows near the viewport; one card, one height |
| `2c75ed4` | a narrowing filter is never hidden; the empty grid says which kind of empty |
| `0dc698c`, `f6a8870` | the empty state names the filter that emptied it, and the pick stays removable |
| `5bd9fc1` | a group's heading pins while its section is on screen, and carries its own select-all |
| `9180357` | one treatment for the three headings that name a place |
| `e461d72`, `daa3587` | the folder, the filters, the sort and the grouping go in the URL |
| `3dc9e7d` | the folders toggle drops its filled state; cards lose the dead ⋯ |
| `af0fd29` | the pane narrows, and opens the parent of a hit |
| `c7cd2c1`, `bcf24e9`, `9202056` | the rail draws a real tree |
| `c3837fd` | branch guides; videos stop rendering as broken images |
| `0af9b1f` | the level below; folders as cards in the grid |
| `5c0c829` | the root is a folder too; the Folders band |
| `8f539d3` | "Show fewer" sticks to the bottom |
| `f233e28` | furniture rides the first line; the breadcrumb |
| `658251e` | the trail reads as one line; the bands share a grid |
| `18e6000`, `8d7090a` | the breadcrumb truncates its middle, and a shortened crumb opens on hover |

Files: `components/logos-backgrounds/BackgroundFolderTree.tsx` (the rail),
`app/portal/page.tsx` (the main pane). [Observed]

---

## 2. The rail — its header, and how a row is built

### The pane header

**Folders** on the left, **`+ New Folder`** and the close **×** on the right, one row.
Add sits beside Close rather than on a band of its own — the row it used to share went
with the search field, and one button does not earn a band. [Observed]

**The action is named, not a bare `+`.** In a pane that is nothing but folders, a naked
glyph did not say *which* folder it meant — the one you are in, or a new one beside it.
[Observed]

**It is outlined where the main pane's `+ New` is filled.** Same pill, same size, one
step quieter: that button is the page's primary action, and two filled pills on one
screen compete for the role. The colours are the design system's own `outline` variant
(`components/ui/button.tsx`) — `--semantic-primary-main` on the label,
`--semantic-primary-states-outlinedborder` on the edge — rather than an indigo picked by
eye. [Observed — measured 105×30 against the main pane's 103×28]

**The heading truncates before the button does.** The pane narrows while you search
(§4), and what should give there is the word "Folders", never the label of the action.
[Observed — no overflow at either width]

### The seam between the panes

The gap between the rail and the main pane is an 8px drag rail. At rest it is the app
background; on hover a **2px line in `--semantic-primary-light` (#6356E1) runs the full
height of the gap**, and the cursor becomes `col-resize`. [Observed — measured: the line
is exactly as tall as the rail it divides]

It runs edge to edge on purpose. A short stub centred in a tall gap read as a mark *on*
the seam rather than as the seam itself, and said nothing about how far the thing you
were about to move reached. Full height, the line **is** the boundary. [Observed]

> ⚠️ **`PaneResizeHandle` is shared, not the Portal's.** Projects, Competitive
> Intelligence, the Studio, `ProjectContentLayout` and the Canonical UI all use the same
> component. It is written up here because this is where it is specified, **not** because
> it belongs to this screen — a change to it changes five other surfaces. [Observed]

Each screen owns its own size state and the clamp (`minSize` 200, `maxSize` 640 by
default); the handle only reports the drag. [Observed —
`components/layout/PaneResizeHandle.tsx`]

### How a row is built

A row is: **caret · icon · name · count**. Everything below follows from the name being
able to wrap. [Observed]

| | |
|---|---|
| Indent, first level | 8px |
| Indent, per level | **26px** |
| Guide line | 1px, `gray-200`, at `8 + depth × 26 + 7` — under the parent's caret |
| Caret / icon | 12px / 13px, centred in a box **one line tall**, so they sit on the FIRST line |
| Count | **right after the name**, 4px gap — not at the pane's edge; centred against the whole row |

Type, everywhere a folder is named:

| Where | Size | Line height | Colour | Wraps |
|---|---|---|---|---|
| Folder name, rail | **11.5px** | 18px | `gray-600`, `indigo-700` when active | two lines, then ellipsis |
| Item count, rail | 10px | — | `gray-400` | no |
| Folder name, tile | **13px** | snug | `gray-900` | no |
| Item count, tile | 13px | — | `gray-400`, inline after the name | no |
| `N subfolders`, tile | 11px | — | `gray-500` | no |
| Breadcrumb | 12px | — | `gray-500` throughout | wraps as a row |
| Folder name, title line | **14px, semibold** | — | `gray-800` | truncates |
| "Folders", rail heading | 14px, semibold | — | `gray-800` | no |
| Section heading, grouped grid | 14px, semibold | — | `gray-800` | truncates |
| Section count | 11px, lower case | — | `gray-500` | beside the name |

[Observed — `BackgroundFolderTree.tsx:41-51, 130, 134`; `app/portal/page.tsx:585, 592,
879, 931`]

The three headings that name a place — the rail's "Folders", the main pane's title, and
a section of a grouped grid — are **one treatment**. They were within a pixel of each
other, which reads as an accident rather than a hierarchy. [Observed]

**Group by is its own ticket** — `HANDOFF-grouping.md`, [CP-14194](https://theconstellationagency.atlassian.net/browse/CP-14194),
[hand-off](https://claude.ai/code/artifact/6c1b112f-aef2-4bd9-9d82-a79851c5f38f). What follows is only what it does to *this* screen's type and layers;
the control, the sections and the sort rule are there. [Observed]

**A grouped section's heading pins to the top while that section is on screen**, and the
next section carries it off rather than covering it — it sticks inside its own section,
so two headings can never overlap. It clears whatever the scroll-away header is covering
the top with: that header publishes its height as `--chrome-offset` on the scroller, 0
when it is away, and the heading reads it. The layers, top to bottom: **scroll-away
header 30, pinned heading 20, a card's checkbox and menu 10** — the heading shared 10
with the cards at first, and the checkboxes painted over it, because equal z-index falls
back to document order and the cards come later. [Observed — measured: scrolled 900px,
the current section's heading sits at 0 in the scroller while the one above it has left
at −318]

**Each section carries its own select-all**, beside its name and count, reading
"Select group" rather than "Select all" — two controls on one screen both saying
"Select all" and meaning different things is the ambiguity that avoids. [Observed]

A grouped section is divided by a **4px solid `gray-100` bar**, not a hairline: a section
of a grid is a bigger break than a row of a table, and a 1px rule under a heading read as
underlining it rather than dividing what came before from what follows. Its count sits
**beside the name, in lower case** — "330i, 4 assets" is one phrase, and a number alone at
the far right of a wide pane reads as belonging to the rule. [Observed]

The rail is a level quieter than the tile on purpose: the rail is a list you scan and the
tile is a thing you pick. 11.5px is below the app's usual floor of 12 and was chosen so a
dealership name fits two lines in a 240px pane rather than three. [Observed that it is
11.5; the reasoning is [Inferred]]

**Every row reserves the caret's box, including rows that have no caret.** Without it a
childless folder slides a caret's width left and the icons stop falling on one diagonal.
The prototype renders the chevron invisible rather than hard-coding a width, so the two
cannot drift apart if the icon changes size. [Observed — measured: icons at 118, 144,
170 across three levels, one step each]

**The caret and icon ride the first line, not the middle of the pair.** A wrapped name
grows downward; the furniture stays where the name starts. This was first built as a
2-3px nudge and that was wrong — it held for wrapped rows and pulled single-line rows
off. Centring inside a one-line box is exact for both. [Observed — measured: first-line
centre and icon centre agree at 139/139 for one line and 171/171 for two]

**The rail scrolls.** However deep or long the tree, it is one scrolling column — no
pagination, no "show more" inside the rail. (The *Folders band in the main pane* is the
one that pages, §6; they are different things.) [Decision; already what the prototype
does — Observed]

> The count is the one thing that does **not** ride the first line. It describes the row,
> not the first line of a name. [Observed; the reasoning is [Inferred]]
>
> **It follows the name rather than sitting at the pane's edge.** Right-aligned, the
> counts read as a column belonging to nothing in particular; beside the name they read
> as one phrase — `Brand Kits (0)`. The name therefore takes only its own width, not the
> rest of the row. [Observed — designer's call]

**A folder row has a kebab, shown on hover.** It opens a menu — **Rename, Move to…,
Delete**, which are **mock** for now: they close the menu and do nothing. Recents has
none; it is a view, not a folder. [Observed]

- **It takes no space.** It is laid *over* the row's right end on a fade in the row's
  own colour (white, `gray-50` on hover, `indigo-50` when active), not given a column of
  its own — a reserved slot would truncate every name in the tree by its width just in
  case. Nothing moves when it appears. [Observed — measured: a two-line name ends at
  280px, the kebab starts at 293px]
- It shows on row hover, on keyboard focus, and while its menu is open. [Observed]
- **The menu is portalled and `position: fixed`**, because the rail scrolls and would
  clip a menu inside it. It opens below the kebab, or **above it when that would run
  past the foot of the window** — the rail reaches the bottom of the screen. It closes on
  a click outside, on Escape (focus returns to the kebab), and on any scroll or resize,
  since a fixed menu would otherwise stay put while its row moved away. [Observed]
- Clicking the kebab or the menu never opens the folder — React bubbles a portal's
  events through its owner, so the row's click is stopped at the kebab. [Observed]
- The menu's items are the design system's `BulkActionMenuItem`. [Observed]

---

## 3. Opening and closing

This is the part most likely to be got wrong, because there are two gestures and they do
different things.

| Gesture | What happens |
|---|---|
| Click the **row** | Opens that folder in the main pane **and unfolds it in the rail** |
| Click the **caret** | Expands or collapses, and nothing else |

[Observed — `BackgroundFolderTree.tsx:344-361`]

**The row only ever opens.** It never toggles. A row that toggled would collapse the tree
under the cursor of anyone clicking a folder they were already inside — and the rail is
how you know where you just went, so it has to follow you down rather than fold up
behind you. [Observed that it only opens; the reasoning is [Inferred]]

Both gestures were wrong at some point in the prototype and each was reported: first the
row toggled and did not navigate, then it navigated without unfolding. The pair above is
what survived. [Observed]

**The client root starts open.** Closed, the rail says nothing but the client's own name.
[Observed — `BackgroundFolderTree.tsx:314`]

**Which branches are open survives between visits.** Leave the Portal, come back, and the
tree is as you left it — someone who works out of one folder should not have to walk back
down to it every time. [Decision — not built: the prototype holds this per mount, so
today every branch but the root is closed again on return. Observed]

[Inferred] The obvious shape is the set of open paths in `localStorage`, read in an
effect rather than during render — reading storage during render makes server and client
disagree, which is a hydration error. `usePinnedFilters` in `FilterBar.tsx` is the
existing precedent for exactly this.

**Every branch is a place you can stand**, including one that holds no files of its own.
It has folders to show, and the main pane shows them — see §6. The prototype's root is
exactly this case. [Observed]

---

## 4. Searching the tree

The platform search narrows the rail. A tree narrows differently from a list, and these
are the rules — the full context is `HANDOFF-search.md` §4. [Observed]

- A **leaf** hides when its name does not match.
- A **branch** survives if its own name matches **or anything beneath it does, at any
  depth**. Hiding a folder whose child matched would hide the hit with it.
- A branch with a hit inside **opens itself**. A match in a collapsed branch is a match
  you were not shown.
- That open state is **derived, not stored**. Clearing the term hands every branch back
  the state you had left it in — it does not leave the tree splayed open.
- **The folder you are standing in stays listed whatever you type.** A tree that hides
  where you are is worse than a long tree: the pane stops containing the thing it
  describes.

[Observed — measured: 27 rows, `"jellybean"` leaves three, `"09 sept"` opens four levels
down, clearing restores all 27 with the branches collapsed as before]

Matched runs are marked in the same yellow every other surface uses. [Observed]

---

## 5. The main pane — the trail and the title

Top to bottom: **breadcrumb**, then the **title line**, then the filters.

```
Portal  ›  Constellation Incentives and Signals  ›  Audi Concord
📁 Audi Concord   [+ New]
[File Type] [Entity Type] [Brands] …
```

| | |
|---|---|
| Gap, breadcrumb → title | **10px** |
| Gap, title → filters | **2px** |

[Observed — `app/portal/page.tsx:911`, measured from the computed padding]

The two gaps are deliberately uneven: the trail and the title are one block, and the
filters read as the next thing rather than a third band. [Inferred]

**Every crumb but the last navigates to that level.** In a folder three deep it is the
only way out that is not hunting for the parent in the rail. [Observed]

**The last crumb looks like the rest of the trail** — same colour, same weight. It is one
line of text; `aria-current="page"` is what says which end you are at, for anyone who
cannot see it. [Observed]

**The breadcrumb is hidden at the root**, where it would be a single crumb to nowhere.
[Observed]

### When the trail does not fit

**Truncate the middle crumbs. Never remove one.** The first and the last keep their full
text; the ones between them shorten with an ellipsis, each on its own, and every level
stays in the trail. The trail is always **one line**. [Observed — measured at 900px:
"Portal" 32px whole, the two middle crumbs clipped at 127px and 108px, the last 164px
whole, on one 18px line]

```
Portal  ›  Constellation Incenti…  ›  Audi Conc…  ›  Audi Concord
```

The reason to shorten rather than collapse: a trail that replaces its middle with a
single `…` stops saying how deep you are, and depth is most of what a breadcrumb is for.
A shortened name still counts. [Inferred]

**Hovering a shortened crumb opens it.** Over **300ms** it grows into its own text and
walks the crumbs after it toward the right-hand end; the trail still never wraps, and
whatever is pushed past the edge is clipped. `flex-shrink` goes 1 → 0 and the browser
interpolates that as width, so the animation is the layout rather than a transform over
it. [Observed — measured at 900px: the crumb goes 127px → 193px, still one 18px line]

A truncated crumb also carries its full text in a `title`. [Observed]

[Inferred] The floor is 3rem — below that a shortened name says nothing at all. What
gives when even the floor does not fit is still open; see §9.

**The title is the last segment only, never the path.** A folder under a dealership is
addressed as `Audi Concord/Audi Concord`, and the header printed that until it was
fixed. The trail above already carries the rest. [Observed]

---

## 6. The main pane — folders as contents

**A folder that holds folders is not empty**, and the grid must not draw it as though it
were. Its folders come first, then its files — the order every file browser uses.
[Observed]

The Folders band:

- **No heading.** The tiles are self-evidently folders. [Observed]
- **Same grid as the file cards** — one shared component, tracks of
  `minmax(240px, 1fr)`, `auto-fill`. A folder therefore sits in the same column as the
  card beneath it and the two bands reflow together as the pane resizes. Measured at
  240px each. Sharing the component rather than repeating the numbers is what keeps them
  from drifting. [Observed — `CardViewVertical.tsx:27`]
- **A tile is not a card.** It is a compact row — icon, name, item count, and
  `N subfolders` beneath — not a square with a picture of a folder in it. The tile spends
  its room on what you choose by. [Observed]
- **The icon stays an icon.** Not a thumbnail, not a collage of what is inside. A folder
  is picked by its name; a picture of four of its images says less and costs four
  requests. [Decision; already what the prototype does — Observed]
- **Ten tiles, then `Show all N folders`.** Ten is two rows at the usual width.
  [Observed]
- **Expanded, `Show fewer` sticks to the bottom of the scroller**, over a white fade so
  the tiles do not bleed through it. With 126 tiles open the collapse sat several screens
  down, which made expanding a one-way door. Collapsed, it rides with the content — there
  is nothing to escape from. [Observed — verified scrolled 2,000px into the expanded
  list]

---

## 7. Asset cards

**A video is not an image.** Around a fifth of the library is MP4 and every one of them
rendered as a broken-image icon until it was fixed. [Observed — 59 of the first 262
assets]

The prototype renders `<video muted playsInline preload="metadata">` with a `#t=0.1`
fragment, which makes the browser seek a tenth of a second in and paint that frame.
Without the fragment it paints a grey box. The platform stores no separate poster for
these, so the frame is the only picture there is. A fragment never reaches the server, so
a signed URL is untouched. [Observed]

[Inferred] If production can store a real poster, prefer it — the fragment trick costs a
range request per tile.

> 🔴 **An asset with no file gets no media element — not an empty one.** The platform's
> `public_url` is nullable, and the prototype's route maps null to `""`, so an asset can
> reach the grid with nothing behind it. **An empty `src` is not merely blank: the browser
> resolves it against the current address and re-downloads the page** — as an image on the
> image branch, and as a *video* on the video branch, where `#t=0.1` on nothing is the
> same trap wearing a fragment. Multiplied by the cards on screen, that is a page the
> browser offers to kill.
>
> The card's own ground shows through instead, with a quiet glyph, so the square reads as
> "nothing to show" rather than as still loading. [Observed — Next reports it in the
> console, which is how it surfaced]
>
> **It comes and goes with the upstream**: one response carried 314 of 2,367 assets like
> that, the next two carried none. So it is not a fixed set of broken assets to find and
> exclude — the guard has to live at the card. Production has whatever its own answer to a
> missing file is; the rule that survives is *do not render the element*. [Observed —
> measured across three responses]

**Every card is one height, and the slack falls at its foot.** The name reserves two
lines whether or not it uses them — two is what nearly every one of these names takes,
and reserving three left a band of white under most cards. Below it: the measurements,
then the chips, then the folder. Nothing is reserved for the chips, so an asset carrying
none shows its folder directly under the measurements; what is left over collects at the
bottom. [Observed — measured: every card 398px inside a folder, 400px in Recents]

This is not only tidiness. A card of constant height is what lets the grid draw only the
rows near the viewport instead of all 2,367 of them — `HANDOFF-grouping.md` §6 has the
measurements and the mechanism. [Observed]

**The folder line shows only in Recents.** That is the one view whose cards come from
different folders. Inside a folder, every card is from it, and the line repeated the
page's own title once per card. [Observed]

**Cards draw no ⋯ menu.** The one that was there opened nothing, and a control that does
not work is worse than no control. `AssetCard` now draws a menu only when a caller passes
one; bring it back per card, with the menu, when there is something in it. [Observed]

**The folders toggle has no filled state while the pane is open.** The pane sits right
beside it saying the same thing, and the grey square only competed with it. It keeps its
hover, which is about the pointer rather than the state. [Observed]

### The table view

The list toggle beside the count switches the grid to a **table**: the same library,
filtered, sorted and grouped exactly as the cards are, one row per asset.
[Observed — `components/portal/PortalAssetTable.tsx`]

| Column | Width | Sorts by |
|---|---|---|
| ☐ | 40px | — (the heading checkbox selects every listed asset) |
| Name — 40px square-cornered thumbnail, then the name on up to **two lines**, then an ellipsis | 1fr, min 200px | Name |
| Details — **every chip the card carries** | 1.3fr, min 220px | — |
| Type | 72px | File Type |
| Dimensions | 110px | Dimensions (by area) |
| Shape | 96px | Shape |
| Folder — **Recents only**, as with the cards | 120–180px | Folder |
| Updated | 104px | Updated At |

- **Folders come first, as a list of their own** — never interleaved with the assets, and
  ended by a 4px `gray-100` line, the way a filter's picked values sit above its other
  values. A folder row is the folder icon, the name with its count right after it, and
  `· N subfolders`; Type reads "Folder". Clicking it opens the folder. [Observed]
- **Folders follow the assets' sort where a folder has that field.** Name sorts them by
  name; Updated / Created by their most recent asset anywhere beneath them, in the same
  direction as the assets. A field a folder does not carry (File Type, Brands…) leaves
  them by name, A to Z. The card view's folder tiles stay alphabetical. [Observed —
  `sortFolders`]
- **A column heading sets the sort**; the same heading again flips it. A new column starts
  newest-first for a date and A to Z for the rest. It is the same state as the Sort
  control, so the two always agree, and it goes in the URL. The active heading carries
  an arrow and `aria-sort`. [Observed — measured: Name ascending gives `Audi Bellevue…
  Wyoming Valley BMW`, again gives the reverse, URL `sortBy=Name&asc=1` then `sortBy=Name`]
- **The card's two targets carry over:** the checkbox selects (and feeds the bulk-actions
  pill), the name opens the lightbox. The heading checkbox adds or removes only the listed
  assets, as Select all / Select visible does. A row with no file shows the same quiet
  glyph as the card; a video paints its first frame. [Observed]
- **Every chip is here**, the card's own `AssetChips`: two rows, the rest behind `+N`,
  and a chip is a filter you can click — `330i` narrows to Model 330i. **`+N` opens the
  full list over the rows below**, on a white panel with a shadow, and the row keeps
  its height; `show less` closes it, and opening another row's closes this one.
  Growing the row instead would break the windowing below. [Observed — measured: the
  panel covers the next row and no row moves]
- **The thumbnail is square-cornered** — a picture of the asset, and the asset has
  corners. [Observed — designer's call]
- **Every row is 64px** — a name on two lines and two rows of chips — so the rows off
  screen go undrawn: `WindowedCardGrid` with `variant="rows"`, the same mechanism as the
  cards. Grouped by File Type at the root, 4,323 JPEG rows draw 17. [Observed —
  measured]
- Grouped, each section is its heading and its rows; the column header is drawn once,
  above the first section, and does not pin (the section headings do). [Observed]
- **The view travels with a link**: `view=table`, written only for the table, since
  cards are the default. See §8. [Observed]

---

## 8. A view is a link

**The folder you are in and the filters you have set are written to the query string**,
so copying the address bar hands someone else the same view and a bookmark reopens it.
The assets are re-read, so they see it against whatever is current. [Observed —
`lib/portal-url-state.ts`, `app/portal/page.tsx`]

```
/portal?folder=BMW+Concord&fileType=JPEG&sortBy=Name&categorizeBy=Brands&view=table
```

The order, the grouping and the view are in it too: a link that restored what
is listed but not how it is arranged — or whether as cards or as a table — hands
someone half of what the sender was looking at. `sortBy` and `categorizeBy` are
spelled the way the platform's own Portal spells them. The view is `view=table`,
the word a reader uses rather than the code's `list`; cards write nothing, and
any other value opens as cards rather than in some third state. [Observed —
`lib/portal-url-state.ts`, tested in `lib/portal-url-state.test.ts`]

Rules, all of them borrowed from the Studio's version of this problem
(`lib/studio-url-state.ts`), which is the precedent to follow rather than reinvent:

- **Only non-defaults are written.** A link stays readable, and a link that omits
  something means *default* — not "whatever the recipient last had". [Observed]
- **Multi-value filters repeat the key** — `?brands=Audi&brands=BMW` — rather than
  comma-joining. A folder or a brand may contain a comma, and repeating the key sidesteps
  the escaping question instead of inventing a separator nothing is allowed to contain.
  [Observed. The platform's own Portal appears to comma-join; if the real implementation
  must match it, that is one line.]
- **A range is `min-max`**, either side allowed to be empty — `width=600-`, `width=-1080`
  — which is what a blank box in the control means. [Observed]
- **The URL is read once, on mount.** After that the screen owns the state and the URL
  follows it; re-reading would fight the writes. [Observed]
- **`replace`, not `push`, and debounced 200ms.** A filter is not a place you navigated
  to, so Back should leave the screen rather than undo one chip at a time; and dragging a
  range slider fires every frame. [Observed]
- **Which filter keys are shareable is read off the filter set itself**, not listed
  again — a filter added to `PortalFilters` is shareable the moment it exists. [Observed]

Verified both directions: opening `?folder=BMW+Concord&fileType=JPEG` lands on BMW
Concord at `20 of 26 assets`; clearing the filters drops `fileType` and the count returns
to `26 of 26`. Opening `?sortBy=Name&asc=1&categorizeBy=Brands` reads back as Name,
ascending, grouped by Brands with sections for Audi, BMW, INFINITI, Subaru and
Volkswagen; flipping the direction back to descending drops `asc` from the URL, since
descending is the default and only departures are written. Opening
`?folder=BMW+Concord&view=table` lands in the table; switching to cards drops `view`,
and back to the table writes it again. [Observed — measured]

**The search term is deliberately not in the URL.** `HANDOFF-search.md` §5.1 decided the
term belongs to the screen you are on and clears when you leave it, which a shareable
term would contradict. The two decisions have to move together. [Observed]

> **A filter you set here follows you into the next folder.** The bar filters, the tree
> navigates, and they are deliberately separate — but the vocabularies each filter offers
> are derived from the folder you are looking at, so a value picked in one folder can
> outlive the list it came from. It then narrows the new folder to nothing while its own
> menu no longer contains it: a badge reading "1" over an empty grid, with nothing to
> untick. Every menu now lists a picked value whether or not the current options contain
> it, which is enough to make it removable, since a picked option is never disabled.
> [Observed — this shipped, and was found by reading a URL that carried
> `dimensions=600+x+450` into a folder with no such size]
>
> **A filter that is narrowing is always shown**, even where the current folder offers it
> nothing to choose from. A filter with no options is otherwise hidden — an empty select
> is worse than an absent one — but hiding one that is *doing something* removed the only
> sign on screen that anything was filtering, and with it the only way to undo it. It is
> shown with its value ticked, whatever is left in its list. [Observed]

### There is nothing here: which of the three

An empty folder and a folder emptied by something someone set look identical, and the
second is the one that reads as the app being broken. Each case says which it is, and the
two that are somebody's doing carry the way out. [Observed — all three measured]

| When | What it says | Action |
|---|---|---|
| A pick this folder has never heard of | *Nothing here matches **Dimensions 600 x 450**. That filter came from another folder — this one has no assets like that.* | Remove that one pick |
| Filters that do belong here, leaving nothing | *No assets here match the filters. This folder holds 10 assets — none of them match what is set.* | Clear the filters |
| Genuinely empty | *This folder contains no assets.* | none — there is nothing to undo |

Naming the count in the second case is the point of it: "this folder holds 10 assets" is
what tells you the folder is not the problem. [Inferred]

The first case removes **only that one pick** — the other filters stay where they are,
which is the whole difference from Clear Filters. [Observed — measured:
`?folder=Alexandria+Volkswagen&dimensions=600+x+450` shows the stranded notice at
`0 of 10 assets`; the button returns `10 of 10` and leaves `?folder=Alexandria+Volkswagen`]

**The notice keys off the assets being empty, not the grid.** A folder with subfolders
still has tiles to draw, so a version keyed off an empty grid never appeared in exactly
the folders where a stranded filter is most likely. [Observed]

[Inferred] The alternative not taken: clear the filters outright on a folder change. That
would make the bar follow the tree, which is a bigger decision than this screen — the two
are deliberately independent today.

> **A control has to be able to show a value it has not heard of yet.** A link is read on
> mount, while the fields it names are derived from a library that is still loading — so
> the grouping control said "None" over a grid that was visibly grouped, because a
> `<select>` whose value matches no option falls back to the first one. Both field
> controls now keep the current value selectable whether or not it is in the list yet.
> [Observed — this was a live defect, found by someone reading the control and concluding
> the feature was not built]

---

## 9. Decisions taken

These were open when this document was drafted and have been answered by the designer.
One of them is **not in the prototype** and is marked so — build it from the spec here,
not from the code. [Observed]

| | Decision |
|---|---|
| Folder tile | An **icon**, not a thumbnail of the contents. Already what the prototype does. |
| Breadcrumb overflow | **Truncate the middle, never drop it**, and open a crumb on hover — §5. Built. |
| Open/closed state | **Survives between visits** — §3. **Not built.** |
| Long trees | The rail **scrolls**. It does not paginate and has no "show more". Already what the prototype does. |
| `Show all N folders` | Stays as it is, at any count. No search of its own in the band. |

### What is left genuinely open

**The resize seam cannot be operated without a mouse.** It declares `role="separator"`
with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` — announcing itself to
assistive technology as a widget you can operate — and then carries only `onMouseDown`:
no `tabIndex`, no `onKeyDown`, no pointer or touch handler. So it cannot be reached by
keyboard, moved by arrow keys, or dragged on a touch screen, while the ARIA promises all
three. The fix is small (focusable, arrows nudge, Home/End to the clamps, and
`onPointerDown` in place of `onMouseDown`), but it is **five other surfaces wide** — see
the warning in §2. [Observed — read from the component; nothing else handles it]

And one that falls out of the truncation rule: **if even the truncated middle
does not fit** — four or five levels of long names in a narrow pane — nothing says what
gives. The rule below shortens each middle crumb; it does not say what happens when
shortening them all is still not enough. Worth deciding before a deep tree exists.
[Inferred]

---

## 10. First tasks, in order

1. **Build §3 exactly.** Two gestures, two behaviours, and the row that only opens. It is
   the part that was got wrong twice here.
2. **Then §2.** The reserved caret box and the first-line alignment are cheap to build in
   and expensive to retrofit, because every other measurement hangs off them.
3. **Then §5 and §6.** The trail, and folders as contents.
4. **§7 before any demo.** A broken-image icon on a fifth of the library is the first
   thing anyone will see.
5. **The one decision in §9 the prototype does not have** — open branches surviving a
   visit. It is specified in §3; it cannot be copied from the code.
