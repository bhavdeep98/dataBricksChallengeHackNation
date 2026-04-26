import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatSafeErrorMessage } from "../error-handler.js";
import type { NexHealthApiError } from "../../nexhealth/types.js";

/**
 * Property 12: Error messages never expose raw API details
 *
 * For any NexHealthApiError passed through the error handler, the user-facing
 * output SHALL NOT contain raw HTTP status codes, stack traces, or internal
 * error object fields.
 *
 * **Validates: Requirements 9.4**
 */
describe("Property 12: Error messages never expose raw API details", () => {
  const nexHealthApiErrorArb = fc.record({
    status: fc.integer({ min: 100, max: 599 }),
    code: fc.string({ minLength: 1, maxLength: 30 }),
    message: fc.string({ minLength: 0, maxLength: 200 }),
    details: fc.option(
      fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 50 })),
      { nil: undefined },
    ),
  }) as fc.Arbitrary<NexHealthApiError>;

  it("should never contain raw HTTP status codes in user-facing output", () => {
    fc.assert(
      fc.property(nexHealthApiErrorArb, (error) => {
        const message = formatSafeErrorMessage(error);

        // Should not contain 3-digit status codes
        const threeDigitMatches = message.match(/\b\d{3}\b/g);
        expect(threeDigitMatches).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it("should never contain stack traces in user-facing output", () => {
    fc.assert(
      fc.property(nexHealthApiErrorArb, (error) => {
        const message = formatSafeErrorMessage(error);

        expect(message).not.toContain("stack");
        expect(message).not.toContain("Stack");
        expect(message).not.toContain("Error:");
        expect(message).not.toMatch(/at\s+\w+\s+\(/); // stack trace pattern
      }),
      { numRuns: 100 },
    );
  });

  it("should never contain raw JSON objects or internal error fields", () => {
    // Use codes and messages that are clearly internal/technical identifiers
    const technicalCodeArb = fc.constantFrom(
      "AUTH_FAILED",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "API_ERROR",
      "TIMEOUT",
      "FORBIDDEN",
      "NOT_FOUND",
      "SERVER_ERROR",
    );
    const technicalMessageArb = fc.constantFrom(
      "Invalid API key",
      "Too many requests per second",
      "Internal server error occurred",
      "Connection refused at 10.0.0.1:8080",
      "ECONNRESET socket hang up",
      "Unexpected token < in JSON at position 0",
    );
    const technicalErrorArb = fc.record({
      status: fc.integer({ min: 100, max: 599 }),
      code: technicalCodeArb,
      message: technicalMessageArb,
      details: fc.option(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 50 })),
        { nil: undefined },
      ),
    }) as fc.Arbitrary<NexHealthApiError>;

    fc.assert(
      fc.property(technicalErrorArb, (error) => {
        const message = formatSafeErrorMessage(error);

        // Should not contain raw JSON-like patterns
        expect(message).not.toMatch(/\{.*".*":.*\}/);
        // Should not contain the raw error code field
        expect(message).not.toContain(error.code);
        // Should not contain the raw technical error message
        expect(message).not.toContain(error.message);
      }),
      { numRuns: 100 },
    );
  });

  it("should produce a non-empty user-friendly string for any error", () => {
    fc.assert(
      fc.property(nexHealthApiErrorArb, (error) => {
        const message = formatSafeErrorMessage(error);

        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});
