import { normalizeTicketCategory } from "./catalog";
import type { TicketPriority, TicketType } from "./types";

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

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function determineTicketPriority(input: {
  type: TicketType;
  category: string;
  title: string;
  description: string;
}): TicketPriority {
  const category = normalizeTicketCategory(input.category);
  const text = `${input.title} ${input.description}`.trim().toLowerCase();

  if (includesAny(text, criticalKeywords)) {
    return "CRITICAL";
  }

  if (input.type === "INCIDENT") {
    if (
      ["Water / Plumbing", "Electricity / Lighting", "Access / Security"].includes(
        category
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
      category
    ) &&
    includesAny(text, highKeywords)
  ) {
    return "HIGH";
  }

  if (
    ["Classroom Equipment", "Internet / Wi-Fi", "Furniture / Facility Damage"].includes(
      category
    ) ||
    includesAny(text, mediumKeywords)
  ) {
    return "MEDIUM";
  }

  if (
    ["Cleaning / Housekeeping", "Other"].includes(category) ||
    includesAny(text, lowKeywords)
  ) {
    return "LOW";
  }

  return "MEDIUM";
}
