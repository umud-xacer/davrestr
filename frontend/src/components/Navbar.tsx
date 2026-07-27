import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CloseIcon, MenuIcon } from "./icons";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t("nav.linkDocs"), to: "/" },
    { label: t("nav.linkFaq"), to: "/" },
    { label: t("nav.linkSurvey"), to: "/" },
    { label: t("nav.linkNews"), to: "/" },
    { label: t("nav.linkContact"), to: "/apply" },
  ];

  return (
    <header className="relative bg-white">
      {/* Yuqori ingichka qator */}
      <div className="border-b border-slate-100">
        <div className="mx-auto flex max-w-[1364px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
          {!user ? (
            <Link
              to="/cabinet/login"
              className="rounded-[8px] bg-brand-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              {t("nav.login")}
            </Link>
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {(user.role === "cabinet_employee" ||
                user.role === "cabinet_approver" ||
                user.role === "org_admin" ||
                user.role === "superadmin") && (
                <Link to="/cabinet" className="text-xs font-medium text-brand-700 hover:underline">
                  {t("nav.kabinet")}
                </Link>
              )}
              {(user.role === "org_admin" || user.role === "superadmin") && (
                <Link to="/admin" className="text-xs font-medium text-brand-700 hover:underline">
                  {t("nav.adminPanel")}
                </Link>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {user.full_name} · {t(`role.${user.role}`)}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-xs text-muted hover:underline"
              >
                {t("nav.logout")}
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <img src="/images/glass-icon.svg" alt="" className="h-3.5 cursor-pointer opacity-80 hover:opacity-100" />
            <img src="/images/wifi-icon.svg" alt="RSS" className="h-4 w-4 cursor-pointer opacity-80 hover:opacity-100" />
            <img src="/images/sitemap-icon.png" alt="" className="h-4 w-4 cursor-pointer opacity-80 hover:opacity-100" />
            <button
              onClick={() => setLang("uz")}
              className={lang === "uz" ? "font-semibold text-ink" : "text-muted hover:text-brand-600"}
            >
              Uz
            </button>
            <button
              onClick={() => setLang("ru")}
              className={lang === "ru" ? "font-semibold text-ink" : "text-muted hover:text-brand-600"}
            >
              Ru
            </button>
          </div>
        </div>
      </div>

      {/* Logo + nomi */}
      <div className="mx-auto flex max-w-[1364px] items-center justify-between px-4 py-4">
        <Link to="/" className="flex min-w-0 items-center gap-[22px]">
          <img src="/images/gerb.png" alt="" className="h-14 w-14 shrink-0 object-contain" />

          <div className="min-w-0 max-w-[300px] leading-[1.4] sm:max-w-none">
            <div className="text-[16px] font-semibold text-ink sm:whitespace-normal">{t("nav.titleLine1")}</div>
            <div className="text-[16px] font-semibold text-ink">{t("nav.titleLine2")}</div>
          </div>
        </Link>

        <nav className="hidden gap-6 text-sm text-ink lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="font-semibold hover:text-[#6192E7]">
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
