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

export const getProfile = async () => {
  return request("/employers/profile");
};

export const updateProfile = async (data: {
  companyName?: string;
  industry?: string;
  website?: string;
  description?: string;
}) => {
  return request("/employers/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const uploadLogo = async (file: File) => {
  const token = getToken();
  const form = new FormData();
  form.append("logo", file);
  const res = await fetch(`${BASE_URL}/employers/upload-logo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data;
};

export const getListingMatches = async (listingId: string) => {
  return request(`/employers/listings/${listingId}/matches`);
};