import { FieldDef } from "../types";

export function SimpleField({
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

export function ListField({
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
