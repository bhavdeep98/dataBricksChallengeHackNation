import { normalizeInput } from "./normalizer.js";
import { matchSymptoms } from "./matcher.js";
import { classifyUrgency } from "./urgency.js";
import { matchAppointmentTypes } from "./appointment-matcher.js";
import type { TriageResult } from "./types.js";
import type { NexHealthAppointmentType } from "../nexhealth/types.js";

/**
 * Full triage pipeline: normalize → match symptoms → classify urgency → match appointment types.
 * Pure function — no side effects.
 */
export function triage(
  description: string,
  appointmentTypes?: NexHealthAppointmentType[],
): TriageResult {
  const normalized = normalizeInput(description);
  const specialties = matchSymptoms(normalized);
  const urgency = classifyUrgency(normalized);

  const appointment_types =
    appointmentTypes && appointmentTypes.length > 0
      ? matchAppointmentTypes(
          specialties.map((s) => s.name),
          appointmentTypes,
        )
      : [];

  return {
    specialties,
    appointment_types,
    urgency,
  };
}
