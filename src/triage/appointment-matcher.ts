import type { NexHealthAppointmentType } from "../nexhealth/types.js";

/**
 * Given specialty recommendations and NexHealth appointment types,
 * return matching appointment type IDs via fuzzy matching.
 *
 * Fuzzy matching: check if any word from the specialty name appears
 * in the appointment type name (case-insensitive), or vice versa.
 *
 * Returns empty array if no matches or types unavailable.
 */
export function matchAppointmentTypes(
  specialties: string[],
  appointmentTypes: NexHealthAppointmentType[],
): { id: number; name: string }[] {
  if (!appointmentTypes || appointmentTypes.length === 0) {
    return [];
  }

  if (!specialties || specialties.length === 0) {
    return [];
  }

  const seen = new Set<number>();
  const results: { id: number; name: string }[] = [];

  for (const apptType of appointmentTypes) {
    if (seen.has(apptType.id)) continue;

    const apptNameLower = apptType.name.toLowerCase();
    const apptWords = apptNameLower.split(/[\s\-]+/).filter(Boolean);

    for (const specialty of specialties) {
      const specLower = specialty.toLowerCase();
      const specWords = specLower.split(/[\s\-]+/).filter(Boolean);

      let matched = false;

      // Check if any specialty word appears in the appointment type name
      for (const word of specWords) {
        if (word.length > 0 && apptNameLower.includes(word)) {
          matched = true;
          break;
        }
      }

      // Check if any appointment type word appears in the specialty name
      if (!matched) {
        for (const word of apptWords) {
          if (word.length > 0 && specLower.includes(word)) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        seen.add(apptType.id);
        results.push({ id: apptType.id, name: apptType.name });
        break;
      }
    }
  }

  return results;
}
