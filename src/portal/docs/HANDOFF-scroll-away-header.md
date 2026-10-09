# Scroll-away header (`ScrollAwayHeader`) — hand-off

> **Who this is for.** You are picking up the main pane's header behaviour **inside this
> repo**. It is written to be read by you and by Claude Code in your session — point it at
> this file first.
>
> Tags: **[Observed]** = it is in the code, or I ran it and measured it.
> **[Inferred]** = my reasoning or an assumption; check before relying on it.
>
> Two sibling tickets share these screens: `HANDOFF-filters.md` (the filter row this
> header carries) and `HANDOFF-search.md`. This component is independent of both — it
> knows nothing about its children.
>
> **Read §3 before writing any code.** Four different implementations of this were tried
> and rejected. §3 records what each one got wrong, because every one of them looks
> correct until you scroll.

---

## 0. State of the branch

**Updated 2026-09-28.** Branch `dev` and `origin/main` are both at `5bd9fc1`, so this is
live. `components/ui/ScrollAwayHeader.tsx` arrived in `26dd352` and stood unchanged until
today, when the Portal grew sticky section headings inside the same scroller. Two things
changed for that, both in §5: **the component now publishes how much room it is taking**,
and **it sits at z-30 in both states rather than z-20 when pinned**. Everything else below
still stands as written. [Observed]

The filter row it carries has changed a great deal in the meantime, which matters for one
thing only: the row now opens menus and side panels that overlay scrolling content. See
§9.4. [Observed]

---

## 1. What it does, in one paragraph

The main pane's header used to be `sticky` — permanently parked at the top, costing
vertical room on every screen. It now **scrolls off with the content like anything else**.
Scroll back up and it **fades in over** the content, without pushing anything down. Scroll
down again and it waits a beat before leaving. Arrive back at the very top and the
floating copy hands over to the real one with no visible seam. [Observed]

---

## 2. The one rule everything follows

> **It is `sticky` only once it has already left the screen.**

Everything else is a consequence. Say it as three positions: [Observed —
`ScrollAwayHeader.tsx:5-26,141`]

| Situation | CSS position | Why |
|---|---|---|
| Any part still in view | `relative` | so it scrolls off like ordinary content |
| Fully gone, not summoned | `relative` | invisible in flow costs nothing and shows nothing |
| Summoned back, or fading out | `sticky top-0` | so it floats **over** content instead of displacing it |

---

## 3. Rejected implementations — do not rebuild these

Each of these was written, run, and reported broken by the user. They are listed because
each is the *obvious* implementation, and you will be tempted by at least one.

### 3.1 Collapsing the header's height

**Rejected.** Animating height (or `max-height`) to zero changes the scroller's
`scrollHeight` mid-gesture, which moves the scroll position under the user's finger. The
content jumped. [Observed — the fix note in the component's own header comment; the user's
report was *"tem um salto, como se o header desaparecesse"*]

**Requirement:** the element keeps its slot in the flow at all times, so `scrollHeight`
never changes and the scroll position is never disturbed. [Observed — lines 28-29]

### 3.2 `sticky` from the start

**Rejected.** If it is sticky before it has left, it pins itself to the top instead of
leaving, so the only thing that ever happens is the opacity fade — which reads as the
header *blinking out* rather than scrolling away. [Observed — lines 8-12; user's report:
*"ele ainda está desaparecendo em vez de rolar para fora"*]

### 3.3 Becoming `sticky` the moment it goes past

**Rejected.** The header snapped to the top of the viewport just to play its fade-out
*there* — so the first scroll down flashed it back into view before hiding it. [Observed —
lines 13-17; user's report: *"quando eu dou a primeira rolada para baixo e o header sai da
vista, a versão sticky dele aparece e dá fade out rapidamente"*]

**Requirement:** out of sight, it stays `relative`.

### 3.4 Swapping `sticky` ↔ `relative` wherever the header's height is passed

**Rejected.** At any scroll offset other than zero, the pinned position and the in-flow
position are one header-height apart — so the swap is a jump of that size. It looked like
the header vanished just before the real one arrived. [Observed — lines 22-26; user's
report: *"ao chegar próximo ao topo, desaparece antes de aparecer o header normal"*]

**Requirement:** un-pin **only at `scrollTop <= 0`**, where the two positions coincide
exactly and the handover is invisible. [Observed — lines 109-115]

---

## 4. The state machine

Three booleans. [Observed — lines 57-68]

| State | Meaning | Set when |
|---|---|---|
| `past` | scrolled clear of the header's own height | `scrollTop > header.offsetHeight` |
| `pinned` | summoned back deliberately, by scrolling up | `delta < 0` |
| `leaving` | mid fade-out; still pinned so the fade is visible | during `hide()`, for `FADE_MS` |

Derived:

```ts
const shown = !past || pinned;                       // opacity 1 vs 0
className = pinned || leaving ? "sticky top-0"       // floats over content
                              : "relative";          // in flow
```
[Observed — lines 135, 141]

### Scroll handler, in order [Observed — lines 96-125]

```ts
function onScroll() {
  const y = el.scrollTop;
  const height = ref.current?.offsetHeight ?? 0;
  setPast(y > height);

  const delta = y - lastY.current;
  if (Math.abs(delta) < DIRECTION_THRESHOLD) return;   // 1. ignore jitter
  lastY.current = y;

  if (y <= 0) {                                         // 2. the handover point
    cancelHide();
    pinnedRef.current = false;
    setPinned(false);
    setLeaving(false);
    return;                                             //    no fade — already visible
  }

  if (delta < 0) { show(); return; }                    // 3. scrolling up: summon

  // 4. scrolling down: one grace period, started once
  if (pinnedRef.current && hideTimer.current === undefined) {
    hideTimer.current = window.setTimeout(hide, HIDE_DELAY_MS);
  }
}
```

**Four details in there are load-bearing:**

1. **`setPast` runs before the threshold check.** It must track the true position even
   during sub-threshold movement. [Observed — line 100 precedes line 103]
2. **At `y <= 0` there is no fade.** The header is already fully visible and must stay
   that way through the handover — fading would reintroduce the blink of §3.4.
   [Observed — lines 106-108]
3. **The hide timer is started once, not restarted per wheel tick** (`hideTimer.current
   === undefined`). Restarting it would make the header wait 800 ms after the *last*
   scroll event, so a continuous downward scroll would never hide it. [Observed — line
   122 and the comment at 119-121]
4. **`pinnedRef` shadows `pinned` state.** The scroll listener is attached once; reading
   React state inside it would read a stale closure. [Observed — lines 65-67]

### Constants [Observed — lines 39-44]

| Constant | Value | Rationale |
|---|---|---|
| `DIRECTION_THRESHOLD` | `6` px | a trackpad reports a stream of 1–2 px moves either way; below this there is no "direction" |
| `HIDE_DELAY_MS` | `800` | a header you just asked for does not leave the moment you nudge the list |
| `FADE_MS` | `200` | must match the CSS `duration-200`, or the fade plays off-screen and it just vanishes |

> `FADE_MS` and the Tailwind `duration-200` are the same number written twice, in two
> places, with no link between them. Change one and the fade silently breaks. [Observed —
> lines 44, 141] — [Inferred] worth deriving one from the other, or at least a comment on
> each pointing at the other.

---

## 5. API

```ts
<ScrollAwayHeader scrollerRef={ref} className="">{children}</ScrollAwayHeader>
```
[Observed — lines 46-56]

| Prop | Type | Notes |
|---|---|---|
| `scrollerRef` | `RefObject<HTMLElement \| null>` | **the element that scrolls** — the header listens to it rather than owning it, because the content below has to share the same scroller |
| `children` | `ReactNode` | whatever rides in the header |
| `className` | `string` | defaults to `bg-white`; it overlays content when pinned, so **it must be opaque** |

The component knows nothing about its children. Both current consumers put a filter row in
it, but that is not a constraint. [Observed]

### It also tells the scroller how much room it is taking

`--chrome-offset`, set on the scrolling element: **its own height while it is floating
over the top, `0px` while it is away or still in flow**. Anything else that sticks to the
top of the same scroller reads that variable instead of assuming a constant — the Portal's
grouped section headings do, which is what keeps them below a header someone deliberately
scrolled back rather than behind it. [Observed — `ScrollAwayHeader.tsx:130-137`]

```css
top: var(--chrome-offset, 0px);
```

The fallback matters: a scroller with no ScrollAwayHeader in it never sets the variable,
and `0px` is the right answer there. [Observed]

### Layering

**z-30, in both states.** It was z-30 only when pinned, which was enough while nothing
else in the scroller was sticky. It is not any more: a heading pinned to the top of the
same scroller paints over the header during the moments it is still in flow and leaving.
Above it in every state, the heading passes underneath, which is what leaving should look
like. [Observed]

The ladder the Portal now runs, for anything built on the same scroller:

| | |
|---|---|
| 30 | this header |
| 20 | a section heading pinned to the top |
| 10 | a card's own checkbox and menu |

Equal z-index falls back to document order, and cards come later than headings — which is
exactly the bug that produced this table. [Observed]

### Consumers

| Screen | Scroller | Line |
|---|---|---|
| Tasks | `scrollerRef` | `app/tasks/page.tsx:194` |
| Portal | `gridScrollerRef` | `app/portal/page.tsx:908` |

Both mount it **inside** the scrolling element, not above it — required, since `sticky`
resolves against the nearest scrolling ancestor. [Observed]

---

## 6. Acceptance criteria

Each of these maps to a bug that actually shipped and was reported. Test them in this
order. The checklist is mine [Inferred]; every bug behind it was reported [Observed].

1. **Scroll down slowly from the top.** The header moves up with the content at exactly
   the content's speed. It does not fade, shrink, detach, or lag.
2. **Keep scrolling past it.** It leaves the viewport and nothing appears at the top. No
   flash, no second copy of the header.
3. **Scroll up a little.** It fades in over the content in 200 ms. **The row you were
   reading does not move.**
4. **Scroll down again immediately.** It stays for ~800 ms, then fades out. It does not
   leave on the first wheel tick.
5. **Scroll down, then up inside the 800 ms.** It cancels the departure and stays.
6. **Scroll all the way back to the top.** The floating header becomes the real header
   with **no visible transition, gap, or jump.** This is the one §3.4 broke; watch the
   row directly beneath it.
7. **Throughout all of the above, the scrollbar thumb size never changes.** If it does,
   something is altering `scrollHeight` — see §3.1.
8. **Resize the window** so the header's height changes (its content wraps). The
   threshold follows, because `offsetHeight` is read per scroll event rather than cached.
   [Observed — line 98]

---

## 7. Known gaps

### 7.1 🔴 Hidden but still focusable

```tsx
aria-hidden={!shown}
className="… opacity-0 pointer-events-none …"
```
[Observed — lines 140-143]

`pointer-events-none` stops the mouse. It does **not** stop the keyboard. A tab-key user
can land on a filter control that is invisible and marked `aria-hidden` — which is both a
WCAG failure and an ARIA validity error (focus inside an `aria-hidden` subtree).
[Observed that it is written this way; the classification is standard]

**Fix:** add `inert` when `!shown`, or use `visibility:hidden` — both remove it from the
tab order. `inert` is the better fit since the fade needs the element to remain rendered.
[Inferred]

### 7.2 🟡 `passive: true` is correct, and must stay

The listener is registered `{ passive: true }`. [Observed — line 128] It never calls
`preventDefault`, so this is right — but it means the component can never block or hijack
scrolling. Do not "improve" this into a controlled scroll. [Inferred]

### 7.3 🟡 No `prefers-reduced-motion` handling

The 200 ms opacity transition runs unconditionally. [Observed — line 141] A fade is mild,
but the project honours reduced motion elsewhere. [Inferred] Gate the transition and let
it snap.

### 7.4 🟡 Nothing runs on mount

`lastY` is seeded from the scroller and then nothing happens until the first scroll event.
[Observed — line 127] If a screen ever restores a saved scroll position, the header will
be in the wrong state until the user scrolls. No screen does that today. [Observed]

---

## 8. Out of scope

- **No "scrolled" shadow or border.** The header carries no elevation when floating; it is
  distinguished from the content only by its opaque background. [Observed] [Inferred] On a
  dense table this may read as ambiguous — worth a design decision, not a code one.
- **No horizontal behaviour.** Only `scrollTop` is read. [Observed]
- **One header per scroller.** Two instances on the same scroller would each measure
  themselves and fight. [Inferred — untested; nothing prevents it]
- **What rides in it, and what else sticks under it, are other tickets.** The filter row
  is `HANDOFF-filters.md`; the Portal's folders, its grouped sections and their pinned
  headings are `HANDOFF-portal.md`. This one is only the header's own behaviour.

---

## 9. Open questions

1. **Should the floating state carry a shadow?** §8. Purely a design call.
2. **Is 800 ms right?** It was chosen by feel and confirmed by the user in use, not
   measured against anything. [Observed that the user asked for exactly 800 ms]
3. **Should the behaviour extend to other screens?** Only Tasks and Portal use it. The
   pattern is screen-agnostic. [Observed]
4. **Does this interact with the global search?** When a search opens a filter menu inside
   a header that then scrolls away, the menu goes with it. Untested. [Inferred — worth one
   manual pass before shipping]
