import { z } from "zod";

const timeSlotSchema = z.object({
  start_time: z.string().describe("ISO datetime for the slot start"),
  end_time: z.string().optional().describe("ISO datetime for the slot end"),
  is_available: z.boolean().describe("Whether the slot is available for booking"),
});

const providerAvailabilitySchema = z.object({
  provider_location_id: z.string().describe("Provider location ID"),
  provider_name: z.string().describe("Provider display name"),
  slots: z.array(timeSlotSchema).describe("Time slots for this provider"),
});

export const propSchema = z.object({
  availabilities: z
    .array(providerAvailabilitySchema)
    .describe("Array of provider availabilities with time slots"),
});

export type TimeSlotItem = z.infer<typeof timeSlotSchema>;
export type ProviderAvailabilityItem = z.infer<typeof providerAvailabilitySchema>;
export type AvailabilityCalendarProps = z.infer<typeof propSchema>;
