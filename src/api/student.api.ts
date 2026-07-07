import { BASE_URL } from "./config";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export interface StudentProfileDto {
  id: string;
  userId: string;
  university: string | null;
  faculty: string | null;
  department: string | null;
  year: number | null;
  gpa: number | null;
  bio: string | null;
  skills: string | null;
  experience: string | null;
  languages: string | null;
  certifications: string | null;
  cvUrl: string | null;
  photoUrl: string | null;
  jobAlertsEnabled: boolean;
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
    err.status = res.status;
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data as T;
}

export const getProfile = async () => {
  return request<{ student: StudentProfileDto }>("/students/profile");
};

export const updateProfile = async (data: {
  university?: string;
  faculty?: string;
  department?: string;
  year?: number;
  gpa?: number;
  bio?: string;
  skills?: string;
  experience?: string;
  languages?: string;
  certifications?: string;
}) => {
  return request<{ message: string; student: StudentProfileDto }>("/students/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const uploadCV = async (file: File) => {
  const token = getToken();
  const form = new FormData();
  form.append("cv", file);
  const res = await fetch(`${BASE_URL}/students/upload-cv`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.status = res.status;
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }
  return data as { message: string; cvUrl: string; skills: string; extractionMethod: string; student: StudentProfileDto };
};

export const getRecommendations = async () => {
  return request("/students/recommendations");
};

export const toggleJobAlerts = async (enabled: boolean) => {
  return request("/students/job-alerts", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
};