import {
  apiFetch,
  formatRoleLabel,
  getApiMessage,
  getStoredAuthSession,
  parseResponsePayload,
  replaceStoredAuthSession,
} from "./auth";

export type ActivityEventTypeValue =
  | "ROLE_REQUEST_CREATED"
  | "ROLE_REQUEST_UPDATED"
  | "ROLE_REQUEST_DELETED"
  | "ROLE_REQUEST_APPROVED"
  | "ROLE_REQUEST_REJECTED"
  | "USER_ROLE_CHANGED";

export type RoleRequestStatusValue = "PENDING" | "APPROVED" | "REJECTED";

type ActivityFeedApiItem = {
  id: string;
  eventType: ActivityEventTypeValue;
  title?: string | null;
  message?: string | null;
  actorUserId?: string | null;
  actorDisplayName?: string | null;
  actorEmail?: string | null;
  subjectUserId?: string | null;
  subjectDisplayName?: string | null;
  subjectEmail?: string | null;
  previousRole?: string | null;
  requestedRole?: string | null;
  resultingRole?: string | null;
  roleRequestId?: string | null;
  roleRequestStatus?: string | null;
  read?: boolean;
  createdAt?: string | null;
};

type ActivityNotificationFeedApiResponse = {
  unreadCount?: number;
  items?: unknown;
};

export type ActivityFeedItem = {
  id: string;
  eventType: ActivityEventTypeValue;
  title: string;
  message: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  actorEmail: string | null;
  subjectUserId: string | null;
  subjectDisplayName: string | null;
  subjectEmail: string | null;
  previousRole: string | null;
  requestedRole: string | null;
  resultingRole: string | null;
  roleRequestId: string | null;
  roleRequestStatus: RoleRequestStatusValue | null;
  read: boolean;
  createdAt: string | null;
};

export type ActivityNotificationFeed = {
  unreadCount: number;
  items: ActivityFeedItem[];
};

const activityEventTypes: ActivityEventTypeValue[] = [
  "ROLE_REQUEST_CREATED",
  "ROLE_REQUEST_UPDATED",
  "ROLE_REQUEST_DELETED",
  "ROLE_REQUEST_APPROVED",
  "ROLE_REQUEST_REJECTED",
  "USER_ROLE_CHANGED",
];

const roleRequestStatuses: RoleRequestStatusValue[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

const isNullableString = (value: unknown) =>
  value === undefined || value === null || typeof value === "string";

const isActivityFeedApiItem = (value: unknown): value is ActivityFeedApiItem => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "string" &&
      "eventType" in value &&
      typeof value.eventType === "string" &&
      activityEventTypes.includes(value.eventType as ActivityEventTypeValue) &&
      (!("title" in value) || isNullableString(value.title)) &&
      (!("message" in value) || isNullableString(value.message))
  );
};

const normalizeRoleValue = (value?: string | null) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return value.trim().toUpperCase();
};

const normalizeRoleRequestStatus = (
  value?: string | null
): RoleRequestStatusValue | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toUpperCase();
  return roleRequestStatuses.includes(normalizedValue as RoleRequestStatusValue)
    ? (normalizedValue as RoleRequestStatusValue)
    : null;
};

const normalizeActivityItem = (item: ActivityFeedApiItem): ActivityFeedItem => ({
  id: item.id,
  eventType: item.eventType,
  title:
    typeof item.title === "string" && item.title.trim()
      ? item.title.trim()
      : "Activity update",
  message:
    typeof item.message === "string" && item.message.trim()
      ? item.message.trim()
      : "A new activity event was recorded.",
  actorUserId:
    typeof item.actorUserId === "string" && item.actorUserId.trim()
      ? item.actorUserId.trim()
      : null,
  actorDisplayName:
    typeof item.actorDisplayName === "string" && item.actorDisplayName.trim()
      ? item.actorDisplayName.trim()
      : null,
  actorEmail:
    typeof item.actorEmail === "string" && item.actorEmail.trim()
      ? item.actorEmail.trim()
      : null,
  subjectUserId:
    typeof item.subjectUserId === "string" && item.subjectUserId.trim()
      ? item.subjectUserId.trim()
      : null,
  subjectDisplayName:
    typeof item.subjectDisplayName === "string" && item.subjectDisplayName.trim()
      ? item.subjectDisplayName.trim()
      : null,
  subjectEmail:
    typeof item.subjectEmail === "string" && item.subjectEmail.trim()
      ? item.subjectEmail.trim()
      : null,
  previousRole: normalizeRoleValue(item.previousRole),
  requestedRole: normalizeRoleValue(item.requestedRole),
  resultingRole: normalizeRoleValue(item.resultingRole),
  roleRequestId:
    typeof item.roleRequestId === "string" && item.roleRequestId.trim()
      ? item.roleRequestId.trim()
      : null,
  roleRequestStatus: normalizeRoleRequestStatus(item.roleRequestStatus),
  read: item.read === true,
  createdAt:
    typeof item.createdAt === "string" && item.createdAt.trim()
      ? item.createdAt.trim()
      : null,
});

const syncCurrentUserRole = (items: ActivityFeedItem[]) => {
  const currentSession = getStoredAuthSession();
  if (!currentSession?.userId) {
    return;
  }

  const currentUserUpdate = items.find(
    (item) =>
      item.subjectUserId === currentSession.userId &&
      typeof item.resultingRole === "string" &&
      item.resultingRole.trim()
  );

  if (!currentUserUpdate?.resultingRole) {
    return;
  }

  const normalizedResultRole = currentUserUpdate.resultingRole.trim().toUpperCase();
  const normalizedSessionRole =
    typeof currentSession.role === "string"
      ? currentSession.role.trim().toUpperCase()
      : "USER";

  if (normalizedResultRole === normalizedSessionRole) {
    return;
  }

  replaceStoredAuthSession({
    ...currentSession,
    role: normalizedResultRole,
  });
};

export const fetchActivityNotifications = async (
  limit = 8,
  signal?: AbortSignal
): Promise<ActivityNotificationFeed> => {
  const response = await apiFetch(`/api/activity/notifications?limit=${limit}`, {
    signal,
  });
  const rawResponse = await response.text();
  const payload = parseResponsePayload<ActivityNotificationFeedApiResponse>(rawResponse);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Unable to load notifications right now."));
  }

  const itemsPayload = payload?.items;
  if (!Array.isArray(itemsPayload) || !itemsPayload.every(isActivityFeedApiItem)) {
    throw new Error("The server returned an invalid notifications response.");
  }

  const items = itemsPayload.map(normalizeActivityItem);
  syncCurrentUserRole(items);

  return {
    unreadCount:
      typeof payload?.unreadCount === "number" && payload.unreadCount > 0
        ? payload.unreadCount
        : 0,
    items,
  };
};

export const markActivityNotificationsAsRead = async () => {
  const response = await apiFetch("/api/activity/notifications/mark-read", {
    method: "POST",
  });
  const rawResponse = await response.text();
  const payload = parseResponsePayload<{ message?: string }>(rawResponse);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Unable to update notifications right now."));
  }
};

export const fetchActivityAuditLog = async (
  limit = 40,
  signal?: AbortSignal
): Promise<ActivityFeedItem[]> => {
  const response = await apiFetch(`/api/activity/audit?limit=${limit}`, {
    signal,
  });
  const rawResponse = await response.text();
  const payload = parseResponsePayload<unknown>(rawResponse);

  if (!response.ok) {
    throw new Error(getApiMessage(payload, "Unable to load the audit log right now."));
  }

  if (!Array.isArray(payload) || !payload.every(isActivityFeedApiItem)) {
    throw new Error("The server returned an invalid audit log response.");
  }

  return payload.map(normalizeActivityItem);
};

export const getActivityEventBadgeColor = (eventType: ActivityEventTypeValue) => {
  switch (eventType) {
    case "ROLE_REQUEST_APPROVED":
      return "success" as const;
    case "ROLE_REQUEST_REJECTED":
      return "error" as const;
    case "ROLE_REQUEST_CREATED":
      return "primary" as const;
    case "ROLE_REQUEST_UPDATED":
      return "info" as const;
    case "ROLE_REQUEST_DELETED":
      return "warning" as const;
    case "USER_ROLE_CHANGED":
      return "dark" as const;
    default:
      return "light" as const;
  }
};

export const getActivityEventLabel = (eventType: ActivityEventTypeValue) => {
  switch (eventType) {
    case "ROLE_REQUEST_CREATED":
      return "Requested";
    case "ROLE_REQUEST_UPDATED":
      return "Updated";
    case "ROLE_REQUEST_DELETED":
      return "Deleted";
    case "ROLE_REQUEST_APPROVED":
      return "Approved";
    case "ROLE_REQUEST_REJECTED":
      return "Rejected";
    case "USER_ROLE_CHANGED":
      return "Role Changed";
    default:
      return "Activity";
  }
};

export const formatActivityTimestamp = (value?: string | null) => {
  if (!value) {
    return "Unavailable";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
};

export const formatRelativeActivityTime = (value?: string | null) => {
  if (!value) {
    return "Just now";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return "Just now";
  }

  const diffInMs = Date.now() - timestamp.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  }

  return formatActivityTimestamp(value);
};

export const formatActivityRoleSummary = (item: ActivityFeedItem) => {
  if (item.previousRole && item.resultingRole) {
    return `${formatRoleLabel(item.previousRole)} -> ${formatRoleLabel(item.resultingRole)}`;
  }

  if (item.requestedRole) {
    return formatRoleLabel(item.requestedRole);
  }

  if (item.resultingRole) {
    return formatRoleLabel(item.resultingRole);
  }

  return "N/A";
};
