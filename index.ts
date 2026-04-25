import "dotenv/config";
import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";
import { createNexHealthClient } from "./src/nexhealth/client.js";
import {
  listInstitutionsSchema,
  listProvidersSchema,
  getProviderSchema,
  searchPatientsSchema,
  createPatientSchema,
  listAppointmentTypesSchema,
  getAvailableSlotsSchema,
  bookAppointmentSchema,
  listLocationsSchema,
} from "./src/nexhealth/schemas.js";
import type { NexHealthApiError } from "./src/nexhealth/types.js";

const nexhealth = createNexHealthClient();

const NEXHEALTH_UNAVAILABLE_MSG = "NexHealth is not configured. Set the NEXHEALTH_API_KEY environment variable to enable NexHealth tools.";

const server = new MCPServer({
  name: "my-chatgpt-app",
  title: "my-chatgpt-app", // display name
  version: "1.0.0",
  description: "MCP server with MCP Apps integration",
  baseUrl: process.env.MCP_URL || "http://localhost:3000", // Full base URL (e.g., https://myserver.com)
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com", // Can be customized later
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// --- NexHealth Tools ---

function handleNexHealthError(error: unknown, context: string) {
  if ((error as NexHealthApiError).status) {
    const apiError = error as NexHealthApiError;
    switch (apiError.status) {
      case 401:
        return text("NexHealth authentication failed. Please check the API key configuration.");
      case 403:
        return text("NexHealth access forbidden. Your API key may not have permission for this resource.");
      case 429:
        return text("NexHealth API rate limit reached. Please try again in a moment.");
      case 404:
        return text(`${context} not found. The ID may be invalid.`);
      default:
        return text(`NexHealth API error: ${apiError.message}`);
    }
  }
  if (error instanceof Error && error.name === "AbortError") {
    return text("NexHealth API request timed out. Please try again.");
  }
  return text("An unexpected error occurred while contacting NexHealth.");
}

server.tool(
  {
    name: "nh-list-institutions",
    description: "List all institutions (practices) accessible with your NexHealth API key. Returns subdomain needed for all other NexHealth tools. Call this first to discover available institutions.",
    schema: listInstitutionsSchema,
  },
  async () => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getInstitutions();
      const institutions = Array.isArray(response.data) ? response.data : [];
      if (institutions.length === 0) return text("No institutions found for this API key.");
      const lines = institutions.map(
        (i) => `• ${i.name} (subdomain: ${i.subdomain}, ID: ${i.id})${i.is_test ? " [TEST]" : ""}`
      );
      return text(`Found ${institutions.length} institution(s):\n${lines.join("\n")}\n\nUse the subdomain value in subsequent NexHealth tool calls.`);
    } catch (error) {
      return handleNexHealthError(error, "Institutions");
    }
  }
);

server.tool(
  {
    name: "nh-list-locations",
    description: "List all practice locations for a NexHealth institution. Returns location IDs needed for providers, patients, and booking tools.",
    schema: listLocationsSchema,
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getLocations(params.subdomain);
      const locations = Array.isArray(response.data) ? response.data : [];
      if (locations.length === 0) return text("No locations found for this institution.");
      const lines = locations.map(
        (l) => `• ${l.name} (ID: ${l.id})${l.city ? ` — ${l.city}, ${l.state}` : ""}${l.phone_number ? ` — ${l.phone_number}` : ""}`
      );
      return text(`Found ${locations.length} location(s):\n${lines.join("\n")}`);
    } catch (error) {
      return handleNexHealthError(error, "Locations");
    }
  }
);

server.tool(
  {
    name: "nh-list-providers",
    description: "List healthcare providers at a NexHealth practice location, optionally filtered to only bookable providers",
    schema: listProvidersSchema,
    widget: {
      name: "provider-search-result-zocdoc",
      invoking: "Loading providers...",
      invoked: "Providers loaded",
    },
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getProviders(params.subdomain, {
        location_id: params.location_id,
        page: params.page,
        per_page: params.per_page,
        requestable: params.requestable,
      });
      const providers = response.data?.providers ?? [];
      return widget({
        props: {
          providers: providers.map((p) => ({
            name: p.name ?? `${p.first_name} ${p.last_name}`,
            specialty: p.meta_type ?? undefined,
            provider_location_id: String(p.id),
          })),
          query: "NexHealth Providers",
          totalCount: response.count ?? providers.length,
        },
        output: text(`Found ${providers.length} providers`),
      });
    } catch (error) {
      return handleNexHealthError(error, "Providers");
    }
  }
);

server.tool(
  {
    name: "nh-get-provider",
    description: "Get detailed information about a specific NexHealth provider",
    schema: getProviderSchema,
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getProvider(params.subdomain, params.provider_id);
      const p = response.data?.provider;
      if (!p) return text("Provider not found.");
      return text(
        `Provider: ${p.name}\nType: ${p.meta_type ?? "N/A"}\nID: ${p.id}\nActive: ${!p.inactive}`
      );
    } catch (error) {
      return handleNexHealthError(error, "Provider");
    }
  }
);

server.tool(
  {
    name: "nh-search-patients",
    description: "Search for patients in a NexHealth practice by name, email, phone, or date of birth. Always search before creating a new patient to avoid duplicates.",
    schema: searchPatientsSchema,
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getPatients(params.subdomain, {
        location_id: params.location_id,
        name: params.name,
        email: params.email,
        phone_number: params.phone_number,
        date_of_birth: params.date_of_birth,
        page: params.page,
        per_page: params.per_page,
      });
      const patients = response.data?.patients ?? [];
      if (patients.length === 0) return text("No patients found matching the search criteria.");
      const lines = patients.map(
        (p) => `• ${p.name} (ID: ${p.id})${p.email ? ` — ${p.email}` : ""}${p.bio?.date_of_birth ? ` — DOB: ${p.bio.date_of_birth}` : ""}`
      );
      return text(`Found ${response.count ?? patients.length} patient(s):\n${lines.join("\n")}`);
    } catch (error) {
      return handleNexHealthError(error, "Patients");
    }
  }
);

server.tool(
  {
    name: "nh-create-patient",
    description: "Create a new patient record in NexHealth for appointment booking. Search for existing patients first to avoid duplicates.",
    schema: createPatientSchema,
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.createPatient(params.subdomain, params.location_id, {
        first_name: params.first_name,
        last_name: params.last_name,
        email: params.email,
        bio: {
          phone_number: params.phone_number,
          date_of_birth: params.date_of_birth,
        },
      });
      const p = response.data?.patient;
      return text(
        `Patient created: ${p.first_name} ${p.last_name} (ID: ${p.id}). Use this patient ID when booking appointments.`
      );
    } catch (error) {
      return handleNexHealthError(error, "Patient");
    }
  }
);

server.tool(
  {
    name: "nh-list-appointment-types",
    description: "List available appointment types (e.g., New Patient, Cleaning) at a NexHealth location",
    schema: listAppointmentTypesSchema,
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getAppointmentTypes(params.subdomain, {
        location_id: params.location_id,
        page: params.page,
        per_page: params.per_page,
      });
      const types = response.data?.appointment_types ?? [];
      if (types.length === 0) return text("No appointment types found.");
      const lines = types.map(
        (t) => `• ${t.name} (ID: ${t.id})${t.minutes ? ` — ${t.minutes} min` : ""}`
      );
      return text(`Available appointment types:\n${lines.join("\n")}`);
    } catch (error) {
      return handleNexHealthError(error, "Appointment types");
    }
  }
);

server.tool(
  {
    name: "nh-get-available-slots",
    description: "Check available appointment time slots for providers at a NexHealth location. Returns bookable slots with operatory IDs needed for booking.",
    schema: getAvailableSlotsSchema,
    widget: {
      name: "availability-calendar",
      invoking: "Checking availability...",
      invoked: "Availability loaded",
    },
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.getAppointmentSlots(params.subdomain, {
        start_date: params.start_date,
        days: params.days,
        lids: params.location_ids,
        pids: params.provider_ids,
        appointment_type_id: params.appointment_type_id,
        slot_length: params.slot_length,
      });
      const slotGroups = Array.isArray(response.data) ? response.data : [];
      const availabilities = slotGroups.map((group) => ({
        provider_location_id: `${group.pid}`,
        provider_name: `Provider ${group.pid}`,
        slots: group.slots.map((s) => ({
          start_time: s.time,
          is_available: true,
          operatory_id: s.operatory_id,
        })),
      }));
      const totalSlots = availabilities.reduce((sum, a) => sum + a.slots.length, 0);
      return widget({
        props: { availabilities },
        output: text(`Found ${totalSlots} available time slots`),
      });
    } catch (error) {
      return handleNexHealthError(error, "Availability");
    }
  }
);

server.tool(
  {
    name: "nh-book-appointment",
    description: "Book an appointment with a NexHealth provider. Requires patient_id, provider_id, operatory_id (from available slots), and start_time.",
    schema: bookAppointmentSchema,
    widget: {
      name: "booking-confirmation",
      invoking: "Booking your appointment...",
      invoked: "Appointment booked",
    },
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);
    try {
      const response = await nexhealth.createAppointment(
        params.subdomain,
        params.location_id,
        {
          patient_id: params.patient_id,
          provider_id: params.provider_id,
          operatory_id: params.operatory_id,
          start_time: params.start_time,
          appointment_type_id: params.appointment_type_id,
        },
        params.notify_patient,
      );
      const appt = response.data?.appointment;
      return widget({
        props: {
          booking: {
            appointment_id: String(appt.id),
            status: "confirmed" as const,
            provider_name: appt.provider_name ?? `Provider ${appt.provider_id}`,
            location: `Location ${appt.location_id}`,
            start_time: appt.start_time,
            visit_reason: appt.appointment_type_id ? `Type ${appt.appointment_type_id}` : "General",
          },
        },
        output: text(`Appointment booked (ID: ${appt.id}) at ${appt.start_time}`),
      });
    } catch (error) {
      if ((error as NexHealthApiError).status) {
        const apiError = error as NexHealthApiError;
        return widget({
          props: {
            booking: {
              appointment_id: "",
              status: "failed" as const,
              provider_name: `Provider ${params.provider_id}`,
              location: "",
              start_time: params.start_time,
              visit_reason: "",
              error_message: apiError.message,
            },
          },
          output: text(`Booking failed: ${apiError.message}`),
        });
      }
      if (error instanceof Error && error.name === "AbortError") {
        return text("NexHealth API request timed out. Please try again.");
      }
      return text("An unexpected error occurred while booking the appointment.");
    }
  }
);

server.listen().then(() => {
  console.log(`Server running`);
});
