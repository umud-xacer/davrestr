import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FacebookIcon,
  RefreshIcon,
  SearchIcon,
  StarIcon,
  TelegramIcon,
} from "../../components/icons";
import { PublicContentItemOut, PublicRecordOut, RevealCodeOut } from "../../types";

export function SearchPage() {
  const { lang, t } = useLanguage();
  const SEARCH_TYPES = [
    { label: t("home.searchTypeCadastre"), placeholder: t("home.searchTypeCadastrePlaceholder") },
    { label: t("home.searchTypeTin"), placeholder: t("home.searchTypeTinPlaceholder") },
  ];
  const STEPS = [
    { title: t("home.step1Title"), desc: t("home.step1Desc"), icon: "/images/step1-icon.svg" },
    { title: t("home.step2Title"), desc: t("home.step2Desc"), icon: "/images/step2-icon.svg" },
    { title: t("home.step3Title"), desc: t("home.step3Desc"), icon: "/images/step3-icon.svg" },
    { title: t("home.step4Title"), desc: t("home.step4Desc"), icon: "/images/step4-icon.svg" },
  ];
  const STATUS_LABELS: Record<string, string> = {
    draft: t("status.draft"),
    active: t("status.active"),
    suspended: t("status.suspended"),
    terminated: t("status.terminated"),
    violated: t("status.violated"),
  };

  const [searchTypeIdx, setSearchTypeIdx] = useState(0);
  const [query, setQuery] = useState("");

  const [reveal, setReveal] = useState<RevealCodeOut | null>(null);
  const [confirmAnswer, setConfirmAnswer] = useState("");

  const [results, setResults] = useState<PublicRecordOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<PublicContentItemOut[]>([]);
  const [news, setNews] = useState<PublicContentItemOut[]>([]);
  const servicesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient
      .get<PublicContentItemOut[]>("/public/content", { params: { type: "service" } })
      .then(({ data }) => setServices(data))
      .catch(() => {});
    apiClient
      .get<PublicContentItemOut[]>("/public/content", { params: { type: "news" } })
      .then(({ data }) => setNews(data))
      .catch(() => {});
    fetchRevealCode();
  }, []);

  const scrollServices = (dir: 1 | -1) => {
    const el = servicesScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };

  const fetchRevealCode = async () => {
    setCodeLoading(true);
    try {
      const { data } = await apiClient.get<RevealCodeOut>("/public/reveal-code");
      setReveal(data);
      setConfirmAnswer("");
    } catch {
      setReveal(null);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError(t("home.errMinLength"));
      return;
    }
    if (!reveal) {
      setError(t("home.errCodeNotLoaded"));
      return;
    }
    if (confirmAnswer.trim().length < 4) {
      setError(t("home.errAnswerIncomplete"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.get<PublicRecordOut[]>("/public/search", {
        params: { q: query.trim(), captcha_token: reveal.token, captcha_answer: confirmAnswer.trim() },
      });
      setResults(data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError(t("home.errTooMany"));
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || t("home.errWrongCode"));
        fetchRevealCode();
      } else {
        setError(t("home.errSearchFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-[#CEE5FA] bg-no-repeat bg-[length:auto]"
        style={{ backgroundImage: "url('/images/building.png')", backgroundPosition: "106% 100%" }}
      >
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pb-24">
          <div className="max-w-[560px] space-y-6">
            <h1 className="text-[26px] font-extrabold leading-tight text-[#282A2E] sm:text-[30px]">
              {t("home.heroTitle")}
            </h1>
            <button className="rounded-[11px] bg-white px-10 py-[11px] text-sm font-medium text-ink shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              {t("home.detailsBtn")}
            </button>
            <div className="flex items-center gap-3 text-[18px] font-semibold text-ink">
              <span>{t("home.socialLabel")}</span>
              <TelegramIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
              <FacebookIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Search card (hero ustiga chiqib turadi) — real saytdagi kabi bitta qatorda:
          tur tanlash, raqam, tasdiqlash kodi, kodni yangilash, javob va qidirish tugmasi */}
      <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-4 sm:-mt-16">
        <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-100 sm:p-5">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <select
              value={searchTypeIdx}
              onChange={(e) => setSearchTypeIdx(Number(e.target.value))}
              className="rounded-[11px] border border-[#F1F1F1] bg-[#F8F8F8] px-5 py-3 text-[15px] font-semibold text-black focus:outline-none sm:w-56"
            >
              {SEARCH_TYPES.map((st, i) => (
                <option key={st.label} value={i}>
                  {st.label}
                </option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={SEARCH_TYPES[searchTypeIdx].placeholder}
              className="min-w-0 flex-1 rounded-[11px] border border-[#F1F1F1] bg-[#F8F8F8] px-4 py-3 text-sm placeholder:text-[#979797] focus:outline-none"
            />
            <div
              title="Xavfsizlik kodi"
              className="relative flex h-[53px] w-[134px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-[#F1F1F1] bg-[#e2e2e2]"
            >
              {/* Don/grain texturasi (SVG feTurbulence) — haqiqiy captcha rasmiga o'xshatish uchun */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <filter id="captchaGrain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="noise" />
                  <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#captchaGrain)" />
                <line x1="8" y1="10" x2="126" y2="40" stroke="#8a8a8a" strokeWidth="1" opacity="0.5" />
                <line x1="6" y1="38" x2="128" y2="12" stroke="#8a8a8a" strokeWidth="1" opacity="0.5" />
                <line x1="15" y1="46" x2="110" y2="6" stroke="#8a8a8a" strokeWidth="1" opacity="0.5" />
              </svg>
              <div className="relative flex" style={{ mixBlendMode: "multiply" }}>
                {(codeLoading ? "····" : reveal?.code ?? "----").split("").map((ch, i) => (
                  <span
                    key={i}
                    className="font-serif text-[28px] font-bold text-black"
                    style={{
                      display: "inline-block",
                      transform: `rotate(${[-14, 10, -8, 13][i % 4]}deg) translateY(${[5, -4, 6, -3][i % 4]}px) scaleY(${[1.1, 0.9, 1.15, 0.85][i % 4]})`,
                    }}
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={fetchRevealCode}
              title="Kodni yangilash"
              className="flex h-[53px] w-[58px] shrink-0 items-center justify-center rounded-[11px] bg-[#6699F2] text-white hover:bg-brand-600"
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
            <input
              value={confirmAnswer}
              onChange={(e) => setConfirmAnswer(e.target.value)}
              placeholder="----"
              maxLength={4}
              className="h-[53px] w-[96px] shrink-0 rounded-[11px] border border-[#F1F1F1] bg-[#F8F8F8] text-center text-[17px] tracking-widest text-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              title="Qidirish"
              className="flex h-[53px] w-[58px] shrink-0 items-center justify-center rounded-[11px] bg-[#6699F2] text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {results !== null && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
                {t("home.noResults")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
                {results.map((r) => (
                  <li key={r.record_number} className="p-4 hover:bg-slate-50">
                    <Link to={`/record/${r.record_number}`} className="block">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-brand-700">{r.record_number}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          {STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {r.data.manzil || r.registry_type_name}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Elektron xizmatlar */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-[26px] font-bold text-ink sm:text-[30px]">{t("home.servicesTitle")}</h2>
        <div className="relative mt-8">
          {services.length > 3 && (
            <button
              onClick={() => scrollServices(-1)}
              aria-label="Oldingi"
              className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-50 text-ink shadow hover:bg-brand-100 sm:flex"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div
            ref={servicesScrollRef}
            className="flex snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {services.map((s) => (
              <div key={s.id} className="w-full shrink-0 snap-start sm:w-1/2 sm:pl-8 lg:w-1/3">
                <div className="flex items-start gap-4">
                  <img src="/images/service-icon.svg" alt="" className="h-[68px] w-[68px] shrink-0" />
                  <h3 className="text-[17px] font-bold leading-snug text-black">{s.title}</h3>
                </div>
                {s.description && <p className="mt-3 text-sm font-medium text-[#676767]">{s.description}</p>}
              </div>
            ))}
          </div>
          {services.length > 3 && (
            <button
              onClick={() => scrollServices(1)}
              aria-label="Keyingi"
              className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-brand-50 text-ink shadow hover:bg-brand-100 sm:flex"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </section>

      {/* Qanday olinadi */}
      <section className="bg-[#f9fafb] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-[26px] font-bold text-ink sm:text-[30px]">
                {t("home.howToTitlePrefix")} <span className="text-brand-600">{t("home.howToTitleHighlight")}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted">{t("home.howToDesc")}</p>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {STEPS.map((s) => (
                  <div key={s.title} className="flex gap-4">
                    <img src={s.icon} alt="" className="h-[68px] w-[68px] shrink-0" />
                    <div>
                      <h3 className="text-[20px] font-bold text-ink">{s.title}</h3>
                      <p className="mt-1 text-sm text-muted">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <video
                controls
                poster="/images/howto-poster.png"
                className="w-full rounded-2xl shadow-lg"
              >
                <source src="/images/howto-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* So'nggi yangiliklar */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 flex justify-center text-[26px] font-bold text-ink sm:text-[30px]">
          {t("home.newsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {news.map((n, i) => (
            <div key={n.id} className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:shadow-md">
              <img
                src={`/images/news/${(i % 3) + 1}.jpg`}
                alt=""
                className="h-[220px] w-full object-cover"
              />
              <div className="p-5">
                <h3 className="truncate text-[17px] font-bold text-[#2D2D2D]">{n.title}</h3>
                {n.published_at && (
                  <p className="mt-2 text-right text-[15px] text-[#6D6D6D]">
                    {new Date(n.published_at).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button className="rounded-[8px] bg-[#6699F2] px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            {t("home.allNewsBtn")}
          </button>
        </div>
      </section>

      {/* Suzuvchi tugmalar — real saytdagi kabi */}
      <a
        href="#top"
        title={t("home.goUp")}
        className="fixed bottom-24 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#6699F2] text-white shadow-lg hover:bg-brand-600"
      >
        <ChevronRightIcon className="h-5 w-5 -rotate-90" />
      </a>
      <button
        title={t("home.rateBtn")}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-[11px] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-brand-700"
      >
        <StarIcon className="h-4 w-4" />
        {t("home.rateBtn")}
      </button>
    </div>
  );
}
