import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { ContentItemOut, ContentType } from "../../types";

const TYPES: ContentType[] = ["news", "service", "announcement"];

function emptyForm() {
  return { type: "news" as ContentType, title: "", description: "", sortOrder: 0, isPublished: true };
}

export function ContentPage() {
  const { t } = useLanguage();
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
      setError(err.response?.data?.detail || t("content.submitError"));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: ContentItemOut) => {
    await apiClient.patch(`/admin/content/${item.id}`, { is_published: !item.is_published });
    load();
  };

  const remove = async (item: ContentItemOut) => {
    if (!confirm(`"${item.title}" ${t("content.confirmDelete")}`)) return;
    await apiClient.delete(`/admin/content/${item.id}`);
    if (editingId === item.id) cancelEdit();
    load();
  };

  const visibleItems = filterType === "all" ? items : items.filter((i) => i.type === filterType);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("content.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("content.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("content.type")}</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContentType }))}
              disabled={!!editingId}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-50"
            >
              {TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`contentType.${ct}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{t("content.sortOrder")}</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("content.titleLabel")}</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("content.descLabel")}</label>
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
          {t("content.publishToggle")}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? t("content.saving") : editingId ? t("content.save") : t("content.add")}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-md bg-slate-100 px-5 py-2 font-medium text-slate-600 hover:bg-slate-200">
              {t("content.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          {(["all", ...TYPES] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`rounded-md px-3 py-1.5 font-medium ${
                filterType === ft ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {ft === "all" ? t("content.all") : t(`contentType.${ft}`)}
            </button>
          ))}
        </div>

        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {t(`contentType.${item.type}`)}
                  </span>
                  {!item.is_published && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                      {t("content.hiddenBadge")}
                    </span>
                  )}
                  <span className="truncate font-medium text-slate-800">{item.title}</span>
                </div>
                {item.description && <p className="mt-1 truncate text-xs text-slate-500">{item.description}</p>}
              </div>
              <div className="flex shrink-0 gap-3 text-xs">
                <button onClick={() => startEdit(item)} className="text-brand-700 hover:underline">
                  {t("content.edit")}
                </button>
                <button onClick={() => togglePublish(item)} className="text-slate-500 hover:underline">
                  {item.is_published ? t("content.hide") : t("content.show")}
                </button>
                <button onClick={() => remove(item)} className="text-red-500 hover:underline">
                  {t("content.delete")}
                </button>
              </div>
            </li>
          ))}
          {visibleItems.length === 0 && (
            <li className="p-6 text-center text-sm text-slate-400">{t("content.empty")}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
