import { apiFetch, getApiMessage, parseResponsePayload } from "../auth";
import type {
  CreateTicketInput,
  DashboardSummary,
  EditTicketInput,
  TicketListResult,
  TicketMeta,
  TicketRecord,
  TicketType,
  TicketReports,
  UpdateTicketInput,
} from "./types";

const TICKET_DATA_CHANGE_EVENT = "paf.ticketing.data-changed";

const emitTicketDataChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TICKET_DATA_CHANGE_EVENT));
  }
};

const parseApiResponse = async <T>(
  response: Response,
  fallbackMessage: string
): Promise<T> => {
  const rawResponse = await response.text();
  const payload = parseResponsePayload<T & { message?: string }>(rawResponse);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, fallbackMessage));
  }

  if (!payload) {
    throw new Error(fallbackMessage);
  }

  return payload;
};

export async function fetchTicketMeta(): Promise<TicketMeta> {
  const response = await apiFetch("/api/tickets/meta");
  return parseApiResponse<TicketMeta>(response, "Unable to load ticket form options right now.");
}

export async function fetchTickets(searchParams: {
  search?: string;
  type?: TicketType | "";
  priority?: string;
  status?: string;
  category?: string;
  location?: string;
  assignedTechnicianId?: string;
  overdueOnly?: boolean;
} = {}): Promise<TicketListResult> {
  const params = new URLSearchParams();
  if (searchParams.search) params.set("search", searchParams.search);
  if (searchParams.type) params.set("type", searchParams.type);
  if (searchParams.priority) params.set("priority", searchParams.priority);
  if (searchParams.status) params.set("status", searchParams.status);
  if (searchParams.category) params.set("category", searchParams.category);
  if (searchParams.location) params.set("location", searchParams.location);
  if (searchParams.assignedTechnicianId) {
    params.set("assignedTechnicianId", searchParams.assignedTechnicianId);
  }
  if (searchParams.overdueOnly) {
    params.set("overdue", "true");
  }

  const response = await apiFetch(
    `/api/tickets${params.toString() ? `?${params.toString()}` : ""}`
  );
  return parseApiResponse<TicketListResult>(response, "Unable to load tickets right now.");
}

export async function fetchTicketById(ticketId: string): Promise<TicketRecord> {
  const response = await apiFetch(`/api/tickets/${ticketId}`);
  return parseApiResponse<TicketRecord>(response, "Unable to load the selected ticket.");
}

export async function createTicket(input: CreateTicketInput): Promise<TicketRecord> {
  const createResponse = await apiFetch("/api/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      priority: input.priority,
      category: input.category.trim(),
      location: {
        building: input.location.building.trim(),
        floor: input.location.floor?.trim() ?? "",
        room: input.location.room?.trim() ?? "",
        campus: input.location.campus?.trim() ?? "",
        note: input.location.note?.trim() ?? "",
      },
    }),
  });

  const createdTicket = await parseApiResponse<TicketRecord>(
    createResponse,
    "Unable to create the ticket right now."
  );

  if (!input.attachments?.length) {
    emitTicketDataChange();
    return createdTicket;
  }

  const formData = new FormData();
  input.attachments.forEach((file) => formData.append("attachments", file));

  const attachmentResponse = await apiFetch(`/api/tickets/${createdTicket.id}/attachments`, {
    method: "POST",
    body: formData,
  });

  const ticketWithAttachments = await parseApiResponse<TicketRecord>(
    attachmentResponse,
    "Unable to upload ticket attachments right now."
  );

  emitTicketDataChange();
  return ticketWithAttachments;
}

export async function editTicket(
  ticketId: string,
  input: EditTicketInput
): Promise<TicketRecord> {
  const response = await apiFetch(`/api/tickets/${ticketId}/edit`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      priority: input.priority,
      category: input.category.trim(),
      location: {
        building: input.location.building.trim(),
        floor: input.location.floor?.trim() ?? "",
        room: input.location.room?.trim() ?? "",
        campus: input.location.campus?.trim() ?? "",
        note: input.location.note?.trim() ?? "",
      },
    }),
  });

  const ticket = await parseApiResponse<TicketRecord>(
    response,
    "Unable to update the ticket right now."
  );

  emitTicketDataChange();
  return ticket;
}

export async function updateTicket(
  ticketId: string,
  input: UpdateTicketInput
): Promise<TicketRecord> {
  const response = await apiFetch(`/api/tickets/${ticketId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const ticket = await parseApiResponse<TicketRecord>(
    response,
    "Unable to update workflow right now."
  );

  emitTicketDataChange();
  return ticket;
}

export async function assignTechnician(
  ticketId: string,
  technicianId: string | null
): Promise<TicketRecord> {
  const response = await apiFetch(`/api/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ technicianId }),
  });

  const ticket = await parseApiResponse<TicketRecord>(
    response,
    "Unable to assign a technician right now."
  );

  emitTicketDataChange();
  return ticket;
}

export async function addTicketComment(
  ticketId: string,
  message: string
): Promise<TicketRecord> {
  const response = await apiFetch(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message.trim() }),
  });

  const ticket = await parseApiResponse<TicketRecord>(
    response,
    "Unable to add the comment right now."
  );

  emitTicketDataChange();
  return ticket;
}

export async function uploadTicketAttachments(
  ticketId: string,
  files: File[]
): Promise<TicketRecord> {
  const formData = new FormData();
  files.forEach((file) => formData.append("attachments", file));

  const response = await apiFetch(`/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
  });

  const ticket = await parseApiResponse<TicketRecord>(
    response,
    "Unable to upload ticket attachments right now."
  );

  emitTicketDataChange();
  return ticket;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiFetch("/api/dashboard");
  return parseApiResponse<DashboardSummary>(
    response,
    "Unable to load the ticketing dashboard right now."
  );
}

export async function fetchReports(): Promise<TicketReports> {
  const response = await apiFetch("/api/reports");
  return parseApiResponse<TicketReports>(
    response,
    "Unable to load ticket reports right now."
  );
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const response = await apiFetch(`/api/tickets/${ticketId}`, {
    method: "DELETE",
  });

  await parseApiResponse<{ message?: string; ticketId?: string }>(
    response,
    "Unable to delete the ticket right now."
  );

  emitTicketDataChange();
}

export function subscribeToTicketDataChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(TICKET_DATA_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(TICKET_DATA_CHANGE_EVENT, listener);
  };
}
