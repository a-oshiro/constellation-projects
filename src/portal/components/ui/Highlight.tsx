// The matched run of a search, marked in yellow.
//
// Used wherever a search reaches: table cells, asset names, filter options,
// folder names, the results dialog. Having one component means a match looks
// the same everywhere, and that the matching rule cannot drift between the
// thing that decided to show a row and the thing that paints it.

export function Highlight({
  text, query, className = "",
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const q = query.trim();
  if (!q) return <span className={className}>{text}</span>;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;

  for (let i = lower.indexOf(needle); i !== -1; i = lower.indexOf(needle, from)) {
    if (i > from) parts.push(text.slice(from, i));
    parts.push(
      <mark key={i} className="bg-yellow-200 text-inherit rounded-[2px] px-0">
        {text.slice(i, i + needle.length)}
      </mark>,
    );
    from = i + needle.length;
  }
  if (from === 0) return <span className={className}>{text}</span>;
  if (from < text.length) parts.push(text.slice(from));

  return <span className={className}>{parts}</span>;
}
