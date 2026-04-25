import { z } from "zod";

export const listInstitutionsSchema = z.object({}).strict();

export const listLocationsSchema = z.object({
  subdomain: z.string().describe("Institution subdomain (get from nh-list-institutions)"),
}).strict();

export const listProvidersSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  location_id: z.number().int().describe("Location ID (get from nh-list-locations)"),
  page: z.number().int().min(1).optional().describe("Page number"),
  per_page: z.number().int().min(1).max(300).optional().describe("Results per page (max 300)"),
  requestable: z.boolean().optional().describe("Only return bookable providers"),
}).strict();

export const getProviderSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  provider_id: z.number().int().describe("Provider ID"),
}).strict();

export const searchPatientsSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  location_id: z.number().int().describe("Location ID"),
  name: z.string().optional().describe("Patient name to search for"),
  email: z.string().email().optional().describe("Patient email"),
  phone_number: z.string().optional().describe("Patient phone number"),
  date_of_birth: z.string().optional().describe("Patient date of birth (YYYY-MM-DD)"),
  page: z.number().int().min(1).optional().describe("Page number"),
  per_page: z.number().int().min(1).max(300).optional().describe("Results per page"),
}).strict();

export const createPatientSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  location_id: z.number().int().describe("Location ID"),
  first_name: z.string().describe("Patient first name"),
  last_name: z.string().describe("Patient last name"),
  email: z.string().email().optional().describe("Patient email"),
  phone_number: z.string().optional().describe("Patient phone number"),
  date_of_birth: z.string().optional().describe("Patient date of birth (YYYY-MM-DD)"),
}).strict();

export const listAppointmentTypesSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  location_id: z.number().int().describe("Location ID"),
  page: z.number().int().min(1).optional().describe("Page number"),
  per_page: z.number().int().min(1).max(300).optional().describe("Results per page"),
}).strict();

export const getAvailableSlotsSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  start_date: z.string().describe("Start date (YYYY-MM-DD)"),
  days: z.number().int().min(1).max(14).optional().describe("Number of days to search (max 14)"),
  provider_ids: z.array(z.number().int()).min(1).describe("Provider IDs to check availability"),
  location_ids: z.array(z.number().int()).min(1).describe("Location IDs"),
  appointment_type_id: z.number().int().optional().describe("Appointment type ID to filter slots"),
  slot_length: z.number().int().optional().describe("Slot length in minutes (default 15)"),
}).strict();

export const bookAppointmentSchema = z.object({
  subdomain: z.string().describe("Institution subdomain"),
  location_id: z.number().int().describe("Location ID"),
  patient_id: z.number().int().describe("Patient ID"),
  provider_id: z.number().int().describe("Provider ID"),
  operatory_id: z.number().int().describe("Operatory ID from the selected slot"),
  start_time: z.string().describe("Appointment start time (ISO 8601 datetime from a slot)"),
  appointment_type_id: z.number().int().optional().describe("Appointment type ID"),
  notify_patient: z.boolean().optional().describe("Send appointment notification to patient"),
}).strict();
