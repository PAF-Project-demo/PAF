import { apiFetch, getApiMessage, parseResponsePayload } from "./auth";

type NullableString = string | null;

export type UserProfile = {
  userId: string;
  email: string;
  displayName: NullableString;
  photoUrl: NullableString;
  provider: NullableString;
  role: NullableString;
  createdAt: NullableString;
  googleSubject: NullableString;
  linkedinSubject: NullableString;
  githubSubject: NullableString;
};

type UserProfileApiResponse = {
  userId: string;
  email: string;
  displayName?: NullableString;
  photoUrl?: NullableString;
  provider?: NullableString;
  role?: NullableString;
  createdAt?: NullableString;
  googleSubject?: NullableString;
  linkedinSubject?: NullableString;
  githubSubject?: NullableString;
};

const getNullableString = (value: unknown): NullableString =>
  typeof value === "string" ? value : null;

const buildUserProfile = (
  payload: Partial<UserProfileApiResponse> | null
): UserProfile | null => {
  if (!payload || typeof payload.userId !== "string" || typeof payload.email !== "string") {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    displayName: getNullableString(payload.displayName),
    photoUrl: getNullableString(payload.photoUrl),
    provider: getNullableString(payload.provider),
    role: getNullableString(payload.role),
    createdAt: getNullableString(payload.createdAt),
    googleSubject: getNullableString(payload.googleSubject),
    linkedinSubject: getNullableString(payload.linkedinSubject),
    githubSubject: getNullableString(payload.githubSubject),
  };
};

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const response = await apiFetch("/api/auth/profile");
  const rawResponse = await response.text();
  const payload = parseResponsePayload<Partial<UserProfileApiResponse>>(rawResponse);

  if (!response.ok) {
    throw new Error(
      getApiMessage(payload, "Unable to load your profile right now.")
    );
  }

  const profile = buildUserProfile(payload);

  if (!profile) {
    throw new Error("The profile response was incomplete.");
  }

  return profile;
};
