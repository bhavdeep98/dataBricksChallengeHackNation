import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { classifyUrgency } from "../urgency.js";

/**
 * Property 6: Urgency classifier returns exactly one valid level
 *
 * For any non-empty string, classifyUrgency() SHALL return exactly one value
 * from the set {emergency, urgent, soon, routine}.
 *
 * **Validates: Requirements 3.1**
 */
describe("Property 6: Urgency classifier returns exactly one valid level", () => {
  const validLevels = new Set(["emergency", "urgent", "soon", "routine"]);

  it("should return exactly one valid urgency level for any non-empty string", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 300 }),
        (input) => {
          const result = classifyUrgency(input);

          expect(typeof result).toBe("string");
          expect(validLevels.has(result)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
