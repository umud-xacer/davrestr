import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient, resolveMediaUrl } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { DocumentOut } from "../../types";

export function DocumentViewPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [doc, setDoc] = useState<DocumentOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<DocumentOut>(`/public/documents/${id}`)
      .then(({ data }) => setDoc(data))
      .catch(() => setError(t("documentView.notFound")));
  }, [id]);

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-600">{error}</div>;
  }
  if (!doc) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-500">{t("documentView.loading")}</div>;
  }

  const fileUrl = resolveMediaUrl(doc.file_url) || "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-800">{doc.title}</h1>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("documentView.download")}
        </a>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <iframe src={fileUrl} title={doc.title} className="h-[80vh] w-full" />
      </div>
    </div>
  );
}
