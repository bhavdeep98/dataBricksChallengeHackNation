import type { UrgencyLevel } from "./types.js";

export const EMERGENCY_KEYWORDS: string[] = [
  "chest pain",
  "difficulty breathing",
  "can't breathe",
  "uncontrolled bleeding",
  "severe trauma",
  "unconscious",
  "stroke",
  "heart attack",
  "seizure now",
  "choking",
  "anaphylaxis",
  "overdose",
  "suicidal",
];

export const URGENT_KEYWORDS: string[] = [
  "acute pain",
  "high fever",
  "severe pain",
  "recent injury",
  "broken",
  "broke",
  "deep cut",
  "infection",
  "swelling",
  "swollen",
  "can't walk",
  "vomiting blood",
  "paining a lot",
  "hurts like hell",
  "fell",
  "fall",
  "dislocation",
];

/**
 * Classify urgency of a patient's described need.
 * Operates on already-normalized text (caller is responsible for normalization).
 * Emergency keywords take priority over all other classifications.
 */
export function classifyUrgency(normalizedText: string): UrgencyLevel {
  // Emergency takes highest priority
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return "emergency";
    }
  }

  // Urgent is next priority
  for (const keyword of URGENT_KEYWORDS) {
    if (normalizedText.includes(keyword)) {
      return "urgent";
    }
  }

  // Default to routine for anything else
  return "routine";
}
