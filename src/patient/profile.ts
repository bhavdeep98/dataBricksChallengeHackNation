/**
 * Patient profile — pre-loaded personal information so the agent
 * doesn't have to ask for name, insurance, phone, etc.
 *
 * In production this would come from a database or auth session.
 * For demo purposes we hardcode it.
 */

export interface PatientProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  insurance: InsuranceInfo;
}

export interface InsuranceInfo {
  provider: string;
  planName: string;
  memberId: string;
  groupNumber: string;
}

/**
 * The current logged-in patient. In production, resolved from auth.
 */
export const CURRENT_PATIENT: PatientProfile = {
  firstName: "Bhavdeep",
  lastName: "Singh",
  fullName: "Bhavdeep Singh",
  phone: "+14804080760",
  email: "bhavdeep@example.com",
  dateOfBirth: "1998-05-15",
  insurance: {
    provider: "Blue Cross Blue Shield",
    planName: "PPO Gold",
    memberId: "BCB-9982341",
    groupNumber: "GRP-44210",
  },
};

/**
 * Check if a provider/location accepts the patient's insurance.
 */
export function acceptsInsurance(
  acceptedInsurances: string[],
  patientInsurance: string,
): boolean {
  const norm = patientInsurance.toLowerCase();
  return acceptedInsurances.some((ins) => {
    const n = ins.toLowerCase();
    // Fuzzy match — "blue cross" matches "Blue Cross Blue Shield"
    return n.includes(norm) || norm.includes(n);
  });
}
