import { FacebookIcon, TelegramIcon } from "./icons";

const QUICK_LINKS = ["Normativ huquqiy hujjatlar", "Savol-javoblar", "Online so'rovnoma", "Yangiliklar", "Murojaat qoldirish"];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img src="/images/gerb.png" alt="O'zbekiston Respublikasi gerbi" className="h-12 w-12 shrink-0 object-contain" />
            <div className="text-[15px] font-bold leading-tight text-ink">
              Ko'chmas mulk obyektlariga bo'lgan
              <br />
              huquqlarning davlat reyestri
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            Oʻzbekiston Respublikasi Urbanizatsiya va uy-joy bozori qoʻmitasi huzuridagi Kadastr
            agentligi
          </p>
          <p className="mt-2 text-sm text-muted">(+998 71) 207-00-03</p>
          <p className="mt-1 text-sm text-muted">Toshkent, 100097, Chilonzor tumani, Cho'ponota ko'chasi</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Havolalar</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {QUICK_LINKS.map((l) => (
              <li key={l} className="cursor-pointer hover:text-brand-700">
                {l}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">Biz ijtimoiy tarmoqlarda</h3>
          <div className="mt-3 flex gap-3 text-faint">
            <TelegramIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
            <FacebookIcon className="h-5 w-5 cursor-pointer hover:text-brand-600" />
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-faint">
        © 2021-2026 Oʻzbekiston Respublikasi Urbanizatsiya va uy-joy bozori qoʻmitasi huzuridagi
        Kadastr agentligi. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
