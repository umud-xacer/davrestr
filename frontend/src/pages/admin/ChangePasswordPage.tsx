import { FormEvent, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";

export function ChangePasswordPage() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (newPassword.length < 8) {
      setError(t("changePassword.errTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.errMismatch"));
      return;
    }

    setSaving(true);
    try {
      await apiClient.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("changePassword.submitError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("changePassword.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("changePassword.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("changePassword.currentLabel")}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("changePassword.newLabel")}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("changePassword.confirmLabel")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-emerald-600">{t("changePassword.saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? t("changePassword.saving") : t("changePassword.submit")}
        </button>
      </form>
    </div>
  );
}
