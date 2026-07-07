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

export const getListings = async (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request(`/listings${qs}`);
};

export const getMyListings = async () => {
  return request("/listings/my");
};

export const getListingById = async (id: string) => {
  return request(`/listings/${id}`);
};

export const createListing = async (data: {
  title: string;
  description: string;
  skills?: string;
  location?: string;
  duration?: string;
  stipend?: string;
  deadline?: string;
  openings?: number;
}) => {
  return request("/listings", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateListing = async (id: string, data: Record<string, any>) => {
  return request(`/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteListing = async (id: string) => {
  return request(`/listings/${id}`, { method: "DELETE" });
};

export const getSkillsGap = async (id: string) => {
  return request(`/listings/${id}/skills-gap`);
};