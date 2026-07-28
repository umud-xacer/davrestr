import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { ListField, SimpleField } from "../../components/RecordFieldInputs";
import { useLanguage } from "../../context/LanguageContext";
import { RegistryRecordOut, RegistryTypeOut } from "../../types";

export function RecordFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [registryTypes, setRegistryTypes] = useState<RegistryTypeOut[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [recordNumber, setRecordNumber] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectPinfl, setSubjectPinfl] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get<RegistryTypeOut[]>("/cabinet/registry-types").then(({ data }) => setRegistryTypes(data));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      apiClient.get<RegistryRecordOut>(`/cabinet/records/${id}`).then(({ data: rec }) => {
        setSelectedTypeId(rec.registry_type_id);
        setRecordNumber(rec.record_number);
        setSubjectName(rec.subject_name || "");
        setSubjectPinfl(rec.subject_pinfl || "");
        setData(rec.data);
      });
    }
  }, [isEdit, id]);

  const selectedType = registryTypes.find((rt) => rt.id === selectedTypeId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit && id) {
        await apiClient.put(`/cabinet/records/${id}`, {
          subject_name: subjectName,
          subject_pinfl: subjectPinfl,
          data,
        });
      } else {
        await apiClient.post("/cabinet/records", {
          registry_type_id: selectedTypeId,
          record_number: recordNumber || null,
          subject_name: subjectName,
          subject_pinfl: subjectPinfl,
          data,
        });
      }
      navigate("/cabinet");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("recordForm.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">
        {isEdit ? t("recordForm.editTitle") : t("recordForm.newTitle")}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("recordForm.registryType")}</label>
            <select
              value={selectedTypeId}
              onChange={(e) => {
                setSelectedTypeId(e.target.value);
                setData({});
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
            >
              <option value="">{t("recordForm.selectPlaceholder")}</option>
              {registryTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700">
            {t("recordForm.recordNumber")}{" "}
            <span className="font-normal text-slate-400">{t("recordForm.recordNumberHint")}</span>
          </label>
          <input
            value={recordNumber}
            onChange={(e) => setRecordNumber(e.target.value)}
            disabled={isEdit}
            placeholder={t("recordForm.recordNumberPlaceholder")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50 disabled:text-slate-400"
          />
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || (!isEdit && !selectedTypeId)}
          className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? t("recordForm.saving") : t("recordForm.saveDraft")}
        </button>
        <p className="text-center text-xs text-slate-400">{t("recordForm.footerNote")}</p>
      </form>
    </div>
  );
}
