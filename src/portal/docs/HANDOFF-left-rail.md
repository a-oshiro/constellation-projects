# Left rail (`GlobalNav`) — hand-off

> **Who this is for.** You are picking up the **global left rail** — the 72px navy column
> that runs down every screen of the app — **inside this repo**. It is written to be read
> by you and by Claude Code in your session; point it at this file first.
>
> Tags: **[Observed]** = it is in the code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> There was no hand-off for this component before. Everything below is written from the
> current source, not from memory.

---

## 0. State of the branch

Branch `dev`, in sync with `origin/dev`. The rail changes described in §3 are committed on
top of `5bd9fc1` and touch one file: `components/layout/GlobalNav.tsx`. [Observed]

The matching Component Library blurb (`components/ui/ComponentLibraryDialog.tsx:238`, per
the standing rule that a component change updates its library entry) is **already in
`9180357`** — it was swept into a parallel portal commit rather than landing with the rail
change. Nothing is missing; it is just not where `git log` would lead you to look.
[Observed]

Deployment, from the project's standing rules: pushing `main` deploys straight to
production on Vercel. Stage explicitly — never `git add -A`. [Observed]

---

## 1. What the rail is, in one paragraph

`components/layout/GlobalNav.tsx` (≈560 lines) renders a fixed-width navy column:
Constellation logo at the top, a run of 56×56 icon+label squares under it, and **Help**
pinned at the foot. Every square is either a `Link` that navigates or — for Projects only
— a button that opens a white contextual menu to its right. The rail **fits itself to the
window**: when there is not enough vertical room for every item, it first tightens its gap
and then folds the tail into a **More** kebab. Help never takes part in that; it sits
outside the fitted list and is always on screen. [Observed]

---

## 2. The two rules everything follows

> **Rule 1 — the rail never scrolls; it fits.**
> Vertical room is resolved by arithmetic on fixed 56px slots, not by overflow.

> **Rule 2 — Help is not part of the fit.**
> It is rendered after the `<nav>`, so no window height can hide it or move it into the
> kebab.

---

## 3. What changed in this pass

Three changes, all in `GlobalNav.tsx`: [Observed]

| # | Before | After |
|---|---|---|
| 1 | **Enrollment Form** and **Mockups (Legacy)** lived inside an *Automation* popover at the foot of the rail | Each is a **rail item of its own**, with its own glyph, at the tail of the list |
| 2 | The foot of the rail was the **Automation** popover button | The foot is **Help**, always visible — matching prod |
| 3 | The rail's bottom padding was `pb-6` (24px), Help's slot did not exist | Container is `pb-1` and Help carries no bottom margin, so it sits **exactly 4px** off the rail's bottom edge |

The whole Automation popover is gone: its `useState`, its `useRef`, and its
outside-click/Escape effect were deleted along with the markup. The `automationActive`
path check (`/emails`, `/enrollment`) is gone too — those two paths now light their own
rail items instead. [Observed]

**The `Workflow` icon is still in use.** It is the *Triggers* item at the head of the rail
(`/studio`, "Automation Studio" in menus) — that item is unrelated to the popover that was
removed and was deliberately left alone. [Observed — `GlobalNav.tsx:262`]

### 3.1 The two new items

```tsx
// GlobalNav.tsx:277-278
{ key: "/enrollment", label: "Enrollment", menuLabel: "Enrollment Form",
  href: "/enrollment/enrollment-form-live-copy.html",
  renderIcon: () => <ClipboardList size={20} />, active: pathname.startsWith("/enrollment") },
{ key: "/emails",     label: "Mockups",    menuLabel: "Mockups (Legacy)",
  href: "/emails/mobile",
  renderIcon: () => <Smartphone size={20} />,    active: pathname.startsWith("/emails") },
```

Two details worth knowing before you touch them:

- **`label` vs `menuLabel`.** The rail label is drawn at 9px in a 56px-wide slot, so it is
  the short form ("Enrollment", "Mockups"); the full name ("Enrollment Form", "Mockups
  (Legacy)") is what the `title` tooltip and the More menu show. Every rail item has this
  pair — do not collapse them into one field. [Observed — `GlobalNav.tsx:246-279`,
  `487-527`]
- **Enrollment is a static file, not a route.** `href` points at
  `public/enrollment/enrollment-form-live-copy.html`. Following it leaves the React app,
  so the rail is not on the page you land on — that was equally true of the old popover
  entry, and is not a regression. [Observed]

They are placed **last** in `navItems`, which is deliberate: the fit logic collapses from
the tail, so these two are the first things a short window folds into the kebab, ahead of
anything above them. [Observed]

### 3.2 Help

```tsx
// GlobalNav.tsx:534-549 — rendered after </nav>, inside the rail container
<Link href="/help" title="Help" className="w-14 h-14 …">
  <CircleHelp size={20} />
  <span className="text-[9px] …">Help</span>
</Link>
```

- Same 56×56 geometry, same active/hover treatment (`bg-nav-selected` when
  `pathname.startsWith("/help")`) as every other item, so it reads as one of them rather
  than as a footer control. [Observed]
- The 4px offset is the **container's** `pb-1`, not a margin on the link. Measured in the
  browser at a 1100px viewport: rail bottom 1100, Help bottom 1096, **gap 4**. If you
  restore padding on the container, that measurement moves. [Observed]
- **`/help` does not exist yet and 404s.** So do `/feeds`, `/design`, `/campaigns`,
  `/inventory`, `/insights`, `/ai-tools` and `/chats` — every rail item whose screen is
  not built yet. Help is consistent with them, not a special case. [Observed] Whether prod
  opens a help *panel* instead of navigating is the open question in §6. [Inferred]

---

## 4. How the fit works

Three constants and one predicate at the top of the file: [Observed —
`GlobalNav.tsx:17-23`]

```ts
const RAIL_ITEM = 56;       // every slot is a fixed square
const RAIL_GAP = 12;        // the comfortable gap
const RAIL_GAP_TIGHT = 6;   // the one concession before collapsing

function railFits(height, count, gap) {
  return count * RAIL_ITEM + Math.max(0, count - 1) * gap <= height;
}
```

A `ResizeObserver` on the `<nav>` keeps `navHeight` equal to its **content box** (padding
excluded). The decision, in order: [Observed — `GlobalNav.tsx:232-293`]

1. Everything fits at 12px → render it all.
2. It does not → drop the gap to 6px and ask again.
3. Still not → `visibleCount = floor((navHeight − RAIL_ITEM) / (RAIL_ITEM + 6))`. The
   subtracted `RAIL_ITEM` is the kebab's own slot; the tail past `visibleCount` becomes
   `hiddenItems` and opens in the More menu, which grows **upward** (`bottom-0 left-full`)
   because the rail is short precisely when this happens.

The measurement runs in `useLayoutEffect` on the client (`useEffect` on the server, where
layout effects only warn), so the **first paint is already fitted** — you never see a
frame of icons running off the bottom. [Observed — `GlobalNav.tsx:28`]

### 4.1 What the new items cost

14 items in the rail now (was 12, and Help is a 15th slot outside the nav). Room needed:
[Observed — arithmetic; Inferred — the exact viewport numbers, which depend on the 60px
logo slot and the nav's 16px top padding]

| Items at gap | Nav content height needed | Roughly, viewport height |
|---|---|---|
| 14 @ 12px | 940px | ≥ ~1080px |
| 14 @ 6px  | 862px | ≥ ~1002px |
| below that | collapses from the tail | Mockups goes first, then Enrollment, then Chats… |

Verified in the browser: at a 1100px viewport all 14 render at a 12px gap; at 700px the
rail shows 8 items + More + Help, and the More menu lists Offers, Insights, AI Tools,
Chats, **Enrollment Form**, **Mockups (Legacy)** with 16px glyphs. [Observed]

---

## 5. Things that look wrong and are not

- **`min-h-screen` on the container, `flex-1 min-h-0` on the nav.** The `min-h-0` is what
  lets the nav actually shrink below its content height; without it flexbox refuses, the
  ResizeObserver reads a too-large height and nothing ever collapses. Do not remove it.
  [Observed — `GlobalNav.tsx:310,331`]
- **`z-[1100]` on the rail and on both menus.** It clears Leaflet's panes and controls,
  which top out near 700 on the Inventory map. It is not an arbitrary large number.
  [Observed — `GlobalNav.tsx:310`, and the comment at `357`]
- **Rail glyphs are 20px, menu glyphs 16px.** The More menu re-renders the same
  `renderIcon()` inside `[&_svg]:w-4 [&_svg]:h-4` rather than keeping a second icon set.
  Any new item gets this for free. [Observed — `GlobalNav.tsx:521-524`]
- **The label `<span>` is always `text-white`, even when the icon is `#acabff`.** That is
  the design, not a missed state. [Observed]

### 5.1 One trap I hit while verifying

Reading the rail's state through `javascript_tool` right after a viewport resize returns
**stale numbers** — it reported 14 visible items at a 700px viewport while the screenshot
plainly showed 8 + More. Trust the screenshot, or re-navigate before reading the DOM.
[Observed]

---

## 6. Open questions

1. **What should Help actually do?** It navigates to `/help`, which 404s. If prod opens a
   support panel or an external help centre, this becomes a button with a popover (the
   Projects item at `GlobalNav.tsx:334-346` is the pattern to copy) rather than a `Link`.
   [Inferred]
2. **Does Enrollment Form belong in the rail at all**, given it leaves the SPA? It is
   there because it was asked for; if the rail should only hold in-app destinations, this
   is the item to revisit. [Inferred]
3. **14 items is close to the collapse threshold** on a 1080p screen once browser chrome
   is subtracted. Anything added to the rail from here effectively ships with the kebab
   on. [Observed]

---

## 7. Where to look

| What | Where |
|---|---|
| The rail itself | `components/layout/GlobalNav.tsx` |
| Fit constants + predicate | `GlobalNav.tsx:17-23` |
| Item list (order lives here) | `GlobalNav.tsx:246-279` |
| Collapse decision | `GlobalNav.tsx:283-293` |
| Projects popover (the popover pattern) | `GlobalNav.tsx:335-346` |
| More kebab + its menu | `GlobalNav.tsx:482-531` |
| Help | `GlobalNav.tsx:534-549` |
| Library entry (keep in sync) | `components/ui/ComponentLibraryDialog.tsx:238`, preview at `:1087` |
