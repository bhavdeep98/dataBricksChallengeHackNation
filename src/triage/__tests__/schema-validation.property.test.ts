import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { triageNeedSchema } from "../schemas.js";

/**
 * Property 3: Invalid input produces validation error
 *
 * For any string with fewer than 3 characters (including empty strings),
 * the nh-triage-need Zod schema SHALL reject the input.
 *
 * **Validates: Requirements 1.3, 8.1**
 */
describe("Property 3: Invalid input produces validation error", () => {
  it("should reject description strings shorter than 3 characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 2 }),
        (shortDescription) => {
          const result = triageNeedSchema.safeParse({ description: shortDescription });
          expect(result.success).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should accept description strings with 3 or more characters", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 200 }),
        (validDescription) => {
          const result = triageNeedSchema.safeParse({ description: validDescription });
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("should reject non-string description values", () => {
    const nonStringValues = [undefined, null, 123, true, {}, []];
    for (const value of nonStringValues) {
      const result = triageNeedSchema.safeParse({ description: value });
      expect(result.success).toBe(false);
    }
  });

  it("should strip unknown fields (non-strict mode for OpenAI compatibility)", () => {
    const result = triageNeedSchema.safeParse({
      description: "headache for two days",
      unknownField: "should be stripped",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("unknownField");
    }
  });
});
