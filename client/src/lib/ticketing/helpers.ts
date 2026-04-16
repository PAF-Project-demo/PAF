import type {
  DashboardSummary,
  TicketFilters,
  TicketPriority,
  TicketRecord,
  TicketReports,
  TicketRole,
  TicketStatus,
} from "./types";

export function formatTicketLocation(ticketLocation: TicketRecord["location"]) {
  return [
    ticketLocation.building,
    ticketLocation.floor ? `Floor ${ticketLocation.floor}` : "",
    ticketLocation.room ? `Room ${ticketLocation.room}` : "",
    ticketLocation.campus ?? "",
  ]
    .filter(Boolean)
    .join(" • ");
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
  const closedStatuses: TicketStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];
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

export function canManageTickets(role?: string | null): role is TicketRole {
  return role === "TECHNICIAN" || role === "ADMIN";
}

export function canViewReports(role?: string | null) {
  return role === "TECHNICIAN" || role === "ADMIN";
}

export function applyTicketFilters(tickets: TicketRecord[], filters: TicketFilters) {
  const search = filters.search?.trim().toLowerCase();

  return tickets.filter((ticket) => {
    if (filters.type && ticket.type !== filters.type) return false;
    if (filters.priority && ticket.priority !== filters.priority) return false;
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.category && ticket.category !== filters.category) return false;
    if (
      filters.assignedTechnicianId &&
      ticket.assignedTechnician?.id !== filters.assignedTechnicianId
    ) {
      return false;
    }
    if (filters.location) {
      const locationText = formatTicketLocation(ticket.location).toLowerCase();
      if (!locationText.includes(filters.location.toLowerCase())) return false;
    }
    if (filters.overdueOnly && !isTicketOverdue(ticket)) return false;

    if (!search) return true;

    const blob = [
      ticket.ticketId,
      ticket.title,
      ticket.description,
      ticket.category,
      formatTicketLocation(ticket.location),
      ticket.reporter.fullName,
      ticket.assignedTechnician?.fullName ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return blob.includes(search);
  });
}

export function buildDashboardSummary(tickets: TicketRecord[]): DashboardSummary {
  const statusMap = new Map<string, number>();
  const priorityMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();

  tickets.forEach((ticket) => {
    statusMap.set(ticket.status, (statusMap.get(ticket.status) ?? 0) + 1);
    priorityMap.set(ticket.priority, (priorityMap.get(ticket.priority) ?? 0) + 1);

    const monthKey = new Date(ticket.createdAt).toLocaleString(undefined, {
      month: "short",
      year: "numeric",
    });
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + 1);
  });

  const resolvedCount = tickets.filter((ticket) =>
    ["RESOLVED", "CLOSED"].includes(ticket.status)
  ).length;

  return {
    cards: {
      totalTickets: tickets.length,
      openTickets: tickets.filter((ticket) =>
        ["OPEN", "IN_PROGRESS", "ON_HOLD"].includes(ticket.status)
      ).length,
      overdueTickets: tickets.filter((ticket) => isTicketOverdue(ticket)).length,
      resolvedRate: tickets.length ? Math.round((resolvedCount / tickets.length) * 100) : 0,
    },
    charts: {
      statusBreakdown: Array.from(statusMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      priorityBreakdown: Array.from(priorityMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      monthlyTrend: Array.from(monthlyMap.entries()).map(([label, created]) => ({
        label,
        created,
      })),
    },
    recentTickets: [...tickets]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 5),
  };
}

export function buildReports(tickets: TicketRecord[]): TicketReports {
  const toPairs = (entries: Map<string, number>) =>
    Array.from(entries.entries()).map(([label, value]) => ({ label, value }));

  const categoryMap = new Map<string, number>();
  const technicianMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  let slaMetTickets = 0;
  let slaBreachedTickets = 0;

  tickets.forEach((ticket) => {
    categoryMap.set(ticket.category, (categoryMap.get(ticket.category) ?? 0) + 1);
    typeMap.set(ticket.type, (typeMap.get(ticket.type) ?? 0) + 1);
    technicianMap.set(
      ticket.assignedTechnician?.fullName ?? "Unassigned",
      (technicianMap.get(ticket.assignedTechnician?.fullName ?? "Unassigned") ?? 0) + 1
    );
  });

  const closedTickets = tickets.filter((ticket) =>
    ["RESOLVED", "CLOSED"].includes(ticket.status)
  );

  closedTickets.forEach((ticket) => {
    const endTime = ticket.resolvedAt ?? ticket.closedAt ?? ticket.updatedAt;
    if (Date.parse(endTime) > Date.parse(ticket.dueAt)) {
      slaBreachedTickets += 1;
    } else {
      slaMetTickets += 1;
    }
  });

  const averageResolutionHours = closedTickets.length
    ? Math.round(
        closedTickets.reduce((sum, ticket) => {
          const endTime = ticket.resolvedAt ?? ticket.closedAt ?? ticket.updatedAt;
          return (
            sum +
            (Date.parse(endTime) - Date.parse(ticket.createdAt)) / (1000 * 60 * 60)
          );
        }, 0) / closedTickets.length
      )
    : 0;

  return {
    summary: {
      averageResolutionHours,
      slaBreachedTickets,
      slaMetTickets,
    },
    categoryBreakdown: toPairs(categoryMap),
    technicianWorkload: toPairs(technicianMap),
    typeBreakdown: toPairs(typeMap),
  };
}
