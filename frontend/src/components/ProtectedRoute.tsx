import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>;
  }
  if (!user) {
    return <Navigate to="/cabinet/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-red-600">
        Ushbu sahifaga kirish uchun sizda yetarli huquq yo'q.
      </div>
    );
  }
  return children;
}
