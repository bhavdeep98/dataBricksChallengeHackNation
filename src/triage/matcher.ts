import { normalizeInput } from "./normalizer.js";
import { SYMPTOM_KNOWLEDGE_BASE } from "./knowledge-base.js";
import type { SpecialtyRecommendation } from "./types.js";

/**
 * Match normalized text against the knowledge base.
 * Returns 1–5 specialties ranked by confidence (descending).
 * Falls back to "general practice" at confidence < 0.5 if no keywords match.
 */
export function matchSymptoms(input: string): SpecialtyRecommendation[] {
  const normalized = normalizeInput(input);

  const scores = new Map<string, number>();

  for (const mapping of SYMPTOM_KNOWLEDGE_BASE) {
    let matchCount = 0;
    for (const keyword of mapping.keywords) {
      if (normalized.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      // Boost confidence slightly for multiple keyword matches within the same specialty
      const boost = Math.min((matchCount - 1) * 0.02, 0.1);
      const confidence = Math.min(mapping.baseConfidence + boost, 1);
      const existing = scores.get(mapping.specialty);
      if (existing === undefined || confidence > existing) {
        scores.set(mapping.specialty, confidence);
      }
    }
  }

  // If no keywords matched, fall back to general practice
  if (scores.size === 0) {
    return [{ name: "general practice", confidence: 0.3 }];
  }

  // Sort by confidence descending, then alphabetically for stability
  const results = Array.from(scores.entries())
    .map(([name, confidence]) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));

  // Return at most 5 results
  return results.slice(0, 5);
}
