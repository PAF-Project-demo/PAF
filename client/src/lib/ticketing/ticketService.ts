import { getStoredAuthSession, parseResponsePayload } from "../auth";
import {
  applyTicketFilters,
  buildDashboardSummary,
  buildReports,
  canManageTickets,
  isTicketOverdue,
} from "./helpers";
import {
  normalizeTicketCategory,
  STUDENT_TICKET_CATEGORIES,
} from "./catalog";
import { initialMockTicketingData, type TicketingMockDatabase } from "./mockData";
import { resolveSlaPlan } from "./sla";
import type {
  CreateTicketInput,
  DashboardSummary,
  TicketFilters,
  TicketListResult,
  TicketMeta,
  TicketRecord,
  TicketReports,
  TicketRole,
  TicketStatus,
  TicketUser,
  UpdateTicketInput,
} from "./types";

const STORAGE_KEY = "paf.ticketing.mock-db.v1";
const API_ENABLED = import.meta.env.VITE_TICKETING_ENABLE_API === "true";
const API_BASE_URL = (import.meta.env.VITE_TICKETING_API_BASE_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
);
function getTicketingApiToken() {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_TICKETING_API_TOKEN ?? null;
  }

  return (
    import.meta.env.VITE_TICKETING_API_TOKEN ??
    window.localStorage.getItem("paf.ticketing.jwt") ??
    window.sessionStorage.getItem("paf.ticketing.jwt")
  );
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCurrentRole(role?: string | null): TicketRole {
  if (role === "ADMIN" || role === "TECHNICIAN") {
    return role;
  }

  return "USER";
}

function getCurrentTicketUser(db: TicketingMockDatabase): TicketUser {
  const session = getStoredAuthSession();
  if (!session) {
    return db.users.find((user) => user.role === "USER") ?? db.users[0];
  }

  const mappedRole = getCurrentRole(session.role);
  const existingUser = db.users.find((user) => user.email === session.email);
  if (existingUser) {
    return {
      ...existingUser,
      fullName: session.displayName ?? existingUser.fullName,
      role: mappedRole,
    };
  }

  return {
    id: session.userId,
    fullName: session.displayName ?? session.email.split("@")[0],
    email: session.email,
    role: mappedRole,
  };
}

function normalizeTickets(tickets: TicketRecord[]) {
  return tickets.map((ticket) => ({
    ...ticket,
    category: normalizeTicketCategory(ticket.category),
    overdue: isTicketOverdue(ticket),
  }));
}

function readMockDb(): TicketingMockDatabase {
  if (typeof window === "undefined") {
    return initialMockTicketingData;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockTicketingData));
    return initialMockTicketingData;
  }

  try {
    const parsed = JSON.parse(raw) as TicketingMockDatabase;
    return {
      ...parsed,
      tickets: normalizeTickets(parsed.tickets),
    };
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockTicketingData));
    return initialMockTicketingData;
  }
}

function writeMockDb(db: TicketingMockDatabase) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...db,
      tickets: normalizeTickets(db.tickets),
    })
  );
}

function buildMeta(db: TicketingMockDatabase): TicketMeta {
  return {
    types: ["MAINTENANCE", "INCIDENT"],
    priorities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    statuses: ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"],
    categories: [...STUDENT_TICKET_CATEGORIES],
    technicians: db.users.filter((user) => user.role === "TECHNICIAN" || user.role === "ADMIN"),
  };
}

function createTicketId(tickets: TicketRecord[]) {
  const sequence = String(tickets.length + 1).padStart(4, "0");
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TCK-${datePart}-${sequence}`;
}

function accessScopeTickets(db: TicketingMockDatabase) {
  const currentUser = getCurrentTicketUser(db);
  if (currentUser.role === "USER") {
    return db.tickets.filter((ticket) => ticket.reporter.email === currentUser.email);
  }

  return db.tickets;
}

function assertWorkflowPermission(role?: string | null) {
  if (!canManageTickets(role)) {
    throw new Error("Only technicians and admins can update ticket workflow.");
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const apiToken = getTicketingApiToken();
  if (apiToken) {
    headers.set("Authorization", `Bearer ${apiToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const rawResponse = await response.text();
    const payload = parseResponsePayload<{ message?: string }>(rawResponse);
    const message =
      payload?.message?.trim() ||
      `Ticketing API request failed with ${response.status}.`;

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchTicketMeta(): Promise<TicketMeta> {
  if (API_ENABLED) {
    try {
      return await apiFetch<TicketMeta>("/api/tickets/meta");
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  return buildMeta(readMockDb());
}

export async function fetchTickets(filters: TicketFilters = {}): Promise<TicketListResult> {
  if (API_ENABLED) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.status) params.set("status", filters.status);
      if (filters.category) params.set("category", filters.category);
      if (filters.location) params.set("location", filters.location);
      if (filters.assignedTechnicianId) {
        params.set("assignedTechnicianId", filters.assignedTechnicianId);
      }
      if (filters.overdueOnly) params.set("overdue", "true");

      const response = await apiFetch<{
        items: TicketRecord[];
        pagination?: { total: number };
      }>(`/api/tickets${params.toString() ? `?${params.toString()}` : ""}`);

      return {
        items: response.items,
        total: response.pagination?.total ?? response.items.length,
      };
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const items = applyTicketFilters(accessScopeTickets(db), filters).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );

  return {
    items,
    total: items.length,
  };
}

export async function fetchTicketById(ticketId: string): Promise<TicketRecord> {
  if (API_ENABLED) {
    try {
      return await apiFetch<TicketRecord>(`/api/tickets/${ticketId}`);
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const ticket = accessScopeTickets(db).find((item) => item.id === ticketId);

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  return ticket;
}

export async function createTicket(input: CreateTicketInput): Promise<TicketRecord> {
  if (API_ENABLED) {
    const created = await apiFetch<TicketRecord>("/api/tickets", {
      method: "POST",
      body: JSON.stringify({
        title: input.title.trim(),
        description: input.description.trim(),
        type: input.type,
        priority: input.priority,
        category: input.category.trim(),
        location: {
          ...input.location,
          building: input.location.building.trim(),
          floor: input.location.floor?.trim() ?? "",
          room: input.location.room?.trim() ?? "",
          campus: input.location.campus?.trim() ?? "",
          note: input.location.note?.trim() ?? "",
        },
      }),
    });

    if (input.attachments?.length) {
      const formData = new FormData();
      input.attachments.forEach((file) => formData.append("attachments", file));
      return await apiFetch<TicketRecord>(`/api/tickets/${created.id}/attachments`, {
        method: "POST",
        body: formData,
      });
    }

    return created;
  }

  const db = readMockDb();
  const currentUser = getCurrentTicketUser(db);
  const now = new Date();
  const slaPlan = resolveSlaPlan({
    priority: input.priority,
    title: input.title,
    description: input.description,
    category: input.category,
    providedSlaHours: input.slaHours,
  });

  const attachments =
    input.attachments?.map((file) => ({
      id: uid("attachment"),
      fileName: file.name.replace(/\s+/g, "-").toLowerCase(),
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      url: "#",
      uploadedAt: now.toISOString(),
      uploadedBy: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        role: currentUser.role,
      },
    })) ?? [];

  const newTicket: TicketRecord = {
    id: uid("ticket"),
    ticketId: createTicketId(db.tickets),
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    priority: input.priority,
    category: normalizeTicketCategory(input.category.trim()),
    status: "OPEN",
    location: {
      ...input.location,
      note: input.type === "INCIDENT" ? input.location.note : "",
    },
    reporter: currentUser,
    assignedTechnician: null,
    slaHours: slaPlan.targetHours,
    dueAt: new Date(now.getTime() + slaPlan.targetHours * 60 * 60 * 1000).toISOString(),
    overdue: false,
    attachments,
    comments: [],
    activity: [
      {
        id: uid("activity"),
        action: "TICKET_CREATED",
        message: `Ticket created with ${input.priority} priority.`,
        createdAt: now.toISOString(),
        actor: {
          id: currentUser.id,
          fullName: currentUser.fullName,
          role: currentUser.role,
        },
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.tickets = [newTicket, ...db.tickets];
  writeMockDb(db);
  return newTicket;
}

export async function updateTicket(ticketId: string, input: UpdateTicketInput) {
  if (API_ENABLED) {
    try {
      return await apiFetch<TicketRecord>(`/api/tickets/${ticketId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const currentUser = getCurrentTicketUser(db);
  assertWorkflowPermission(currentUser.role);
  const ticketIndex = db.tickets.findIndex((ticket) => ticket.id === ticketId);

  if (ticketIndex < 0) {
    throw new Error("Ticket not found");
  }

  const previous = db.tickets[ticketIndex];
  const updated = {
    ...previous,
    ...input,
    updatedAt: new Date().toISOString(),
  } satisfies TicketRecord;

  if (
    input.priority ||
    input.slaHours ||
    input.description ||
    input.category
  ) {
    const slaPlan = resolveSlaPlan({
      priority: updated.priority,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      providedSlaHours: input.slaHours,
    });
    updated.slaHours = slaPlan.targetHours;
    updated.dueAt = new Date(
      Date.parse(updated.createdAt) + slaPlan.targetHours * 60 * 60 * 1000
    ).toISOString();
  }

  if (input.status === "RESOLVED" && previous.status !== "RESOLVED") {
    updated.resolvedAt = updated.updatedAt;
  }

  if (input.status === "CLOSED" && previous.status !== "CLOSED") {
    updated.closedAt = updated.updatedAt;
  }

  if (input.status && !["RESOLVED", "CLOSED"].includes(input.status)) {
    updated.closedAt = null;
    if (input.status !== "RESOLVED") {
      updated.resolvedAt = null;
    }
  }

  updated.overdue = isTicketOverdue(updated);
  updated.activity = [
    {
      id: uid("activity"),
      action: input.status ? "STATUS_CHANGED" : "TICKET_UPDATED",
      message: input.status
        ? `Ticket moved to ${input.status.replace(/_/g, " ")}.`
        : "Ticket updated.",
      createdAt: updated.updatedAt,
      actor: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        role: currentUser.role,
      },
    },
    ...updated.activity,
  ];

  db.tickets[ticketIndex] = updated;
  writeMockDb(db);
  return updated;
}

export async function assignTechnician(ticketId: string, technicianId: string) {
  if (API_ENABLED) {
    try {
      return await apiFetch<TicketRecord>(`/api/tickets/${ticketId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ technicianId }),
      });
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const currentUser = getCurrentTicketUser(db);
  if (currentUser.role !== "ADMIN") {
    throw new Error("Only admins can assign technicians.");
  }
  const technician = db.users.find((user) => user.id === technicianId);
  if (!technician) {
    throw new Error("Technician not found");
  }

  return updateTicket(ticketId, {
    status: "IN_PROGRESS",
    assignedTechnician: technician,
  });
}

export async function addTicketComment(ticketId: string, message: string) {
  if (API_ENABLED) {
    try {
      return await apiFetch<TicketRecord>(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const currentUser = getCurrentTicketUser(db);
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const comment = {
    id: uid("comment"),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    author: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      role: currentUser.role,
    },
  };

  ticket.comments = [...ticket.comments, comment];
  ticket.activity = [
    {
      id: uid("activity"),
      action: "COMMENT_ADDED",
      message: "Comment added.",
      createdAt: comment.createdAt,
      actor: comment.author,
    },
    ...ticket.activity,
  ];
  ticket.updatedAt = comment.createdAt;

  writeMockDb(db);
  return ticket;
}

export async function uploadTicketAttachments(ticketId: string, files: File[]) {
  if (API_ENABLED) {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("attachments", file));
      return await apiFetch<TicketRecord>(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
      });
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  const currentUser = getCurrentTicketUser(db);
  const ticket = db.tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const uploadedAt = new Date().toISOString();
  const attachments = files.map((file) => ({
    id: uid("attachment"),
    fileName: file.name.replace(/\s+/g, "-").toLowerCase(),
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    url: "#",
    uploadedAt,
    uploadedBy: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      role: currentUser.role,
    },
  }));

  ticket.attachments = [...ticket.attachments, ...attachments];
  ticket.activity = [
    {
      id: uid("activity"),
      action: "ATTACHMENT_UPLOADED",
      message: `${attachments.length} attachment(s) uploaded.`,
      createdAt: uploadedAt,
      actor: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        role: currentUser.role,
      },
    },
    ...ticket.activity,
  ];
  ticket.updatedAt = uploadedAt;
  writeMockDb(db);
  return ticket;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  if (API_ENABLED) {
    try {
      const response = await apiFetch<{
        cards: DashboardSummary["cards"];
        charts: {
          statusBreakdown: Array<{ _id: string; count: number }>;
          priorityBreakdown: Array<{ _id: string; count: number }>;
          typeBreakdown: Array<{ _id: string; count: number }>;
          slaBreakdown: Array<{ _id: string; count: number }>;
          monthlyTrend: Array<{ label: string; created: number }>;
        };
        recentTickets: TicketRecord[];
      }>("/api/dashboard");

      return {
        cards: response.cards,
        charts: {
          statusBreakdown: response.charts.statusBreakdown.map((item) => ({
            label: item._id,
            value: item.count,
          })),
          priorityBreakdown: response.charts.priorityBreakdown.map((item) => ({
            label: item._id,
            value: item.count,
          })),
          typeBreakdown: response.charts.typeBreakdown.map((item) => ({
            label: item._id,
            value: item.count,
          })),
          slaBreakdown: response.charts.slaBreakdown.map((item) => ({
            label: item._id,
            value: item.count,
          })),
          monthlyTrend: response.charts.monthlyTrend,
        },
        recentTickets: response.recentTickets,
      };
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  return buildDashboardSummary(accessScopeTickets(db));
}

export async function fetchReports(): Promise<TicketReports> {
  if (API_ENABLED) {
    try {
      const response = await apiFetch<{
        summary: TicketReports["summary"];
        categoryBreakdown: Array<{ _id: string; count: number }>;
        technicianWorkload: Array<{ _id: string; count: number }>;
        typeBreakdown: Array<{ _id: string; count: number }>;
      }>("/api/reports");

      return {
        summary: response.summary,
        categoryBreakdown: response.categoryBreakdown.map((item) => ({
          label: item._id,
          value: item.count,
        })),
        technicianWorkload: response.technicianWorkload.map((item) => ({
          label: item._id,
          value: item.count,
        })),
        typeBreakdown: response.typeBreakdown.map((item) => ({
          label: item._id,
          value: item.count,
        })),
      };
    } catch {
      // Fall back to local mock state for this workspace.
    }
  }

  const db = readMockDb();
  return buildReports(accessScopeTickets(db));
}

export async function deleteTicket(ticketId: string) {
  const db = readMockDb();
  db.tickets = db.tickets.filter((ticket) => ticket.id !== ticketId);
  writeMockDb(db);
}

export function getCurrentUserRole() {
  return getCurrentRole(getStoredAuthSession()?.role);
}

export function getAvailableStatuses(): TicketStatus[] {
  return ["OPEN", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"];
}
