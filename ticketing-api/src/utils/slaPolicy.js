const sameDayPriorities = new Set(["LOW", "MEDIUM"]);

const extendedRepairKeywords = [
  "major repair",
  "large repair",
  "replacement",
  "replace unit",
  "replace panel",
  "structural",
  "ceiling damage",
  "ceiling collapse",
  "wall damage",
  "renovation",
  "rebuild",
  "part order",
  "replacement part",
  "spare part",
  "extensive",
  "full service",
  "compressor",
  "rewiring",
  "pipe burst repair",
];

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getStandardSlaHours(priority) {
  return sameDayPriorities.has(priority) ? 12 : 48;
}

export function detectExtendedRepair({ title = "", description = "", category = "" }) {
  const combinedText = `${title} ${description} ${category}`.trim().toLowerCase();
  return includesAny(combinedText, extendedRepairKeywords);
}

export function resolveSlaPlan({
  priority,
  title = "",
  description = "",
  category = "",
  providedSlaHours,
}) {
  const baseHours = getStandardSlaHours(priority);
  const numericProvidedHours = Number(providedSlaHours);
  const hasProvidedHours =
    Number.isFinite(numericProvidedHours) && numericProvidedHours > 0;
  const autoExtended = detectExtendedRepair({ title, description, category });
  const extendedHours = sameDayPriorities.has(priority) ? 48 : 72;
  const targetHours = hasProvidedHours
    ? numericProvidedHours
    : autoExtended
      ? extendedHours
      : baseHours;

  return {
    baseHours,
    targetHours,
    requiresExtendedResolution: targetHours > baseHours,
  };
}

export function getSlaBucket({ priority, slaHours }) {
  return slaHours > getStandardSlaHours(priority)
    ? "EXTENDED"
    : sameDayPriorities.has(priority)
      ? "SAME_DAY"
      : "TWO_DAY";
}
