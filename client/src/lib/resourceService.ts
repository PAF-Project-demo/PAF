import { getStoredAuthSession, authApiBaseUrl, clearAuthSession } from "./auth";

const API_BASE_URL = `${authApiBaseUrl}/api/resources`;

export interface Review {
  id?: string;
  userId: string;
  userName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

export interface Resource {
  id?: string;
  name: string;
  type: "LECTURE_HALL" | "LAB" | "MEETING_ROOM" | "EQUIPMENT";
  capacity?: number;
  location: string;
  availabilityWindows?: string;
  status?: "ACTIVE" | "OUT_OF_SERVICE";
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  reviews?: Review[];
  averageRating?: number;
}

const getHeaders = (): HeadersInit => {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (session && session.userId) {
    headers["X-Auth-User-Id"] = session.userId;
  }
  
  return headers;
};

export const fetchResources = async (filters?: { type?: string; location?: string; capacity?: number }) => {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.location) params.append("location", filters.location);
  if (filters?.capacity) params.append("capacity", filters.capacity.toString());

  const queryString = params.toString();
  const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;

  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch resources");
  }
  
  return await response.json() as Resource[];
};

export const getResource = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to get resource");
  }
  
  return await response.json() as Resource;
};

export const createResource = async (resource: Resource) => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(resource),
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAuthSession();
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to create resource. Server responded with: ${response.status} ${errorText}`);
  }
  
  return await response.json() as Resource;
};

export const updateResource = async (id: string, resource: Resource) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(resource),
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAuthSession();
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to update resource. Server responded with: ${response.status} ${errorText}`);
  }
  
  return await response.json() as Resource;
};

export const deleteResource = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete resource");
  }
};

export const updateResourceStatus = async (id: string, status: "ACTIVE" | "OUT_OF_SERVICE") => {
  const response = await fetch(`${API_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to update resource status");
  }
  
  return await response.json() as Resource;
};

export const addResourceReview = async (id: string, review: { rating: number; comment?: string }) => {
  const response = await fetch(`${API_BASE_URL}/${id}/reviews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(review),
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAuthSession();
    const errorText = await response.text().catch(() => "");
    throw new Error(`Failed to add review. Server responded with: ${response.status} ${errorText}`);
  }
  
  return await response.json() as Resource;
};

export const deleteResourceReview = async (resourceId: string, reviewId: string) => {
  const response = await fetch(`${API_BASE_URL}/${resourceId}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAuthSession();
    throw new Error(`Failed to delete review.`);
  }
  
  return await response.json() as Resource;
};
