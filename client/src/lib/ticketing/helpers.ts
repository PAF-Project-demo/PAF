import type {
  DashboardSummary,
  TicketFilters,
  TicketPriority,
  TicketRecord,
  TicketReports,
  TicketRole,
  TicketSlaPolicy,
  TicketStatus,
} from "./types";

const dashboardStatusOrder: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

const dashboardPriorityOrder: TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const closedStatuses: TicketStatus[] = ["RESOLVED", "CLOSED", "CANCELLED"];

const workflowTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["IN_PROGRESS", "ON_HOLD", "RESOLVED", "CANCELLED"],
  ON_HOLD: ["ON_HOLD", "IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["RESOLVED", "CLOSED", "IN_PROGRESS"],
  CLOSED: ["CLOSED"],
  CANCELLED: ["CANCELLED"],
};

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

export function getTicketSlaPolicy(ticket: Pick<TicketRecord, "priority"> & {
  requiresExtendedResolution?: boolean;
}): TicketSlaPolicy {
  if (ticket.requiresExtendedResolution) {
    return {
      targetHours: 72,
      targetLabel: "Extended repair window",
      description: "Major or large repairs can stay open longer with a planned follow-up window.",
      workflowPath: ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED"],
    };
  }

  if (ticket.priority === "HIGH" || ticket.priority === "CRITICAL") {
    return {
      targetHours: 48,
      targetLabel: "2-day target",
      description: "High and critical work is expected to be resolved within about 2 days.",
      workflowPath: ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED"],
    };
  }

  return {
    targetHours: 12,
    targetLabel: "Same-day target",
    description: "Low and medium work should normally move from Open to In Progress to Resolved.",
    workflowPath: ["OPEN", "IN_PROGRESS", "RESOLVED"],
  };
}

export function getTicketDueAt(ticket: Pick<TicketRecord, "createdAt" | "priority"> & {
  requiresExtendedResolution?: boolean;
}) {
  const { targetHours } = getTicketSlaPolicy(ticket);
  return new Date(Date.parse(ticket.createdAt) + targetHours * 60 * 60 * 1000).toISOString();
}

export function synchronizeTicketComputedFields(ticket: TicketRecord): TicketRecord {
  const policy = getTicketSlaPolicy(ticket);
  const dueAt = getTicketDueAt(ticket);

  return {
    ...ticket,
    requiresExtendedResolution: Boolean(ticket.requiresExtendedResolution),
    slaHours: policy.targetHours,
    dueAt,
    overdue: isTicketOverdue({
      dueAt,
      status: ticket.status,
    }),
  };
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

export function getAllowedStatusOptions(ticket: Pick<TicketRecord, "status" | "priority"> & {
  requiresExtendedResolution?: boolean;
}) {
  const nextOptions = workflowTransitions[ticket.status] ?? [ticket.status];

  return nextOptions.filter((status) => {
    if (status !== "ON_HOLD") {
      return true;
    }

    return (
      ticket.requiresExtendedResolution ||
      ticket.priority === "HIGH" ||
      ticket.priority === "CRITICAL"
    );
  });
}

export function canTransitionTicket(
  ticket: Pick<TicketRecord, "status" | "priority"> & { requiresExtendedResolution?: boolean },
  nextStatus: TicketStatus
) {
  return getAllowedStatusOptions(ticket).includes(nextStatus);
}

function getLastSixMonthLabels() {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  });

  return Array.from({ length: 6 }, (_, index) => {
    const current = new Date();
    current.setDate(1);
    current.setMonth(current.getMonth() - (5 - index));
    return formatter.format(current);
  });
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
  const typeMap = new Map<string, number>();
  const slaBucketMap = new Map<string, number>([
    ["Same-day target", 0],
    ["2-day target", 0],
    ["Extended repair window", 0],
  ]);

  tickets.forEach((ticket) => {
    statusMap.set(ticket.status, (statusMap.get(ticket.status) ?? 0) + 1);
    priorityMap.set(ticket.priority, (priorityMap.get(ticket.priority) ?? 0) + 1);
    typeMap.set(ticket.type, (typeMap.get(ticket.type) ?? 0) + 1);
    const slaPolicy = getTicketSlaPolicy(ticket);
    slaBucketMap.set(
      slaPolicy.targetLabel,
      (slaBucketMap.get(slaPolicy.targetLabel) ?? 0) + 1
    );

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
    slaBuckets: [
      {
        label: "Same-day target",
        value: slaBucketMap.get("Same-day target") ?? 0,
        description: "Low and medium priority tickets expected to close within the day.",
      },
      {
        label: "2-day target",
        value: slaBucketMap.get("2-day target") ?? 0,
        description: "High and critical tickets that can take up to around 2 days.",
      },
      {
        label: "Extended repair window",
        value: slaBucketMap.get("Extended repair window") ?? 0,
        description: "Major or large repairs intentionally given extra time.",
      },
    ],
    charts: {
      statusBreakdown: dashboardStatusOrder.map((label) => ({
        label,
        value: statusMap.get(label) ?? 0,
      })),
      priorityBreakdown: dashboardPriorityOrder.map((label) => ({
        label,
        value: priorityMap.get(label) ?? 0,
      })),
      monthlyTrend: getLastSixMonthLabels().map((label) => ({
        label,
        created: monthlyMap.get(label) ?? 0,
      })),
      typeBreakdown: ["MAINTENANCE", "INCIDENT"].map((label) => ({
        label,
        value: typeMap.get(label) ?? 0,
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
