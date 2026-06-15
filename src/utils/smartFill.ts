export interface SmartFillResult {
  ctaKey: string;
  predictions: Record<string, string>; // offerId -> predicted url
}

export function detectSmartFill(
  offers: Array<{ id: string; vehicleName: string }>,
  ctaKey: string,
  matrix: Record<string, Record<string, string>>,
): SmartFillResult | null {
  const MIXED = '__MIXED__';

  const filled: Array<{ offerId: string; vehicleName: string; url: string }> = [];
  const unfilledIds: string[] = [];

  for (const offer of offers) {
    const url = (matrix[offer.id]?.[ctaKey] ?? '').trim();
    if (url && url !== MIXED) {
      filled.push({ offerId: offer.id, vehicleName: offer.vehicleName, url });
    } else {
      unfilledIds.push(offer.id);
    }
  }

  // Need at least 2 filled entries and at least 1 unfilled to suggest
  if (filled.length < 2 || unfilledIds.length === 0) return null;

  const unfilledSet = new Set(unfilledIds);
  const maxTokenCount = Math.max(...filled.map(p => p.vehicleName.split(/\s+/).length));

  // Try each whitespace-token position in vehicleName.
  // For a position to be a valid pattern: every filled URL must END with the token
  // at that position, and the remaining prefix must be identical across all filled entries.
  for (let pos = 0; pos < maxTokenCount; pos++) {
    let valid = true;
    let sharedPrefix: string | null = null;

    for (const pair of filled) {
      const tokens = pair.vehicleName.split(/\s+/);
      const token = tokens[pos];
      if (!token) { valid = false; break; }

      if (!pair.url.toLowerCase().endsWith(token.toLowerCase())) {
        valid = false;
        break;
      }

      // Derive prefix by removing the token from the URL tail (preserving original case)
      const prefix = pair.url.slice(0, pair.url.length - token.length);

      if (sharedPrefix === null) {
        sharedPrefix = prefix;
      } else if (prefix !== sharedPrefix) {
        valid = false;
        break;
      }
    }

    if (!valid || sharedPrefix === null) continue;

    // Generate predictions for unfilled offers using the same token position
    const predictions: Record<string, string> = {};
    for (const offer of offers) {
      if (!unfilledSet.has(offer.id)) continue;
      const tokens = offer.vehicleName.split(/\s+/);
      if (pos < tokens.length) {
        predictions[offer.id] = sharedPrefix + tokens[pos];
      }
    }

    if (Object.keys(predictions).length === 0) continue;

    return { ctaKey, predictions };
  }

  return null;
}
