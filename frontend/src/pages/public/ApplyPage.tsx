import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";

export function ApplyPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [serviceTitle, setServiceTitle] = useState(searchParams.get("service") || "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/public/applications", {
        service_title: serviceTitle,
        full_name: fullName,
        phone,
        message: message || null,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || t("apply.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-800">{t("apply.successTitle")}</h1>
        <p className="mt-2 text-sm text-slate-500">{t("apply.successDesc")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-xl font-semibold text-slate-800">{t("apply.title")}</h1>
      <p className="mt-1 text-center text-sm text-slate-500">{t("apply.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("apply.serviceLabel")}</label>
          <input
            value={serviceTitle}
            onChange={(e) => setServiceTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("apply.fullNameLabel")}</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("apply.phoneLabel")}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("apply.messageLabel")}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? t("apply.submitting") : t("apply.submit")}
        </button>
      </form>
    </div>
  );
}
