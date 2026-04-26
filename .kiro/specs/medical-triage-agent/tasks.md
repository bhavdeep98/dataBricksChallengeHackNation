# Implementation Plan: Medical Triage Agent

## Overview

Build a medical triage reasoning layer between natural language patient input and existing NexHealth MCP tools. Implementation follows a bottom-up approach: data models → pure triage functions → MCP tool registration → agent system prompt. All triage logic is pure TypeScript with keyword-based matching and urgency classification. Testing uses fast-check for property-based tests alongside unit tests.

## Tasks

- [x] 1. Set up triage data models, schemas, and test infrastructure
  - [x] 1.1 Create `src/triage/types.ts` with `UrgencyLevel`, `SpecialtyRecommendation`, `AppointmentTypeMatch`, `TriageResult`, and `TriageError` types
    - Define `UrgencyLevel` as union type of "emergency" | "urgent" | "soon" | "routine"
    - Define `SpecialtyRecommendation` with `name: string` and `confidence: number` (0–1)
    - Define `AppointmentTypeMatch` with `id: number` and `name: string`
    - Define `TriageResult` with `specialties` (1–5 elements), `appointment_types`, `urgency`, and optional `warnings`
    - Define `TriageError` with `code` and `message`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.2 Create `src/triage/schemas.ts` with Zod input schema for `nh-triage-need`
    - Define `triageNeedSchema` with `description` (string, min 3 chars) and optional `subdomain` (string)
    - Use `.strict()` to reject unknown fields
    - _Requirements: 1.4, 1.3_

  - [x] 1.3 Install fast-check and set up test configuration
    - Add `fast-check` and `vitest` as dev dependencies
    - Create `vitest.config.ts` if not present
    - Create `src/triage/__tests__/` directory with initial test file
    - _Requirements: Testing infrastructure_

  - [x] 1.4 Write property test for TriageResult structural invariant
    - **Property 1: TriageResult structural invariant**
    - Generate arbitrary valid symptom strings (≥ 3 chars), call `triage()`, assert `specialties` length 1–5, all `confidence` in [0,1], `urgency` in valid set
    - **Validates: Requirements 1.1, 7.1, 7.3, 7.4**

  - [x] 1.5 Write property test for invalid input validation
    - **Property 3: Invalid input produces validation error**
    - Generate arbitrary strings with fewer than 3 characters (including empty), assert Zod schema rejects them
    - **Validates: Requirements 1.3, 8.1**

- [x] 2. Implement text normalizer and symptom knowledge base
  - [x] 2.1 Create `src/triage/normalizer.ts` with `normalizeInput()` function
    - Convert input to lowercase
    - Trim leading/trailing whitespace
    - Strip extraneous punctuation (keep hyphens and spaces for compound terms)
    - _Requirements: 2.4_

  - [x] 2.2 Create `src/triage/knowledge-base.ts` with `SYMPTOM_KNOWLEDGE_BASE` array
    - Define `SymptomMapping` interface with `keywords`, `specialty`, and `baseConfidence`
    - Populate at least 30 symptom keyword-to-specialty mappings covering: dentistry, dermatology, orthopedics, ophthalmology, ENT, cardiology, psychiatry, pediatrics, OB-GYN, gastroenterology, neurology, allergy-immunology, endocrinology, urology, pulmonology, and more
    - _Requirements: 2.1, 2.2_

  - [x] 2.3 Write property test for normalization invariance
    - **Property 5: Normalization invariance**
    - Generate arbitrary strings, assert `matchSymptoms(input)` equals `matchSymptoms(input.toUpperCase())` and `matchSymptoms("  " + input + "  ")`
    - **Validates: Requirements 2.4**

- [x] 3. Implement symptom matcher and urgency classifier
  - [x] 3.1 Create `src/triage/matcher.ts` with `matchSymptoms()` function
    - Match normalized text against knowledge base keywords
    - Return 1–5 specialties ranked by descending confidence
    - Fall back to "general practice" with confidence < 0.5 when no keywords match
    - Handle compound symptoms mapping to multiple specialties with distinct scores
    - _Requirements: 2.2, 2.3, 8.4_

  - [x] 3.2 Write property test for confidence descending order
    - **Property 4: Confidence scores in descending order**
    - Generate arbitrary symptom strings, call `matchSymptoms()`, assert confidence scores are in non-increasing order
    - **Validates: Requirements 2.3**

  - [x] 3.3 Write property test for unknown symptoms fallback
    - **Property 11: Unknown symptoms fall back to general practice**
    - Generate strings with no known keywords, assert result includes "general practice" or "primary care" with confidence < 0.5
    - **Validates: Requirements 8.4**

  - [x] 3.4 Create `src/triage/urgency.ts` with `classifyUrgency()` function and keyword arrays
    - Define `EMERGENCY_KEYWORDS` array (chest pain, difficulty breathing, uncontrolled bleeding, severe trauma, unconscious, stroke, heart attack, seizure now, choking, anaphylaxis, overdose, suicidal)
    - Define `URGENT_KEYWORDS` array (acute pain, high fever, severe pain, recent injury, broken, deep cut, infection, swelling, can't walk, vomiting blood)
    - Implement `classifyUrgency(normalizedText)` returning exactly one `UrgencyLevel`
    - Emergency keywords take priority over all other classifications
    - _Requirements: 3.1, 3.6, 3.7_

  - [x] 3.5 Write property test for urgency classifier valid level
    - **Property 6: Urgency classifier returns exactly one valid level**
    - Generate arbitrary non-empty strings, assert return value is exactly one of {emergency, urgent, soon, routine}
    - **Validates: Requirements 3.1**

  - [x] 3.6 Write property test for emergency keywords
    - **Property 8: Emergency keywords always produce emergency classification**
    - Generate strings containing at least one emergency keyword, assert `classifyUrgency()` returns "emergency"
    - **Validates: Requirements 3.6**

  - [x] 3.7 Write property test for urgent keywords
    - **Property 9: Urgent keywords produce urgent classification**
    - Generate strings containing at least one urgent keyword and no emergency keywords, assert `classifyUrgency()` returns "urgent"
    - **Validates: Requirements 3.7**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement appointment type matcher and triage orchestrator
  - [x] 5.1 Create `src/triage/appointment-matcher.ts` with `matchAppointmentTypes()` function
    - Accept specialty names and NexHealth appointment types array
    - Return matching `{ id, name }` pairs by fuzzy-matching specialty names against appointment type names
    - Return empty array if no matches or types unavailable
    - _Requirements: 1.2, 1.5_

  - [x] 5.2 Write property test for appointment type IDs subset
    - **Property 2: Appointment type IDs are a subset of available types**
    - Generate arbitrary specialty names and appointment type arrays, assert all returned IDs exist in the input array
    - **Validates: Requirements 1.2**

  - [x] 5.3 Create `src/triage/triage.ts` with `triage()` orchestrator function
    - Implement full pipeline: `normalizeInput()` → `matchSymptoms()` → `classifyUrgency()` → `matchAppointmentTypes()` (if types provided)
    - Accept `description` string and optional `appointmentTypes` array
    - Return complete `TriageResult` object
    - _Requirements: 1.1, 1.2, 3.1, 7.1_

- [x] 6. Implement urgency-to-days mapping and slot search helpers
  - [x] 6.1 Create `src/triage/slot-search.ts` with `getSlotSearchDays()` and `getRetryDays()` helper functions
    - Map urgency levels to days: urgent→1, soon→7, routine→14
    - `getRetryDays()` returns exactly `2 × original days`
    - Export `getStartDate()` returning today's date in YYYY-MM-DD format
    - _Requirements: 3.3, 3.4, 3.5, 5.1, 5.2_

  - [x] 6.2 Write property test for urgency-to-days mapping
    - **Property 7: Urgency-to-days mapping**
    - For all non-emergency urgency levels, assert days equals defined mapping and start_date equals today
    - **Validates: Requirements 3.3, 3.4, 3.5, 5.1**

  - [x] 6.3 Write property test for retry doubles days
    - **Property 10: Retry doubles the search window**
    - For all initial days values, assert retry days equals `2 × original`
    - **Validates: Requirements 5.2**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Register nh-triage-need MCP tool and wire error handling
  - [x] 8.1 Add `nh-triage-need` tool registration in `index.ts`
    - Import `triageNeedSchema` from `src/triage/schemas.ts` and `triage` from `src/triage/triage.ts`
    - Register tool with name `nh-triage-need`, description for symptom analysis
    - Implement handler: validate input via schema, call `triage()`, if subdomain provided fetch appointment types via `nexhealth.getAppointmentTypes()` and pass to `triage()`
    - Handle NexHealth API errors gracefully: on failure, return specialty-only results with warning
    - Return `TriageResult` as formatted text output
    - _Requirements: 1.4, 1.5, 1.6, 9.1_

  - [x] 8.2 Implement safe error message formatting for triage flow
    - Ensure error handler never exposes raw HTTP status codes, stack traces, or internal error objects to the patient
    - Map 401 → "service temporarily unavailable", 429 → "system busy, try again", generic → safe fallback message
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Write property test for safe error messages
    - **Property 12: Error messages never expose raw API details**
    - Generate arbitrary `NexHealthApiError` objects, assert user-facing output contains no raw status codes, stack traces, or internal error fields
    - **Validates: Requirements 9.4**

  - [x] 8.4 Write unit tests for API fallback behavior
    - Mock NexHealth client to throw errors, verify specialty recommendations still returned with warning
    - Test 401, 429, and timeout error scenarios produce correct user-friendly messages
    - _Requirements: 1.6, 9.1, 9.2, 9.3_

- [x] 9. Create agent system prompt with triage intelligence
  - [x] 9.1 Add triage-aware system prompt to the MCP server configuration
    - Instruct LLM to call `nh-triage-need` as first tool for any patient symptom description
    - Include urgency assessment and specialty presentation before slot search
    - Encode urgency-to-days mapping: urgent=1, soon=7, routine=14
    - Include slot search retry logic: if zero slots, double days and retry once; if still zero, suggest contacting practice
    - Include emergency flow: display emergency guidance and terminate booking flow (no booking tools called)
    - Instruct LLM to ask at most 3 clarifying questions for ambiguous descriptions
    - Include safety disclaimer: scheduling assistance only, no medical diagnoses or advice
    - Prohibit medical diagnoses, treatment recommendations, and medication suggestions
    - Instruct to recommend emergency services for life-threatening conditions regardless of patient preference
    - Include patient lookup flow: call `nh-search-patients`, if not found call `nh-create-patient` before booking
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 3.2, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 8.2, 8.3_

- [x] 10. Wire end-to-end triage-to-booking flow
  - [x] 10.1 Ensure slot search uses triage result for provider filtering and urgency-aware date ranges
    - Agent prompt instructs filtering providers by specialty match from triage result
    - Agent prompt instructs using `availability-calendar` widget for slot presentation
    - Agent prompt instructs forwarding selected slot's `start_time` and `operatory_id` to `nh-book-appointment`
    - Agent prompt instructs showing `booking-confirmation` widget with `status: "failed"` on booking errors
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.4_

  - [x] 10.2 Write unit tests for end-to-end triage flow
    - Test emergency flow terminates without booking
    - Test booking failure shows failed widget
    - Test slot selection forwards correct `start_time` and `operatory_id`
    - _Requirements: 3.2, 6.2, 6.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 12 correctness properties defined in the design document using fast-check
- Unit tests validate specific examples, edge cases, and API error scenarios
- All triage logic is pure TypeScript — no external ML models required
