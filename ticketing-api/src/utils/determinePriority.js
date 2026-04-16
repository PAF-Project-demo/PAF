const categoryMap = {
  HVAC: "Air Conditioning",
  Electrical: "Electricity / Lighting",
  Plumbing: "Water / Plumbing",
  Networking: "Internet / Wi-Fi",
  "AV Equipment": "Classroom Equipment",
  "Access Control": "Access / Security",
  Security: "Access / Security",
  Cleaning: "Cleaning / Housekeeping",
};

const criticalKeywords = [
  "fire",
  "smoke",
  "sparks",
  "sparking",
  "flood",
  "flooding",
  "burst pipe",
  "electrocution",
  "injury",
  "injured",
  "unsafe",
  "security breach",
  "cannot enter",
  "locked out",
  "gas leak",
];

const highKeywords = [
  "leak",
  "water",
  "no power",
  "power outage",
  "outage",
  "ceiling",
  "short circuit",
  "internet down",
  "wifi down",
  "network down",
  "overheating",
  "urgent",
  "immediately",
  "asap",
  "whole class",
  "whole building",
  "everyone affected",
  "lab closed",
];

const mediumKeywords = [
  "not working",
  "broken",
  "damaged",
  "fault",
  "issue",
  "stopped",
  "intermittent",
  "not turning on",
  "cannot use",
];

const lowKeywords = [
  "request",
  "replace",
  "routine",
  "cleaning",
  "dust",
  "minor",
  "cosmetic",
  "loose",
];

function normalizeCategory(category) {
  return categoryMap[category] ?? category;
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function determinePriority({ type, category, title, description }) {
  const normalizedCategory = normalizeCategory(category);
  const text = `${title ?? ""} ${description ?? ""}`.trim().toLowerCase();

  if (includesAny(text, criticalKeywords)) {
    return "CRITICAL";
  }

  if (type === "INCIDENT") {
    if (
      ["Water / Plumbing", "Electricity / Lighting", "Access / Security"].includes(
        normalizedCategory
      ) ||
      includesAny(text, highKeywords)
    ) {
      return "HIGH";
    }

    if (includesAny(text, lowKeywords)) {
      return "MEDIUM";
    }

    return "HIGH";
  }

  if (
    ["Air Conditioning", "Electricity / Lighting", "Water / Plumbing"].includes(
      normalizedCategory
    ) &&
    includesAny(text, highKeywords)
  ) {
    return "HIGH";
  }

  if (
    ["Classroom Equipment", "Internet / Wi-Fi", "Furniture / Facility Damage"].includes(
      normalizedCategory
    ) ||
    includesAny(text, mediumKeywords)
  ) {
    return "MEDIUM";
  }

  if (
    ["Cleaning / Housekeeping", "Other"].includes(normalizedCategory) ||
    includesAny(text, lowKeywords)
  ) {
    return "LOW";
  }

  return "MEDIUM";
}
