import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getRetryDays } from "../slot-search.js";

/**
 * Property 10: Retry doubles the search window
 *
 * For all initial days values (positive integers), the retry search SHALL use
 * a days value exactly equal to 2 × original days.
 *
 * **Validates: Requirements 5.2**
 */
describe("Property 10: Retry doubles the search window", () => {
  it("should return exactly 2 × original days for any positive integer", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (days) => {
          const retryDays = getRetryDays(days);
          expect(retryDays).toBe(2 * days);
        },
      ),
      { numRuns: 100 },
    );
  });
});
