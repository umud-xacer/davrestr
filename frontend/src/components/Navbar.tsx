import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../types";
import { CloseIcon, MenuIcon, RssIcon, SitemapIcon } from "./icons";

const NAV_LINKS = [
  { label: "Normativ huquqiy hujjatlar", to: "/" },
  { label: "Savol-javoblar", to: "/" },
  { label: "Online so'rovnoma", to: "/" },
  { label: "Yangiliklar", to: "/" },
  { label: "Murojaat qoldirish", to: "/" },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative bg-white">
      {/* Yuqori ingichka qator */}
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
          {!user ? (
            <Link
              to="/cabinet/login"
              className="text-xs font-medium text-muted hover:text-brand-600 hover:underline"
            >
              Kabinetga kirish
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {(user.role === "cabinet_employee" ||
                user.role === "cabinet_approver" ||
                user.role === "org_admin" ||
                user.role === "superadmin") && (
                <Link to="/cabinet" className="text-xs font-medium text-brand-700 hover:underline">
                  Kabinet
                </Link>
              )}
              {(user.role === "org_admin" || user.role === "superadmin") && (
                <Link to="/admin" className="text-xs font-medium text-brand-700 hover:underline">
                  Admin panel
                </Link>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {user.full_name} · {ROLE_LABELS[user.role]}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-xs text-muted hover:underline"
              >
                Chiqish
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 text-faint">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-200 text-[10px] font-semibold text-brand-700">
              A+
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-200 text-[10px] font-semibold text-brand-700">
              A-
            </span>
            <RssIcon className="h-4 w-4 cursor-pointer hover:text-brand-600" />
            <SitemapIcon className="h-4 w-4 cursor-pointer hover:text-brand-600" />
            <span className="font-semibold text-ink">Uz</span>
            <span className="cursor-pointer hover:text-brand-600">Ru</span>
          </div>
        </div>
      </div>

      {/* Logo + nomi */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img src="/images/gerb.png" alt="O'zbekiston Respublikasi gerbi" className="h-14 w-14 shrink-0 object-contain" />

          <div className="min-w-0 max-w-[260px] leading-tight sm:max-w-none">
            <div className="text-[15px] font-bold text-ink sm:whitespace-normal">
              Ko'chmas mulk obyektlariga bo'lgan huquqlarning
            </div>
            <div className="text-[15px] font-bold text-ink">davlat reyestri</div>
          </div>
        </Link>

        <nav className="hidden gap-6 text-sm text-faint lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="font-medium hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-2 text-muted hover:bg-slate-100 lg:hidden"
          aria-label="Menyu"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-sm text-faint lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="rounded px-2 py-2 hover:bg-slate-50 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
