import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { matchSymptoms } from "../matcher.js";

/**
 * Property 4: Confidence scores in descending order
 *
 * For any symptom description, the specialties array returned by matchSymptoms()
 * SHALL have confidence scores in non-increasing order (each score ≥ the next).
 *
 * **Validates: Requirements 2.3**
 */
describe("Property 4: Confidence scores in descending order", () => {
  it("should return specialties with confidence in non-increasing order", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        (input) => {
          const results = matchSymptoms(input);

          expect(results.length).toBeGreaterThanOrEqual(1);
          expect(results.length).toBeLessThanOrEqual(5);

          for (let i = 0; i < results.length - 1; i++) {
            expect(results[i].confidence).toBeGreaterThanOrEqual(
              results[i + 1].confidence,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
