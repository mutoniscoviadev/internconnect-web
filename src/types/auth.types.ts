export type Role = "STUDENT" | "COMPANY" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}
