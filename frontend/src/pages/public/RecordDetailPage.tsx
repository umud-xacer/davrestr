import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { FieldDef, PublicRecordOut } from "../../types";

export function RecordDetailPage() {
  const { recordNumber } = useParams<{ recordNumber: string }>();
  const { lang, t } = useLanguage();
  const [record, setRecord] = useState<PublicRecordOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    draft: t("status.draft"),
    active: t("status.active"),
    suspended: t("status.suspended"),
    terminated: t("status.terminated"),
    violated: t("status.violated"),
  };

  const RESTRICTION_COLUMNS: { key: string; label: string }[] = [
    { key: "raqami", label: t("record.restrictionNumber") },
    { key: "turi", label: t("record.restrictionType") },
    { key: "kim_tomonidan", label: t("record.restrictionBy") },
    { key: "sana", label: t("record.restrictionDate") },
    { key: "ijro_raqami", label: t("record.restrictionExecNumber") },
    { key: "almashuv_kodi", label: t("record.restrictionExchangeCode") },
  ];

  function formatValue(field: FieldDef, value: any): string {
    if (value === null || value === undefined || value === "") return "—";
    if (field.type === "boolean") return value ? t("record.yes") : t("record.no");
    if (field.type === "number") return Number(value).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ");
    return String(value);
  }

  useEffect(() => {
    apiClient
      .get<PublicRecordOut>(`/public/records/${recordNumber}`)
      .then(({ data }) => setRecord(data))
      .catch(() => setError(t("record.notFound")));
  }, [recordNumber]);

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-600">{error}</div>;
  }
  if (!record) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-500">{t("record.loading")}</div>;
  }

  const simpleFields = record.field_defs.filter((f) => f.type !== "list");
  const listFields = record.field_defs.filter((f) => f.type === "list");
  const manzil = record.data.manzil;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-center text-2xl font-semibold text-slate-800">{record.record_number}</h1>
      {manzil && <p className="mt-1 text-center text-brand-600">{manzil}</p>}

      <p className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm italic text-slate-600">
        {t("record.notice")}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <tbody>
            {simpleFields
              .filter((f) => f.key !== "manzil")
              .map((f, idx) => (
                <tr key={f.key} className={idx % 2 === 0 ? "" : "bg-slate-50"}>
                  <td className="p-3 font-medium text-slate-600">{f.label}:</td>
                  <td className="p-3 text-right">{formatValue(f, record.data[f.key])}</td>
                </tr>
              ))}

            {listFields.map((f) => {
              const items: Record<string, any>[] = record.data[f.key] || [];
              return (
                <tr key="cheklov-summary" className="bg-slate-50">
                  <td className="p-3 font-medium text-slate-600">
                    {t("record.restrictionsFor")} {f.label.toLowerCase()}:
                  </td>
                  <td className="p-3 text-right">
                    {items.length > 0 ? (
                      <span className="font-semibold text-orange-600">{t("record.exists")}</span>
                    ) : (
                      <span className="text-slate-400">{t("record.notExists")}</span>
                    )}
                  </td>
                </tr>
              );
            })}

            <tr className={simpleFields.length % 2 === 0 ? "" : "bg-slate-50"}>
              <td className="p-3 font-medium text-slate-600">{t("record.status")}</td>
              <td className="p-3 text-right">{STATUS_LABELS[record.status]}</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="p-3 font-medium text-slate-600">{t("record.publishedDate")}</td>
              <td className="p-3 text-right">
                {record.published_at
                  ? new Date(record.published_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {listFields.map((f) => {
        const items: Record<string, any>[] = record.data[f.key] || [];
        if (items.length === 0) return null;
        return (
          <div key={f.key} className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-600">
                  {RESTRICTION_COLUMNS.map((c) => (
                    <th key={c.key} className="border border-slate-200 p-2 font-medium">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="bg-white">
                    {RESTRICTION_COLUMNS.map((c) => (
                      <td key={c.key} className="border border-slate-200 p-2 text-slate-700">
                        {item[c.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <p className="mt-4 text-center text-xs text-slate-400">
        {t("record.verifyCode")}: {record.verify_code} — {t("record.verifyHint")}{" "}
        <span className="underline">/verify</span> {t("record.verifyHintSuffix")}
      </p>
    </div>
  );
}
