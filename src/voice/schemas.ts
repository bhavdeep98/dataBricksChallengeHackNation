import { z } from "zod";

export const findAndCallSchema = z.object({
  description: z.string().describe("Patient symptom description (same as passed to nh-triage-need)"),
  urgency: z.enum(["urgent", "soon", "routine"]).describe("Urgency level from triage result (do NOT use for emergency — those go to 911)"),
  specialty: z.string().describe("Primary recommended specialty from triage result"),
  avoid_provider_types: z.array(z.string()).optional().describe("Provider types to avoid from triage result (e.g. 'urgent care without x-ray')"),
});

export const checkCallSchema = z.object({
  call_sid: z.string().describe("The Call SID returned by nh-find-and-call"),
});
