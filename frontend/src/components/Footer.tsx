import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { FacebookIcon, TelegramIcon } from "./icons";

export function Footer() {
  const { t } = useLanguage();
  const QUICK_LINKS = [
    { label: t("nav.linkDocs"), to: "/" },
    { label: t("nav.linkFaq"), to: "/" },
    { label: t("nav.linkSurvey"), to: "/" },
    { label: t("nav.linkNews"), to: "/" },
    { label: t("nav.linkContact"), to: "/apply" },
  ];

  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-slate-100 px-4 py-10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <div className="pb-6 sm:pb-0 sm:pr-6">
          <div className="flex items-center gap-3">
            <img src="/images/gerb.png" alt="" className="h-12 w-12 shrink-0 object-contain" />
            <div className="text-[15px] font-bold leading-tight text-ink">
              {t("nav.titleLine1")}
              <br />
              {t("nav.titleLine2")}
            </div>
          </div>
          <div className="mt-4 space-y-3 divide-y divide-slate-100">
            <p className="pb-3 text-sm text-muted">{t("footer.orgName")}</p>
            <p className="pt-3 text-sm text-muted">{t("footer.system")}</p>
          </div>
        </div>

        <div className="py-6 sm:px-6 sm:py-0">
          <p className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm text-muted">
            <img src="/images/phone-icon.svg" alt="" className="h-[17px] w-[17px]" />
            (+998 71) 207-00-03
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <img src="/images/location-icon.svg" alt="" className="h-[18px] w-4" />
            {t("footer.address")}
          </p>
        </div>

        <div className="py-6 sm:px-6 sm:py-0">
          <h3 className="text-sm font-semibold text-ink">{t("footer.linksTitle")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="cursor-pointer hover:text-brand-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-6 sm:pl-6 sm:pt-0">
          <h3 className="text-sm font-semibold text-ink">{t("footer.socialTitle")}</h3>
          <div className="mt-3 flex items-center gap-3 text-faint">
            <TelegramIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
            <FacebookIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
          </div>
          {/* Dekorativ statistika belgisi — hech qanday tashqi kuzatuv xizmatiga ulanmaydi */}
          <div className="mt-3 flex h-[26px] w-fit overflow-hidden rounded text-[9px] font-bold leading-none text-white">
            <div className="flex w-6 items-center justify-center bg-[#F5A623]">38</div>
            <div className="flex flex-col items-center justify-center gap-[1px] bg-[#0063AF] px-1.5 py-1">
              <span>530709</span>
              <span>1690</span>
              <span>4283</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-faint">{t("footer.copyright")}</div>
    </footer>
  );
}
