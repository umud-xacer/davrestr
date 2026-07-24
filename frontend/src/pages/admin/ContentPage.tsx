import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { CONTENT_TYPE_LABELS, ContentItemOut, ContentType } from "../../types";

const TYPES: ContentType[] = ["news", "service", "announcement"];

function emptyForm() {
  return { type: "news" as ContentType, title: "", description: "", sortOrder: 0, isPublished: true };
}

export function ContentPage() {
  const [items, setItems] = useState<ContentItemOut[]>([]);
  const [filterType, setFilterType] = useState<ContentType | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiClient.get<ContentItemOut[]>("/admin/content").then(({ data }) => setItems(data));
  };
  useEffect(load, []);

  const startEdit = (item: ContentItemOut) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      description: item.description || "",
      sortOrder: item.sort_order,
      isPublished: item.is_published,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(`/admin/content/${editingId}`, {
          title: form.title,
          description: form.description || null,
          sort_order: form.sortOrder,
          is_published: form.isPublished,
        });
      } else {
        await apiClient.post("/admin/content", {
          type: form.type,
          title: form.title,
          description: form.description || null,
          sort_order: form.sortOrder,
          is_published: form.isPublished,
        });
      }
      cancelEdit();
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: ContentItemOut) => {
    await apiClient.patch(`/admin/content/${item.id}`, { is_published: !item.is_published });
    load();
  };

  const remove = async (item: ContentItemOut) => {
    if (!confirm(`"${item.title}" o'chirilsinmi?`)) return;
    await apiClient.delete(`/admin/content/${item.id}`);
    if (editingId === item.id) cancelEdit();
    load();
  };

  const visibleItems = filterType === "all" ? items : items.filter((i) => i.type === filterType);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">Sayt kontenti</h1>
      <p className="mt-1 text-sm text-slate-500">
        Bosh sahifadagi yangiliklar, elektron xizmatlar ro'yxati va e'lonlarni shu yerdan boshqaring.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Turi</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentType }))}
              disabled={!!editingId}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tartib raqami</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Sarlavha</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Qisqa matn</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            rows={3}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
          />
          Sayt bosh sahifasida ko'rinsin
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda..." : editingId ? "O'zgarishlarni saqlash" : "Qo'shish"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-md bg-slate-100 px-5 py-2 font-medium text-slate-600 hover:bg-slate-200">
              Bekor qilish
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {(["all", ...TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                filterType === t ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "all" ? "Barchasi" : CONTENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {CONTENT_TYPE_LABELS[item.type]}
                  </span>
                  {!item.is_published && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">yashirin</span>
                  )}
                  <span className="truncate font-medium text-slate-800">{item.title}</span>
                </div>
                {item.description && <p className="mt-1 truncate text-xs text-slate-500">{item.description}</p>}
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                <button onClick={() => startEdit(item)} className="text-brand-700 hover:underline">
                  Tahrirlash
                </button>
                <button onClick={() => togglePublish(item)} className="text-slate-500 hover:underline">
                  {item.is_published ? "Yashirish" : "Ko'rsatish"}
                </button>
                <button onClick={() => remove(item)} className="text-red-500 hover:underline">
                  O'chirish
                </button>
              </div>
            </li>
          ))}
          {visibleItems.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-400">Kontent topilmadi</li>
          )}
        </ul>
      </div>
    </div>
  );
}
