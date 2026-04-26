import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  classifyUrgency,
  URGENT_KEYWORDS,
  EMERGENCY_KEYWORDS,
} from "../urgency.js";

/**
 * Property 9: Urgent keywords produce urgent classification
 *
 * For any string containing at least one urgent keyword and no emergency
 * keywords, classifyUrgency() SHALL return "urgent".
 *
 * **Validates: Requirements 3.7**
 */
describe("Property 9: Urgent keywords produce urgent classification", () => {
  const urgentKeywordArb = fc.constantFrom(...URGENT_KEYWORDS);

  // Generate filler text that cannot accidentally contain emergency keywords.
  // Use digits-only tokens so no alphabetic emergency keyword can appear.
  const safeFillerArb = fc
    .array(
      fc.integer({ min: 100, max: 999 }).map((n) => n.toString()),
      { minLength: 0, maxLength: 3 },
    )
    .map((parts) => parts.join(" "));

  it("should return 'urgent' when input contains an urgent keyword and no emergency keywords", () => {
    fc.assert(
      fc.property(
        fc.tuple(safeFillerArb, urgentKeywordArb, safeFillerArb),
        ([prefix, keyword, suffix]) => {
          const input = `${prefix} ${keyword} ${suffix}`.trim();

          // Verify no emergency keywords are present
          const hasEmergency = EMERGENCY_KEYWORDS.some((ek) =>
            input.includes(ek),
          );
          expect(hasEmergency).toBe(false);

          const result = classifyUrgency(input);
          expect(result).toBe("urgent");
        },
      ),
      { numRuns: 100 },
    );
  });
});
