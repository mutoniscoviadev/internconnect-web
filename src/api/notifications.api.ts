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

export const getNotifications = async () => {
  return request("/notifications");
};

export const markAsRead = async (id: string) => {
  return request(`/notifications/${id}/read`, { method: "PUT" });
};

export const markAllAsRead = async () => {
  return request("/notifications/read-all", { method: "PUT" });
};