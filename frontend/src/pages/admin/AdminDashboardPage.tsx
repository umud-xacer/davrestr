import { Link } from "react-router-dom";

const CARDS = [
  { to: "/admin/registry-types", title: "Reestr strukturasi konstruktori", desc: "Dynamic Form Builder — yangi reestr turlarini yaratish" },
  { to: "/admin/content", title: "Sayt kontenti", desc: "Yangiliklar, elektron xizmatlar va e'lonlarni qo'shish/tahrirlash" },
  { to: "/admin/users", title: "Foydalanuvchilar va huquqlar", desc: "Xodimlar, mas'ul shaxslar, tashkilotlar bo'yicha boshqaruv" },
  { to: "/admin/audit-logs", title: "Audit jurnali", desc: "Tizimdagi barcha muhim amallar tarixi" },
];

export function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">SuperAdmin Panel</h1>
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
