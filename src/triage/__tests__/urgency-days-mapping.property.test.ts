import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getSlotSearchDays, getStartDate } from "../slot-search.js";

/**
 * Property 7: Urgency-to-days mapping
 *
 * For any non-emergency UrgencyLevel, the slot search days parameter SHALL equal
 * the defined mapping: urgent→1, soon→7, routine→14.
 * The start_date SHALL equal today's date in YYYY-MM-DD format.
 *
 * **Validates: Requirements 3.3, 3.4, 3.5, 5.1**
 */
describe("Property 7: Urgency-to-days mapping", () => {
  const expectedMapping: Record<string, number> = {
    urgent: 1,
    soon: 7,
    routine: 14,
  };

  it("should map non-emergency urgency levels to correct days", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("urgent" as const, "soon" as const, "routine" as const),
        (urgency) => {
          const days = getSlotSearchDays(urgency);
          expect(days).toBe(expectedMapping[urgency]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should return today's date in YYYY-MM-DD format as start_date", () => {
    const startDate = getStartDate();
    const today = new Date();
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(startDate).toBe(expected);
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should throw for emergency urgency", () => {
    expect(() => getSlotSearchDays("emergency")).toThrow();
  });
});
