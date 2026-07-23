import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { CaptchaBox } from "../../components/CaptchaBox";
import { BuildingIcon, CheckCircleIcon, FacebookIcon, SearchIcon, TelegramIcon } from "../../components/icons";
import { PublicRecordOut, STATUS_LABELS } from "../../types";

const SEARCH_TYPES = [
  "Kadastr raqami bo'yicha",
  "STIR bo'yicha",
  "PINFL bo'yicha",
  "Kalit so'z bo'yicha",
];

const SERVICES = [
  {
    title: "Ulush kiritish asosida ishtirok etish shartnomasini davlat ro'yhatidan o'tkazish",
    desc: "Ulush kiritish asosida ishtirok etish shartnomasini davlat ro'yhatidan o'tkazish",
  },
  {
    title: "Obyektning eski kadastr raqamini kiritish orqali yangi kadastr raqamini aniqlash",
    desc: "Obyektning eski kadastr raqamini kiritish orqali yangi kadastr raqamini aniqlash",
  },
  {
    title: "Ariza va shikoyatlarni ko'rib chiqish xizmati",
    desc: "Ariza va shikoyatlarni ko'rib chiqish xizmati",
  },
  {
    title: "Kadastr obyektiga taqiqni tekshirish",
    desc: "Kadastr obyektiga taqiqni tekshirish",
  },
  {
    title: "Ko'p yillik dov-daraxtlarga kadastr pasporti",
    desc: "Ko'p yillik dov-daraxtlarga kadastr pasportini shakllantirish va ularga bo'lgan huquqlarni davlat ro'yxatidan o'tkazish",
  },
  {
    title: "Ko'chmas mulk ma'lumotlarini tahrirlash uchun ariza berish",
    desc: "Ko'chmas mulk ma'lumotlarini tahrirlash uchun ariza berish",
  },
  {
    title: "Bino va inshootlarni ijara shartnomasini davlat ro'yxatidan o'tkazish",
    desc: "Bino va inshootlarni ijara shartnomasini davlat ro'yxatidan o'tkazish",
  },
  {
    title: "Bino va inshootlarning mansubligi va tarkibi to'g'risida ma'lumotnoma berish",
    desc: "Bino va inshootlarning mansubligi va tarkibi to'g'risida ma'lumotnoma berish",
  },
  {
    title: "Ko'chmas mulk tarixi haqida ma'lumot olish",
    desc: "Ko'chmas mulk tarixi haqida ma'lumot olish",
  },
  {
    title: "Davlat kadastr reyestridan ko'chmas mulk bo'yicha ko'chirmani tekshirish",
    desc: "Davlat kadastr reyestridan ko'chmas mulk bo'yicha ko'chirmani tekshirish",
  },
  {
    title: "Shaxsiy uy-joyi to'g'risida ma'lumotnoma",
    desc: "Fuqarolarning nomida shaxsiy uy-joyi borligi yoki yo'qligi to'g'risidagi ma'lumotnoma olish",
  },
  {
    title: "Qurilish-montaj ishlari tugallangan obyektdan foydalanish uchun ruxsatnoma berish",
    desc: "Qurilish-montaj ishlari tugallangan obyektdan foydalanish uchun ruxsatnoma berish va kadastr hujjatlarini rasmiylashtirish",
  },
  {
    title: "Noturar obyektlarini kadastr pasportini shakllantirish",
    desc: "Noturar obyektlarini kadastr pasportini shakllantirish va ularga bo'lgan huquqni davlat ro'yxatidan o'tkazish",
  },
  {
    title: "Turar-joy obyektlariga bo'lgan huquqlarni davlat ro'yxatidan o'tkazishga ariza yuborish",
    desc: "Turar-joy obyektlariga bo'lgan huquqlarni davlat ro'yxatidan o'tkazishga ariza yuborish",
  },
  {
    title: "Turar-joy obyektlarini kadastr pasportini shakllantirish",
    desc: "Turar-joy obyektlarini kadastr pasportini shakllantirish",
  },
  {
    title: "Servitutni ro'yxatdan o'tkazish",
    desc: "O'zganing yer uchastkasidan cheklangan tarzda foydalanish huquqi (servitut) to'g'risida kelishuvni ro'yhatdan o'tkazish",
  },
];

const NEWS = [
  { date: "2026-07-23 10:42", title: "Andijon viloyatida xatlov jarayonlari yakunlandi" },
  { date: "2026-07-22 11:01", title: "O'zbekiston Respublikasi qonun hujjatlariga oid yangiliklar" },
  { date: "2026-07-17 17:54", title: "Rejali profilaktika ishlari" },
];

const STEPS = [
  { title: "Ro'yxatdan o'tish", desc: "Yagona identifikatsiya tizimi (OneID) orqali" },
  { title: "Ko'chmas mulk obektini izlash", desc: "Ob'ektning kadastr raqami, jismoniy shaxsning PINFL raqami yoki yuridik shaxsning STIR raqamini kiriting" },
  { title: "Javobni kutish", desc: "Onlayn rejimida" },
  { title: "Ma'lumotnoma olish", desc: "Onlayn rejimda ekranda aks etadi" },
];

export function SearchPage() {
  const [searchType, setSearchType] = useState(SEARCH_TYPES[0]);
  const [query, setQuery] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [results, setResults] = useState<PublicRecordOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 3) {
      setError("Kamida 3 ta belgi kiriting");
      return;
    }
    if (!captchaAnswer || captchaAnswer.length < 4) {
      setError("Rasmdagi kodni to'liq kiriting");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.get<PublicRecordOut[]>("/public/search", {
        params: { q: query.trim(), captcha_token: captchaToken, captcha_answer: captchaAnswer },
      });
      setResults(data);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Juda ko'p so'rov yubordingiz. Birozdan so'ng qayta urinib ko'ring.");
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.detail || "Captcha kodi noto'g'ri");
      } else {
        setError("Qidiruvda xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kadastr raqamini kiriting (namuna: 11:14:04:01:01:1630)"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
            <CaptchaBox onChange={(token, answer) => { setCaptchaToken(token); setCaptchaAnswer(answer); }} />
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-white hover:bg-brand-700 disabled:opacity-50 sm:w-11 sm:px-0"
              title="Qidirish"
            >
              <SearchIcon className="h-4 w-4" />
              <span className="sm:hidden">{loading ? "Qidirilmoqda..." : "Qidirish"}</span>
            </button>
          </form>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {results !== null && (
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
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold uppercase text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.desc}</p>
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
            kiritadi, so'ngra rasmda paydo bo'lgan kodni kiritib, izlash tugmasi bosiladi.
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
          {NEWS.map((n) => (
            <div key={n.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-32 items-center justify-center rounded-lg bg-brand-50 text-brand-200">
                <BuildingIcon className="h-8 w-8" />
              </div>
              <p className="mt-4 text-xs text-faint">{n.date}</p>
              <h3 className="mt-1 text-sm font-semibold text-ink">{n.title}</h3>
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
