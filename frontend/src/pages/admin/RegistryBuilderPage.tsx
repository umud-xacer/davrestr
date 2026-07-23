import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { FieldDef, RegistryTypeOut } from "../../types";

const FIELD_TYPES: FieldDef["type"][] = ["text", "number", "date", "select", "boolean", "file", "list"];
const ITEM_FIELD_TYPES: FieldDef["type"][] = ["text", "number", "date", "select", "boolean"];

function emptyField(): FieldDef {
  return { key: "", label: "", type: "text", required: false };
}

export function RegistryBuilderPage() {
  const [types, setTypes] = useState<RegistryTypeOut[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDef[]>([emptyField()]);
  const [publicFields, setPublicFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiClient.get<RegistryTypeOut[]>("/admin/registry-types").then(({ data }) => setTypes(data));
  };
  useEffect(load, []);

  const updateField = (idx: number, patch: Partial<FieldDef>) => {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const addItemField = (idx: number) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === idx ? { ...f, item_fields: [...(f.item_fields || []), emptyField()] } : f
      )
    );
  };

  const updateItemField = (idx: number, itemIdx: number, patch: Partial<FieldDef>) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === idx
          ? {
              ...f,
              item_fields: (f.item_fields || []).map((sf, si) => (si === itemIdx ? { ...sf, ...patch } : sf)),
            }
          : f
      )
    );
  };

  const removeItemField = (idx: number, itemIdx: number) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === idx ? { ...f, item_fields: (f.item_fields || []).filter((_, si) => si !== itemIdx) } : f
      )
    );
  };

  const togglePublic = (key: string) => {
    setPublicFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const cleanFields = fields
        .filter((f) => f.key && f.label)
        .map((f) =>
          f.type === "list"
            ? { ...f, item_fields: (f.item_fields || []).filter((sf) => sf.key && sf.label) }
            : f
        );
      await apiClient.post("/admin/registry-types", {
        code,
        name,
        description,
        field_schema: cleanFields,
        public_fields: publicFields,
      });
      setCode("");
      setName("");
      setDescription("");
      setFields([emptyField()]);
      setPublicFields([]);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">Reestr strukturasi konstruktori</h1>
      <p className="mt-1 text-sm text-slate-500">
        Dasturchisiz yangi reestr turini (maydonlar, tiplar) shu yerda yarating.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Kod (unikal)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="MASALAN: LITSENZIYA"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nomi</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tavsifi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            rows={2}
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-700">Maydonlar</h3>
            <button
              type="button"
              onClick={() => setFields((prev) => [...prev, emptyField()])}
              className="rounded bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200"
            >
              + Maydon qo'shish
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {fields.map((f, idx) => (
              <div key={idx} className="rounded border border-slate-100 p-2">
                <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
                  <input
                    placeholder="key (kadastr_qiymati)"
                    value={f.key}
                    onChange={(e) => updateField(idx, { key: e.target.value })}
                    className="col-span-2 rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-3"
                  />
                  <input
                    placeholder="Label (Kadastr qiymati)"
                    value={f.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    className="col-span-2 rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-4"
                  />
                  <select
                    value={f.type}
                    onChange={(e) => updateField(idx, { type: e.target.value as FieldDef["type"] })}
                    className="col-span-2 rounded border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="col-span-1 flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(idx, { required: e.target.checked })}
                    />
                    majburiy
                  </label>
                  <label className="col-span-1 flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={publicFields.includes(f.key)}
                      disabled={!f.key}
                      onChange={() => togglePublic(f.key)}
                    />
                    ochiq
                  </label>
                  <button
                    type="button"
                    onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-2 text-xs text-red-500 hover:underline sm:col-span-1"
                  >
                    o'chirish
                  </button>
                </div>

                {f.type === "list" && (
                  <div className="mt-2 space-y-2 border-t border-slate-100 pl-4 pt-2">
                    <p className="text-xs font-medium text-slate-500">
                      "{f.label || "..."}" har bir qatoridagi maydonlar:
                    </p>
                    {(f.item_fields || []).map((sf, sidx) => (
                      <div key={sidx} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
                        <input
                          placeholder="key (raqami)"
                          value={sf.key}
                          onChange={(e) => updateItemField(idx, sidx, { key: e.target.value })}
                          className="col-span-2 rounded border border-slate-300 px-2 py-1 text-xs sm:col-span-3"
                        />
                        <input
                          placeholder="Label"
                          value={sf.label}
                          onChange={(e) => updateItemField(idx, sidx, { label: e.target.value })}
                          className="col-span-2 rounded border border-slate-300 px-2 py-1 text-xs sm:col-span-5"
                        />
                        <select
                          value={sf.type}
                          onChange={(e) => updateItemField(idx, sidx, { type: e.target.value as FieldDef["type"] })}
                          className="col-span-2 rounded border border-slate-300 px-2 py-1 text-xs sm:col-span-2"
                        >
                          {ITEM_FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <label className="col-span-1 flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={sf.required}
                            onChange={(e) => updateItemField(idx, sidx, { required: e.target.checked })}
                          />
                          majb.
                        </label>
                        <button
                          type="button"
                          onClick={() => removeItemField(idx, sidx)}
                          className="col-span-1 text-xs text-red-500 hover:underline"
                        >
                          o'chirish
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItemField(idx)}
                      className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
                    >
                      + Ichki maydon qo'shish
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            "Ochiq" belgisi — bu maydon avtorizatsiyasiz public qidiruvda ko'rinadi. Moliyaviy/nozik
            maydonlarni ochiq qilmaslik tavsiya etiladi.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saqlanmoqda..." : "Reestr turini yaratish"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="font-medium text-slate-700">Mavjud reestr turlari</h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {types.map((t) => (
            <li key={t.id} className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-slate-400">{t.code}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{t.field_schema.length} ta maydon</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
