/**
 * Smart provider discovery + sequential calling.
 *
 * Flow:
 * 1. Find all institutions → locations → providers
 * 2. Filter by specialty match + insurance coverage
 * 3. Rank by: specialty match > insurance > rating > distance
 * 4. Return top candidates for the widget
 * 5. Call them one by one until one confirms
 */

import type {
  NexHealthInstitution,
  NexHealthLocation,
  NexHealthProvider,
} from "../nexhealth/types.js";
import type { VoiceConfig, CallResult } from "./types.js";
import { initiateOutboundCall } from "./outbound-call.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RankedProvider {
  provider: NexHealthProvider;
  institution: NexHealthInstitution;
  location: NexHealthLocation;
  score: number;
  insuranceMatch: boolean;
  specialtyMatch: boolean;
  disqualified: boolean;
  disqualifyReason?: string;
}

// ── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Score a provider for ranking. Higher = better.
 *
 * Weights:
 * - Specialty match:  +50
 * - Insurance match:  +30
 * - Rating (0–5):     +rating * 5 (max 25)
 * - Distance penalty: -distance * 1 (closer = better)
 * - Reviews bonus:    +min(reviews/50, 5)
 */
export function scoreProvider(
  provider: NexHealthProvider,
  targetSpecialty: string,
  patientInsurance: string,
  avoidProviderTypes?: string[],
): { score: number; specialtyMatch: boolean; insuranceMatch: boolean; disqualified: boolean; disqualifyReason?: string } {
  let score = 0;
  let disqualified = false;
  let disqualifyReason: string | undefined;

  // Check known limitations against avoidProviderTypes from LLM triage
  if (avoidProviderTypes && provider.known_limitations) {
    for (const avoid of avoidProviderTypes) {
      const normAvoid = avoid.toLowerCase();
      for (const limitation of provider.known_limitations) {
        if (limitation.toLowerCase().includes(normAvoid) || normAvoid.includes(limitation.toLowerCase())) {
          disqualified = true;
          disqualifyReason = limitation;
          score -= 100;
          break;
        }
      }
      if (disqualified) break;
    }
  }

  // Also disqualify if provider has critical limitations for the specialty
  if (provider.known_limitations && provider.known_limitations.length > 0) {
    const criticalLimitations = ["no x-ray", "no orthopedic", "refers fractures", "nurse practitioners only", "pediatric only"];
    for (const limitation of provider.known_limitations) {
      const normLim = limitation.toLowerCase();
      if (criticalLimitations.some((c) => normLim.includes(c))) {
        score -= 30;
        if (!disqualified) {
          disqualifyReason = limitation;
        }
      }
    }
  }

  // Specialty match
  const normSpec = targetSpecialty.toLowerCase();
  const providerType = (provider.meta_type ?? "").toLowerCase();
  const specialtyMatch =
    providerType.includes(normSpec) ||
    normSpec.includes(providerType) ||
    (normSpec === "orthopedics" && providerType.includes("orthopedic"));
  if (specialtyMatch) score += 50;

  // Insurance match
  const normIns = patientInsurance.toLowerCase();
  const insuranceMatch = (provider.insurance_accepted ?? []).some(
    (ins) => ins.toLowerCase().includes(normIns) || normIns.includes(ins.toLowerCase()),
  );
  if (insuranceMatch) score += 30;

  // Rating
  if (provider.rating) score += provider.rating * 5;

  // Distance (penalty)
  if (provider.distance_mi) score -= provider.distance_mi;

  // Reviews bonus
  if (provider.reviews_count) score += Math.min(provider.reviews_count / 50, 5);

  return { score, specialtyMatch, insuranceMatch, disqualified, disqualifyReason };
}

/**
 * Find and rank providers across all institutions/locations.
 */
export function rankProviders(
  institutions: NexHealthInstitution[],
  locations: Record<string, NexHealthLocation[]>,
  providers: Record<number, NexHealthProvider[]>,
  targetSpecialty: string,
  patientInsurance: string,
  avoidProviderTypes?: string[],
): RankedProvider[] {
  const ranked: RankedProvider[] = [];

  for (const inst of institutions) {
    const locs = locations[inst.subdomain] ?? [];
    for (const loc of locs) {
      const provs = providers[loc.id] ?? [];
      for (const prov of provs) {
        if (prov.inactive) continue;
        const { score, specialtyMatch, insuranceMatch, disqualified, disqualifyReason } = scoreProvider(
          prov,
          targetSpecialty,
          patientInsurance,
          avoidProviderTypes,
        );
        ranked.push({
          provider: prov,
          institution: inst,
          location: loc,
          score,
          insuranceMatch,
          specialtyMatch,
          disqualified,
          disqualifyReason,
        });
      }
    }
  }

  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

// ── Call prompt ───────────────────────────────────────────────────────────────

// Agent prompt is now in agent-prompt.ts with full patient details

import { buildAgentSystemPrompt, buildAgentFirstMessage } from "./agent-prompt.js";
import type { AgentPromptParams } from "./agent-prompt.js";

// ── Outbound call ────────────────────────────────────────────────────────────

/**
 * Place a call to a specific provider's office.
 */
export async function callProviderOffice(
  voiceConfig: VoiceConfig,
  candidate: RankedProvider,
  patientName: string,
  patientPhone: string,
  patientDOB: string,
  insuranceProvider: string,
  insurancePlanName: string,
  insuranceMemberId: string,
  insuranceGroupNumber: string,
  description: string,
  urgency: string,
  specialty: string,
  slotTime?: string,
): Promise<CallResult> {
  const phoneNumber =
    candidate.provider.phone_number ?? candidate.location.phone_number;

  if (!phoneNumber) {
    return { success: false, error: "No phone number available" };
  }

  // Format phone number
  let toNumber = phoneNumber.replace(/\D/g, "");
  if (toNumber.length === 10) {
    toNumber = `+1${toNumber}`;
  } else if (!toNumber.startsWith("+")) {
    toNumber = `+${toNumber}`;
  }

  const promptParams: AgentPromptParams = {
    patientName,
    patientPhone,
    patientDOB,
    insuranceProvider,
    insurancePlanName,
    insuranceMemberId,
    insuranceGroupNumber,
    providerName: candidate.provider.name,
    locationName: candidate.location.name,
    locationAddress: `${candidate.location.address ?? ""}, ${candidate.location.city ?? ""}, ${candidate.location.state ?? ""}`,
    locationPhone: phoneNumber,
    specialty,
    symptoms: description,
    urgency,
    slotTime,
    slotTimeFormatted: slotTime
      ? new Date(slotTime).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
      : undefined,
  };

  const agentPrompt = buildAgentSystemPrompt(promptParams);
  const firstMessage = buildAgentFirstMessage(promptParams);

  return initiateOutboundCall(voiceConfig, {
    toNumber,
    fromNumber: voiceConfig.twilioPhoneNumber,
    agentPrompt,
    firstMessage,
    webhookBaseUrl: voiceConfig.webhookBaseUrl,
  });
}
