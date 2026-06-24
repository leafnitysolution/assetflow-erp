import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import type { UserRole } from "@/types"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath =
      user.role === "super-admin"
        ? "/super-admin/dashboard"
        : user.role === "admin"
        ? "/admin/dashboard"
        : "/member/dashboard"
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}
