import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth.context";
import type { Role } from "../types/auth.types";

interface RoleRouteProps {
  allowedRoles: Role[];
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-3xl font-bold text-gray-800">403</h1>
        <p className="text-gray-500">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
