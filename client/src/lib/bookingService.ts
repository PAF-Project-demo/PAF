import { getStoredAuthSession, authApiBaseUrl } from "./auth";

const API_BASE_URL = `${authApiBaseUrl}/api/bookings`;

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  date: string; // LocalDate as string (YYYY-MM-DD)
  startTime: string; // LocalTime as string (HH:mm:ss)
  endTime: string; // LocalTime as string (HH:mm:ss)
  purpose: string;
  attendees: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason?: string;
  createdAt: string; // LocalDateTime as string
}

export interface CreateBookingRequest {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
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

/**
 * Create a new booking
 */
export const createBooking = async (bookingRequest: CreateBookingRequest): Promise<Booking> => {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(bookingRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create booking");
  }

  return await response.json();
};

/**
 * Get current user's bookings
 */
export const getUserBookings = async (): Promise<Booking[]> => {
  const response = await fetch(`${API_BASE_URL}/my`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch your bookings");
  }

  return await response.json();
};

/**
 * Get all bookings (admin only)
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  const response = await fetch(API_BASE_URL, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return await response.json();
};

/**
 * Get a specific booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch booking");
  }

  return await response.json();
};

/**
 * Cancel a booking (user can cancel own bookings)
 */
export const cancelBooking = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to cancel booking");
  }
};

/**
 * Update booking status (admin only)
 */
export const updateBookingStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED" | "CANCELLED",
  reason?: string
): Promise<Booking> => {
  const response = await fetch(`${API_BASE_URL}/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ status, reason }),
  });

  if (!response.ok) {
    throw new Error("Failed to update booking status");
  }

  return await response.json();
};
