import { NavLink, Outlet } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: "/admin", label: "adminNav.dashboard", end: true },
  { to: "/admin/registry-types", label: "adminNav.registryTypes" },
  { to: "/admin/records", label: "adminNav.recordEdit" },
  { to: "/admin/documents", label: "adminNav.documents" },
  { to: "/admin/content", label: "adminNav.content" },
  { to: "/admin/users", label: "adminNav.users" },
  { to: "/admin/applications", label: "adminNav.applications" },
  { to: "/admin/audit-logs", label: "adminNav.auditLogs" },
  { to: "/admin/settings", label: "adminNav.settings" },
  { to: "/cabinet/change-password", label: "adminNav.changePassword" },
];

export function AdminLayout() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="w-64 shrink-0">
        <nav className="sticky top-4 space-y-1 rounded-lg border border-slate-200 bg-white p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
