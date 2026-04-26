/**
 * Local seed data for development and testing.
 * Provides mock institutions, locations, providers, appointment types,
 * patients, and slot generation so the full triage → search → book
 * flow works without the NexHealth Synchronizer.
 */

import type {
  NexHealthInstitution,
  NexHealthLocation,
  NexHealthProvider,
  NexHealthPatient,
  NexHealthAppointmentType,
} from "./types.js";

// ---------------------------------------------------------------------------
// Institutions
// ---------------------------------------------------------------------------
export const SEED_INSTITUTIONS: NexHealthInstitution[] = [
  { id: 21041, name: "Carenox, Inc. Demo Practice", subdomain: "carenox-inc-demo-practice", is_test: true },
  { id: 90001, name: "Metro Health Partners", subdomain: "metro-health-partners", is_test: true },
  { id: 90002, name: "Sunrise Medical Group", subdomain: "sunrise-medical-group", is_test: true },
];

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
export const SEED_LOCATIONS: Record<string, NexHealthLocation[]> = {
  "carenox-inc-demo-practice": [
    { id: 346811, name: "Green River Dental", phone_number: "2125551001", address: "428 Broadway", city: "New York", state: "NY", zip_code: "10013", time_zone: "America/New_York" },
    { id: 346884, name: "Relaxation Dental", phone_number: "5035551002", address: "5216 S Welcome Way", city: "Happy Valley", state: "OR", zip_code: "97086", time_zone: "America/Los_Angeles" },
  ],
  "metro-health-partners": [
    { id: 90101, name: "Metro Downtown Clinic", phone_number: "3125551010", address: "200 N Michigan Ave", city: "Chicago", state: "IL", zip_code: "60601", time_zone: "America/Chicago" },
    { id: 90102, name: "Metro Lakeview Family Practice", phone_number: "3125551020", address: "3400 N Broadway", city: "Chicago", state: "IL", zip_code: "60657", time_zone: "America/Chicago" },
    { id: 90103, name: "Metro Pediatric & Urgent Care", phone_number: "3125551030", address: "1550 W Fullerton Ave", city: "Chicago", state: "IL", zip_code: "60614", time_zone: "America/Chicago" },
  ],
  "sunrise-medical-group": [
    { id: 90201, name: "Sunrise Main Campus", phone_number: "6025551100", address: "4800 N 22nd St", city: "Phoenix", state: "AZ", zip_code: "85016", time_zone: "America/Phoenix" },
    { id: 90202, name: "Sunrise Women's Health Center", phone_number: "6025551200", address: "9250 E Shea Blvd", city: "Scottsdale", state: "AZ", zip_code: "85260", time_zone: "America/Phoenix" },
    { id: 90203, name: "Sunrise Orthopedic & Sports Medicine", phone_number: "6025551300", address: "3330 N 2nd St", city: "Phoenix", state: "AZ", zip_code: "85012", time_zone: "America/Phoenix" },
  ],
};

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------
export const SEED_PROVIDERS: Record<number, NexHealthProvider[]> = {
  // --- Green River Dental (existing sandbox data + extras) ---
  346811: [
    { id: 480636598, first_name: "Jonas", last_name: "Salk", name: "Jonas Salk", meta_type: "Dentist" },
    { id: 480636599, first_name: "Albert", last_name: "Einstein", name: "Albert Einstein", meta_type: "Dentist" },
    { id: 480636600, first_name: "Rodolfo", last_name: "Huerta", name: "Rodolfo Huerta", meta_type: "Hygienist" },
    { id: 480636601, first_name: "Ignacio", last_name: "Alvirde", name: "Ignacio Alvirde", meta_type: "Hygienist" },
    { id: 480636602, first_name: "Charles", last_name: "Peirce", name: "Charles Peirce", meta_type: "Hygienist" },
    { id: 800001, first_name: "Maria", last_name: "Chen", name: "Maria Chen", meta_type: "Dentist" },
    { id: 800002, first_name: "David", last_name: "Kim", name: "David Kim", meta_type: "Orthodontist" },
    { id: 800003, first_name: "Sarah", last_name: "Patel", name: "Sarah Patel", meta_type: "Endodontist" },
  ],
  // --- Relaxation Dental ---
  346884: [
    { id: 800010, first_name: "Michael", last_name: "Torres", name: "Michael Torres", meta_type: "Oral Surgeon" },
    { id: 800011, first_name: "Lisa", last_name: "Nguyen", name: "Lisa Nguyen", meta_type: "Periodontist" },
    { id: 800012, first_name: "Robert", last_name: "Garcia", name: "Robert Garcia", meta_type: "Pediatric Dentist" },
    { id: 800013, first_name: "Emily", last_name: "Johnson", name: "Emily Johnson", meta_type: "Prosthodontist" },
    { id: 800014, first_name: "Amanda", last_name: "Williams", name: "Amanda Williams", meta_type: "Hygienist" },
  ],
  // --- Metro Downtown Clinic ---
  90101: [
    { id: 810001, first_name: "Rachel", last_name: "Adams", name: "Rachel Adams", meta_type: "Internal Medicine" },
    { id: 810002, first_name: "Daniel", last_name: "Brooks", name: "Daniel Brooks", meta_type: "Cardiologist" },
    { id: 810003, first_name: "Sophia", last_name: "Martinez", name: "Sophia Martinez", meta_type: "Dermatologist" },
    { id: 810004, first_name: "William", last_name: "Chang", name: "William Chang", meta_type: "Gastroenterologist" },
    { id: 810005, first_name: "Olivia", last_name: "Foster", name: "Olivia Foster", meta_type: "Neurologist" },
    { id: 810006, first_name: "Ethan", last_name: "Reeves", name: "Ethan Reeves", meta_type: "Psychiatrist" },
  ],
  // --- Metro Lakeview Family Practice ---
  90102: [
    { id: 810010, first_name: "Jennifer", last_name: "Walsh", name: "Jennifer Walsh", meta_type: "Family Medicine" },
    { id: 810011, first_name: "Marcus", last_name: "Green", name: "Marcus Green", meta_type: "Family Medicine" },
    { id: 810012, first_name: "Aisha", last_name: "Rahman", name: "Aisha Rahman", meta_type: "OB-GYN" },
    { id: 810013, first_name: "Thomas", last_name: "Erikson", name: "Thomas Erikson", meta_type: "Endocrinologist" },
  ],
  // --- Metro Pediatric & Urgent Care ---
  90103: [
    { id: 810020, first_name: "Laura", last_name: "Simmons", name: "Laura Simmons", meta_type: "Pediatrician", rating: 4.1, reviews_count: 78, insurance_accepted: ["Blue Cross Blue Shield", "Aetna"], distance_mi: 8.2, review_summary: "Good pediatrician. Not suitable for adult orthopedic issues.", known_limitations: ["pediatric only"] },
    { id: 810021, first_name: "Kevin", last_name: "Nakamura", name: "Kevin Nakamura", meta_type: "Pediatrician", rating: 3.9, reviews_count: 45, insurance_accepted: ["UnitedHealthcare"], distance_mi: 8.2, review_summary: "Decent pediatric care. Limited to children.", known_limitations: ["pediatric only"] },
    { id: 810022, first_name: "Diana", last_name: "Ruiz", name: "Diana Ruiz", meta_type: "Urgent Care", rating: 3.2, reviews_count: 23, insurance_accepted: ["Aetna", "Humana"], distance_mi: 8.2, review_summary: "Basic urgent care. Multiple reviews mention no X-ray machine on-site. Only nurse practitioners on weekends. Long wait times.", known_limitations: ["no X-ray machine", "nurse practitioners only on weekends", "long wait times"] },
    { id: 810023, first_name: "Brian", last_name: "O'Connor", name: "Brian O'Connor", meta_type: "Urgent Care", rating: 3.5, reviews_count: 31, insurance_accepted: ["Blue Cross Blue Shield"], distance_mi: 8.2, review_summary: "Adequate for minor issues. Reviews note they refer fracture cases to hospital ER. No orthopedic specialist on staff.", known_limitations: ["no orthopedic specialist", "refers fractures to ER"] },
  ],
  // --- Sunrise Main Campus ---
  90201: [
    { id: 820001, first_name: "Catherine", last_name: "Bell", name: "Catherine Bell", meta_type: "Internal Medicine" },
    { id: 820002, first_name: "Andrew", last_name: "Hoffman", name: "Andrew Hoffman", meta_type: "Pulmonologist" },
    { id: 820003, first_name: "Natalie", last_name: "Stone", name: "Natalie Stone", meta_type: "Oncologist" },
    { id: 820004, first_name: "Richard", last_name: "Vasquez", name: "Richard Vasquez", meta_type: "Urologist" },
    { id: 820005, first_name: "Grace", last_name: "Liu", name: "Grace Liu", meta_type: "Allergist" },
    { id: 820006, first_name: "Samuel", last_name: "Osei", name: "Samuel Osei", meta_type: "ENT" },
  ],
  // --- Sunrise Women's Health Center ---
  90202: [
    { id: 820010, first_name: "Michelle", last_name: "Park", name: "Michelle Park", meta_type: "OB-GYN" },
    { id: 820011, first_name: "Angela", last_name: "Moretti", name: "Angela Moretti", meta_type: "OB-GYN" },
    { id: 820012, first_name: "Heather", last_name: "Collins", name: "Heather Collins", meta_type: "Reproductive Endocrinologist" },
    { id: 820013, first_name: "Jasmine", last_name: "Kaur", name: "Jasmine Kaur", meta_type: "Breast Surgeon" },
  ],
  // --- Sunrise Orthopedic & Sports Medicine ---
  90203: [
    { id: 820020, first_name: "Derek", last_name: "Hamilton", name: "Derek Hamilton", meta_type: "Orthopedic Surgeon", rating: 4.8, reviews_count: 312, phone_number: "+14804080760", insurance_accepted: ["Blue Cross Blue Shield", "Aetna", "UnitedHealthcare", "Cigna"], distance_mi: 2.1, review_summary: "Excellent orthopedic surgeon. Patients praise quick diagnosis, on-site X-ray and MRI. Short wait times. Great bedside manner.", known_limitations: [] },
    { id: 820021, first_name: "Victor", last_name: "Petrov", name: "Victor Petrov", meta_type: "Orthopedic Surgeon", rating: 4.5, reviews_count: 187, phone_number: "+19174351160", insurance_accepted: ["Blue Cross Blue Shield", "Aetna", "Medicare"], distance_mi: 4.3, review_summary: "Very knowledgeable orthopedic specialist. Has on-site imaging. Some patients mention longer wait times during peak hours.", known_limitations: [] },
    { id: 820022, first_name: "Megan", last_name: "Doyle", name: "Megan Doyle", meta_type: "Orthopedic Surgeon", rating: 4.2, reviews_count: 95, phone_number: "+16315684450", insurance_accepted: ["UnitedHealthcare", "Humana", "Tricare"], distance_mi: 6.7, review_summary: "Good orthopedic care. Newer practice. Some reviews mention referrals to external imaging center for X-rays.", known_limitations: ["external imaging referral for X-rays"] },
    { id: 820023, first_name: "Chris", last_name: "Tanaka", name: "Chris Tanaka", meta_type: "Rheumatologist", rating: 4.6, reviews_count: 210, phone_number: "+16025551400", insurance_accepted: ["Blue Cross Blue Shield", "Cigna"], distance_mi: 5.0, review_summary: "Top rheumatologist. Not ideal for acute fractures — specializes in chronic joint conditions.", known_limitations: ["not equipped for acute fracture care"] },
    { id: 820024, first_name: "Nina", last_name: "Alvarez", name: "Nina Alvarez", meta_type: "Sports Medicine", rating: 4.3, reviews_count: 145, phone_number: "+16025551500", insurance_accepted: ["Aetna", "UnitedHealthcare", "Blue Cross Blue Shield"], distance_mi: 3.8, review_summary: "Great for sports injuries and rehab. Has basic imaging on-site. Good for follow-up care after fracture treatment.", known_limitations: [] },
  ],
};

// ---------------------------------------------------------------------------
// Appointment Types (per location)
// ---------------------------------------------------------------------------
export const SEED_APPOINTMENT_TYPES: Record<number, NexHealthAppointmentType[]> = {
  // Dental locations share similar types
  346811: [
    { id: 1188164, name: "New patient exam and cleaning", minutes: 60 },
    { id: 1188165, name: "Existing patient exam and cleaning", minutes: 60 },
    { id: 1188166, name: "Emergency visit", minutes: 30 },
    { id: 1188167, name: "Consultation", minutes: 30 },
    { id: 1188169, name: "Existing Patient Exam & Cleaning", minutes: 45 },
    { id: 1188170, name: "Invisalign Consultation", minutes: 60 },
    { id: 1188171, name: "Root Canal", minutes: 45 },
    { id: 1188172, name: "Filling", minutes: 30 },
    { id: 1188173, name: "Extraction", minutes: 45 },
    { id: 1188168, name: "New Patient Appointment", minutes: 30 },
  ],
  346884: [
    { id: 1190001, name: "New Patient Exam", minutes: 60 },
    { id: 1190002, name: "Cleaning", minutes: 45 },
    { id: 1190003, name: "Oral Surgery Consultation", minutes: 30 },
    { id: 1190004, name: "Periodontal Treatment", minutes: 60 },
    { id: 1190005, name: "Pediatric Dental Exam", minutes: 30 },
    { id: 1190006, name: "Crown & Bridge Consultation", minutes: 45 },
  ],
  // Metro Downtown Clinic
  90101: [
    { id: 2001, name: "New Patient Visit", minutes: 45 },
    { id: 2002, name: "Follow-up Visit", minutes: 20 },
    { id: 2003, name: "Annual Physical", minutes: 60 },
    { id: 2004, name: "Cardiology Consultation", minutes: 45 },
    { id: 2005, name: "Dermatology Consultation", minutes: 30 },
    { id: 2006, name: "GI Consultation", minutes: 45 },
    { id: 2007, name: "Neurology Consultation", minutes: 45 },
    { id: 2008, name: "Psychiatry Initial Evaluation", minutes: 60 },
    { id: 2009, name: "Psychiatry Follow-up", minutes: 30 },
  ],
  // Metro Lakeview Family Practice
  90102: [
    { id: 2101, name: "New Patient Visit", minutes: 45 },
    { id: 2102, name: "Follow-up Visit", minutes: 20 },
    { id: 2103, name: "Well-Woman Exam", minutes: 45 },
    { id: 2104, name: "Prenatal Visit", minutes: 30 },
    { id: 2105, name: "Diabetes Management", minutes: 30 },
    { id: 2106, name: "Annual Physical", minutes: 60 },
  ],
  // Metro Pediatric & Urgent Care
  90103: [
    { id: 2201, name: "Pediatric Well-Child Visit", minutes: 30 },
    { id: 2202, name: "Pediatric Sick Visit", minutes: 20 },
    { id: 2203, name: "Urgent Care Walk-In", minutes: 20 },
    { id: 2204, name: "Sports Physical", minutes: 30 },
    { id: 2205, name: "Immunizations", minutes: 15 },
  ],
  // Sunrise Main Campus
  90201: [
    { id: 3001, name: "New Patient Visit", minutes: 45 },
    { id: 3002, name: "Follow-up Visit", minutes: 20 },
    { id: 3003, name: "Pulmonology Consultation", minutes: 45 },
    { id: 3004, name: "Oncology Consultation", minutes: 60 },
    { id: 3005, name: "Urology Consultation", minutes: 30 },
    { id: 3006, name: "Allergy Testing", minutes: 60 },
    { id: 3007, name: "ENT Consultation", minutes: 30 },
    { id: 3008, name: "Annual Physical", minutes: 60 },
  ],
  // Sunrise Women's Health Center
  90202: [
    { id: 3101, name: "OB-GYN New Patient", minutes: 45 },
    { id: 3102, name: "Prenatal Visit", minutes: 30 },
    { id: 3103, name: "Well-Woman Exam", minutes: 45 },
    { id: 3104, name: "Fertility Consultation", minutes: 60 },
    { id: 3105, name: "Breast Health Screening", minutes: 30 },
  ],
  // Sunrise Orthopedic & Sports Medicine
  90203: [
    { id: 3201, name: "Orthopedic Consultation", minutes: 30 },
    { id: 3202, name: "Sports Medicine Evaluation", minutes: 45 },
    { id: 3203, name: "Physical Therapy Initial Eval", minutes: 60 },
    { id: 3204, name: "Physical Therapy Follow-up", minutes: 45 },
    { id: 3205, name: "Rheumatology Consultation", minutes: 45 },
    { id: 3206, name: "Pain Management Consultation", minutes: 30 },
    { id: 3207, name: "Joint Injection", minutes: 20 },
  ],
};

// ---------------------------------------------------------------------------
// Seed Patients (pre-populated for testing)
// ---------------------------------------------------------------------------
export const SEED_PATIENTS: Record<number, NexHealthPatient[]> = {
  346811: [
    { id: 143776, first_name: "John", last_name: "Smith", name: "John Smith", email: "john.smith@example.com", created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z", bio: { phone_number: "2125559001", date_of_birth: "1985-03-12" } },
    { id: 143777, first_name: "Jane", last_name: "Doe", name: "Jane Doe", email: "jane.doe@example.com", created_at: "2024-02-20T10:00:00Z", updated_at: "2024-02-20T10:00:00Z", bio: { phone_number: "2125559002", date_of_birth: "1990-07-25" } },
  ],
  90101: [
    { id: 500001, first_name: "Alice", last_name: "Johnson", name: "Alice Johnson", email: "alice.j@example.com", created_at: "2024-03-01T10:00:00Z", updated_at: "2024-03-01T10:00:00Z", bio: { phone_number: "3125559010", date_of_birth: "1978-11-05" } },
    { id: 500002, first_name: "Bob", last_name: "Williams", name: "Bob Williams", email: "bob.w@example.com", created_at: "2024-03-15T10:00:00Z", updated_at: "2024-03-15T10:00:00Z", bio: { phone_number: "3125559011", date_of_birth: "1965-06-18" } },
  ],
  90201: [
    { id: 500010, first_name: "Carlos", last_name: "Rivera", name: "Carlos Rivera", email: "carlos.r@example.com", created_at: "2024-04-01T10:00:00Z", updated_at: "2024-04-01T10:00:00Z", bio: { phone_number: "6025559020", date_of_birth: "1992-01-30" } },
  ],
};

// ---------------------------------------------------------------------------
// Slot generation helper
// ---------------------------------------------------------------------------

/**
 * Generates realistic appointment slots for a provider over a date range.
 * Slots are weekdays only, 9 AM–5 PM, every 30 minutes, with ~30% randomly removed
 * to simulate a partially-booked schedule.
 */
export function generateMockSlots(
  providerId: number,
  locationId: number,
  startDate: string,
  days: number,
  operatoryIdBase: number = 7000,
): { time: string; operatory_id: number; provider_id: number }[] {
  const slots: { time: string; operatory_id: number; provider_id: number }[] = [];
  const start = new Date(startDate + "T00:00:00");
  const operatoryId = operatoryIdBase + (providerId % 100);

  for (let d = 0; d < days; d++) {
    const day = new Date(start);
    day.setDate(day.getDate() + d);

    // Skip weekends
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue;

    // Generate slots from 9:00 to 16:30 (last slot starts at 16:30)
    for (let hour = 9; hour < 17; hour++) {
      for (const minute of [0, 30]) {
        // Randomly skip ~30% of slots to simulate bookings
        if (seededRandom(providerId, d, hour, minute) < 0.3) continue;

        const slotTime = new Date(day);
        slotTime.setHours(hour, minute, 0, 0);

        slots.push({
          time: slotTime.toISOString(),
          operatory_id: operatoryId,
          provider_id: providerId,
        });
      }
    }
  }

  return slots;
}

/** Simple deterministic pseudo-random so mock data is stable across runs */
function seededRandom(a: number, b: number, c: number, d: number): number {
  let seed = ((a * 2654435761) ^ (b * 2246822519) ^ (c * 3266489917) ^ (d * 668265263)) >>> 0;
  seed = ((seed ^ (seed >> 16)) * 2246822507) >>> 0;
  seed = ((seed ^ (seed >> 13)) * 3266489909) >>> 0;
  seed = (seed ^ (seed >> 16)) >>> 0;
  return seed / 4294967296;
}
