import type { TicketPriority, TicketRecord } from "./types";

export type TicketSlaBucket = "SAME_DAY" | "TWO_DAY" | "EXTENDED";

const sameDayPriorities = new Set<TicketPriority>(["LOW", "MEDIUM"]);

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

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function getStandardSlaHours(priority: TicketPriority) {
  return sameDayPriorities.has(priority) ? 12 : 48;
}

export function detectExtendedRepair(input: {
  title?: string;
  description?: string;
  category?: string;
}) {
  const combinedText = `${input.title ?? ""} ${input.description ?? ""} ${input.category ?? ""}`
    .trim()
    .toLowerCase();

  return includesAny(combinedText, extendedRepairKeywords);
}

export function resolveSlaPlan(input: {
  priority: TicketPriority;
  title?: string;
  description?: string;
  category?: string;
  providedSlaHours?: number;
}) {
  const baseHours = getStandardSlaHours(input.priority);
  const hasProvidedHours =
    Number.isFinite(Number(input.providedSlaHours)) && Number(input.providedSlaHours) > 0;
  const extendedHours = sameDayPriorities.has(input.priority) ? 48 : 72;
  const targetHours = hasProvidedHours
    ? Number(input.providedSlaHours)
    : detectExtendedRepair(input)
      ? extendedHours
      : baseHours;
  const requiresExtendedResolution = targetHours > baseHours;
  const bucket: TicketSlaBucket = requiresExtendedResolution
    ? "EXTENDED"
    : sameDayPriorities.has(input.priority)
      ? "SAME_DAY"
      : "TWO_DAY";

  return {
    baseHours,
    targetHours,
    requiresExtendedResolution,
    bucket,
  };
}

export function getSlaPlanForTicket(
  ticket: Pick<TicketRecord, "priority" | "slaHours">
) {
  const baseHours = getStandardSlaHours(ticket.priority);
  const requiresExtendedResolution = ticket.slaHours > baseHours;
  const bucket: TicketSlaBucket = requiresExtendedResolution
    ? "EXTENDED"
    : sameDayPriorities.has(ticket.priority)
      ? "SAME_DAY"
      : "TWO_DAY";

  return {
    baseHours,
    targetHours: ticket.slaHours,
    requiresExtendedResolution,
    bucket,
  };
}

export function getSlaBucketForTicket(
  ticket: Pick<TicketRecord, "priority" | "slaHours">
) {
  return getSlaPlanForTicket(ticket).bucket;
}

export function getSlaSummaryText(
  ticket: Pick<TicketRecord, "priority" | "slaHours">
) {
  const plan = getSlaPlanForTicket(ticket);

  if (plan.bucket === "EXTENDED") {
    return "Extended repair window";
  }

  return plan.bucket === "SAME_DAY" ? "Same-day target" : "Up to 2 days";
}

export function getWorkflowGuidance(
  ticket: Pick<TicketRecord, "priority" | "slaHours">
) {
  const plan = getSlaPlanForTicket(ticket);

  if (plan.bucket === "EXTENDED") {
    return "Open -> In Progress -> Pending (if parts or major repair) -> Resolved";
  }

  return plan.bucket === "SAME_DAY"
    ? "Open -> In Progress -> Resolved"
    : "Open -> In Progress -> Resolved, with Pending only when extra work is required";
}
