import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { FieldDef, RegistryRecordOut, RegistryTypeOut } from "../../types";

function SimpleField({
  field,
  value,
  onChange,
  t,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  t: (key: string) => string;
}) {
  const commonClasses =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none";

  if (field.type === "boolean") {
    return (
      <label className="mt-1 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {t("recordForm.yes")}
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClasses}>
        <option value="">{t("recordForm.selectPlaceholder")}</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      step={field.type === "number" ? "any" : undefined}
      value={value ?? ""}
      onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
      className={commonClasses}
      required={field.required}
    />
  );
}

function ListField({
  field,
  items,
  onChange,
  t,
}: {
  field: FieldDef;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  t: (key: string) => string;
}) {
  const itemFields = field.item_fields || [];

  const updateItem = (idx: number, key: string, value: any) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [key]: value } : it));
    onChange(next);
  };

  const addItem = () => onChange([...items, {}]);
  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-md border border-slate-200 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {itemFields.map((sf) => (
              <div key={sf.key}>
                <label className="block text-xs font-medium text-slate-600">{sf.label}</label>
                <SimpleField field={sf} value={item[sf.key]} onChange={(v) => updateItem(idx, sf.key, v)} t={t} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            {t("recordForm.removeRow")}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
      >
        + {field.label}{t("recordForm.addRow")}
      </button>
    </div>
  );
}

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
