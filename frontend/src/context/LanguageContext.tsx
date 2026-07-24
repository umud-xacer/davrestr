import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Lang } from "../i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function lookup(dict: any, key: string): string | undefined {
  return key.split(".").reduce<any>((obj, part) => (obj ? obj[part] : undefined), dict);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("lang");
    return stored === "ru" || stored === "uz" ? stored : "uz";
  });

  const setLang = (next: Lang) => {
    localStorage.setItem("lang", next);
    setLangState(next);
  };

  const t = (key: string): string => {
    const value = lookup(translations[lang], key);
    if (value !== undefined) return value;
    const fallback = lookup(translations.uz, key);
    return fallback !== undefined ? fallback : key;
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
