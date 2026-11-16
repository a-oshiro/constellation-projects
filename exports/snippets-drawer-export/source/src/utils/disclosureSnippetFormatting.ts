import { getDisclosureVariable } from '../data/disclosureVariables';

// Shared between DisclosureSnippetEditor (write mode) and DisclosureSnippetDialog (preview mode) —
// kept in its own module (rather than exported alongside the editor component) so Fast Refresh can
// still treat DisclosureSnippetEditor.tsx as a component-only file.

const VARIABLE_TOKEN_RE = /\{([a-zA-Z0-9_]+)\}/g;

export function substituteVariablesWithSamples(value: string): string {
  VARIABLE_TOKEN_RE.lastIndex = 0;
  return value.replace(VARIABLE_TOKEN_RE, (_m, key: string) => {
    const v = getDisclosureVariable(key);
    return v ? v.sampleValue : `[${key}]`;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderFormattedHtml(value: string): string {
  let html = escapeHtml(value);
  html = html.replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}
