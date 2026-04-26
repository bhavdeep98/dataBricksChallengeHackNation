import { describe, it, expect } from "vitest";
import { formatSafeErrorMessage } from "../error-handler.js";
import type { NexHealthApiError } from "../../nexhealth/types.js";
import { triage } from "../triage.js";

describe("formatSafeErrorMessage", () => {
  it("should return service unavailable message for 401 errors", () => {
    const error: NexHealthApiError = {
      status: 401,
      code: "AUTH_FAILED",
      message: "Invalid API key",
    };
    const message = formatSafeErrorMessage(error);
    expect(message).toBe(
      "The scheduling service is temporarily unavailable. Please contact the practice directly.",
    );
  });

  it("should return system busy message for 429 errors", () => {
    const error: NexHealthApiError = {
      status: 429,
      code: "RATE_LIMITED",
      message: "Too many requests",
    };
    const message = formatSafeErrorMessage(error);
    expect(message).toBe(
      "The system is busy right now. Please wait a moment and try again.",
    );
  });

  it("should return timeout message for AbortError", () => {
    const error = new DOMException("The operation was aborted", "AbortError");
    const message = formatSafeErrorMessage(error);
    expect(message).toBe("The request timed out. Please try again.");
  });

  it("should return generic safe message for unknown errors", () => {
    const error = new Error("Something unexpected");
    const message = formatSafeErrorMessage(error);
    expect(message).toBe(
      "Something went wrong. Please try again or contact the practice directly.",
    );
  });

  it("should return generic safe message for other HTTP status codes", () => {
    const error: NexHealthApiError = {
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    };
    const message = formatSafeErrorMessage(error);
    expect(message).toBe(
      "Something went wrong. Please try again or contact the practice directly.",
    );
  });
});

describe("Triage API fallback behavior", () => {
  it("should return specialty recommendations without appointment types when API is unavailable", () => {
    // Call triage without appointment types (simulating API failure fallback)
    const result = triage("I have a bad toothache");

    expect(result.specialties.length).toBeGreaterThanOrEqual(1);
    expect(result.urgency).toBeDefined();
    // Without appointment types, the array should be empty
    expect(result.appointment_types).toEqual([]);
  });

  it("should still produce valid triage results for various symptoms when no API data", () => {
    const symptoms = [
      "my knee hurts after running",
      "I have a skin rash on my arm",
      "feeling very anxious and can't sleep",
    ];

    for (const symptom of symptoms) {
      const result = triage(symptom);
      expect(result.specialties.length).toBeGreaterThanOrEqual(1);
      expect(result.specialties.length).toBeLessThanOrEqual(5);
      expect(result.appointment_types).toEqual([]);
      expect(["emergency", "urgent", "soon", "routine"]).toContain(result.urgency);
    }
  });
});
