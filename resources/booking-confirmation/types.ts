import { z } from "zod";

const bookingResultSchema = z.object({
  appointment_id: z.string().describe("Unique appointment identifier"),
  status: z
    .enum(["confirmed", "pending", "failed"])
    .describe("Booking status"),
  provider_name: z.string().describe("Provider display name"),
  location: z.string().describe("Appointment location"),
  start_time: z.string().describe("Appointment start time (ISO datetime)"),
  visit_reason: z.string().describe("Visit reason"),
  error_message: z
    .string()
    .optional()
    .describe("Error message for failed bookings"),
});

export const propSchema = z.object({
  booking: bookingResultSchema.describe("Booking result from ZocDoc API"),
});

export type BookingConfirmationProps = z.infer<typeof propSchema>;
