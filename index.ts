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
import { triageNeedSchema } from "./src/triage/schemas.js";
import { triage } from "./src/triage/triage.js";
import { llmTriage } from "./src/triage/llm-triage.js";
import { formatSafeErrorMessage } from "./src/triage/error-handler.js";
import { findAndCallSchema, checkCallSchema } from "./src/voice/schemas.js";
import {
  rankProviders,
  callProviderOffice,
} from "./src/voice/auto-book.js";
import type { RankedProvider } from "./src/voice/auto-book.js";
import type { VoiceConfig } from "./src/voice/types.js";
import { CURRENT_PATIENT } from "./src/patient/profile.js";
import { getCallStatus } from "./src/voice/call-tracker.js";
import { getLatestSummary } from "./src/voice/call-summary-store.js";

const nexhealth = createNexHealthClient();

const NEXHEALTH_UNAVAILABLE_MSG = "NexHealth is not configured. Set the NEXHEALTH_API_KEY environment variable to enable NexHealth tools.";

// --- Voice Config (Twilio + ElevenLabs) ---
const voiceConfig: VoiceConfig | null =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER &&
  process.env.ELEVENLABS_API_KEY &&
  process.env.ELEVENLABS_AGENT_ID
    ? {
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
        twilioApiKeySid: process.env.TWILIO_API_KEY_SID,
        twilioApiKeySecret: process.env.TWILIO_API_KEY_SECRET,
        twilioTwimlAppSid: process.env.TWILIO_TWIML_APP_SID,
        elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
        elevenLabsAgentId: process.env.ELEVENLABS_AGENT_ID,
        elevenLabsPhoneNumberId: process.env.ELEVENLABS_PHONE_NUMBER_ID || undefined,
        elevenLabsWebhookSecret: process.env.ELEVENLABS_WEBHOOK_SECRET || undefined,
        webhookBaseUrl: process.env.VOICE_WEBHOOK_BASE_URL ?? "http://localhost:3000",
      }
    : null;

/** Map urgency level to a human-readable timeframe for the AI agent. */
function urgencyToTimeframe(urgency: string): string {
  switch (urgency.toLowerCase()) {
    case "urgent": return "today or tomorrow";
    case "soon": return "within the next 7 days";
    case "routine": return "within the next 2 weeks";
    default: return "as soon as possible";
  }
}

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
  instructions: `You are a medical scheduling assistant. Your job is to make life easier for patients in pain or distress. The patient's personal information (name, insurance, phone) is already known — do NOT ask for it.

CRITICAL RULE: When a patient describes symptoms or health concerns, your FIRST tool call MUST be \`nh-triage-need\`. Do NOT call any other tool before it.

SAFETY DISCLAIMER: You provide scheduling assistance only. You are not a doctor and do not offer medical advice, diagnoses, or treatment plans.

## Step 1 — Triage (always first)

1. Call \`nh-triage-need\` with the patient's symptom description.
2. If the description is ambiguous, ask at most 2 clarifying questions, then triage.

AFTER receiving the triage result, you MUST respond to the patient BEFORE calling any other tool. Your response should:
- Acknowledge their pain empathetically in YOUR OWN WORDS. Do NOT repeat their exact description back. Paraphrase naturally.
- Explain what you think is going on: "It sounds like you may have fractured your elbow. You need an orthopedic specialist right away."
- Share the urgency and what it means: "This is urgent — we need to get you seen today."
- If emotional distress was detected, acknowledge it: "I can tell you're in a lot of pain. Let me take care of this."
- Call out what to avoid: "I'll skip any place without X-ray equipment on-site."
- Tell them what you're about to do: "I'm going to find the best orthopedic specialists near you that accept your insurance, check their availability, and start calling to book you in."
- Ask permission: "Should I go ahead?"
- Do NOT end with "How can I help?" — you already know what to do. Be decisive and action-oriented.

Then wait for the patient to confirm before calling \`nh-find-and-call\`.

## Step 2 — Emergency check

If urgency is "emergency" or life-threatening conditions are described:
- Say: "Please call 911 or go to the nearest emergency room immediately."
- STOP. Do NOT proceed with booking.

## Step 3 — Find providers and call

After your triage response to the patient, call \`nh-find-and-call\` with the triage results. This tool:
1. Finds ALL providers across all institutions matching the specialty
2. Filters out providers that don't accept the patient's insurance
3. Ranks them by: specialty match → insurance coverage → rating → distance
4. Shows the top candidates in a widget with ratings, distance, and insurance status
5. Calls the top-ranked provider's office via AI voice agent
6. If the first call doesn't work, moves to the next provider

After receiving the results, explain to the patient:
- Which providers were found and why they're ranked that way
- Which ones were eliminated and why (bad reviews, no equipment, wrong insurance)
- What digital availability was found (specific slot times)
- That a call is being placed and what the assistant will verify: address, specialist availability, imaging, insurance, and the specific slot
- What to expect next

After presenting the call results, ALWAYS follow up with the patient:
- Tell them the call has been placed and what the assistant is verifying.
- Give them the clickable address link so they can start navigating.
- Then call \`nh-check-call\` with the Call SID to check if the call has ended.
- If the call is still in progress, wait a moment and check again.
- Once the call ends, tell the patient the result:
  - If completed successfully (>15s): "The call went through. My assistant spoke with the office. You should be all set — head over to [address]."
  - If completed but short (<15s): "The call was very short — they may not have been able to help. Want me to try the next provider?"
  - If failed/busy/no-answer: "Couldn't get through to them. Let me try the next one on the list."
- If the patient says the call didn't go well or they need another option, call \`nh-find-and-call\` again or suggest the next provider from the list.

## Step 4 — Fallback (only if find-and-call fails entirely)

If \`nh-find-and-call\` fails, fall back to manual flow:
1. Use \`nh-get-available-slots\` with urgency-based day window (urgent=1, soon=7, routine=14).
2. Present slots using the \`availability-calendar\` widget.
3. Handle patient lookup/creation and book via \`nh-book-appointment\`.

## Key principles

- ENGAGE the patient. Don't just silently call tools — explain what you're doing and why.
- Acknowledge their pain. Be human about it.
- The patient's name, insurance, and phone are already known — use them automatically.
- Always explain WHY you're recommending a specific provider (specialty match, rating, insurance, distance).
- Call out problems: "I'm skipping Metro Urgent Care — reviews say they don't have X-ray equipment and only have nurse practitioners on weekends."
- Tell the patient what's happening at each step: "I'm calling Dr. Hamilton's office now. My AI assistant Alex will verify they have imaging on-site and book you in."

## Prohibited Actions

- Do NOT provide medical diagnoses or treatment recommendations.
- Do NOT override emergency classification.
- Do NOT expose raw API errors, status codes, or stack traces.
- Do NOT ask for the patient's name, insurance, or phone — you already have it.`,
});

// --- Triage Tool ---

server.tool(
  {
    name: "nh-triage-need",
    description:
      "REQUIRED FIRST STEP: When a patient describes ANY symptoms or health concerns, you MUST call this tool BEFORE any other tool. Analyzes symptoms to determine urgency (emergency/urgent/soon/routine), recommends specialties, and matches appointment types. Do NOT call nh-list-institutions, nh-list-providers, or nh-get-available-slots until you have called this tool first.",
    schema: triageNeedSchema,
  },
  async (params) => {
    const parsed = triageNeedSchema.safeParse(params);
    if (!parsed.success) {
      return text(`Validation error: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    }

    const { description, subdomain } = parsed.data;

    let appointmentTypes: { id: number; name: string; minutes?: number }[] | undefined;

    if (subdomain && nexhealth) {
      try {
        const response = await nexhealth.getAppointmentTypes(subdomain, {
          location_id: 0,
          per_page: 50,
        });
        appointmentTypes = response.data?.appointment_types ?? [];
      } catch (error) {
        // NexHealth API failed — fall back to specialty-only results with warning
        const result = await llmTriage(description, process.env.OPENAI_API_KEY);
        (result as any).warnings = (result as any).warnings ?? [];
        (result as any).warnings.push(
          "Live appointment type matching was unavailable. " +
            formatSafeErrorMessage(error),
        );
        return text(formatTriageResult(result));
      }
    }

    // Use LLM-powered triage with emotion profiling
    const result = await llmTriage(description, process.env.OPENAI_API_KEY);

    // If we have appointment types from NexHealth, try to match them
    if (appointmentTypes && appointmentTypes.length > 0) {
      const { matchAppointmentTypes } = await import("./src/triage/appointment-matcher.js");
      result.appointment_types = matchAppointmentTypes(
        result.specialties.map((s) => s.name),
        appointmentTypes,
      );
    }

    return text(formatTriageResult(result));
  },
);

function formatTriageResult(result: import("./src/triage/types.js").TriageResult & { emotion?: any; clinicalNotes?: string; avoidProviderTypes?: string[] }): string {
  const lines: string[] = [];

  lines.push(`Urgency: ${result.urgency.toUpperCase()}`);

  if (result.urgency === "emergency") {
    lines.push(
      "⚠️ This sounds like an emergency. Please call 911 or go to the nearest emergency room immediately.",
    );
  }

  // Emotion profiling
  if (result.emotion) {
    lines.push("");
    lines.push(`Patient tone: ${result.emotion.tone} | Pain level: ${result.emotion.painLevel}`);
    if (result.emotion.assessment) {
      lines.push(`Assessment: ${result.emotion.assessment}`);
    }
  }

  lines.push("");
  lines.push("Recommended specialties:");
  for (const s of result.specialties) {
    lines.push(`  • ${s.name} (confidence: ${(s.confidence * 100).toFixed(0)}%)`);
  }

  if (result.clinicalNotes) {
    lines.push("");
    lines.push(`Clinical reasoning: ${result.clinicalNotes}`);
  }

  if (result.avoidProviderTypes && result.avoidProviderTypes.length > 0) {
    lines.push("");
    lines.push("⚠️ Avoid these provider types:");
    for (const t of result.avoidProviderTypes) {
      lines.push(`  • ${t}`);
    }
  }

  if (result.appointment_types.length > 0) {
    lines.push("");
    lines.push("Matching appointment types:");
    for (const t of result.appointment_types) {
      lines.push(`  • ${t.name} (ID: ${t.id})`);
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    lines.push("");
    for (const w of result.warnings) {
      lines.push(`⚠️ ${w}`);
    }
  }

  // Instruct the LLM to respond to the patient and ask permission
  lines.push("");
  lines.push("---");
  lines.push("ACTION REQUIRED: Respond to the patient — acknowledge their pain, explain your assessment, tell them what you plan to do (find the best specialists nearby, check insurance, and call on their behalf). Then ASK for their permission: 'Should I go ahead and find the best orthopedic specialists near you and start calling?' Wait for the patient to confirm before calling nh-find-and-call.");

  return lines.join("\n");
}

// --- Find & Call Tool (Smart Provider Discovery + Sequential Calling) ---

server.tool(
  {
    name: "nh-find-and-call",
    description:
      "Finds the best providers matching the triage specialty, ranks them by specialty/insurance/rating/distance, displays them in a widget, and calls the top-ranked office via AI voice agent. Falls through to the next provider if the first call fails. Call AFTER nh-triage-need.",
    schema: findAndCallSchema,
    widget: {
      name: "provider-search-result-zocdoc",
      invoking: "Finding the best providers near you...",
      invoked: "Providers found",
    },
  },
  async (params) => {
    if (!nexhealth) return text(NEXHEALTH_UNAVAILABLE_MSG);

    const parsed = findAndCallSchema.safeParse(params);
    if (!parsed.success) {
      return text(`Validation error: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    }

    const { description, urgency, specialty, avoid_provider_types } = parsed.data;
    const patient = CURRENT_PATIENT;

    // ── Step 1: Gather all institutions + locations + providers ───────
    let institutions;
    try {
      const resp = await nexhealth.getInstitutions();
      institutions = Array.isArray(resp.data) ? resp.data : [];
    } catch {
      return text("Could not retrieve institutions. Please try the manual booking flow.");
    }

    const allLocations: Record<string, import("./src/nexhealth/types.js").NexHealthLocation[]> = {};
    const allProviders: Record<number, import("./src/nexhealth/types.js").NexHealthProvider[]> = {};

    for (const inst of institutions) {
      try {
        const locResp = await nexhealth.getLocations(inst.subdomain);
        const locs = Array.isArray(locResp.data) ? locResp.data : [];
        allLocations[inst.subdomain] = locs;

        for (const loc of locs) {
          try {
            const provResp = await nexhealth.getProviders(inst.subdomain, {
              location_id: loc.id,
              per_page: 50,
            });
            allProviders[loc.id] = provResp.data?.providers ?? [];
          } catch {
            allProviders[loc.id] = [];
          }
        }
      } catch {
        allLocations[inst.subdomain] = [];
      }
    }

    // ── Step 2: Rank providers ───────────────────────────────────────
    const ranked = rankProviders(
      institutions,
      allLocations,
      allProviders,
      specialty,
      patient.insurance.provider,
      avoid_provider_types,
    );

    if (ranked.length === 0) {
      return text("No providers found matching your needs. Please contact a practice directly.");
    }

    // Take top 5 candidates
    const topCandidates = ranked.slice(0, 5);

    // ── Step 3: Check digital availability for top candidates ────────
    const daysMap: Record<string, number> = { urgent: 2, soon: 7, routine: 14 };
    const days = daysMap[urgency] ?? 7;
    const today = new Date().toISOString().slice(0, 10);

    // Map: candidateIndex → earliest slot info
    const candidateSlots: Map<number, { slotTime: string; operatoryId: number }> = new Map();

    for (let i = 0; i < topCandidates.length; i++) {
      const c = topCandidates[i];
      try {
        const resp = await nexhealth.getAppointmentSlots(c.institution.subdomain, {
          start_date: today,
          days,
          lids: [c.location.id],
          pids: [c.provider.id],
        });
        const groups = Array.isArray(resp.data) ? resp.data : [];
        // Find earliest slot
        let earliest: { time: string; operatoryId: number } | null = null;
        for (const group of groups) {
          for (const slot of group.slots) {
            if (!earliest || new Date(slot.time) < new Date(earliest.time)) {
              earliest = { time: slot.time, operatoryId: slot.operatory_id };
            }
          }
        }
        if (earliest) {
          candidateSlots.set(i, { slotTime: earliest.time, operatoryId: earliest.operatoryId });
        }
      } catch {
        // Slot check failed — still include provider, call will verify
      }
    }

    // ── Step 4: Build widget data ────────────────────────────────────
    const widgetProviders = topCandidates.map((c, i) => {
      const slot = candidateSlots.get(i);
      const slotDate = slot ? new Date(slot.slotTime) : null;
      return {
        name: c.provider.name,
        specialty: c.provider.meta_type ?? undefined,
        provider_location_id: String(c.provider.id),
        rating: c.provider.rating,
        reviews_count: c.provider.reviews_count,
        distance_mi: c.provider.distance_mi,
        insurance_accepted: c.provider.insurance_accepted,
        phone_number: c.provider.phone_number ?? c.location.phone_number,
        location_name: c.location.name,
        address: c.location.address
          ? {
              line1: c.location.address,
              city: c.location.city ?? "",
              state: c.location.state ?? "",
              zip_code: c.location.zip_code ?? "",
            }
          : undefined,
        next_available_date: slotDate ? slotDate.toISOString() : undefined,
        call_status: (i === 0 ? "calling" : "pending") as "calling" | "pending" | "failed" | "confirmed" | "skipped",
        accepts_insurance: c.insuranceMatch,
      };
    });

    // ── Step 5: Build summary text ───────────────────────────────────
    const summaryLines: string[] = [];
    summaryLines.push(`Found ${topCandidates.length} ${specialty} providers ranked by best match:\n`);

    for (let i = 0; i < topCandidates.length; i++) {
      const c = topCandidates[i];
      const slot = candidateSlots.get(i);
      const stars = c.provider.rating ? `${c.provider.rating.toFixed(1)}★` : "N/A";
      const dist = c.provider.distance_mi ? `${c.provider.distance_mi.toFixed(1)} mi` : "N/A";
      const ins = c.insuranceMatch ? "✓ In-network" : "✗ Out-of-network";
      const spec = c.specialtyMatch ? "✓ Specialty match" : "General";
      const fullAddress = `${c.location.address ?? ""}, ${c.location.city ?? ""}, ${c.location.state ?? ""} ${c.location.zip_code ?? ""}`.trim();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

      summaryLines.push(
        `${i + 1}. ${c.provider.name} — ${c.provider.meta_type ?? "N/A"} at ${c.location.name}`,
      );
      summaryLines.push(`   ${stars} | ${dist} | ${ins} | ${spec}`);
      if (slot) {
        const slotDate = new Date(slot.slotTime);
        summaryLines.push(`   🕐 Earliest available slot: ${slotDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${slotDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
      } else {
        summaryLines.push(`   🕐 No digital slots found — will check by phone`);
      }
      summaryLines.push(`   📍 [${fullAddress}](${mapsUrl})`);
      if (!c.insuranceMatch) {
        summaryLines.push(`   ⚠️ Does not accept ${patient.insurance.provider}`);
      }
      if (c.disqualified && c.disqualifyReason) {
        summaryLines.push(`   🚫 Not recommended: ${c.disqualifyReason}`);
      } else if (c.provider.known_limitations && c.provider.known_limitations.length > 0) {
        summaryLines.push(`   ⚠️ Limitations: ${c.provider.known_limitations.join(", ")}`);
      }
      if (c.provider.review_summary) {
        summaryLines.push(`   📝 ${c.provider.review_summary}`);
      }
    }

    // ── Step 6: Call the top-ranked provider ─────────────────────────
    if (!voiceConfig) {
      summaryLines.push(
        `\n⚠️ Voice calling is not configured. Please call the top provider directly at ${topCandidates[0].provider.phone_number ?? topCandidates[0].location.phone_number}.`,
      );
      return widget({
        props: {
          providers: widgetProviders,
          query: `${specialty} providers for: ${description}`,
          totalCount: topCandidates.length,
          patientInsurance: patient.insurance.provider,
        },
        output: text(summaryLines.join("\n")),
      });
    }

    // Call candidates — fire and forget, don't block the UI
    let callPlaced = false;
    let placedCallSid = "";

    for (let ci = 0; ci < Math.min(topCandidates.length, 3); ci++) {
      const candidate = topCandidates[ci];
      const slot = candidateSlots.get(ci);

      widgetProviders[ci].call_status = "calling";

      const callResult = await callProviderOffice(
        voiceConfig,
        candidate,
        patient.fullName,
        patient.phone,
        patient.dateOfBirth,
        patient.insurance.provider,
        patient.insurance.planName,
        patient.insurance.memberId,
        patient.insurance.groupNumber,
        description,
        urgency,
        specialty,
        slot?.slotTime,
      );

      if (callResult.success) {
        const addr = `${candidate.location.address ?? ""}, ${candidate.location.city ?? ""}, ${candidate.location.state ?? ""} ${candidate.location.zip_code ?? ""}`.trim();
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

        summaryLines.push(`\n📞 Calling ${candidate.provider.name} at ${candidate.location.name} (Call SID: ${callResult.callSid})`);
        if (slot) {
          const slotDate = new Date(slot.slotTime);
          summaryLines.push(`   Confirming the ${slotDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} slot.`);
        }
        summaryLines.push(`   Verifying: address, ${specialty} specialist, imaging, ${patient.insurance.provider} insurance.`);
        summaryLines.push(`\n📍 Address: [${addr}](${mapsUrl})`);
        summaryLines.push(`📞 Office: ${candidate.provider.phone_number ?? candidate.location.phone_number}`);

        placedCallSid = callResult.callSid ?? "";
        callPlaced = true;
        break;
      } else {
        summaryLines.push(`\n❌ Could not reach ${candidate.provider.name}: ${callResult.error}`);
        widgetProviders[ci].call_status = "failed";
      }
    }

    if (!callPlaced) {
      summaryLines.push(`\n⚠️ Could not place a call to any provider. Please try calling directly:`);
      for (const c of topCandidates.slice(0, 3)) {
        summaryLines.push(`  • ${c.provider.name}: ${c.provider.phone_number ?? c.location.phone_number}`);
      }
    } else {
      summaryLines.push(`\n📞 Call is in progress. After you tell the patient about the providers and the call, IMMEDIATELY call the tool nh-check-call with call_sid "${placedCallSid}" to get the call result.`);
    }

    return widget({
      props: {
        providers: widgetProviders,
        query: `${specialty} providers for: ${description}`,
        totalCount: topCandidates.length,
        patientInsurance: patient.insurance.provider,
      },
      output: text(summaryLines.join("\n")),
    });
  },
);

// --- Check Call Status Tool ---

server.tool(
  {
    name: "nh-check-call",
    description:
      "Check the result of a call placed by nh-find-and-call. Waits up to 30 seconds for the call to end and returns the transcript and summary. MUST be called after nh-find-and-call.",
    schema: checkCallSchema,
  },
  async (params) => {
    const parsed = checkCallSchema.safeParse(params);
    if (!parsed.success) {
      return text(`Validation error: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
    }

    // Wait up to 45 seconds for the ElevenLabs summary to arrive
    let callSummary = null;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      callSummary = getLatestSummary();
      if (callSummary && callSummary.receivedAt > Date.now() - 120_000) {
        break;
      }
      callSummary = null;

      // Also check Twilio status — if call already ended, don't wait forever
      const twilioStatus = getCallStatus(parsed.data.call_sid);
      if (twilioStatus && ["failed", "busy", "no-answer", "canceled"].includes(twilioStatus.status)) {
        break;
      }
    }

    const lines: string[] = [];

    // Check Twilio status
    const twilioStatus = getCallStatus(parsed.data.call_sid);
    if (twilioStatus) {
      lines.push(`Call status: ${twilioStatus.status.toUpperCase()}`);
      if (twilioStatus.duration) lines.push(`Duration: ${twilioStatus.duration} seconds`);
    }

    // Check ElevenLabs summary
    if (callSummary) {
      lines.push("");
      lines.push("📋 Call Summary:");
      if (callSummary.summary) lines.push(callSummary.summary);
      if (callSummary.duration) lines.push(`Call duration: ${callSummary.duration} seconds`);
      if (callSummary.transcript) {
        lines.push("");
        lines.push("📝 Transcript:");
        lines.push(callSummary.transcript);
      }

      const isSuccessful = callSummary.summary?.toLowerCase().includes("successful") ||
        callSummary.summary?.toLowerCase().includes("booked") ||
        callSummary.summary?.toLowerCase().includes("confirmed") ||
        callSummary.transcript?.toLowerCase().includes("booked");

      lines.push("");
      if (isSuccessful) {
        lines.push("✅ The appointment appears to be confirmed! Tell the patient the good news, give them the address link, and let them know what to bring.");
      } else {
        lines.push("⚠️ The appointment may not have been confirmed. Share the transcript with the patient and ask if they'd like to try the next provider.");
      }
    } else {
      lines.push("");
      if (twilioStatus && ["completed"].includes(twilioStatus.status)) {
        lines.push(`The call ended (${twilioStatus.duration ?? 0}s) but no detailed summary was received.`);
        lines.push("Ask the patient how the call went.");
      } else if (twilioStatus && ["failed", "busy", "no-answer", "canceled"].includes(twilioStatus.status)) {
        lines.push(`❌ The call ${twilioStatus.status}. Offer to try the next provider.`);
      } else {
        lines.push("The call summary hasn't arrived yet. Ask the patient if the call is still going or if it ended.");
      }
    }

    return text(lines.join("\n"));
  },
);

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
    description: "List all institutions (practices) accessible with your NexHealth API key. Returns subdomain needed for other NexHealth tools. NOTE: If the patient has described symptoms, call nh-triage-need FIRST before calling this tool.",
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
