export type UrgencyLevel = "emergency" | "urgent" | "soon" | "routine";

export interface SpecialtyRecommendation {
  name: string;
  confidence: number; // 0–1 inclusive
}

export interface AppointmentTypeMatch {
  id: number;
  name: string;
}

export interface TriageResult {
  specialties: SpecialtyRecommendation[]; // 1–5 elements, sorted by confidence desc
  appointment_types: AppointmentTypeMatch[]; // empty if unavailable
  urgency: UrgencyLevel;
  warnings?: string[];
}

export interface TriageError {
  code: "VALIDATION_ERROR" | "API_ERROR" | "UNKNOWN_ERROR";
  message: string;
}
