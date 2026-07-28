import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { SiteSettingsOut } from "../../types";

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [hours, setHours] = useState(36);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get<SiteSettingsOut>("/admin/settings").then(({ data }) => {
      setEnabled(data.maintenance_notice_enabled);
      setHours(data.maintenance_notice_hours);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await apiClient.put<SiteSettingsOut>("/admin/settings", {
        maintenance_notice_enabled: enabled,
        maintenance_notice_hours: hours,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || t("settings.submitError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-slate-500">...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("settings.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("settings.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">{t("settings.noticeToggle")}</span>
            <span className="block text-xs text-slate-500">{t("settings.noticeToggleHint")}</span>
          </span>
        </label>

        <div className="max-w-xs">
          <label className="block text-sm font-medium text-slate-700">{t("settings.hoursLabel")}</label>
          <input
            type="number"
            min={1}
            max={240}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        {enabled && (
          <div className="rounded-md bg-amber-50 p-3 text-sm italic text-amber-800">
            <span className="not-italic text-xs font-medium text-amber-600">{t("settings.preview")}</span>{" "}
            {t("record.maintenanceNotice").replace("{hours}", String(hours))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">{t("settings.saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? t("settings.saving") : t("settings.save")}
        </button>
      </form>
    </div>
  );
}
