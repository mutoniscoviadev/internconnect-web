import { BASE_URL } from "./config";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data as T;
}

// Employer: schedule interview directly for a shortlisted applicant
export const scheduleInterview = async (
  applicationId: string,
  data: {
    datetime: string; // ISO string e.g. "2026-07-10T15:00:00"
    location?: string;
    notes?: string;
  }
) => {
  return request(`/interviews/schedule/${applicationId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Employer: create an open interview slot
export const createSlot = async (data: {
  listingId: string;
  datetime: string;
}) => {
  return request("/interviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Get available slots for a listing
export const getListingSlots = async (listingId: string) => {
  return request(`/interviews/listing/${listingId}`);
};

// Student: get my booked interviews
export const getMyInterviews = async () => {
  return request("/interviews/my");
};

// Student: book a slot
export const bookSlot = async (slotId: string) => {
  return request(`/interviews/${slotId}/book`, { method: "PUT" });
};