// Marking the platform search inside the labels of controls.
//
// The rule the app follows: where a screen used to carry its own search field,
// the platform search NARROWS that screen; everywhere else it only MARKS what
// is already on screen and hides nothing. Rows are marked by the Highlight
// component, because the screen that drew them knows which field it matched.
// A control's label has no such owner — there are ~700 buttons in the app and
// only a fifth come through the shared Button — so wrapping each one would
// mean touching every button in the codebase and would still miss the next one
// someone writes.
//
// So this paints them instead of wrapping them. CSS custom highlights take a
// list of Ranges and colour them without changing the DOM at all: no extra
// elements inside a button, nothing for React to reconcile, and no risk of a
// label's layout shifting because it happens to match. The ranges are rebuilt
// whenever the term changes and thrown away when it empties.
//
// Deliberately only controls: buttons, links, and anything wearing their role.
// A term marked in every paragraph on screen would be noise, and the point is
// to answer "where is the thing I am looking for" for the things you can act
// on.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGlobalSearch } from "@portal/lib/global-search";

const HIGHLIGHT_NAME = "search-mark";
/** The same mark, for text that is light because it sits on a filled control. */
const HIGHLIGHT_ON_FILL = "search-mark-on-fill";
const STYLE_ID = "search-mark-style";

/** The paint rule, injected rather than written into the global stylesheet.
 *  Tailwind's CSS pipeline treats `::highlight()` as an unknown pseudo-element
 *  and strips the rule, so the ranges were registered and nothing painted
 *  them. Kept beside the code that depends on it, which is where it belongs
 *  anyway — the colour is the same yellow the Highlight component uses, so one
 *  search looks like one search whether its text was wrapped or painted. */
function ensurePaintRule() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  // Two rules for one mark. On ordinary text the colour is left alone — the
  // ground behind it is pale and the ink still reads. On a filled control it
  // is not: white on yellow is the label gone, which is what a mark is least
  // allowed to do. There the ink is restated in the brand purple, which is the
  // colour that label would have worn on a white ground anyway.
  style.textContent = [
    `::highlight(${HIGHLIGHT_NAME}){background-color:#fef08a;color:inherit;}`,
    `::highlight(${HIGHLIGHT_ON_FILL}){background-color:#fef08a;`
      + `color:var(--semantic-primary-main,#473BAB);}`,
  ].join("");
  document.head.appendChild(style);
}

/** Rec. 709 luma of a computed `color`, 0..1, or null when it cannot be read.
 *  Enough to tell white-ish ink from ink. */
function luma(color: string): number | null {
  const m = color.match(/-?[\d.]+/g);
  if (!m || m.length < 3) return null;
  const [r, g, b] = m.map(Number);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Whether this run needs its ink restated to stay readable on the mark.
 *
 *  Asked of the rendered text rather than of a class name: there are hundreds
 *  of buttons here and no convention that says which are filled, but every one
 *  of them has a computed colour, and light text is light text however it got
 *  that way. */
function needsOwnInk(node: Text): boolean {
  const el = node.parentElement;
  if (!el) return false;
  const l = luma(getComputedStyle(el).color);
  return l !== null && l > 0.6;
}

function setOrClear(name: string, ranges: Range[]) {
  if (ranges.length === 0) CSS.highlights!.delete(name);
  else CSS.highlights!.set(name, new Highlight(...ranges));
}

function clearMarks() {
  CSS.highlights?.delete(HIGHLIGHT_NAME);
  CSS.highlights?.delete(HIGHLIGHT_ON_FILL);
}

/** How long a burst of mutations is allowed to collapse into one repaint. */
const REPAINT_MS = 50;

const CONTROL_SELECTOR = 'button, a, [role="button"], [role="tab"], [role="menuitem"]';

/** Every text node under `root` that is not already inside a <mark>. The
 *  Highlight component wraps what it marks in one, so skipping those keeps a
 *  row from being painted twice by two different mechanisms. */
function textNodesIn(root: Element): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if ((node.parentElement as Element | null)?.closest("mark")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

export function SearchMarks() {
  const { query } = useGlobalSearch();
  // Not read, but it is what tells us the screen under us has been replaced.
  const { pathname } = useLocation();

  useEffect(() => {
    // Chrome, Safari 17.2+ and Firefox 140+. Where it is missing the controls
    // simply go unmarked — the search still narrows what it narrows.
    if (typeof CSS === "undefined" || !CSS.highlights) return;

    const term = query.trim().toLowerCase();
    if (!term) {
      clearMarks();
      return;
    }
    ensurePaintRule();

    function paint() {
      const plain: Range[] = [];
      const onFill: Range[] = [];
      for (const control of document.querySelectorAll(CONTROL_SELECTOR)) {
        for (const node of textNodesIn(control)) {
          const haystack = node.nodeValue!.toLowerCase();
          let matched = false;
          const found: Range[] = [];
          for (
            let i = haystack.indexOf(term);
            i !== -1;
            i = haystack.indexOf(term, i + term.length)
          ) {
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i + term.length);
            found.push(range);
            matched = true;
          }
          // The colour is only read for runs that actually matched, so the
          // walk stays a string search over everything and a style read over
          // the handful of labels that hit.
          if (matched) (needsOwnInk(node) ? onFill : plain).push(...found);
        }
      }
      setOrClear(HIGHLIGHT_NAME, plain);
      setOrClear(HIGHLIGHT_ON_FILL, onFill);
    }

    paint();

    // Controls that appear after the term was typed get marked too — a menu
    // opened, a pane swapped, a list that finished loading. Without this the
    // marks described the screen as it stood the moment you stopped typing.
    //
    // Safe to observe the whole body precisely because this paints rather than
    // wraps: registering ranges changes no nodes, so the observer cannot see
    // its own work and loop. Only the <style> rule touches the DOM, and it
    // goes in <head>, outside what is watched.
    //
    // Coalesced: the first mutation of a burst books a repaint, the rest ride
    // on it, so at most one walk every REPAINT_MS. A page with a spinner or a
    // ticking clock mutates constantly, and the walk is cheap but not free.
    //
    // A timer rather than requestAnimationFrame, which is the obvious choice
    // and the wrong one: frames stop in a hidden tab, so a menu opened in a
    // background tab would stay unmarked until something else woke the loop.
    // This is DOM work, not painting — it has no reason to wait for a frame.
    let timer: ReturnType<typeof setTimeout> | 0 = 0;
    const observer = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => { timer = 0; paint(); }, REPAINT_MS);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      clearMarks();
    };
  }, [query, pathname]);

  return null;
}
