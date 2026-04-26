import type { UrgencyLevel } from "./types.js";

const URGENCY_DAYS_MAP: Record<Exclude<UrgencyLevel, "emergency">, number> = {
  urgent: 1,
  soon: 7,
  routine: 14,
};

/**
 * Map a non-emergency urgency level to the number of days to search for slots.
 * Throws if called with "emergency" — emergencies should not search for slots.
 */
export function getSlotSearchDays(urgency: UrgencyLevel): number {
  if (urgency === "emergency") {
    throw new Error("Emergency urgency should not search for appointment slots");
  }
  return URGENCY_DAYS_MAP[urgency];
}

/**
 * Double the original search window for a retry attempt.
 */
export function getRetryDays(days: number): number {
  return 2 * days;
}

/**
 * Return today's date in YYYY-MM-DD format.
 */
export function getStartDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
