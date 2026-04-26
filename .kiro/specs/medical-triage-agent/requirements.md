# Requirements: Medical Triage Agent

## Introduction

A medical triage and reasoning layer that sits between natural language patient needs and the existing NexHealth MCP tools. The Triage_Agent interprets patient symptoms described in natural language, maps them to appropriate medical specialties and appointment types, classifies urgency, asks clarifying questions when needed, and orchestrates the existing NexHealth tools to find providers and available slots — ultimately guiding the patient to a booked appointment.

Current flow: User need → NexHealth tools → booking.
Desired flow: User need → [Medical Triage Agent] → NexHealth tools → booking.

## Glossary

- **Triage_Agent**: The AI agent system prompt and orchestration logic that receives natural language patient input, performs medical triage reasoning, and coordinates downstream NexHealth tool calls.
- **Symptom_Mapper**: The `nh-triage-need` MCP tool that accepts natural language symptom descriptions and returns ranked specialty and appointment type recommendations derived from NexHealth practice data.
- **Urgency_Classifier**: The component within the Triage_Agent that assigns an urgency level (emergency, urgent, soon, routine) to a patient's described need.
- **Slot_Searcher**: The urgency-aware wrapper logic that calls `nh-get-available-slots` with date range parameters adjusted to the classified urgency level.
- **NexHealth_Tools**: The existing set of MCP tools (`nh-list-institutions`, `nh-list-locations`, `nh-list-providers`, `nh-get-provider`, `nh-list-appointment-types`, `nh-get-available-slots`, `nh-book-appointment`, etc.) already registered on the MCP server.
- **Specialty**: A medical discipline (e.g., orthopedics, dermatology, urgent care) that a provider practices.
- **Appointment_Type**: A named visit category configured in NexHealth (e.g., "New Patient", "Follow-Up", "Urgent Visit") with an associated duration.
- **Urgency_Level**: One of four classifications — `emergency` (call 911 / go to ER), `urgent` (same-day or next-day), `soon` (within one week), `routine` (within two weeks or more).

## Requirements

### Requirement 1: Symptom-to-Specialty Mapping Tool (nh-triage-need)

**User Story:** As a patient, I want to describe my symptoms in plain language and receive ranked specialty and appointment type recommendations, so that I do not need to know medical terminology to find the right provider.

#### Acceptance Criteria

1. WHEN a natural language symptom description is provided, THE Symptom_Mapper SHALL return a ranked list of at least one and at most five Specialty recommendations, each with a confidence score between 0 and 1.
2. WHEN a natural language symptom description is provided, THE Symptom_Mapper SHALL return a ranked list of matching Appointment_Type identifiers sourced from the NexHealth practice's configured appointment types.
3. WHEN the symptom description is empty or contains fewer than three characters, THE Symptom_Mapper SHALL return a validation error indicating that the description is too short to triage.
4. THE Symptom_Mapper SHALL be registered as an MCP tool named `nh-triage-need` with a zod input schema requiring a `description` string field and an optional `subdomain` string field.
5. WHEN a subdomain is provided, THE Symptom_Mapper SHALL call `nh-list-appointment-types` for that subdomain and match its specialty recommendations against the actual available appointment types.
6. IF the NexHealth API is unavailable, THEN THE Symptom_Mapper SHALL return specialty recommendations from its built-in mapping without appointment type IDs and include a warning that live appointment type matching was unavailable.


### Requirement 2: Built-in Symptom-to-Specialty Knowledge Base

**User Story:** As a patient, I want the triage system to have reliable medical knowledge for mapping common symptoms to specialties, so that I receive accurate routing even without live API data.

#### Acceptance Criteria

1. THE Symptom_Mapper SHALL contain a built-in mapping of at least 30 common symptom keywords or phrases to their corresponding Specialty values.
2. THE Symptom_Mapper SHALL map compound or ambiguous symptoms to multiple specialties with distinct confidence scores (e.g., "swollen wrist after fall" maps to both orthopedics and urgent care).
3. WHEN a symptom description contains keywords matching multiple specialties, THE Symptom_Mapper SHALL rank results by descending confidence score.
4. THE Symptom_Mapper SHALL normalize input text by converting to lowercase and removing extraneous punctuation before matching.

#### Correctness Properties

- **CP-2.1**: For all symptom descriptions containing a known keyword from the built-in mapping, the Symptom_Mapper returns at least one Specialty recommendation.
- **CP-2.3**: For all result lists returned by the Symptom_Mapper, the confidence scores are in non-increasing order (each score is greater than or equal to the next).
- **CP-2.4**: For all input strings, the Symptom_Mapper produces the same result for `input` and `input` with varied casing and leading/trailing whitespace (normalization round-trip).

---

### Requirement 3: Urgency Classification

**User Story:** As a patient, I want the agent to assess how urgently I need care based on my symptoms, so that I am guided to same-day availability when my situation is time-sensitive.

#### Acceptance Criteria

1. WHEN a symptom description is provided, THE Urgency_Classifier SHALL assign exactly one Urgency_Level from the set {emergency, urgent, soon, routine}.
2. WHEN the Urgency_Level is `emergency`, THE Triage_Agent SHALL advise the patient to call 911 or visit the nearest emergency room and SHALL NOT proceed with appointment booking.
3. WHEN the Urgency_Level is `urgent`, THE Slot_Searcher SHALL search for available slots within 1 day by setting the `days` parameter to 1.
4. WHEN the Urgency_Level is `soon`, THE Slot_Searcher SHALL search for available slots within 7 days by setting the `days` parameter to 7.
5. WHEN the Urgency_Level is `routine`, THE Slot_Searcher SHALL search for available slots within 14 days by setting the `days` parameter to 14.
6. THE Urgency_Classifier SHALL classify descriptions containing keywords indicating severe trauma, chest pain, difficulty breathing, or uncontrolled bleeding as `emergency`.
7. THE Urgency_Classifier SHALL classify descriptions containing keywords indicating acute pain, high fever, or recent injury as `urgent`.

#### Correctness Properties

- **CP-3.1**: For all symptom descriptions, the Urgency_Classifier returns exactly one value from the set {emergency, urgent, soon, routine}.
- **CP-3.3**: For all cases where Urgency_Level is `urgent`, the `days` parameter passed to `nh-get-available-slots` equals 1.
- **CP-3.4**: For all cases where Urgency_Level is `soon`, the `days` parameter passed to `nh-get-available-slots` equals 7.
- **CP-3.5**: For all cases where Urgency_Level is `routine`, the `days` parameter passed to `nh-get-available-slots` equals 14.
- **CP-3.6**: For all symptom descriptions containing any of the emergency keywords, the Urgency_Classifier returns `emergency`.

---

### Requirement 4: Agent System Prompt with Triage Intelligence

**User Story:** As a developer, I want a well-structured agent system prompt that encodes medical triage reasoning, so that the LLM can reliably route patients through the booking flow.

#### Acceptance Criteria

1. THE Triage_Agent SHALL have a system prompt that instructs the LLM to perform symptom analysis, specialty matching, urgency classification, and clarifying question generation before invoking NexHealth_Tools.
2. WHEN the patient's description is ambiguous or lacks sufficient detail, THE Triage_Agent SHALL ask at most three clarifying questions before proceeding with triage.
3. THE Triage_Agent system prompt SHALL instruct the LLM to call `nh-triage-need` as the first tool invocation for any patient symptom description.
4. THE Triage_Agent system prompt SHALL instruct the LLM to present the urgency assessment and recommended specialty to the patient before searching for slots.
5. THE Triage_Agent system prompt SHALL include a safety disclaimer stating that the agent provides scheduling assistance only and does not provide medical diagnoses or advice.
6. WHEN the Urgency_Level is `emergency`, THE Triage_Agent SHALL display the emergency guidance and terminate the booking flow without calling any booking tools.

---

### Requirement 5: Urgency-Aware Slot Search Orchestration

**User Story:** As a patient, I want the system to automatically search for appointment slots within a timeframe appropriate to my urgency, so that I see relevant availability without manual date selection.

#### Acceptance Criteria

1. WHEN the Triage_Agent determines a non-emergency Urgency_Level and has identified a Specialty, THE Slot_Searcher SHALL call `nh-get-available-slots` with `start_date` set to today's date and `days` set according to the Urgency_Level mapping (urgent=1, soon=7, routine=14).
2. WHEN the initial slot search returns zero available slots, THE Slot_Searcher SHALL expand the search window by doubling the `days` parameter and retry once.
3. WHEN the expanded search also returns zero available slots, THE Triage_Agent SHALL inform the patient that no availability was found and suggest contacting the practice directly.
4. THE Slot_Searcher SHALL filter provider results to only those whose specialty matches the Symptom_Mapper's top recommendation when provider specialty data is available.
5. WHEN multiple providers have available slots, THE Slot_Searcher SHALL present results using the `availability-calendar` widget, grouped by provider.

#### Correctness Properties

- **CP-5.1**: For all non-emergency triage results, the `start_date` parameter passed to `nh-get-available-slots` equals today's date in YYYY-MM-DD format.
- **CP-5.2**: For all initial searches returning zero slots, the retry search uses a `days` value exactly double the original `days` value.

---

### Requirement 6: End-to-End Triage-to-Booking Flow

**User Story:** As a patient, I want to go from describing my symptoms to having a booked appointment in a single conversational flow, so that the experience is seamless.

#### Acceptance Criteria

1. THE Triage_Agent SHALL orchestrate the following sequential steps for a non-emergency patient need: (a) receive symptom description, (b) call `nh-triage-need`, (c) classify urgency, (d) present triage summary to patient, (e) search for available slots, (f) present availability calendar widget, (g) confirm patient selection, (h) call `nh-book-appointment`, (i) present booking confirmation widget.
2. WHEN the patient selects a time slot from the availability calendar widget, THE Triage_Agent SHALL use the selected slot's `start_time` and `operatory_id` to call `nh-book-appointment`.
3. WHEN the patient has not been identified in the system, THE Triage_Agent SHALL call `nh-search-patients` to look up the patient and, if not found, call `nh-create-patient` before booking.
4. IF the booking call fails, THEN THE Triage_Agent SHALL display the `booking-confirmation` widget with `status: "failed"` and the error message, and suggest the patient try a different time slot.

---

### Requirement 7: Triage Result Data Model

**User Story:** As a developer, I want a well-defined data model for triage results, so that the output of the Symptom_Mapper and Urgency_Classifier can be reliably consumed by downstream orchestration logic.

#### Acceptance Criteria

1. THE Symptom_Mapper SHALL return a `TriageResult` object containing: `specialties` (array of `{name: string, confidence: number}`), `appointment_types` (array of `{id: number, name: string}` or empty if unavailable), and `urgency` (Urgency_Level string).
2. THE `TriageResult` type SHALL be defined in a TypeScript type definition file at `src/triage/types.ts`.
3. THE `TriageResult.specialties` array SHALL contain between 1 and 5 elements inclusive.
4. THE `TriageResult.specialties[].confidence` values SHALL each be a number between 0 and 1 inclusive.

#### Correctness Properties

- **CP-7.1**: For all valid `TriageResult` objects, `specialties` has length between 1 and 5, each `confidence` is in [0, 1], and `urgency` is one of {emergency, urgent, soon, routine}.
- **CP-7.3**: For all outputs of the Symptom_Mapper, the `specialties` array length is greater than or equal to 1 and less than or equal to 5.
- **CP-7.4**: For all `confidence` values in any `TriageResult.specialties` array, the value is greater than or equal to 0 and less than or equal to 1.

---

### Requirement 8: Input Validation and Safety Guardrails

**User Story:** As a developer, I want robust input validation and safety guardrails, so that the triage system handles edge cases gracefully and does not produce harmful outputs.

#### Acceptance Criteria

1. WHEN the `nh-triage-need` tool receives input that does not conform to its zod schema, THE Symptom_Mapper SHALL return a structured validation error without calling any downstream NexHealth tools.
2. THE Triage_Agent system prompt SHALL explicitly prohibit the LLM from providing medical diagnoses, prescribing treatments, or recommending specific medications.
3. THE Triage_Agent system prompt SHALL instruct the LLM to recommend emergency services for any description suggesting life-threatening conditions, regardless of the patient's stated preference.
4. IF the patient describes symptoms that do not map to any known Specialty in the built-in mapping, THEN THE Symptom_Mapper SHALL return a general practice or primary care recommendation as a fallback with a confidence score below 0.5.

#### Correctness Properties

- **CP-8.4**: For all symptom descriptions that match zero keywords in the built-in mapping, the Symptom_Mapper returns at least one result with specialty "general practice" or "primary care" and a confidence score strictly less than 0.5.

---

### Requirement 9: Error Handling for Triage Tools

**User Story:** As a patient, I want clear feedback when something goes wrong during triage, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. IF the `nh-triage-need` tool encounters an error calling `nh-list-appointment-types`, THEN THE Symptom_Mapper SHALL return specialty recommendations from the built-in mapping and include a warning message that appointment type matching is degraded.
2. IF the NexHealth API returns a rate limit error (429) during the triage flow, THEN THE Triage_Agent SHALL inform the patient to wait a moment and retry.
3. IF the NexHealth API returns an authentication error (401) during the triage flow, THEN THE Triage_Agent SHALL inform the patient that the service is temporarily unavailable and suggest contacting the practice directly.
4. WHEN any NexHealth tool call fails during the triage-to-booking flow, THE Triage_Agent SHALL display a user-friendly error message and SHALL NOT expose raw API error details to the patient.
