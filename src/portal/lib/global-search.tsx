// One search for the whole platform.
//
// The top bar's "Search anything" is the only search there is: the screens no
// longer carry their own field. What it narrows depends on where you are —
// the rows of a table, the cards of a library, the folders in a rail — and it
// reaches into the filters too, opening any whose options match what you typed.
//
// It lives in a context rather than being passed down because the writer (the
// top bar) and the readers (whatever page is mounted, and the filter bar
// inside it) are on opposite sides of the layout tree.
//
// Two levels, which is why `query` and `submitted` are separate:
//  · `query` narrows what is on screen, live, as you type.
//  · Enter — or the hint beside the field — submits, and the results dialog
//    looks across the whole platform rather than the current screen.

import {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

interface GlobalSearch {
  /** What is typed, right now. Narrows the current screen. */
  query: string;
  setQuery: (next: string) => void;
  /** Set when the search is submitted — opens the platform-wide results. */
  submitted: string | null;
  submit: () => void;
  clearSubmitted: () => void;
  clear: () => void;
}

const Ctx = createContext<GlobalSearch | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  // The term narrows THIS screen, so leaving the screen drops it. Without
  // this, typing "Toyota" on the Portal and clicking through to the Task
  // Manager opened it at 0/679 with the cause sitting in a top-bar field the
  // user was no longer looking at — the screen read as broken. A search meant
  // to outlive the screen is what Enter is for: it opens the results across
  // the whole platform.
  //
  // Adjusted during render rather than in an effect. An effect would paint the
  // new screen once with the old term still narrowing it, and setting state in
  // one is what `react-hooks/set-state-in-effect` is about; comparing to the
  // previous value during render is React's own pattern for resetting state
  // when something upstream changes.
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setQuery("");
    setSubmitted(null);
  }

  const submit = useCallback(() => {
    setQuery((q) => { setSubmitted(q.trim() || null); return q; });
  }, []);

  const clear = useCallback(() => { setQuery(""); setSubmitted(null); }, []);

  const value = useMemo<GlobalSearch>(() => ({
    query, setQuery, submitted, submit,
    clearSubmitted: () => setSubmitted(null),
    clear,
  }), [query, submitted, submit, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Null outside the provider, so a component can be rendered in isolation —
 *  the Component Library does exactly that. */
export function useGlobalSearch(): GlobalSearch {
  return useContext(Ctx) ?? {
    query: "", setQuery: () => {}, submitted: null,
    submit: () => {}, clearSubmitted: () => {}, clear: () => {},
  };
}

/** Case-insensitive containment, the test every surface uses so they all agree
 *  on what "matches" means. */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q.length > 0 && text.toLowerCase().includes(q);
}
