import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { matchAppointmentTypes } from "../appointment-matcher.js";
import type { NexHealthAppointmentType } from "../../nexhealth/types.js";

/**
 * Property 2: Appointment type IDs are a subset of available types
 *
 * For any list of NexHealthAppointmentType objects and any list of specialty
 * names, all id values in the array returned by matchAppointmentTypes()
 * SHALL exist in the input appointment types array.
 *
 * **Validates: Requirements 1.2**
 */
describe("Property 2: Appointment type IDs are a subset of available types", () => {
  const appointmentNameWords = [
    "dental", "checkup", "general", "visit", "urgent", "care",
    "dermatology", "skin", "orthopedic", "bone", "follow", "up",
    "new", "patient", "consultation", "therapy", "session",
    "eye", "exam", "cardiology", "heart", "neurology", "nerve",
  ];

  const nexHealthAppointmentTypeArb = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    name: fc
      .array(fc.constantFrom(...appointmentNameWords), { minLength: 1, maxLength: 4 })
      .map((words) => words.join(" ")),
    minutes: fc.option(fc.integer({ min: 15, max: 120 }), { nil: undefined }),
  }) as fc.Arbitrary<NexHealthAppointmentType>;

  const specialtyWords = [
    "dentistry", "dermatology", "orthopedics", "cardiology",
    "neurology", "general", "practice", "urgent", "care",
    "ophthalmology", "ent", "psychiatry", "pediatrics",
  ];

  const specialtyNameArb = fc
    .array(fc.constantFrom(...specialtyWords), { minLength: 1, maxLength: 3 })
    .map((words) => words.join(" "));

  it("should only return IDs that exist in the input appointment types array", () => {
    fc.assert(
      fc.property(
        fc.array(specialtyNameArb, { minLength: 0, maxLength: 5 }),
        fc.array(nexHealthAppointmentTypeArb, { minLength: 0, maxLength: 10 }),
        (specialties, appointmentTypes) => {
          const result = matchAppointmentTypes(specialties, appointmentTypes);

          const inputIds = new Set(appointmentTypes.map((t) => t.id));

          for (const match of result) {
            expect(inputIds.has(match.id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
