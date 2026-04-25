import { z } from "zod";

const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
});

const specialtySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const visitReasonSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_new_patient: z.boolean().optional(),
});

const affiliatedLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: addressSchema,
  phone_number: z.string().optional(),
});

const providerSchema = z.object({
  npi: z.string(),
  name: z.string(),
  gender_identity: z.string().optional(),
  spoken_languages: z.array(z.string()),
  specialties: z.array(specialtySchema),
  visit_reasons: z.array(visitReasonSchema),
  affiliated_locations: z.array(affiliatedLocationSchema),
});

const providerLocationDetailSchema = z.object({
  provider_location_id: z.string(),
  provider: providerSchema,
  location: affiliatedLocationSchema,
  visit_reasons: z.array(visitReasonSchema),
  accepted_insurance_plans: z.array(z.string()).optional(),
});

export const propSchema = z.object({
  provider: providerLocationDetailSchema.describe(
    "Full provider location detail from ZocDoc API"
  ),
});

export type ProviderDetailProps = z.infer<typeof propSchema>;
export type AffiliatedLocationItem = z.infer<typeof affiliatedLocationSchema>;
export type VisitReasonItem = z.infer<typeof visitReasonSchema>;
