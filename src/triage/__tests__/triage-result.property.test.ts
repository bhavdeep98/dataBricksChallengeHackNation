import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { triage } from "../triage.js";

/**
 * Property 1: TriageResult structural invariant
 *
 * For any valid symptom description (≥ 3 characters), the triage() function
 * SHALL return a TriageResult where specialties has length between 1 and 5
 * inclusive, every confidence value is in [0, 1], and urgency is one of
 * {emergency, urgent, soon, routine}.
 *
 * **Validates: Requirements 1.1, 7.1, 7.3, 7.4**
 */
describe("Property 1: TriageResult structural invariant", () => {
  it("should return a valid TriageResult for any symptom string ≥ 3 chars", () => {
    const validUrgencyLevels = new Set(["emergency", "urgent", "soon", "routine"]);

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 200 }),
        (description) => {
          const result = triage(description);

          // specialties length between 1 and 5
          expect(result.specialties.length).toBeGreaterThanOrEqual(1);
          expect(result.specialties.length).toBeLessThanOrEqual(5);

          // every confidence in [0, 1]
          for (const s of result.specialties) {
            expect(s.confidence).toBeGreaterThanOrEqual(0);
            expect(s.confidence).toBeLessThanOrEqual(1);
          }

          // urgency is a valid level
          expect(validUrgencyLevels.has(result.urgency)).toBe(true);

          // appointment_types is an array
          expect(Array.isArray(result.appointment_types)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
