import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Role } from "../types";

export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t("protectedRoute.loading")}</div>;
  }
  if (!user) {
    return <Navigate to="/cabinet/login" replace />;
  }
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-red-600">
        {t("protectedRoute.forbidden")}
      </div>
    );
  }
  return children;
}
