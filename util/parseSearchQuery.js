import { getCountryIdFromQuery } from "./getCountryIdFromQuery.js";

/**
 * Parses a natural-language search string into a canonical filter object.
 * Returns null if no recognizable filters are found.
 *
 * Examples that produce identical output:
 *   "Nigerian females between ages 20 and 45"
 *   "Women aged 20–45 living in Nigeria"
 *   → { country_id: "NG", gender: "female", min_age: 20, max_age: 45 }
 */
export async function parseSearchQuery(q) {
  if (!q) return null;

  const lowerQuery = q.toLowerCase();
  const filters = {};

  // ── Country ────────────────────────────────────────────────────────────────
  const countryId = await getCountryIdFromQuery(q);
  if (countryId) filters.country_id = countryId;

  // ── Gender ─────────────────────────────────────────────────────────────────
  // Use word-boundary regex so "male" inside "females" is never matched
  const hasFemale = /\b(female|females|women|woman)\b/.test(lowerQuery);
  const hasMale = /\b(male|males|men|man)\b/.test(lowerQuery);
  if (hasFemale && !hasMale) filters.gender = "female";
  else if (hasMale && !hasFemale) filters.gender = "male";

  // ── Age group ──────────────────────────────────────────────────────────────
  if (/\bseniors?\b/.test(lowerQuery)) filters.age_group = "senior";
  else if (/\bteenagers?\b/.test(lowerQuery)) filters.age_group = "teenager";
  else if (/\badults?\b/.test(lowerQuery)) filters.age_group = "adult";
  else if (/\bchildre?n?\b/.test(lowerQuery)) filters.age_group = "child";

  // ── Age range ──────────────────────────────────────────────────────────────
  // Priority order:
  //   1. "between [ages] X and Y"
  //   2. "aged/age X–Y", "aged/age X-Y", "aged/age X to Y"
  //   3. Bare en-dash "X–Y"
  const betweenMatch = lowerQuery.match(
    /between\s+(?:ages?\s+)?(\d+)\s+and\s+(\d+)/,
  );
  const agedRangeMatch = lowerQuery.match(
    /aged?\s+(\d+)\s*(?:[–-]|to)\s*(\d+)/,
  );
  const enDashMatch = lowerQuery.match(/(\d+)\s*–\s*(\d+)/);

  const rangeMatch = betweenMatch || agedRangeMatch || enDashMatch;
  if (rangeMatch) {
    filters.min_age = parseInt(rangeMatch[1]);
    filters.max_age = parseInt(rangeMatch[2]);
  } else {
    // Single-bound expressions
    const aboveMatch = lowerQuery.match(/(?:above|over)\s+(\d+)/);
    const belowMatch = lowerQuery.match(/(?:below|under)\s+(\d+)/);
    if (aboveMatch) filters.min_age = parseInt(aboveMatch[1]);
    if (belowMatch) filters.max_age = parseInt(belowMatch[1]);

    // Keyword age mappings — only when no explicit number was found
    if (!aboveMatch && !belowMatch) {
      if (/\byoung\b/.test(lowerQuery)) {
        filters.min_age = 16;
        filters.max_age = 24;
      } else if (/\bold\b/.test(lowerQuery)) {
        filters.min_age = 50;
      }
    }
  }

  return Object.keys(filters).length > 0 ? filters : null;
}
