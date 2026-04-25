import { z } from "zod";

// Flexible provider schema that handles both Provider and ProviderLocationSummary shapes
const providerItemSchema = z.object({
  // Common fields
  name: z.string().optional(),
  provider_name: z.string().optional(),
  specialty: z.string().optional(),

  // From Provider (search-providers tool)
  npi: z.string().optional(),
  specialties: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional(),
  spoken_languages: z.array(z.string()).optional(),
  affiliated_locations: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          zip_code: z.string(),
        }),
        phone_number: z.string().optional(),
      })
    )
    .optional(),

  // From ProviderLocationSummary (search-providers-by-location tool)
  provider_location_id: z.string().optional(),
  address: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip_code: z.string(),
    })
    .optional(),
  distance_mi: z.number().optional(),
  next_available_date: z.string().optional(),
  accepts_insurance: z.boolean().optional(),
});

export const propSchema = z.object({
  providers: z.array(providerItemSchema),
  query: z.string().describe("Search context description"),
  totalCount: z.number().describe("Total number of results"),
});

export type ProviderItem = z.infer<typeof providerItemSchema>;
export type ProviderSearchResultProps = z.infer<typeof propSchema>;
