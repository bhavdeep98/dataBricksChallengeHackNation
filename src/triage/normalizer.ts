/**
 * Normalize patient symptom input text for consistent matching.
 * Converts to lowercase, trims whitespace, and strips extraneous punctuation
 * while preserving hyphens and spaces needed for compound medical terms.
 */
export function normalizeInput(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
