import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

export function AdminDashboardPage() {
  const { t } = useLanguage();
  const CARDS = [
    { to: "/admin/registry-types", title: t("adminDashboard.card1Title"), desc: t("adminDashboard.card1Desc") },
    { to: "/admin/records", title: t("adminNav.recordEdit"), desc: t("adminRecordEdit.desc") },
    { to: "/admin/documents", title: t("adminNav.documents"), desc: t("documents.desc") },
    { to: "/admin/content", title: t("adminDashboard.card2Title"), desc: t("adminDashboard.card2Desc") },
    { to: "/admin/users", title: t("adminDashboard.card3Title"), desc: t("adminDashboard.card3Desc") },
    { to: "/admin/audit-logs", title: t("adminDashboard.card4Title"), desc: t("adminDashboard.card4Desc") },
    { to: "/admin/applications", title: t("adminDashboard.card5Title"), desc: t("adminDashboard.card5Desc") },
    { to: "/admin/settings", title: t("adminDashboard.card6Title"), desc: t("adminDashboard.card6Desc") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("adminDashboard.title")}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500 hover:shadow-md"
          >
            <h2 className="font-medium text-slate-800">{c.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
