import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { matchSymptoms } from "../matcher.js";

/**
 * Property 5: Normalization invariance
 *
 * For any symptom description string, matchSymptoms(input) SHALL produce the
 * same specialty results as matchSymptoms(input.toUpperCase()) and
 * matchSymptoms("  " + input + "  ") — casing and surrounding whitespace
 * do not affect output.
 *
 * **Validates: Requirements 2.4**
 */
describe("Property 5: Normalization invariance", () => {
  it("should produce the same results regardless of casing", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 200 }),
        (input) => {
          const original = matchSymptoms(input);
          const uppercased = matchSymptoms(input.toUpperCase());

          expect(original.length).toBe(uppercased.length);
          for (let i = 0; i < original.length; i++) {
            expect(original[i].name).toBe(uppercased[i].name);
            expect(original[i].confidence).toBe(uppercased[i].confidence);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should produce the same results regardless of surrounding whitespace", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 200 }),
        (input) => {
          const original = matchSymptoms(input);
          const padded = matchSymptoms("  " + input + "  ");

          expect(original.length).toBe(padded.length);
          for (let i = 0; i < original.length; i++) {
            expect(original[i].name).toBe(padded[i].name);
            expect(original[i].confidence).toBe(padded[i].confidence);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should produce the same results for combined casing and whitespace variations", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 200 }),
        (input) => {
          const original = matchSymptoms(input);
          const varied = matchSymptoms("  " + input.toUpperCase() + "  ");

          expect(original.length).toBe(varied.length);
          for (let i = 0; i < original.length; i++) {
            expect(original[i].name).toBe(varied[i].name);
            expect(original[i].confidence).toBe(varied[i].confidence);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
