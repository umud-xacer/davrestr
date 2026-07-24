import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { BuildingIcon, CheckCircleIcon, FacebookIcon, RefreshIcon, SearchIcon, TelegramIcon } from "../../components/icons";
import { PublicContentItemOut, PublicRecordOut, RevealCodeOut, STATUS_LABELS } from "../../types";

const SEARCH_TYPES = [
  "Kadastr raqami bo'yicha",
  "STIR bo'yicha",
  "PINFL bo'yicha",
  "Kalit so'z bo'yicha",
];

const STEPS = [
  { title: "Ro'yxatdan o'tish", desc: "Yagona identifikatsiya tizimi (OneID) orqali" },
  { title: "Ko'chmas mulk obektini izlash", desc: "Ob'ektning kadastr raqami, jismoniy shaxsning PINFL raqami yoki yuridik shaxsning STIR raqamini kiriting" },
  { title: "Javobni kutish", desc: "Onlayn rejimida" },
  { title: "Ma'lumotnoma olish", desc: "Onlayn rejimda ekranda aks etadi" },
];

type Step = "query" | "confirm" | "results";

export function SearchPage() {
  const [step, setStep] = useState<Step>("query");
  const [searchType, setSearchType] = useState(SEARCH_TYPES[0]);
  const [query, setQuery] = useState("");

  const [reveal, setReveal] = useState<RevealCodeOut | null>(null);
  const [confirmAnswer, setConfirmAnswer] = useState("");

  const [results, setResults] = useState<PublicRecordOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [services, setServices] = useState<PublicContentItemOut[]>([]);
  const [news, setNews] = useState<PublicContentItemOut[]>([]);

  useEffect(() => {
    apiClient
      .get<PublicContentItemOut[]>("/public/content", { params: { type: "service" } })
      .then(({ data }) => setServices(data))
      .catch(() => {});
    apiClient
      .get<PublicContentItemOut[]>("/public/content", { params: { type: "news" } })
      .then(({ data }) => setNews(data))
      .catch(() => {});
  }, []);

  const fetchRevealCode = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.get<RevealCodeOut>("/public/reveal-code");
      setReveal(data);
      setConfirmAnswer("");
    } catch {
      setError("Tasdiqlash kodini olishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError("Kamida 3 ta belgi kiriting");
      return;
    }
    setError(null);
    await fetchRevealCode();
    setStep("confirm");
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!reveal) return;
    if (confirmAnswer.trim().length < 4) {
      setError("Yuqorida ko'rsatilgan kodni to'liq kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.get<PublicRecordOut[]>("/public/search", {
        params: { q: query.trim(), captcha_token: reveal.token, captcha_answer: confirmAnswer.trim() },
      });
      setResults(data);
      setStep("results");
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Juda ko'p so'rov yubordingiz. Birozdan so'ng qayta urinib ko'ring.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || "Kod noto'g'ri yoki muddati o'tgan. Qayta urinib ko'ring.");
      } else {
        setError("Qidiruvda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setStep("query");
    setQuery("");
    setReveal(null);
    setConfirmAnswer("");
    setResults(null);
    setError(null);
  };

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-brand-50 bg-no-repeat bg-[length:auto]"
        style={{ backgroundImage: "url('/images/building.png')", backgroundPosition: "106% 100%" }}
      >
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pb-24">
          <div className="max-w-xl">
            <h1 className="text-[26px] font-extrabold leading-tight text-ink sm:text-[30px]">
              Ko'chmas mulk obyektlariga bo'lgan huquqlarning davlat reyestri
            </h1>
            <button className="mt-6 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              Batafsil
            </button>
            <div className="mt-6 flex items-center gap-3 text-sm text-muted">
              <span>Biz ijtimoiy tarmoqlarda</span>
              <TelegramIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
              <FacebookIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Search card (hero ustiga chiqib turadi) */}
      <div className="mx-auto -mt-10 max-w-5xl px-4 sm:-mt-16">
        <div className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-slate-100 sm:p-5">
          {step === "query" && (
            <>
              <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-[#f8f8f8] p-1 text-sm">
                {SEARCH_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSearchType(t)}
                    className={`rounded-md px-3 py-2 font-medium transition ${
                      searchType === t ? "bg-white text-brand-600 shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <form onSubmit={handleContinue} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kadastr raqamini kiriting (namuna: 11:14:04:01:01:1630)"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <SearchIcon className="h-4 w-4" />
                  {loading ? "Yuklanmoqda..." : "Davom etish"}
                </button>
              </form>
            </>
          )}

          {step === "confirm" && (
            <div>
              <p className="text-sm text-muted">
                Xavfsizlik maqsadida, natijani ko'rish uchun quyidagi kodni tasdiqlang:
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-md bg-[#f8f8f8] px-6 py-3 text-2xl font-bold tracking-[0.4em] text-ink">
                  {reveal?.code ?? "----"}
                </div>
                <button
                  type="button"
                  onClick={fetchRevealCode}
                  title="Kodni yangilash"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <RefreshIcon className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleConfirm} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={confirmAnswer}
                  onChange={(e) => setConfirmAnswer(e.target.value)}
                  placeholder="Kodni shu yerga kiriting"
                  maxLength={4}
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm tracking-widest focus:border-brand-500 focus:outline-none sm:max-w-[180px]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {loading ? "Tekshirilmoqda..." : "Tasdiqlash va ko'rish"}
                </button>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="text-sm text-muted hover:text-ink sm:ml-2"
                >
                  Orqaga
                </button>
              </form>
            </div>
          )}

          {step === "results" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Qidiruv so'rovi</p>
                <p className="font-medium text-ink">{query}</p>
              </div>
              <button
                onClick={resetSearch}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-ink hover:bg-slate-200"
              >
                Yangi qidiruv
              </button>
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {step === "results" && results !== null && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="rounded-lg bg-white p-6 text-center text-slate-500 shadow-sm">
                Hech narsa topilmadi
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
        <h2 className="text-center text-[26px] font-bold text-ink sm:text-[30px]">Elektron xizmatlar</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold uppercase text-ink">{s.title}</h3>
              {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Qanday olinadi */}
      <section className="bg-[#f9fafb] py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-[26px] font-bold text-ink sm:text-[30px]">
            Rasmiy ma'lumotnoma <span className="text-brand-600">onlayn tarzda qanday olinadi?</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Davlat reyestridan mavjud ko'chirmani yuklab olish uchun mulkdor o'zining shaxsiy kabineti
            orqali bosh sahifada joylashgan qidiruv paneliga ko'chmas mulk ob'ektining kadastr raqamini
            kiritadi, so'ngra paydo bo'lgan tasdiqlash kodini kiritib, natijani ko'radi.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* So'nggi yangiliklar */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-12 flex justify-center text-[26px] font-bold text-ink sm:text-[30px]">
          So'nggi yangiliklar
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {news.map((n) => (
            <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-32 items-center justify-center rounded-lg bg-brand-50 text-brand-200">
                <BuildingIcon className="h-8 w-8" />
              </div>
              {n.published_at && (
                <p className="mt-4 text-xs text-faint">{new Date(n.published_at).toLocaleString("uz-UZ")}</p>
              )}
              <h3 className="mt-1 text-sm font-semibold text-ink">{n.title}</h3>
              {n.description && <p className="mt-1 text-sm text-muted">{n.description}</p>}
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            Barcha yangiliklar
          </button>
        </div>
      </section>
    </div>
  );
}
