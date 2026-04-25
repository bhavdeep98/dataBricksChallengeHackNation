import type {
  NexHealthClientConfig,
  NexHealthApiError,
  NexHealthResponse,
  AuthToken,
  NexHealthInstitution,
  NexHealthLocation,
  NexHealthProvider,
  NexHealthPatient,
  NexHealthAppointmentType,
  NexHealthSlotGroup,
  NexHealthAppointment,
} from "./types.js";

export class NexHealthClient {
  private config: NexHealthClientConfig;
  private bearerToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: NexHealthClientConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    if (this.bearerToken && Date.now() < this.tokenExpiresAt - 60_000) {
      return this.bearerToken;
    }

    const url = new URL("/authenticates", this.config.baseUrl);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: this.config.apiKey,
        Accept: "application/vnd.Nexhealth+json;version=2",
      },
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 10_000),
    });

    if (!response.ok) {
      throw {
        status: response.status,
        code: "AUTH_FAILED",
        message: "Failed to authenticate with NexHealth API",
      } as NexHealthApiError;
    }

    const body = (await response.json()) as NexHealthResponse<AuthToken>;
    this.bearerToken = body.data.token;
    this.tokenExpiresAt = Date.now() + 3_600_000;
    return this.bearerToken;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    queryParams?: Record<string, unknown>,
    body?: Record<string, unknown>,
  ): Promise<NexHealthResponse<T>> {
    const token = await this.authenticate();
    const url = new URL(path, this.config.baseUrl);

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) {
            url.searchParams.append(`${key}[]`, String(item));
          }
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.Nexhealth+json;version=2",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 10_000),
    };

    if ((method === "POST" || method === "PATCH") && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        code: errorBody.code ?? "API_ERROR",
        message: errorBody.error?.[0] ?? errorBody.description?.[0] ?? response.statusText,
        details: errorBody,
      } as NexHealthApiError;
    }

    return response.json() as Promise<NexHealthResponse<T>>;
  }

  // --- Institutions ---
  async getInstitutions(): Promise<NexHealthResponse<NexHealthInstitution[]>> {
    return this.request("GET", "/institutions");
  }

  // --- Locations ---
  async getLocations(subdomain: string): Promise<NexHealthResponse<NexHealthLocation[]>> {
    return this.request("GET", "/locations", { subdomain });
  }

  // --- Providers ---
  async getProviders(subdomain: string, params: {
    location_id: number;
    page?: number;
    per_page?: number;
    requestable?: boolean;
    inactive?: boolean;
  }): Promise<NexHealthResponse<{ providers: NexHealthProvider[] }>> {
    return this.request("GET", "/providers", {
      subdomain,
      location_id: params.location_id,
      page: params.page ?? 1,
      per_page: params.per_page ?? 25,
      requestable: params.requestable,
      inactive: params.inactive ?? false,
    });
  }

  async getProvider(subdomain: string, id: number): Promise<NexHealthResponse<{ provider: NexHealthProvider }>> {
    return this.request("GET", `/providers/${id}`, { subdomain });
  }

  // --- Patients ---
  async getPatients(subdomain: string, params: {
    location_id: number;
    name?: string;
    email?: string;
    phone_number?: string;
    date_of_birth?: string;
    page?: number;
    per_page?: number;
    new_patient?: boolean;
  }): Promise<NexHealthResponse<{ patients: NexHealthPatient[] }>> {
    return this.request("GET", "/patients", {
      subdomain,
      location_id: params.location_id,
      name: params.name,
      email: params.email,
      phone_number: params.phone_number,
      date_of_birth: params.date_of_birth,
      page: params.page ?? 1,
      per_page: params.per_page ?? 25,
      new_patient: params.new_patient,
    });
  }

  async createPatient(subdomain: string, location_id: number, patient: {
    first_name: string;
    last_name: string;
    email?: string;
    bio?: { phone_number?: string; date_of_birth?: string };
  }): Promise<NexHealthResponse<{ patient: NexHealthPatient }>> {
    return this.request("POST", "/patients", {
      subdomain,
      location_id,
    }, { patient });
  }

  // --- Appointment Types ---
  async getAppointmentTypes(subdomain: string, params: {
    location_id: number;
    page?: number;
    per_page?: number;
  }): Promise<NexHealthResponse<{ appointment_types: NexHealthAppointmentType[] }>> {
    return this.request("GET", "/appointment_types", {
      subdomain,
      location_id: params.location_id,
      page: params.page ?? 1,
      per_page: params.per_page ?? 50,
    });
  }

  // --- Appointment Slots ---
  async getAppointmentSlots(subdomain: string, params: {
    start_date: string;
    days?: number;
    lids: number[];
    pids: number[];
    appointment_type_id?: number;
    slot_length?: number;
  }): Promise<NexHealthResponse<NexHealthSlotGroup[]>> {
    return this.request("GET", "/appointment_slots", {
      subdomain,
      start_date: params.start_date,
      days: params.days ?? 7,
      lids: params.lids,
      pids: params.pids,
      appointment_type_id: params.appointment_type_id,
      slot_length: params.slot_length,
    });
  }

  // --- Appointments ---
  async createAppointment(subdomain: string, location_id: number, appt: {
    patient_id: number;
    provider_id: number;
    operatory_id: number;
    start_time: string;
    appointment_type_id?: number;
  }, notify_patient?: boolean): Promise<NexHealthResponse<{ appointment: NexHealthAppointment }>> {
    return this.request("POST", "/appointments", {
      subdomain,
      location_id,
      notify_patient: notify_patient ?? false,
    }, { appt });
  }
}

export function createNexHealthClient(): NexHealthClient | null {
  const apiKey = process.env.NEXHEALTH_API_KEY;

  if (!apiKey) {
    console.warn("NEXHEALTH_API_KEY not set — NexHealth tools will be unavailable");
    return null;
  }

  return new NexHealthClient({
    baseUrl: "https://nexhealth.info",
    apiKey,
    timeoutMs: 10_000,
  });
}
