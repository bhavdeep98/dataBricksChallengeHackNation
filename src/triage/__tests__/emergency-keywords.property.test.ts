import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { classifyUrgency, EMERGENCY_KEYWORDS } from "../urgency.js";

/**
 * Property 8: Emergency keywords always produce emergency classification
 *
 * For any string containing at least one emergency keyword, classifyUrgency()
 * SHALL return "emergency".
 *
 * **Validates: Requirements 3.6**
 */
describe("Property 8: Emergency keywords always produce emergency classification", () => {
  const emergencyKeywordArb = fc.constantFrom(...EMERGENCY_KEYWORDS);

  it("should return 'emergency' when input contains an emergency keyword", () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ maxLength: 50 }),
          emergencyKeywordArb,
          fc.string({ maxLength: 50 }),
        ),
        ([prefix, keyword, suffix]) => {
          const input = `${prefix} ${keyword} ${suffix}`;
          const result = classifyUrgency(input);

          expect(result).toBe("emergency");
        },
      ),
      { numRuns: 100 },
    );
  });
});
