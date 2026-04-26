/**
 * LLM-powered triage using OpenAI.
 *
 * Enhances the keyword-based triage with:
 * - Accurate specialty recommendation (not just keyword matching)
 * - Tone & emotion profiling (panic, calm, distressed, etc.)
 * - Urgency assessment based on clinical reasoning
 * - Contextual understanding ("I think I broke my arm" → orthopedics, urgent)
 */

import type { TriageResult, UrgencyLevel, SpecialtyRecommendation } from "./types.js";
import { triage as keywordTriage } from "./triage.js";

interface LLMTriageResponse {
  urgency: UrgencyLevel;
  specialties: { name: string; confidence: number; reasoning: string }[];
  emotion: {
    tone: "panicked" | "distressed" | "calm" | "frustrated" | "confused" | "neutral";
    painLevel: "none" | "mild" | "moderate" | "severe" | "extreme";
    assessment: string;
  };
  clinicalNotes: string;
  avoidProviderTypes: string[];
}

/**
 * Call OpenAI to do intelligent triage with emotion profiling.
 * Falls back to keyword-based triage if OpenAI is unavailable.
 */
export async function llmTriage(
  description: string,
  apiKey: string | undefined,
): Promise<TriageResult & { emotion?: LLMTriageResponse["emotion"]; clinicalNotes?: string; avoidProviderTypes?: string[] }> {
  // Fall back to keyword triage if no API key
  if (!apiKey) {
    return keywordTriage(description);
  }

  const makeRequest = async (): Promise<Response> => {
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a medical triage assistant. Analyze the patient's description and return a JSON object with:

{
  "urgency": "emergency" | "urgent" | "soon" | "routine",
  "specialties": [{ "name": string, "confidence": 0-1, "reasoning": string }],
  "emotion": {
    "tone": "panicked" | "distressed" | "calm" | "frustrated" | "confused" | "neutral",
    "painLevel": "none" | "mild" | "moderate" | "severe" | "extreme",
    "assessment": "brief description of patient's emotional state"
  },
  "clinicalNotes": "brief clinical reasoning for the urgency and specialty",
  "avoidProviderTypes": ["list of provider types to avoid, e.g. 'urgent care without x-ray', 'nurse-only clinics'"]
}

URGENCY CLASSIFICATION (be precise — do NOT over-classify):
- "emergency" = ONLY for immediately life-threatening conditions: chest pain, can't breathe, uncontrolled bleeding, unconscious, stroke symptoms, heart attack, choking, anaphylaxis, overdose, suicidal ideation. These need 911.
- "urgent" = Needs same-day or next-day care: broken bones, fractures, dislocations, deep cuts, high fever, severe pain, acute infections, sprains with severe swelling. These need an urgent specialist visit, NOT 911.
- "soon" = Within a week: moderate pain, persistent symptoms, non-acute conditions
- "routine" = Within 2 weeks: checkups, mild symptoms, follow-ups

CRITICAL: A broken bone, fracture, or dislocation is URGENT, NOT emergency. The patient needs an orthopedic specialist urgently, not an ambulance. Only classify as "emergency" if there are signs of life-threatening complications (e.g. bone piercing skin with heavy bleeding, loss of circulation to limb, compound fracture with exposed bone).

OTHER RULES:
- For broken bones, fractures, dislocations → orthopedics, urgency=urgent
- For "swollen", "paining a lot", "hurts like hell" → urgent
- Tone analysis: "hurts like hell" = distressed/severe, "I think I might have" = calm/mild
- avoidProviderTypes: list facility types that would NOT be appropriate
- Return 1-3 specialties ranked by confidence
- Be specific: "orthopedics" not "general practice" for bone injuries`,
          },
          {
            role: "user",
            content: description,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });
  };

  try {
    // Try up to 2 times with a delay on rate limit
    let response = await makeRequest();

    if (response.status === 429) {
      console.warn("OpenAI rate limited, waiting 15s and retrying...");
      await new Promise((r) => setTimeout(r, 15_000));
      response = await makeRequest();
    }

    if (!response.ok) {
      console.warn(`OpenAI triage failed (${response.status}), falling back to keyword triage`);
      return keywordTriage(description);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const parsed: LLMTriageResponse = JSON.parse(data.choices[0].message.content);

    // Build the result
    const specialties: SpecialtyRecommendation[] = parsed.specialties.map((s) => ({
      name: s.name,
      confidence: s.confidence,
    }));

    return {
      urgency: parsed.urgency,
      specialties,
      appointment_types: [],
      emotion: parsed.emotion,
      clinicalNotes: parsed.clinicalNotes,
      avoidProviderTypes: parsed.avoidProviderTypes,
    };
  } catch (error) {
    console.warn("LLM triage failed, falling back to keyword triage:", error);
    return keywordTriage(description);
  }
}
