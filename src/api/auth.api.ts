import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
  Role,
} from "../types/auth.types";
import { BASE_URL } from "./config";

function getToken(): string | null {
  return localStorage.getItem("token");
}

// Backend uses lowercase roles, frontend uses uppercase — map them here
function toFrontendRole(role: string): Role {
  const map: Record<string, Role> = {
    student: "STUDENT",
    employer: "COMPANY",
    admin: "ADMIN",
  };
  return map[role] ?? "STUDENT"; // safe fallback if backend ever sends an unexpected role
}

function toBackendRole(role: string): string {
  const map: Record<string, string> = {
    STUDENT: "student",
    COMPANY: "employer",
    ADMIN: "admin",
  };
  return map[role] ?? role.toLowerCase();
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
    // Match the same error shape your existing code throws so catch blocks work identically
    const err: any = new Error(data.error ?? data.message ?? "Request failed");
    err.response = { data: { message: data.error ?? data.message ?? "Request failed" } };
    throw err;
  }

  return data as T;
}

export const register = async (
  payload: RegisterPayload
): Promise<{ data: AuthResponse }> => {
  const data = await request<{
    message: string;
    user: { id: string; name: string; email: string; role: string };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: toBackendRole(payload.role),
      companyName: payload.role === "COMPANY" ? (payload as any).companyName : undefined,
    }),
  });

  // Backend doesn't return a token on register (email verification required first)
  // Return a placeholder token so the shape matches — auth context should NOT auto-login on register
  const user: User = {
    id: data.user.id as unknown as number,
    name: data.user.name,
    email: data.user.email,
    role: toFrontendRole(data.user.role),
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { data: { token: "", user } };
};

export const login = async (
  payload: LoginPayload
): Promise<{ data: AuthResponse }> => {
  const data = await request<{
    message: string;
    token: string;
    user: { id: string; name: string; email: string; role: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  });

  const user: User = {
    id: data.user.id as unknown as number,
    name: data.user.name,
    email: data.user.email,
    role: toFrontendRole(data.user.role),
    avatar: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { data: { token: data.token, user } };
};

export const getCurrentUser = async (): Promise<{ data: User }> => {
  const data = await request<{
    id: string; name: string; email: string; role: string;
  }>("/auth/me");

  return {
    data: {
      id: data.id as unknown as number,
      name: data.name,
      email: data.email,
      role: toFrontendRole(data.role),
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};

// ─── Additional auth endpoints ────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> => {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otp, newPassword }),
  });
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  return request(`/auth/verify-email?token=${encodeURIComponent(token)}`);
};