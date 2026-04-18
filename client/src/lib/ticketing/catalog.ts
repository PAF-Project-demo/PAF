export const STUDENT_TICKET_CATEGORIES = [
  "Air Conditioning",
  "Electricity / Lighting",
  "Water / Plumbing",
  "Internet / Wi-Fi",
  "Classroom Equipment",
  "Access / Security",
  "Cleaning / Housekeeping",
  "Furniture / Facility Damage",
  "Other",
] as const;

const legacyCategoryMap: Record<string, string> = {
  HVAC: "Air Conditioning",
  Electrical: "Electricity / Lighting",
  Plumbing: "Water / Plumbing",
  Networking: "Internet / Wi-Fi",
  "AV Equipment": "Classroom Equipment",
  "Access Control": "Access / Security",
  Security: "Access / Security",
  Cleaning: "Cleaning / Housekeeping",
};

export function normalizeTicketCategory(category: string) {
  return legacyCategoryMap[category] ?? category;
}
