import { z } from "zod";

export const triageNeedSchema = z.object({
  description: z.string().min(3, "Symptom description must be at least 3 characters"),
  subdomain: z.string().optional().describe("Institution subdomain for live appointment type matching"),
});
