# Global search ("Search anything") — hand-off

> **Who this is for.** You are picking up the platform's single search **inside this
> repo**. It is written to be read by you and by Claude Code in your session — point it
> at this file first.
>
> Tags: **[Observed]** = it is in the code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> **The filter system is a separate ticket** — see `HANDOFF-filters.md`. The two meet at
> exactly one seam, described in §6. Read that before you change the context's shape.
>
> **Read §2 before anything else.** The two-level model (live vs. submitted) is the whole
> design; everything else follows from it.

---

## 0. State of the branch — read this first

**Re-checked 2026-09-28.** The search has changed substantially since the first
draft: it now reaches the whole platform rather than two screens, and §5.1 —
the one red defect — is fixed. Sections rewritten on that pass were §0, §1,
§3.3, §3.4, §3.6, §4, §5.1, §10, §11, §12. §2, §6, §7, §8 and §9 were re-read
and still hold.

**Updated again the same day**: the Portal's folder rail moved from marking to
narrowing, which makes twelve narrowing surfaces rather than eleven, and it is
the first one that narrows a *tree* — the rules for that are in §4.

### Where the code is

| | |
|---|---|
| local `dev`, `origin/dev`, `origin/main` | `4b35624` — **all of it is live** |

Everything in this document is deployed: `main` sits at the same commit as `dev`,
and pushing `main` is the deploy. The table below no longer splits into shipped
and unshipped. [Observed]

### The commits, oldest first

| | |
|---|---|
| `80c166c` | one search across the platform; the term stops following you between screens |
| `d6748f9` | the match is marked everywhere; the caret stays in the top bar |
| `9df058a` | the Add Offers pane and the templates table mark their matches |
| `1ea4460` | the count says what was narrowed; control labels are marked |
| `3490385` | controls that appear after you typed get marked too |
| `afa2e17` | readable marks on filled controls; ⌘K reaches the field |
| `7e02b1f` | the submit hint wears the same chip as ⌘K |
| `c8d17fc` | a match inside a filter the row could not fit stops being silent |
| `a5fc840` | the caret stays in the header when a menu opens itself |
| `be126b3` | **the search marks a filter and no longer opens it** — see the seam with the filters |
| `4b35624` | it marks the filter's name too, not only its values |
| `af0fd29` | the folders pane narrows, and opens the parent of a hit |
| `bcf24e9`, `9202056`, `0af9b1f`, `5c0c829`, `8f539d3` | the rail draws the platform's real tree — Portal plumbing the narrowing operates on |

Working tree is clean. [Observed]

Deployment, from the project's standing rules: pushing `main` deploys straight
to production on Vercel. [Observed]

**Three defects are recorded below: §5.2, §5.3, §5.4. A fourth, §5.1, was
fixed on this pass and is kept as a record of what was done and why.**

---

## 1. Overview

There is **one** search on the platform — the top bar's *Search anything*. No screen
carries a field of its own any more. What it does when you type depends on where you
are, and the rule is this:

> **Where a screen used to carry its own search field, the platform search NARROWS it.
> Everywhere else it only MARKS what is already on screen, and hides nothing.**

Twelve surfaces narrow. They are exactly the ones that had a field before, so nothing
that used to be searchable stopped being searchable, and nothing that was not became a
place where rows can vanish. Eleven of them narrow a list; the Portal's folder rail
narrows a tree, which needs rules of its own. [Observed — §4]

Marking happens two ways, and the difference is worth understanding before you change
either:

| | Rows | Control labels |
|---|---|---|
| Mechanism | the `Highlight` component **wraps** the matched run in `<mark>` | `SearchMarks` **paints** ranges with CSS custom highlights |
| Why | the screen that drew the row knows which field it matched | there are ~700 buttons and no convention saying which is which |
| Where | §3.3 | §3.6 |

Three fields remain that are **not** this search, and each is deliberate: the "find
below" inside a filter menu (§6), the pickers inside modal dialogs — which cover the top
bar and cannot reach it — and the mocked Gmail chrome in the e-mail prototypes, which
depicts another product. [Observed]

---

## 2. The two levels

This is the core of the design and the reason `query` and `submitted` are separate fields
rather than one. [Observed — `lib/global-search.tsx:14-17, 23-32`]

| | **Live** | **Submitted** |
|---|---|---|
| Field | `query` | `submitted` |
| Trigger | every keystroke | `Enter`, or the hint chip |
| Scope | the screen you are on | the whole platform |
| Renders | narrowed rows + yellow marks + opened filters | the results dialog |

**Why both.** Typing narrows what is in front of you. But a search that came up empty on
the current screen should still find the thing *somewhere else*, and say which screen to
go to for it. That is what submitting is for. [Observed — `GlobalSearchResults.tsx:5-8`]

The two genuinely disagree in size, by design. Measured: on `/portal` in Recents,
`"Toyota"` narrows the screen to **51 of 1,113 assets**; submitting the same term reports
**101** assets platform-wide, because the dialog walks the whole library rather than the
folder-scoped subset. [Observed — measured in the browser]

---

## 3. Components

| File | Lines | Role |
|---|---|---|
| `lib/global-search.tsx` | 90 | The context. State, `matchesQuery`, clearing on navigation. |
| `lib/search-marks.tsx` | 196 | Paints the term inside control labels. **New.** |
| `components/layout/TopBar.tsx` | 17–180 | The field, ⌘K, the two chips, the clear button. |
| `components/layout/GlobalSearchResults.tsx` | 182 | The platform-wide results dialog. |
| `components/ui/Highlight.tsx` | 36 | The yellow mark, for rows. |

### 3.1 `GlobalSearchProvider`

Mounted at the **root layout**, wrapping everything. [Observed — `app/layout.tsx:30-39`]

It is a context rather than props because the writer (the top bar) and the readers
(whatever page is mounted, and the filter bar inside it) sit on **opposite sides of the
layout tree**. [Observed — `global-search.tsx:10-12`]

```ts
interface GlobalSearch {
  query: string;  setQuery: (next: string) => void;   // narrows the current screen
  submitted: string | null;  submit: () => void;      // opens platform-wide results
  clearSubmitted: () => void;
  clear: () => void;
}
```
[Observed — lines 23-32]

**`useGlobalSearch()` never throws outside the provider** — it returns an inert
null-object. This is deliberate: the Component Library renders these components in
isolation. Keep that property. [Observed — lines 55-62]

### 3.2 `matchesQuery`

```ts
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && text.toLowerCase().includes(q);
}
```

Case-insensitive containment — **the** definition of "matches", shared so that no two
surfaces can drift apart about it. [Observed — lines 64-69]

### 3.3 `Highlight`

Wraps every matched run in `<mark className="bg-yellow-200 text-inherit rounded-[2px]
px-0">`. Marks **all** occurrences in the string, not just the first. Returns a plain
`<span>` when the query is empty or nothing matches, so it is safe to use unconditionally.
[Observed — `Highlight.tsx:8-36`]

Used by every surface that draws rows: filter options, task table cells, the detailed
list, folder tree labels, the results dialog, and the cards — project, offer, template,
alert, conversation, asset — plus the two lists whose rows are written inline rather than
through a card (the Add Offers pane, the templates table). A match looks identical
everywhere, and the rule that decided to show a row cannot drift from the rule that
paints it. [Observed — §4]

**One rule when you add it somewhere new.** Pass the term that did the narrowing, not the
one in the context. They are usually the same and sometimes not: `CIBrowseView` filters by
its own field when a dialog hosts it, and reading the platform term there would choose
rows by one word and paint them with another.
[Observed — `CIBrowseView.tsx:532-546`]

### 3.4 The field

`aria-label` and placeholder both `"Search anything"`. `Enter` submits; `Escape` clears
both levels. [Observed — `TopBar.tsx:110-115`]

Centred with `absolute left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4` rather than by
flex. This is deliberate and load-bearing: the logo on the left and the icon cluster on
the right are **never** the same width, so a flex centre drifts toward whichever side is
lighter. Taking the field out of the flow is what puts it on the window's centre line.
[Observed — `TopBar.tsx:98-103`]

**⌘K, or Ctrl-K, puts the caret in the field from anywhere** and selects what is already
there — pressing it again is almost always the start of a different search rather than a
correction of the last one. It calls `preventDefault`, because Chrome binds ⌘K to the
address bar and the page asked first. One search for the whole platform is only as
reachable as its shortest route to the keyboard, and every screen has given up its own
field. [Observed — `TopBar.tsx:54-72`]

The field's right-hand corner holds one of two things, never both: the **`⌘K`** chip while
it is empty, and the submit affordance **`↵ to search Constellation`** plus an X once you
type. They wear the same bordered chip, written once as `FIELD_HINT` so they cannot drift
— they occupy the same corner one at a time, and two different shapes read as two
different kinds of thing. The submit one keeps a hover, being the only one of the two you
can click; the `⌘K` chip is `aria-hidden` and `pointer-events-none`.
[Observed — `TopBar.tsx:20-21, 148-172`]

### 3.5 The results dialog

`role="dialog"`, `aria-label="Results for {query}"`, opening directly under the field.
Closes on Escape or click-away. [Observed — `GlobalSearchResults.tsx:108-127`]

Five sections, in this order, **`PER_SECTION = 5`** hits each with an `n of total` note
when truncated: [Observed — lines 23, 49-93]

| Section | Source | Matched against |
|---|---|---|
| Projects | `lib/mock-data` `projects` | name, dealerName, oem |
| Alerts | `ALERT_ROWS` | account, workTitle, workDetail, status, owner |
| Tasks | `TASK_ROWS` | account, workTitle, status, owner |
| Assets | `PORTAL_ASSETS` | name, folder, brand, make, model, collection |
| Folders | distinct `asset.folder` | the folder name |

Folders are not a dataset of their own — they are the distinct folders the assets name,
which is the same tree the Portal's rail shows. [Observed — lines 85-87]

**There is no index and no endpoint.** It walks the prototype's in-memory datasets
directly, so a new dataset appears here the moment it exists, with nothing to register.
[Observed — lines 10-12]

Measured: `"Toyota"` → **109 results**; Projects *5 of 7*, Assets *5 of 101*, Folders
present; no Alerts or Tasks section, because neither dataset contains the term.
[Observed — measured]

### 3.6 `SearchMarks` — the term inside control labels

Mounted once, in the root layout beside the provider. It paints the term wherever it
appears in a **button, link, tab or menu item**, and nothing else — a term marked in every
paragraph on screen would be noise, and the question this answers is "where is the thing I
can act on". [Observed — `search-marks.tsx:92`, mounted in `app/layout.tsx`]

**It paints rather than wraps**, and that is the whole design. There are roughly 700
buttons in the app and only a fifth come through the shared `Button`, so wrapping each
label would mean touching every button in the codebase and still missing the next one
someone writes. CSS custom highlights take a list of `Range`s and colour them **without
changing the DOM**: nothing extra inside a button, nothing for React to reconcile, no
label shifting because it happens to match. [Observed]

Four things about it that are not obvious, in the order you would trip over them:

1. **The paint rule is injected by the component**, not written into `globals.css`.
   Tailwind's pipeline treats `::highlight()` as an unknown pseudo-element and strips the
   rule — the ranges were registered and nothing painted them. If you move the rule back
   into a stylesheet, check it survives the build. [Observed — measured; the rule was
   absent from the compiled CSS]
2. **Two highlight names, not one.** On a filled control — white text on indigo — yellow
   behind white ink erases the label, which is the one thing a mark may not do. Text whose
   computed colour is light is registered under a second name that restates the ink in the
   brand purple. Which control is filled is asked of the *rendered text*, not of a class
   name: there is no convention saying which buttons are filled, but every one has a
   computed colour. The colour is only read for runs that actually matched, so the walk
   stays a string search over everything and a style read over the few labels that hit.
   [Observed — `search-marks.tsx:29-31` the two names, `40-57` the rules, `59-77` the ink test]
3. **A MutationObserver on `<body>` rebuilds the marks**, so a menu opened after you typed
   is marked too. Safe to watch the whole body precisely because this paints rather than
   wraps: registering ranges changes no nodes, so the observer cannot see its own work and
   loop. [Observed]
4. **The repaint is on a 50ms timer, not `requestAnimationFrame`.** rAF is the obvious
   choice and the wrong one: frames stop in a hidden tab, so a menu opened there stayed
   unmarked until something else woke the loop — measured, with `document.hidden` true and
   no frame in 45 seconds. This is DOM work, not painting. [Observed — measured]

Text already inside a `<mark>` is skipped, so a row the `Highlight` component marked is
never painted twice by two mechanisms. [Observed — `search-marks.tsx:97-104`]

Browser support: Chrome 105+, Safari 17.2+, Firefox 140+. Where `CSS.highlights` is
missing the controls simply go unmarked and the search still narrows what it narrows.
[Observed — the guard; support figures are [Inferred] from the API's history]

---

## 4. Who reads the live query

**Narrowing** — these twelve had a field of their own before, and each one hides rows
now. Every one of them also shows the narrowing in its count, `7/20 projects`, through the
shared `FilterCount`: a short list has to read as a search result rather than as a short
list.

| Surface | Reads at | Narrows |
|---|---|---|
| Portal | `app/portal/page.tsx:345` | assets, via `matchesPortalFilters` |
| Task Manager | `app/tasks/page.tsx:43` | rows, via `matchesTaskFilters` |
| Projects board | `app/projects/page.tsx:75` | the kanban, name + dealer |
| Project rail | `app/projects/[id]/page.tsx:388` | the project list in the left pane |
| Chats | `app/chats/page.tsx:29` | conversations |
| Alerts board | `components/projects/alerts/AlertsTimeline.tsx:195` | alerts, via that screen's own `matchesQuery` |
| Project offers | `app/projects/[id]/offers/page.tsx:102` | the offer grid and table |
| Templates | `app/projects/[id]/templates/page.tsx:54` | the template grid and table |
| Logos & Backgrounds | `app/projects/[id]/logos-backgrounds/page.tsx:162` | the background list |
| Offers catalogue | `components/offers/OffersCatalog.tsx:260` | models and trims |
| Add Offers pane | `components/offers/BrowseOffersPane.tsx:183` | the pane's model list |
| CI browse | `components/competitive-intelligence/CIBrowseView.tsx:147` | on a page only — in a dialog it uses its own field |
| Portal folder rail | `BackgroundFolderTree.tsx:103, 154, 310, 405` | the folder tree — see below |

**Marking only** — these hide nothing; they paint the match on what is already drawn.

| Surface | Reads at |
|---|---|
| Filter controls | `components/ui/FilterBar.tsx:152` and `:1110` — **opens matching filters**, the seam, §6 |
| Task table / detailed list | `TaskTable.tsx:65`, `TaskDetailedList.tsx:23` |
| Cards | `ProjectKanbanCard.tsx:111`, `OfferCard.tsx:90`, `TemplateCard.tsx:88`, `AlertCard.tsx:106`, `ChatPieces.tsx:102` |
| Every control label | `lib/search-marks.tsx`, mounted once — §3.6 |

[Observed — grep of `@/lib/global-search` imports; line numbers current as of `8f539d3`]

### The folder rail is the one that narrows a tree

Worth its own note, because a tree narrows differently from a list and the rules are not
obvious. Each row decides for itself, so the behaviour holds at any depth:

- a **leaf** hides when its name does not match;
- a **branch** survives if its own name matches *or anything beneath it does*, at any
  depth — hiding a folder whose child matched would hide the hit with it;
- a branch with a hit inside **opens itself**. A match sitting in a collapsed group is a
  match you were not shown. That open state is *derived, not stored*, so clearing the term
  hands every branch back the state you had left it in;
- the folder you are standing in stays listed whatever you type. A tree that hides where
  you are is worse than a long tree — the pane would stop containing the thing it
  describes.

[Observed — `BackgroundFolderTree.tsx:287-331`; measured: 27 rows, `"jellybean"` leaves
three, `"09 sept"` opens four levels down, clearing restores all 27 with the branches
collapsed as before]

> The rail draws a real tree rather than a flat list. How that tree is built, and
> everything else about the Portal's folders — the two gestures that open and close them,
> the indentation, the breadcrumb, the type — is its own ticket: **`HANDOFF-portal.md`**.
> Only the narrowing rules above belong to this one.

> **Three pages had a field that narrowed nothing.** Offers, Templates and Logos &
> Backgrounds each drew a search box through `TaskPageHeader` and never read its value —
> eslint reported `query` assigned and never used in all three. They filter now, and
> `TaskPageHeader` has lost the slot so a page cannot grow a decorative field through it
> again. [Observed — measured before the change]

Each screen owns its own haystack. Portal:

```ts
`${asset.name} ${asset.folder} ${asset.collection} ${asset.brand} ${asset.make} ${asset.model} ${asset.tags.join(" ")}`
```
[Observed — `PortalFilterPanel.tsx:226`]

Tasks:

```ts
`${row.account} ${row.project} ${row.workTitle} ${row.workDetail} ${row.owner} ${row.status}`
```
[Observed — `TaskFilterBar.tsx:77`]

---

## 5. Defects — measured, do not reproduce

### 5.1 ✅ FIXED — the query used to follow you between screens, silently

Kept as a record, because the fix is a design decision someone may want to revisit and
because the shape of it matters if you touch `query`'s lifetime.

**What it was.** The provider sits at the root layout and nothing cleared the term on
navigation. Measured: typed `"Toyota"` on `/portal`, clicked through to `/tasks`. The
field still read `Toyota` and the Task Manager opened at **`0/679 alerts`** — an empty
screen whose cause sat in a top-bar field the user was no longer looking at, under an
empty state that said *"No alerts match these filters"* and never mentioned the search.
[Observed — measured, before the fix]

Rolling the search out to nine more surfaces would have multiplied that by five, which is
what forced the decision.

**What was chosen.** The term narrows the screen you are on, so leaving the screen drops
it. A search meant to outlive the screen is what Enter is for — it opens the results
across the whole platform. The two rejected options were: keep it and make every empty
state name the term, which needs the empty state of all eleven surfaces written; and keep
it and put it in the URL, which is §9's last item and a bigger change.

**How.** Adjusted during render against the previous pathname, not in an effect:

```ts
const pathname = usePathname();
const [lastPath, setLastPath] = useState(pathname);
if (pathname !== lastPath) {
  setLastPath(pathname);
  setQuery("");
  setSubmitted(null);
}
```
[Observed — `global-search.tsx:53-58`]

An effect would paint the new screen once with the old term still narrowing it, and
setting state in one is what the repo's `react-hooks/set-state-in-effect` rule is about.
Comparing to the previous value during render is React's own pattern for resetting state
when something upstream changes.

Verified on a **client-side** transition, which is the case that was broken — a full
reload would have cleared the state anyway: `/portal` with `"Audi"` typed, back to
`/tasks`, field empty and the table at `679/679`. [Observed — measured]

### 5.2 🟡 No debounce anywhere

`setQuery` fires on every keystroke and nothing defers it — no `debounce`, no
`useDeferredValue`, no `startTransition` in the search path. [Observed — grep across
`lib/`, `components/layout/`, `components/ui/`]

On `/portal` each keystroke recomputes **23 facet passes over the library**
(`derivePortalCounts`). At the prototype's scale this is unmeasurable. Against the real
library — roughly **9,800 assets** — it is ~225k predicate evaluations per keystroke.
[Inferred — arithmetic from the measured library size; I did not profile it]

### 5.3 🟡 `submit()` performs a side effect inside a state updater

```ts
const submit = useCallback(() => {
  setQuery((q) => { setSubmitted(q.trim() || null); return q; });
}, []);
```
[Observed — `global-search.tsx:40-42`]

`setSubmitted` is called *inside* the `setQuery` updater, which React may invoke twice
under StrictMode (on by default in Next 16 dev). The write is idempotent so nothing breaks
today. It is written this way [Observed]; that it is currently harmless is my reading [Inferred].

It is reading current state through an updater because `submit` has an empty dependency
array. A ref, or simply depending on `query`, says the same thing without the
anti-pattern. [Inferred]

### 5.4 🟡 Portal search cannot find a file type

The Portal haystack (§4) omits `fileType`, `dimensions`, `shape`, `year` and the other
metadata the cards display and the filters offer.

Measured on 1,113 assets: `"Toyota"` → 51, `"png"` → **0** — while every visible card is a
PNG and *File Type* is a pinned filter. [Observed — measured]

[Inferred] Either fold those fields into the haystack, or make it explicit in the UI that
free text searches names and taxonomy while file attributes are the filters' job. Silent
zero is the worst of the three.

---

## 6. Seam with the filter system — READ THIS

> **Re-read against the code on 2026-09-24**, after 15 commits to `FilterBar.tsx`. Every
> behaviour below still holds. Two things changed underneath it: the seam now has **two**
> call sites instead of one, and the "find below" field **moved out of `FilterSelect`**.
> Line numbers are current as of `a9b3091`.

The only coupling between the two tickets. Full detail is in `HANDOFF-filters.md` §7; what
you need to know from this side.

### Who reaches into the filters

Two components call `useGlobalSearch()` and react to `query`:

| | |
|---|---|
| `FilterSelect` | `FilterBar.tsx:152` — a control in the row |
| `MoreFiltersMenu` | `FilterBar.tsx:1110` — the menu holding the filters that did not fit |

The second is new since this document was written. It passes `query` down to the values it
lists so a filter reached through *More filters* marks its matches like one in the row.
[Observed — `FilterBar.tsx:1245`]

**The search marks a filter. It does not open one.** [Observed]

- A filter holding matches grows a **yellow count badge** — on its chip in the row, and
  on the *More filters* chip for every matching filter the row could not fit, with
  per-filter counts on the rows inside that menu. Nothing opens. [Observed]
- Matched runs are marked with the same `Highlight` inside options **and inside the
  filter's own name** — its chip, the label that rides the stroke once something is
  picked, and its row inside *More filters*. Typing `asset` used to mark every asset name
  on the grid and leave the **Asset Types** filter untouched. [Observed — `4b35624`]
- Opened by hand with a term typed, the **matches lead** the option order. What follows
  them is ordered by `byAvailability`: values that would leave results, alphabetically,
  then values that would leave none below them. So the order under a search is *matches,
  then reachable, then dead* — three bands, not two. [Observed]

> 🔴 **This section used to open every filter whose options match, and the sentence above
> is the correction.** It was right while a term reached one or two filters. Across the
> Portal's 27 it is not: `"audi"` reached five, three panels opened over one another on
> top of the grid, and the *More filters* menu came up over those.
>
> **What was cluttered was never the moment they opened — it was how many.** That is why
> arming the search-inside-filters with a keystroke (`⌘F` was proposed) was dropped: it
> moves *when* five panels appear, not *that* five appear, and it takes the browser's own
> Find shortcut on the one screen most covered in marks. Changed in `be126b3`;
> `HANDOFF-filters.md` §7 carries the same decision from the filter side, and lists the
> three pieces of machinery that existed only to serve the opening and went with it.
> [Observed — reported from the screen, with the URL]

### The filter menus have a search of their own — it is not this one

Each list of values opens with a small field at its head, placeholder "find below", which
narrows that one list.

**It is no longer local to `FilterSelect`.** It lives in `FilterValueList`, a component
extracted since this document was written, and that component is rendered in two places:
the dropdown under a control in the row, and the side panel of the *More filters* menu.
Both therefore have a find field; neither touches this context.
[Observed — `FilterBar.tsx:304-420`, rendered at `280` and `1238`]

The division has shifted with the change above, and is now cleaner than it was: **this
search says which filters are worth opening; that field narrows one you have opened.**
Neither opens anything by itself. [Observed]

They do share one slot. An option is highlighted with `query || find` — the platform
search wins, and the local field only marks text when the platform search is empty. That
is why the two can look identical on screen while being unrelated in the code.
[Observed — `FilterBar.tsx:381`]

Keep them separate. A single field doing both jobs would mean typing in one screen's menu
re-narrowed every other surface on the page. [The separation is [Observed]; the
consequence is [Inferred]]

### What you must not break

`FilterSelect` tracks which **term** was dismissed, not merely that the menu closed:

```ts
const searchOpen = matched.length > 0 && dismissed !== query.trim();
```

> Without it, the menu closed on click-away and **came back the moment anything
> re-rendered the bar** — the user reported it as "I click outside, the filter closes, I
> click the search box and it opens again." [Observed — `FilterBar.tsx:152-158`]

This survived all 15 commits unchanged, which is the point: it is load-bearing and it is
not obvious, so it is the first thing a refactor drops. [Observed]

If you change `query`'s identity or timing — debouncing it (§5.2), moving it to the URL,
resetting it on navigation (§5.1) — **re-test that interaction specifically.** It is the
piece most likely to regress, and it regressed before.

---

## 7. Data model

The search has no persisted model of its own: two strings in React state, no storage, no
URL, no server. [Observed]

`Hit` and `Section` are internal to the results dialog: [Observed —
`GlobalSearchResults.tsx:25-36`]

```ts
interface Hit     { id: string; label: string; detail: string; href: string }
interface Section { title: string; hits: Hit[]; total: number }
```

---

## 8. API surface

**None.** There is no search endpoint. Everything is client-side over in-memory datasets.
[Observed]

[Inferred] This is the main thing that will not survive contact with production. A real
implementation needs a search endpoint returning ranked, typed hits with deep links —
which also fixes §9's first two items for free.

---

## 9. Out of scope / not in the prototype

- **No deep links from results.** Every Alert and Task hit hrefs to `/tasks`, every Asset
  and Folder hit to `/portal` — the destination screen, never the specific row, asset or
  folder. [Observed — `GlobalSearchResults.tsx:64,73,82,92`]
- **No keyboard navigation in the dialog.** Hits are `<Link>`s so they are tabbable, but
  there is no arrow-key model, no active-descendant, no Enter-to-open-highlighted.
  [Observed]
- **No ranking.** Sections are in source order and hits are in dataset order; a whole-word
  match on a name does not outrank an incidental substring. [Observed]
- **No recent searches, no suggestions, no empty-state affordance.** [Observed]
- **No fuzzy matching, no stemming, no multi-term AND.** `matchesQuery` is plain
  containment, so `"toyota camry"` matches only that exact adjacent string. [Observed]
- **The search term is not in the URL,** so a search cannot be linked or shared and
  back/forward do not move through search states. The Portal's *filters and folder* are
  in the URL — see `HANDOFF-portal.md` §8 — and the term was deliberately left out of it:
  §5.1 decided the term belongs to the screen you are on and clears when you leave, which
  a shareable term would contradict. Decide the two together if this changes. [Observed]
- **`aria-live` is absent** — result counts change silently for screen readers. [Observed]

---

## 10. Design system

| | |
|---|---|
| Field | `rounded-full`, `py-1.5`, `pl-8`, `border-gray-200`, `focus:ring-2 focus:ring-indigo-300` |
| Field, empty | `pr-12` to clear the ⌘K chip |
| Field, with content | `pr-[210px]` to clear the submit chip and X |
| Both chips | `px-1.5 py-0.5 rounded-md border-gray-200 text-[11px] font-medium text-gray-400` — one constant, `FIELD_HINT` |
| Match in a row | `bg-yellow-200 text-inherit rounded-[2px]` (`<mark>`) |
| Match in a control label | `#fef08a`, ink left alone |
| …on a filled control | `#fef08a`, ink restated as `var(--semantic-primary-main, #473BAB)` |
| Filter match badge | `bg-yellow-200 text-yellow-900 text-[10px] font-bold` |
| Narrowed count | `FilterCount`, `7/20 projects` — the total in `text-gray-300`, the shown figure bold once it is less |
| Dialog | `bg-white rounded-xl shadow-xl border-gray-100`, `max-h-[60vh]`, `z-50` |
| Section heading | `text-[10px] font-semibold uppercase tracking-wide text-gray-400` |
| Hit | 13px label · 11px detail · `ArrowRight` revealed on hover |

Icons are `lucide-react`. [Observed]

---

## 11. Open questions

1. **Does the search go server-side?** §8. Everything else here is downstream of that
   answer, and §5.2 becomes urgent the moment the datasets are real.
2. **Should results deep-link to the row/asset?** Needs stable per-entity routes, which
   `/tasks` does not have today.
3. **What is the ranking rule?** Right now there is none. Section order is hardcoded —
   is Projects genuinely more important than Assets?
4. **Should file attributes be searchable as free text (§5.4),** or is that deliberately
   the filters' job?
5. **Does `PER_SECTION = 5` want a "show all in this section" affordance?** The dialog
   reports `5 of 101` but offers no way to see the other 96. [Observed]
6. **Should the term go in the URL?** It was the option not taken in §5.1. Clearing on
   navigation and putting it in the URL are not incompatible, but they answer the same
   complaint and only one is built.
7. **Do the mark-only surfaces want a count too?** A narrowing screen says `7/20`. A
   marking screen says nothing about how many matches are on it, and on a long page a
   reader has no way to know whether they have seen them all.

---

## 12. First tasks, in order

1. **Fix §5.3.** Three lines, and a latent StrictMode trap.
2. **Decide §8** — server-side or not. It gates §5.2 and most of §9.
3. **Add `aria-live` to the result count and a keyboard model to the dialog** (§9). The
   dialog is the least finished part of this ticket.
4. **Fix §5.4** or decide it is the filters' job, and say so in the UI either way. A
   silent zero is the worst of the three outcomes.

When you extend the search to a new screen, the rule in §1 is the decision to make first:
did that screen have a field of its own? If yes it narrows, and its count says so; if no
it marks and hides nothing.
