import { describe, it, expect } from "vitest";
import { triage } from "../triage.js";
import { getSlotSearchDays, getRetryDays, getStartDate } from "../slot-search.js";
import { formatSafeErrorMessage } from "../error-handler.js";
import type { NexHealthApiError } from "../../nexhealth/types.js";
import type { UrgencyLevel } from "../types.js";

describe("End-to-end triage flow", () => {
  describe("Emergency flow terminates without booking", () => {
    it("should classify chest pain as emergency urgency", () => {
      const result = triage("I am having severe chest pain");
      expect(result.urgency).toBe("emergency");
    });

    it("should classify difficulty breathing as emergency urgency", () => {
      const result = triage("I can't breathe, difficulty breathing");
      expect(result.urgency).toBe("emergency");
    });

    it("should classify uncontrolled bleeding as emergency urgency", () => {
      const result = triage("uncontrolled bleeding from a wound");
      expect(result.urgency).toBe("emergency");
    });

    it("should throw when getSlotSearchDays is called with emergency urgency", () => {
      expect(() => getSlotSearchDays("emergency")).toThrow(
        "Emergency urgency should not search for appointment slots",
      );
    });
  });

  describe("Triage results produce valid TriageResult objects", () => {
    const symptomCases = [
      { input: "my tooth hurts a lot", expectedSpecialty: "dentistry" },
      { input: "I have a skin rash on my arm", expectedSpecialty: "dermatology" },
      { input: "my knee is swollen after a fall", expectedSpecialty: "orthopedics" },
      { input: "I have anxiety and depression", expectedSpecialty: "psychiatry" },
      { input: "I have blurry vision in my left eye", expectedSpecialty: "ophthalmology" },
    ];

    for (const { input, expectedSpecialty } of symptomCases) {
      it(`should produce valid triage result for "${input}"`, () => {
        const result = triage(input);

        // Structural invariants
        expect(result.specialties.length).toBeGreaterThanOrEqual(1);
        expect(result.specialties.length).toBeLessThanOrEqual(5);
        expect(["emergency", "urgent", "soon", "routine"]).toContain(result.urgency);
        expect(Array.isArray(result.appointment_types)).toBe(true);

        // Confidence values in valid range
        for (const s of result.specialties) {
          expect(s.confidence).toBeGreaterThanOrEqual(0);
          expect(s.confidence).toBeLessThanOrEqual(1);
        }

        // Expected specialty should be in the results
        const specialtyNames = result.specialties.map((s) => s.name);
        expect(specialtyNames).toContain(expectedSpecialty);
      });
    }
  });

  describe("Slot search helpers work with triage urgency output", () => {
    it("should return 1 day for urgent urgency", () => {
      const result = triage("I have acute pain in my wrist from a recent injury");
      expect(result.urgency).toBe("urgent");
      expect(getSlotSearchDays(result.urgency)).toBe(1);
    });

    it("should return 14 days for routine urgency", () => {
      const result = triage("I need a regular dental cleaning");
      expect(result.urgency).toBe("routine");
      expect(getSlotSearchDays(result.urgency)).toBe(14);
    });

    it("should double days on retry for each urgency level", () => {
      const levels: Exclude<UrgencyLevel, "emergency">[] = ["urgent", "soon", "routine"];
      for (const level of levels) {
        const days = getSlotSearchDays(level);
        expect(getRetryDays(days)).toBe(days * 2);
      }
    });

    it("should return today's date in YYYY-MM-DD format", () => {
      const startDate = getStartDate();
      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      expect(startDate).toBe(expected);
    });
  });

  describe("Booking failure error messages", () => {
    it("should produce safe message for 401 authentication error", () => {
      const error: NexHealthApiError = {
        status: 401,
        code: "AUTH_FAILED",
        message: "Invalid API key xyz-secret-123",
      };
      const msg = formatSafeErrorMessage(error);
      expect(msg).not.toContain("401");
      expect(msg).not.toContain("xyz-secret-123");
      expect(msg).toContain("scheduling service");
    });

    it("should produce safe message for 429 rate limit error", () => {
      const error: NexHealthApiError = {
        status: 429,
        code: "RATE_LIMITED",
        message: "Rate limit exceeded: 100 req/min",
      };
      const msg = formatSafeErrorMessage(error);
      expect(msg).not.toContain("429");
      expect(msg).not.toContain("100 req/min");
      expect(msg).toContain("busy");
    });

    it("should produce safe message for 500 server error", () => {
      const error: NexHealthApiError = {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "NullPointerException at com.nexhealth.api.BookingService",
      };
      const msg = formatSafeErrorMessage(error);
      expect(msg).not.toContain("500");
      expect(msg).not.toContain("NullPointerException");
      expect(msg).toContain("try again");
    });

    it("should produce safe message for timeout errors", () => {
      const error = new DOMException("The operation was aborted", "AbortError");
      const msg = formatSafeErrorMessage(error);
      expect(msg).toContain("timed out");
      expect(msg).not.toContain("AbortError");
    });

    it("should produce safe message for unknown error types", () => {
      const msg = formatSafeErrorMessage("some random string error");
      expect(msg.length).toBeGreaterThan(0);
      expect(msg).not.toContain("some random string error");
    });
  });
});
