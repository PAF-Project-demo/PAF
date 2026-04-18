export type TicketRole = "USER" | "TECHNICIAN" | "ADMIN";
export type TicketType = "MAINTENANCE" | "INCIDENT";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export interface TicketUser {
  id: string;
  fullName: string;
  email: string;
  role: TicketRole;
  department?: string;
  skills?: string[];
}

export interface TicketLocation {
  building: string;
  floor?: string;
  room?: string;
  campus?: string;
  note?: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: Pick<TicketUser, "id" | "fullName" | "role">;
}

export interface TicketComment {
  id: string;
  message: string;
  createdAt: string;
  author: Pick<TicketUser, "id" | "fullName" | "role">;
}

export interface TicketActivityItem {
  id: string;
  action: string;
  message: string;
  createdAt: string;
  actor: Pick<TicketUser, "id" | "fullName" | "role">;
  meta?: Record<string, unknown>;
}

export interface TicketRecord {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  category: string;
  status: TicketStatus;
  location: TicketLocation;
  reporter: TicketUser;
  assignedTechnician: TicketUser | null;
  requiresExtendedResolution?: boolean;
  slaHours: number;
  dueAt: string;
  overdue: boolean;
  resolvedAt?: string | null;
  closedAt?: string | null;
  attachments: TicketAttachment[];
  comments: TicketComment[];
  activity: TicketActivityItem[];
  createdAt: string;
  updatedAt: string;
  allowedStatusOptions: TicketStatus[];
  slaPolicy: TicketSlaPolicy;
}

export interface TicketMeta {
  types: TicketType[];
  priorities: TicketPriority[];
  statuses: TicketStatus[];
  categories: string[];
  technicians: TicketUser[];
}

export interface TicketFilters {
  search?: string;
  type?: TicketType | "";
  priority?: TicketPriority | "";
  status?: TicketStatus | "";
  category?: string;
  location?: string;
  assignedTechnicianId?: string;
  overdueOnly?: boolean;
}

export interface TicketListResult {
  items: TicketRecord[];
  total: number;
}

export interface DashboardSummary {
  cards: {
    totalTickets: number;
    openTickets: number;
    overdueTickets: number;
    resolvedRate: number;
  };
  slaBuckets: Array<{ label: string; value: number; description: string }>;
  charts: {
    statusBreakdown: Array<{ label: string; value: number }>;
    priorityBreakdown: Array<{ label: string; value: number }>;
    monthlyTrend: Array<{ label: string; created: number }>;
    typeBreakdown: Array<{ label: string; value: number }>;
  };
  recentTickets: TicketRecord[];
}

export interface TicketSlaPolicy {
  targetHours: number;
  targetLabel: string;
  description: string;
  workflowPath: TicketStatus[];
}

export interface TicketReports {
  summary: {
    averageResolutionHours: number;
    slaBreachedTickets: number;
    slaMetTickets: number;
  };
  categoryBreakdown: Array<{ label: string; value: number }>;
  technicianWorkload: Array<{ label: string; value: number }>;
  typeBreakdown: Array<{ label: string; value: number }>;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  category: string;
  status?: TicketStatus;
  requiresExtendedResolution?: boolean;
  location: TicketLocation;
  slaHours?: number;
  attachments?: File[];
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  description?: string;
  location?: TicketLocation;
  requiresExtendedResolution?: boolean;
  slaHours?: number;
  assignedTechnician?: TicketUser | null;
}
