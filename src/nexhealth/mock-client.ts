/**
 * Mock NexHealth client backed by local seed data.
 * Implements the same public interface as NexHealthClient so it can be
 * used as a drop-in replacement for development/testing.
 */

import type {
  NexHealthResponse,
  NexHealthInstitution,
  NexHealthLocation,
  NexHealthProvider,
  NexHealthPatient,
  NexHealthAppointmentType,
  NexHealthSlotGroup,
  NexHealthAppointment,
} from "./types.js";

import {
  SEED_INSTITUTIONS,
  SEED_LOCATIONS,
  SEED_PROVIDERS,
  SEED_APPOINTMENT_TYPES,
  SEED_PATIENTS,
  generateMockSlots,
} from "./seed-data.js";

function ok<T>(data: T, count?: number): NexHealthResponse<T> {
  return { code: true, data, description: "", error: "", count };
}

let nextPatientId = 600000;
let nextAppointmentId = 900000;

export class MockNexHealthClient {
  // --- Institutions ---
  async getInstitutions(): Promise<NexHealthResponse<NexHealthInstitution[]>> {
    return ok(SEED_INSTITUTIONS, SEED_INSTITUTIONS.length);
  }

  // --- Locations ---
  async getLocations(subdomain: string): Promise<NexHealthResponse<NexHealthLocation[]>> {
    const locations = SEED_LOCATIONS[subdomain] ?? [];
    return ok(locations, locations.length);
  }

  // --- Providers ---
  async getProviders(
    _subdomain: string,
    params: {
      location_id: number;
      page?: number;
      per_page?: number;
      requestable?: boolean;
      inactive?: boolean;
    },
  ): Promise<NexHealthResponse<{ providers: NexHealthProvider[] }>> {
    const all = SEED_PROVIDERS[params.location_id] ?? [];
    const page = params.page ?? 1;
    const perPage = params.per_page ?? 25;
    const start = (page - 1) * perPage;
    const providers = all.slice(start, start + perPage);
    return ok({ providers }, all.length);
  }

  async getProvider(
    _subdomain: string,
    id: number,
  ): Promise<NexHealthResponse<{ provider: NexHealthProvider }>> {
    for (const providers of Object.values(SEED_PROVIDERS)) {
      const found = providers.find((p) => p.id === id);
      if (found) return ok({ provider: found });
    }
    return ok({ provider: { id, first_name: "Unknown", last_name: "Provider", name: "Unknown Provider" } });
  }

  // --- Patients ---
  async getPatients(
    _subdomain: string,
    params: {
      location_id: number;
      name?: string;
      email?: string;
      phone_number?: string;
      date_of_birth?: string;
      page?: number;
      per_page?: number;
      new_patient?: boolean;
    },
  ): Promise<NexHealthResponse<{ patients: NexHealthPatient[] }>> {
    let patients = SEED_PATIENTS[params.location_id] ?? [];

    if (params.name) {
      const q = params.name.toLowerCase();
      patients = patients.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params.email) {
      patients = patients.filter((p) => p.email === params.email);
    }

    return ok({ patients }, patients.length);
  }

  async createPatient(
    _subdomain: string,
    location_id: number,
    patient: {
      first_name: string;
      last_name: string;
      email?: string;
      bio?: { phone_number?: string; date_of_birth?: string };
    },
  ): Promise<NexHealthResponse<{ patient: NexHealthPatient }>> {
    const id = nextPatientId++;
    const now = new Date().toISOString();
    const newPatient: NexHealthPatient = {
      id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email,
      bio: patient.bio,
      created_at: now,
      updated_at: now,
      new_patient: true,
    };

    // Store in seed data so subsequent lookups find them
    if (!SEED_PATIENTS[location_id]) {
      SEED_PATIENTS[location_id] = [];
    }
    SEED_PATIENTS[location_id].push(newPatient);

    return ok({ patient: newPatient });
  }

  // --- Appointment Types ---
  async getAppointmentTypes(
    _subdomain: string,
    params: { location_id: number; page?: number; per_page?: number },
  ): Promise<NexHealthResponse<{ appointment_types: NexHealthAppointmentType[] }>> {
    const types = SEED_APPOINTMENT_TYPES[params.location_id] ?? [];
    return ok({ appointment_types: types }, types.length);
  }

  // --- Appointment Slots ---
  async getAppointmentSlots(
    _subdomain: string,
    params: {
      start_date: string;
      days?: number;
      lids: number[];
      pids: number[];
      appointment_type_id?: number;
      slot_length?: number;
    },
  ): Promise<NexHealthResponse<NexHealthSlotGroup[]>> {
    const days = params.days ?? 7;
    const groups: NexHealthSlotGroup[] = [];

    for (const lid of params.lids) {
      for (const pid of params.pids) {
        const slots = generateMockSlots(pid, lid, params.start_date, days);
        if (slots.length > 0) {
          groups.push({
            lid,
            pid,
            operatory_id: slots[0].operatory_id,
            slots: slots.map((s) => ({
              time: s.time,
              operatory_id: s.operatory_id,
              provider_id: s.provider_id,
            })),
          });
        }
      }
    }

    return ok(groups, groups.length);
  }

  // --- Appointments ---
  async createAppointment(
    _subdomain: string,
    location_id: number,
    appt: {
      patient_id: number;
      provider_id: number;
      operatory_id: number;
      start_time: string;
      appointment_type_id?: number;
    },
    _notify_patient?: boolean,
  ): Promise<NexHealthResponse<{ appointment: NexHealthAppointment }>> {
    const id = nextAppointmentId++;
    const startTime = new Date(appt.start_time);
    const endTime = new Date(startTime.getTime() + 30 * 60_000);
    const now = new Date().toISOString();

    // Look up provider name
    let providerName = `Provider ${appt.provider_id}`;
    for (const providers of Object.values(SEED_PROVIDERS)) {
      const found = providers.find((p) => p.id === appt.provider_id);
      if (found) {
        providerName = found.name;
        break;
      }
    }

    const appointment: NexHealthAppointment = {
      id,
      patient_id: appt.patient_id,
      provider_id: appt.provider_id,
      provider_name: providerName,
      operatory_id: appt.operatory_id,
      location_id,
      appointment_type_id: appt.appointment_type_id,
      start_time: appt.start_time,
      end_time: endTime.toISOString(),
      confirmed: true,
      cancelled: false,
      created_at: now,
      updated_at: now,
    };

    return ok({ appointment });
  }
}
