/**
 * Seed script: Creates providers in Open Dental via their REST API.
 *
 * Once providers exist in Open Dental, the NexHealth Synchronizer will
 * pick them up on the next sync and make them available through the
 * NexHealth API.
 *
 * Usage:
 *   npx tsx scripts/seed-opendental-providers.ts
 *
 * Environment variables (or edit the defaults below):
 *   OPENDENTAL_API_KEY  – "ODFHIR {DeveloperKey}/{CustomerKey}"
 *   OPENDENTAL_BASE_URL – defaults to https://api.opendental.com/api/v1
 */

const BASE_URL =
  process.env.OPENDENTAL_BASE_URL ?? "https://api.opendental.com/api/v1";

// Open Dental public test credentials (from their docs)
const AUTH_HEADER =
  process.env.OPENDENTAL_API_KEY ?? "ODFHIR NFF6i0KrXrxDkZHt/VzkmZEaUWOjnQX2z";

interface ProviderSeed {
  Abbr: string;
  FName: string;
  LName: string;
  Suffix?: string;
  IsSecondary?: string; // "true" for hygienists
  SchedNote?: string;
}

// ---------------------------------------------------------------------------
// Provider data to seed — a mix of dentists, hygienists, and specialists
// ---------------------------------------------------------------------------
const PROVIDERS_TO_SEED: ProviderSeed[] = [
  // Dentists (general)
  {
    Abbr: "DOC3",
    FName: "Maria",
    LName: "Chen",
    Suffix: "DDS",
    SchedNote: "General dentistry, cosmetic procedures",
  },
  {
    Abbr: "DOC4",
    FName: "James",
    LName: "Okafor",
    Suffix: "DMD",
    SchedNote: "General dentistry, pediatric focus",
  },
  {
    Abbr: "DOC5",
    FName: "Priya",
    LName: "Sharma",
    Suffix: "DDS",
    SchedNote: "General dentistry, implants",
  },
  // Orthodontist
  {
    Abbr: "ORT1",
    FName: "David",
    LName: "Kim",
    Suffix: "DDS",
    SchedNote: "Orthodontics, Invisalign certified",
  },
  // Endodontist (root canals)
  {
    Abbr: "END1",
    FName: "Sarah",
    LName: "Patel",
    Suffix: "DMD",
    SchedNote: "Endodontics, root canal specialist",
  },
  // Oral Surgeon
  {
    Abbr: "ORS1",
    FName: "Michael",
    LName: "Torres",
    Suffix: "DDS",
    SchedNote: "Oral surgery, extractions, implant placement",
  },
  // Periodontist
  {
    Abbr: "PER1",
    FName: "Lisa",
    LName: "Nguyen",
    Suffix: "DMD",
    SchedNote: "Periodontics, gum disease treatment",
  },
  // Pediatric Dentist
  {
    Abbr: "PED1",
    FName: "Robert",
    LName: "Garcia",
    Suffix: "DDS",
    SchedNote: "Pediatric dentistry",
  },
  // Prosthodontist
  {
    Abbr: "PRO1",
    FName: "Emily",
    LName: "Johnson",
    Suffix: "DMD",
    SchedNote: "Prosthodontics, crowns, bridges, dentures",
  },
  // Hygienists
  {
    Abbr: "HYG4",
    FName: "Amanda",
    LName: "Williams",
    IsSecondary: "true",
    SchedNote: "Cleanings, preventive care",
  },
  {
    Abbr: "HYG5",
    FName: "Carlos",
    LName: "Rivera",
    IsSecondary: "true",
    SchedNote: "Cleanings, deep scaling",
  },
  {
    Abbr: "HYG6",
    FName: "Rachel",
    LName: "Thompson",
    IsSecondary: "true",
    SchedNote: "Cleanings, pediatric hygiene",
  },
  {
    Abbr: "HYG7",
    FName: "Kevin",
    LName: "Lee",
    IsSecondary: "true",
    SchedNote: "Cleanings, periodontal maintenance",
  },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------

async function createProvider(provider: ProviderSeed): Promise<void> {
  const res = await fetch(`${BASE_URL}/providers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_HEADER,
    },
    body: JSON.stringify(provider),
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(
      `  ✓ Created: ${provider.FName} ${provider.LName} (${provider.Abbr}) → ProvNum ${data.ProvNum}`,
    );
  } else {
    const text = await res.text();
    console.error(
      `  ✗ Failed: ${provider.FName} ${provider.LName} (${provider.Abbr}) — ${res.status}: ${text}`,
    );
  }
}

async function main() {
  console.log(`\nSeeding ${PROVIDERS_TO_SEED.length} providers into Open Dental...`);
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Auth     : ${AUTH_HEADER.slice(0, 20)}...\n`);

  // Open Dental throttles to 1 req/sec for read-only keys, 1 req/5s otherwise.
  // We'll space requests 2s apart to be safe.
  for (const provider of PROVIDERS_TO_SEED) {
    await createProvider(provider);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\nDone! Run a NexHealth sync to pull these providers into your sandbox.");
  console.log(
    "After sync, they'll appear via: GET /providers?subdomain=carenox-inc-demo-practice&location_id=346811",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
