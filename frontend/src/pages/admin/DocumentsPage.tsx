import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { DocumentOut } from "../../types";

export function DocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    apiClient.get<DocumentOut[]>("/admin/documents").then(({ data }) => setDocuments(data));
  };
  useEffect(load, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("file", file);
      await apiClient.post("/admin/documents", fd);
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || t("documents.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (doc: DocumentOut) => {
    if (!confirm(`"${doc.title}" ${t("documents.confirmDelete")}`)) return;
    await apiClient.delete(`/admin/documents/${doc.id}`);
    load();
  };

  const copyLink = async (doc: DocumentOut) => {
    await navigator.clipboard.writeText(doc.page_url);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("documents.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("documents.desc")}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("documents.titleLabel")}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t("documents.fileLabel")}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700"
            required
          />
          <p className="mt-1 text-xs text-slate-400">{t("documents.fileHint")}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded-md bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? t("documents.uploading") : t("documents.upload")}
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-800">{doc.title}</div>
              <div className="truncate text-xs text-slate-400">{doc.original_filename}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs">
              <a href={doc.page_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                {t("documents.view")}
              </a>
              <button onClick={() => copyLink(doc)} className="text-slate-500 hover:underline">
                {copiedId === doc.id ? t("documents.copied") : t("documents.copyLink")}
              </button>
              <button onClick={() => remove(doc)} className="text-red-500 hover:underline">
                {t("documents.delete")}
              </button>
            </div>
          </li>
        ))}
        {documents.length === 0 && (
          <li className="p-6 text-center text-sm text-slate-400">{t("documents.empty")}</li>
        )}
      </ul>
    </div>
  );
}
