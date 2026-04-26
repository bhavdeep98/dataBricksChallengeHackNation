import type { NexHealthApiError } from "../nexhealth/types.js";

/**
 * Format a safe, user-facing error message from a NexHealth API error.
 * Never exposes raw HTTP status codes, stack traces, or internal error objects.
 */
export function formatSafeErrorMessage(error: unknown): string {
  if (isNexHealthApiError(error)) {
    switch (error.status) {
      case 401:
        return "The scheduling service is temporarily unavailable. Please contact the practice directly.";
      case 429:
        return "The system is busy right now. Please wait a moment and try again.";
      default:
        return "Something went wrong. Please try again or contact the practice directly.";
    }
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "The request timed out. Please try again.";
  }

  return "Something went wrong. Please try again or contact the practice directly.";
}

function isNexHealthApiError(error: unknown): error is NexHealthApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as NexHealthApiError).status === "number"
  );
}
