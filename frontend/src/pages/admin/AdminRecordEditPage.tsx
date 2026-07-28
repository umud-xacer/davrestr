import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { ListField, SimpleField } from "../../components/RecordFieldInputs";
import { useLanguage } from "../../context/LanguageContext";
import { RegistryRecordOut, RegistryTypeOut } from "../../types";

export function AdminRecordEditPage() {
  const { t } = useLanguage();
  const [registryTypes, setRegistryTypes] = useState<RegistryTypeOut[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistryRecordOut[]>([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<RegistryRecordOut | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectPinfl, setSubjectPinfl] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get<RegistryTypeOut[]>("/admin/registry-types").then(({ data }) => setRegistryTypes(data));
  }, []);

  const runSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    setSearching(true);
    try {
      const { data } = await apiClient.get<RegistryRecordOut[]>("/admin/records", {
        params: query.trim() ? { q: query.trim() } : {},
      });
      setResults(data);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRecord = (r: RegistryRecordOut) => {
    setSelected(r);
    setSubjectName(r.subject_name || "");
    setSubjectPinfl(r.subject_pinfl || "");
    setData(r.data);
    setError(null);
    setSaved(false);
  };

  const selectedType = selected ? registryTypes.find((rt) => rt.id === selected.registry_type_id) : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { data: updated } = await apiClient.put<RegistryRecordOut>(`/admin/records/${selected.id}`, {
        subject_name: subjectName,
        subject_pinfl: subjectPinfl,
        data,
      });
      setSelected(updated);
      setSaved(true);
      runSearch();
    } catch (err: any) {
      setError(err.response?.data?.detail || t("adminRecordEdit.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("adminRecordEdit.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("adminRecordEdit.desc")}</p>

      <form onSubmit={runSearch} className="mt-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("adminRecordEdit.searchPlaceholder")}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("adminRecordEdit.searchBtn")}
        </button>
      </form>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <ul className="h-fit divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {searching && <li className="p-4 text-center text-sm text-slate-400">{t("adminRecordEdit.loading")}</li>}
          {!searching && results.length === 0 && (
            <li className="p-4 text-center text-sm text-slate-400">{t("adminRecordEdit.empty")}</li>
          )}
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => selectRecord(r)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  selected?.id === r.id ? "bg-brand-50 text-brand-700" : "text-slate-700"
                }`}
              >
                <div className="font-medium">{r.record_number}</div>
                <div className="truncate text-xs text-slate-400">{r.subject_name || "—"}</div>
              </button>
            </li>
          ))}
        </ul>

        <div>
          {!selected ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              {t("adminRecordEdit.selectHint")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-slate-800">{selected.record_number}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{selected.status}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t("recordForm.subjectName")}</label>
                  <input
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t("recordForm.subjectPinfl")}</label>
                  <input
                    value={subjectPinfl}
                    onChange={(e) => setSubjectPinfl(e.target.value)}
                    maxLength={14}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              {selectedType && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  {selectedType.field_schema.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                      </label>
                      {field.type === "list" ? (
                        <div className="mt-1">
                          <ListField
                            field={field}
                            items={data[field.key] || []}
                            onChange={(items) => setData((prev) => ({ ...prev, [field.key]: items }))}
                            t={t}
                          />
                        </div>
                      ) : (
                        <SimpleField
                          field={field}
                          value={data[field.key]}
                          onChange={(v) => setData((prev) => ({ ...prev, [field.key]: v }))}
                          t={t}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selected.signed_at && (
                <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700">{t("adminRecordEdit.signedHint")}</p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && !error && <p className="text-sm text-emerald-600">{t("adminRecordEdit.saved")}</p>}

              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? t("adminRecordEdit.saving") : t("adminRecordEdit.save")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
