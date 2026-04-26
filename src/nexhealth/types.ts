// --- NexHealth API Response Wrapper ---
export interface NexHealthResponse<T> {
  code: boolean;
  data: T;
  description: string | string[];
  error: string | string[];
  count?: number;
}

// --- Authentication ---
export interface AuthToken {
  token: string;
}

// --- Institution ---
export interface NexHealthInstitution {
  id: number;
  name: string;
  subdomain: string;
  is_test?: boolean;
}

// --- Location ---
export interface NexHealthLocation {
  id: number;
  name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  time_zone?: string;
  inactive?: boolean;
}

// --- Provider ---
export interface NexHealthProvider {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  display_name?: string;
  meta_type?: string;
  inactive?: boolean;
  foreign_id?: string;
  profile_url?: string;
  /** Provider rating (1–5 scale) */
  rating?: number;
  /** Number of reviews */
  reviews_count?: number;
  /** Phone number for the provider's office */
  phone_number?: string;
  /** List of accepted insurance providers */
  insurance_accepted?: string[];
  /** Distance from patient in miles */
  distance_mi?: number;
  /** Summary of review highlights and concerns */
  review_summary?: string;
  /** Known facility limitations from reviews (e.g. "no x-ray machine") */
  known_limitations?: string[];
}

// --- Patient ---
export interface NexHealthPatient {
  id: number;
  email?: string | null;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  name: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
  foreign_id?: string;
  inactive?: boolean;
  bio?: {
    phone_number?: string;
    date_of_birth?: string;
  };
  new_patient?: boolean;
}

// --- Appointment Type ---
export interface NexHealthAppointmentType {
  id: number;
  name: string;
  minutes?: number;
  parent_type?: string;
  parent_id?: number;
}

// --- Operatory ---
export interface NexHealthOperatory {
  id: number;
  name: string;
  location_id?: number;
  inactive?: boolean;
}

// --- Appointment Slot ---
export interface NexHealthSlot {
  time: string; // ISO datetime
  operatory_id: number;
  provider_id?: number;
}

export interface NexHealthSlotGroup {
  lid: number;
  pid: number;
  operatory_id: number;
  slots: NexHealthSlot[];
}

// --- Appointment ---
export interface NexHealthAppointment {
  id: number;
  patient_id?: number;
  provider_id?: number;
  provider_name?: string;
  operatory_id?: number;
  location_id?: number;
  appointment_type_id?: number;
  start_time: string;
  end_time?: string;
  confirmed?: boolean;
  cancelled?: boolean;
  created_at?: string;
  updated_at?: string;
}

// --- Error ---
export interface NexHealthApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// --- Client Config ---
export interface NexHealthClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}
