// Shared between DisclosureSnippetEditor (colors the outcome chips) and DisclosureSourcePane (colors
// the matching span in the original source text) in the snippet builder's comparison view. Values are
// the app's own Dataviz/Categorical palette (Figma: "Dataviz Colors/Categorical/Cat-01..09"), assigned
// to variables in the order they first appear so the same variable always gets the same color.

export const CATEGORICAL_COLORS = [
  '#6356e1', // Cat-01
  '#109890', // Cat-02
  '#e55e50', // Cat-03
  '#2b4975', // Cat-04
  '#d4951c', // Cat-05
  '#8c2257', // Cat-06
  '#9058e0', // Cat-07
  '#c8b010', // Cat-08
  '#c04880', // Cat-09
];

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface DisclosureReplacement {
  /** The {key} this value was templatized into. */
  key: string;
  /** The exact original substring from the source disclosure that this variable replaced. */
  original: string;
}

const VARIABLE_TOKEN_RE = /\{([a-zA-Z0-9_]+)\}/g;

/** Every distinct variable key currently present in a snippet's text (used to decide which mapped colors are still "active"). */
export function findActiveVariableKeys(text: string): Set<string> {
  const keys = new Set<string>();
  VARIABLE_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_TOKEN_RE.exec(text))) keys.add(match[1]);
  return keys;
}

/**
 * Assigns a stable color to each replacement whose key is still present in the outcome text — in the
 * order the replacements were generated, so colors read left-to-right the same way a reader encounters
 * them. A key with no entry in `replacements`, or one the user has since removed/replaced, gets no
 * color (renders with the default gray chip / no source highlight).
 */
export function buildVariableColorMap(replacements: DisclosureReplacement[], activeKeys: Set<string>): Record<string, string> {
  const map: Record<string, string> = {};
  let i = 0;
  for (const r of replacements) {
    if (!activeKeys.has(r.key) || map[r.key]) continue;
    map[r.key] = CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
    i += 1;
  }
  return map;
}
