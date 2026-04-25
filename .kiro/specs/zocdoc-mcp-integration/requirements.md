# Requirements: ZocDoc MCP Integration

## Requirement 1: ZocDoc API Client Module

### Description
A TypeScript module (`src/zocdoc/client.ts`) that encapsulates all HTTP communication with the ZocDoc Patient API, handling authentication, request construction, response parsing, and error mapping.

### Acceptance Criteria

#### 1.1 The API client reads the bearer token from `ZOCDOC_API_TOKEN` environment variable and includes it as `Authorization: Bearer <token>` header on every HTTP request to the ZocDoc API.

#### 1.2 The API client targets the base URL `https://api-developer-sandbox.zocdoc.com` and constructs correct endpoint paths for all six ZocDoc API endpoints (`/v1/reference/npi`, `/v1/providers`, `/v1/provider_locations`, `/v1/provider_locations/{id}`, `/v1/provider_locations/availability`, `/v1/appointments`).

#### 1.3 For GET requests, the client serializes parameters as URL query strings, joining array values with commas and omitting undefined/null values. For POST requests, the client serializes the body as JSON.

#### 1.4 The client enforces a configurable request timeout (default 10 seconds) using `AbortSignal.timeout` and throws a descriptive error when the timeout is exceeded.

#### 1.5 Non-2xx HTTP responses are caught and transformed into typed `ZocDocApiError` objects containing `status`, `code`, `message`, and optional `details` — errors are never silently swallowed.

#### 1.6 The `getProviders` method validates that the `npis` array contains between 1 and 50 items before making the HTTP request, throwing an error if the constraint is violated.

### Correctness Properties

- **CP-1.1**: For all calls to `ZocDocClient.request()`, the outgoing HTTP request headers contain `Authorization: Bearer <token>` where `<token>` equals the configured `apiToken`.
- **CP-1.3**: For all valid parameter objects passed to GET requests, every non-undefined, non-null value appears in the resulting URL query string, and array values are joined with commas.
- **CP-1.5**: For all HTTP responses with status code outside 200-299, the client throws a `ZocDocApiError` with a `status` field matching the HTTP status code.
- **CP-1.6**: For all string arrays of length 0 or greater than 50, `getProviders` throws an error before making an HTTP request.

---

## Requirement 2: MCP Tool Definitions and Zod Schemas

### Description
Six MCP tools registered on the server via `server.tool()` that expose ZocDoc API functionality to AI assistants, each with zod input validation schemas.

### Acceptance Criteria

#### 2.1 A `list-provider-npis` tool is registered that calls `GET /v1/reference/npi` with optional `page` and `page_size` parameters and returns a text-only response listing the NPIs.

#### 2.2 A `search-providers` tool is registered that accepts an array of 1–50 NPI strings and an optional `insurance_plan_id`, calls `GET /v1/providers`, and returns a `provider-search-result` widget with the provider data.

#### 2.3 A `search-providers-by-location` tool is registered that accepts `zip_code` (validated as 5-digit string), optional `specialty_id`, `visit_reason_id`, `insurance_plan_id`, `visit_type`, `max_distance_to_patient_mi`, and pagination params, calls `GET /v1/provider_locations`, and returns a `provider-search-result` widget.

#### 2.4 A `get-provider-details` tool is registered that accepts `provider_location_id` and optional `insurance_plan_id`, calls `GET /v1/provider_locations/{id}`, and returns a `provider-detail` widget.

#### 2.5 A `get-availability` tool is registered that accepts `provider_location_ids` (array), `visit_reason_id`, `patient_type` (enum: new/existing), `start_date`, `end_date`, and optional insurance params, calls `GET /v1/provider_locations/availability`, and returns an `availability-calendar` widget.

#### 2.6 A `book-appointment` tool is registered that accepts appointment details and patient information (flattened: first_name, last_name, date_of_birth, sex_at_birth, phone_number, email_address, address fields, optional insurance and gender), assembles the `BookAppointmentRequest` body, calls `POST /v1/appointments`, and returns a `booking-confirmation` widget.

#### 2.7 All tool input schemas use zod validation: `zip_code` validates as `/^\d{5}$/`, `email_address` validates as email, `patient_type` and `sex_at_birth` validate as enums, `npis` validates array length 1–50, and all required fields are enforced.

### Correctness Properties

- **CP-2.3**: For all strings, the `zip_code` field in `search-providers-by-location` schema accepts the string if and only if it matches the regex `/^\d{5}$/`.
- **CP-2.5**: For all pairs of date strings, the `get-availability` tool processes them only when `end_date >= start_date`.
- **CP-2.7**: For all input objects, zod schemas reject inputs with missing required fields and accept inputs with all required fields present and valid.

---

## Requirement 3: ZocDoc API Type Definitions

### Description
TypeScript type definitions (`src/zocdoc/types.ts`) for all ZocDoc API request and response shapes used across the client, tools, and widgets.

### Acceptance Criteria

#### 3.1 Type definitions exist for all API response models: `NPIListResponse`, `Provider`, `Specialty`, `VisitReason`, `AffiliatedLocation`, `Address`, `ProviderResponse`, `ProviderLocationSummary`, `ProviderLocationSearchResponse`, `ProviderLocationDetail`, `TimeSlot`, `ProviderAvailability`, `AvailabilityResponse`.

#### 3.2 Type definitions exist for all request/booking models: `PatientInfo`, `BookAppointmentRequest`, `BookingResult`, `ZocDocApiError`, and `ZocDocClientConfig`.

#### 3.3 All types use strict TypeScript typing with appropriate use of optional fields (`?`), union types (e.g., `"new" | "existing"`), and literal types (e.g., `"transactional"`).

---

## Requirement 4: ProviderSearchResult Widget

### Description
A React widget component (`resources/provider-search-result/`) that renders a card grid of healthcare providers returned from search tools, following the existing `mcp-use` widget pattern.

### Acceptance Criteria

#### 4.1 The widget accepts props containing an array of provider summaries (name, specialty, address, distance, next available date) and a query string, validated by a zod `propSchema`.

#### 4.2 The widget renders each provider as a card showing the provider name, specialty, location (city, state), and distance in miles when available.

#### 4.3 The widget exports `widgetMetadata` with a description, `propSchema`, and display metadata (invoking/invoked messages) matching the `mcp-use` widget pattern.

#### 4.4 The widget displays a loading skeleton state when `isPending` is true, consistent with the existing product-search-result widget pattern.

#### 4.5 The widget displays the total result count and the search query context (e.g., "Showing 15 providers near 10001").

---

## Requirement 5: ProviderDetail Widget

### Description
A React widget component (`resources/provider-detail/`) that renders detailed information about a single healthcare provider.

### Acceptance Criteria

#### 5.1 The widget accepts props containing full provider details: name, gender identity, spoken languages, specialties, visit reasons, and affiliated locations with addresses.

#### 5.2 The widget renders the provider's name, specialties, spoken languages, and gender identity in a structured layout.

#### 5.3 The widget renders a list of affiliated locations with full addresses and phone numbers.

#### 5.4 The widget renders a list of visit reasons the provider accepts, indicating which are for new patients.

---

## Requirement 6: AvailabilityCalendar Widget

### Description
A React widget component (`resources/availability-calendar/`) that renders available appointment time slots grouped by date.

### Acceptance Criteria

#### 6.1 The widget accepts props containing an array of provider availabilities, each with a provider name and array of time slots (start_time, end_time, is_available).

#### 6.2 The widget groups time slots by date and renders them in chronological columns, with each column showing the date header and available time slots below.

#### 6.3 Available time slots are rendered as interactive buttons that trigger a `sendFollowUpMessage` to the AI assistant with the selected slot details for booking.

#### 6.4 Unavailable time slots are visually distinguished (grayed out / disabled) from available ones.

---

## Requirement 7: BookingConfirmation Widget

### Description
A React widget component (`resources/booking-confirmation/`) that renders the result of an appointment booking attempt.

### Acceptance Criteria

#### 7.1 The widget accepts props containing booking result: appointment_id, status (confirmed/pending/failed), provider_name, location, start_time, and visit_reason.

#### 7.2 For confirmed bookings, the widget displays a success state with appointment details: provider name, location, date/time, and visit reason.

#### 7.3 For failed bookings, the widget displays an error state with the failure reason and a suggestion to check availability again.

#### 7.4 For pending bookings, the widget displays a pending state indicating the appointment is being processed.

---

## Requirement 8: Error Handling Strategy

### Description
Consistent error handling across all tool handlers that catches API errors and returns user-friendly messages to the AI assistant.

### Acceptance Criteria

#### 8.1 Each tool handler wraps its API call in a try-catch block that catches `ZocDocApiError` and returns a descriptive text-only error response to the AI assistant instead of throwing.

#### 8.2 Authentication errors (401) return the message: "ZocDoc authentication failed. Please check the API token configuration."

#### 8.3 Rate limit errors (429) return the message: "ZocDoc API rate limit reached. Please try again in a moment."

#### 8.4 Not found errors (404) return a contextual message (e.g., "Provider not found. The provider location ID may be invalid.").

#### 8.5 Timeout errors return the message: "ZocDoc API request timed out. Please try again."

#### 8.6 Booking failures return a `booking-confirmation` widget with `status: "failed"` and the error message, so the user sees what went wrong visually.

---

## Requirement 9: Security and PII Protection

### Description
Security measures to protect patient personally identifiable information and API credentials.

### Acceptance Criteria

#### 9.1 The `ZOCDOC_API_TOKEN` is read exclusively from environment variables and is never hardcoded in source code or logged to console/files.

#### 9.2 Patient PII (name, date of birth, phone number, email, address) passed to the `book-appointment` tool is only forwarded to the ZocDoc API and is never logged, cached, or persisted locally by the MCP server.

#### 9.3 All API communication uses HTTPS (enforced by the base URL configuration).
