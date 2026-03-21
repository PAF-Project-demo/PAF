import { Navigate, Outlet } from "react-router";
import { getStoredAuthSession } from "../../lib/auth";

export function RequireAuth() {
  const authSession = getStoredAuthSession();

  return authSession ? <Outlet /> : <Navigate to="/signin" replace />;
}

export function RedirectAuthenticatedUser() {
  const authSession = getStoredAuthSession();

  return authSession ? <Navigate to="/" replace /> : <Outlet />;
}
