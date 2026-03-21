export type AuthApiResponse = {
  userId: string;
  email: string;
  message: string;
};

export type AuthSession = {
  userId: string;
  email: string;
};

export const authApiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081"
).replace(/\/$/, "");

export const AUTH_CHANGE_EVENT = "paf-auth-change";

const AUTH_STORAGE_KEY = "paf.auth.session";

const isAuthSession = (value: unknown): value is AuthSession => {
  return Boolean(
    value &&
      typeof value === "object" &&
      "userId" in value &&
      typeof value.userId === "string" &&
      "email" in value &&
      typeof value.email === "string"
  );
};

const getAuthStorages = () => {
  if (typeof window === "undefined") {
    return [];
  }

  return [window.localStorage, window.sessionStorage];
};

const emitAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

export const parseResponsePayload = <T>(rawResponse: string): T | null => {
  if (!rawResponse) {
    return null;
  }

  try {
    return JSON.parse(rawResponse) as T;
  } catch {
    return null;
  }
};

export const getStoredAuthSession = (): AuthSession | null => {
  for (const storage of getAuthStorages()) {
    const rawSession = storage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      continue;
    }

    const parsedSession = parseResponsePayload<unknown>(rawSession);
    if (isAuthSession(parsedSession)) {
      return parsedSession;
    }
  }

  return null;
};

export const persistAuthSession = (
  session: AuthSession,
  keepUserSignedIn: boolean
) => {
  for (const storage of getAuthStorages()) {
    storage.removeItem(AUTH_STORAGE_KEY);
  }

  const selectedStorage = keepUserSignedIn
    ? window.localStorage
    : window.sessionStorage;

  selectedStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitAuthChange();
};

export const clearAuthSession = () => {
  for (const storage of getAuthStorages()) {
    storage.removeItem(AUTH_STORAGE_KEY);
  }

  emitAuthChange();
};

export const getUserDisplayName = (email: string) => {
  const [localPart = "Signed In User"] = email.split("@");
  const displayName = localPart
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return displayName || "Signed In User";
};
