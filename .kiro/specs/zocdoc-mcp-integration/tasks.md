# Tasks: ZocDoc MCP Integration

## Task 1: Create ZocDoc API Type Definitions
> Requirement: 3

- [x] 1.1 Create `src/zocdoc/types.ts` with all ZocDoc API response types: `NPIListResponse`, `Provider`, `Specialty`, `VisitReason`, `AffiliatedLocation`, `Address`, `ProviderResponse`, `ProviderLocationSummary`, `ProviderLocationSearchResponse`, `ProviderLocationDetail`, `TimeSlot`, `ProviderAvailability`, `AvailabilityResponse`
- [x] 1.2 Add request/booking types to `src/zocdoc/types.ts`: `PatientInfo`, `BookAppointmentRequest`, `BookingResult`, `ZocDocApiError`, `ZocDocClientConfig`
- [x] 1.3 Ensure all types use strict TypeScript typing with optional fields, union types (`"new" | "existing"`, `"male" | "female"`), and literal types (`"transactional"`)

## Task 2: Create Zod Input Validation Schemas
> Requirement: 2 (AC 2.7)

- [x] 2.1 Create `src/zocdoc/schemas.ts` with zod schemas for all six tool inputs: `listNPIsSchema`, `searchProvidersSchema`, `searchByLocationSchema`, `getProviderDetailsSchema`, `getAvailabilitySchema`, `bookAppointmentSchema`
- [x] 2.2 Add validation constraints: `zip_code` as `/^\d{5}$/` regex, `email_address` as `.email()`, `patient_type` and `sex_at_birth` as enums, `npis` array `.min(1).max(50)`, `page_size` as `.max(100)`
- [x] 2.3 Add `.describe()` annotations to all schema fields for AI assistant discoverability

## Task 3: Implement ZocDoc API Client
> Requirement: 1

- [x] 3.1 Create `src/zocdoc/client.ts` with `ZocDocClient` class that reads `ZOCDOC_API_TOKEN` from `process.env` and configures base URL to `https://api-developer-sandbox.zocdoc.com`
- [x] 3.2 Implement private `request<T>(method, path, params)` method with Bearer token auth header, `AbortSignal.timeout`, query string serialization for GET (arrays joined with commas, undefined omitted), and JSON body for POST
- [x] 3.3 Implement error handling in `request()` that catches non-2xx responses and throws typed `ZocDocApiError` with status, code, message, and details
- [x] 3.4 Implement `listNPIs(params)` method calling `GET /v1/reference/npi`
- [x] 3.5 Implement `getProviders(params)` method calling `GET /v1/providers` with NPI array validation (1–50 items) before the request
- [x] 3.6 Implement `searchProviderLocations(params)` method calling `GET /v1/provider_locations`
- [x] 3.7 Implement `getProviderLocation(params)` method calling `GET /v1/provider_locations/{provider_location_id}`
- [x] 3.8 Implement `getAvailability(params)` method calling `GET /v1/provider_locations/availability`
- [x] 3.9 Implement `bookAppointment(data)` method calling `POST /v1/appointments`
- [x] 3.10 Export a `createZocDocClient()` factory function that instantiates the client with env-based config

## Task 4: Register MCP Tools in index.ts
> Requirement: 2, 8

- [x] 4.1 Import `createZocDocClient` and all zod schemas in `index.ts`, instantiate the ZocDoc client
- [x] 4.2 Register `list-provider-npis` tool with `listNPIsSchema`, calling `zocdoc.listNPIs()` and returning text output with NPI list
- [x] 4.3 Register `search-providers` tool with `searchProvidersSchema` and `provider-search-result` widget, calling `zocdoc.getProviders()` and returning widget with provider data
- [x] 4.4 Register `search-providers-by-location` tool with `searchByLocationSchema` and `provider-search-result` widget, calling `zocdoc.searchProviderLocations()` and returning widget with results
- [x] 4.5 Register `get-provider-details` tool with `getProviderDetailsSchema` and `provider-detail` widget, calling `zocdoc.getProviderLocation()` and returning widget with provider details
- [x] 4.6 Register `get-availability` tool with `getAvailabilitySchema` and `availability-calendar` widget, calling `zocdoc.getAvailability()` and returning widget with time slots
- [x] 4.7 Register `book-appointment` tool with `bookAppointmentSchema` and `booking-confirmation` widget, assembling `PatientInfo` from flat params, calling `zocdoc.bookAppointment()`, and returning widget with booking result
- [x] 4.8 Wrap each tool handler in try-catch that catches `ZocDocApiError` and returns user-friendly text error messages (401 → auth failed, 429 → rate limit, 404 → not found, timeout → timed out)

## Task 5: Create ProviderSearchResult Widget
> Requirement: 4

- [x] 5.1 Create `resources/provider-search-result-zocdoc/types.ts` with zod `propSchema` for provider search results (providers array, query string, totalCount)
- [x] 5.2 Create `resources/provider-search-result-zocdoc/components/ProviderCard.tsx` component rendering a single provider card with name, specialty, city/state, and distance
- [x] 5.3 Create `resources/provider-search-result-zocdoc/widget.tsx` with `widgetMetadata` export, loading skeleton, result count display, and card grid rendering using `McpUseProvider` and `useWidget` hooks
- [x] 5.4 Import `resources/styles.css` and use Tailwind classes consistent with existing widget styling

## Task 6: Create ProviderDetail Widget
> Requirement: 5

- [x] 6.1 Create `resources/provider-detail/types.ts` with zod `propSchema` for provider detail (full provider object with specialties, languages, locations, visit reasons)
- [x] 6.2 Create `resources/provider-detail/components/LocationInfo.tsx` rendering an affiliated location with address and phone number
- [x] 6.3 Create `resources/provider-detail/components/VisitReasonList.tsx` rendering visit reasons with new-patient indicators
- [x] 6.4 Create `resources/provider-detail/widget.tsx` with `widgetMetadata`, structured layout showing provider name, specialties, languages, gender identity, locations list, and visit reasons list

## Task 7: Create AvailabilityCalendar Widget
> Requirement: 6

- [x] 7.1 Create `resources/availability-calendar/types.ts` with zod `propSchema` for availability data (array of provider availabilities with time slots)
- [x] 7.2 Create `resources/availability-calendar/components/TimeSlotButton.tsx` rendering a single time slot as an interactive button (enabled for available, disabled/grayed for unavailable)
- [x] 7.3 Create `resources/availability-calendar/components/DateColumn.tsx` rendering a date header with its time slots below
- [x] 7.4 Create `resources/availability-calendar/widget.tsx` with `widgetMetadata`, grouping slots by date into columns, and using `sendFollowUpMessage` on slot selection to trigger booking flow

## Task 8: Create BookingConfirmation Widget
> Requirement: 7

- [x] 8.1 Create `resources/booking-confirmation/types.ts` with zod `propSchema` for booking result (appointment_id, status, provider_name, location, start_time, visit_reason)
- [x] 8.2 Create `resources/booking-confirmation/widget.tsx` with `widgetMetadata` and three visual states: success (confirmed with appointment details), pending (processing indicator), and failed (error message with retry suggestion)

## Task 9: Update tsconfig.json
> Requirement: 3

- [x] 9.1 Add `src/**/*` to the `include` array in `tsconfig.json` if not already present, ensuring the new `src/zocdoc/` files are compiled
