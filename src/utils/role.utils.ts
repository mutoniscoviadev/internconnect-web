import type { Role } from "../types/auth.types";

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "COMPANY":
      return "/company/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/";
  }
}
