import type { TicketPriority, TicketRecord, TicketStatus } from "./types";

const closedStatuses: TicketStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];

export function formatTicketLocation(ticketLocation: TicketRecord["location"]) {
  return [
    ticketLocation.building,
    ticketLocation.floor ? `Floor ${ticketLocation.floor}` : "",
    ticketLocation.room ? `Room ${ticketLocation.room}` : "",
    ticketLocation.campus ?? "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function isTicketOverdue(ticket: Pick<TicketRecord, "dueAt" | "status">) {
  return !closedStatuses.includes(ticket.status) && new Date(ticket.dueAt) < new Date();
}

export function getStatusColor(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "warning";
    case "IN_PROGRESS":
      return "info";
    case "ON_HOLD":
      return "light";
    case "RESOLVED":
      return "success";
    case "CLOSED":
      return "dark";
    case "CANCELLED":
      return "error";
    default:
      return "light";
  }
}

export function getPriorityTone(priority: TicketPriority) {
  switch (priority) {
    case "LOW":
      return "bg-emerald-500";
    case "MEDIUM":
      return "bg-amber-500";
    case "HIGH":
      return "bg-orange-500";
    case "CRITICAL":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
}

export function getTicketDueLabel(ticket: Pick<TicketRecord, "dueAt" | "status">) {
  const due = new Date(ticket.dueAt).getTime();
  const diffHours = Math.round((due - Date.now()) / (1000 * 60 * 60));

  if (isTicketOverdue(ticket)) {
    return `${Math.abs(diffHours)}h overdue`;
  }

  if (diffHours <= 0) {
    return "Due now";
  }

  return `${diffHours}h remaining`;
}
