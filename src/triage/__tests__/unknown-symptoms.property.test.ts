import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { matchSymptoms } from "../matcher.js";

/**
 * Property 11: Unknown symptoms fall back to general practice
 *
 * For any symptom description that matches zero keywords in the built-in
 * knowledge base, matchSymptoms() SHALL return at least one result with
 * specialty "general practice" or "primary care" and a confidence score
 * strictly less than 0.5.
 *
 * **Validates: Requirements 8.4**
 */
describe("Property 11: Unknown symptoms fall back to general practice", () => {
  // Use a restricted alphabet of digits and special chars that won't match any keywords
  const nonsenseWordArb = fc
    .array(fc.constantFrom("0", "1", "2", "7", "8", "9", "#", "@", "~", "+"), {
      minLength: 1,
      maxLength: 5,
    })
    .map((chars) => chars.join(""));

  const nonsenseStringArb = fc
    .array(nonsenseWordArb, { minLength: 1, maxLength: 5 })
    .map((words) => words.join(" "));

  it("should return general practice with confidence < 0.5 for unknown symptom strings", () => {
    fc.assert(
      fc.property(nonsenseStringArb, (input) => {
        const results = matchSymptoms(input);

        expect(results.length).toBeGreaterThanOrEqual(1);

        const fallback = results.find(
          (r) => r.name === "general practice" || r.name === "primary care",
        );
        expect(fallback).toBeDefined();
        expect(fallback!.confidence).toBeLessThan(0.5);
      }),
      { numRuns: 100 },
    );
  });
});
