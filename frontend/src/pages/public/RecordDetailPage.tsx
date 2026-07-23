import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { FieldDef, PublicRecordOut, STATUS_LABELS } from "../../types";

function formatValue(field: FieldDef, value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "boolean") return value ? "Ha" : "Yo'q";
  if (field.type === "number") return Number(value).toLocaleString("uz-UZ");
  return String(value);
}

const RESTRICTION_COLUMNS: { key: string; label: string }[] = [
  { key: "raqami", label: "Taqiq/cheklov raqami" },
  { key: "turi", label: "Taqiq/cheklov turi" },
  { key: "kim_tomonidan", label: "Kim tomonidan" },
  { key: "sana", label: "Sana" },
  { key: "ijro_raqami", label: "Ijro xujjatining raqami" },
  { key: "almashuv_kodi", label: "Ma'lumot almashuv orqali qo'yilganligi (almashuv kodi)" },
];

export function RecordDetailPage() {
  const { recordNumber } = useParams<{ recordNumber: string }>();
  const [record, setRecord] = useState<PublicRecordOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<PublicRecordOut>(`/public/records/${recordNumber}`)
      .then(({ data }) => setRecord(data))
      .catch(() => setError("Yozuv topilmadi yoki hali e'lon qilinmagan"));
  }, [recordNumber]);

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-600">{error}</div>;
  }
  if (!record) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-500">Yuklanmoqda...</div>;
  }

  const simpleFields = record.field_defs.filter((f) => f.type !== "list");
  const listFields = record.field_defs.filter((f) => f.type === "list");
  const manzil = record.data.manzil;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-center text-2xl font-semibold text-slate-800">{record.record_number}</h1>
      {manzil && <p className="mt-1 text-center text-brand-600">{manzil}</p>}

      <p className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm italic text-slate-600">
        Agar siz ushbu obyekt mulkdori bo'lsangiz, rasmiy ma'lumotnoma (elektron raqamli imzo bilan
        tasdiqlangan) olish uchun shaxsiy kabinet orqali buyurtma berishingiz mumkin.
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
                  <td className="p-3 font-medium text-slate-600">Obyektga nisbatan {f.label.toLowerCase()}:</td>
                  <td className="p-3 text-right">
                    {items.length > 0 ? (
                      <span className="font-semibold text-orange-600">Mavjud</span>
                    ) : (
                      <span className="text-slate-400">Mavjud emas</span>
                    )}
                  </td>
                </tr>
              );
            })}

            <tr className={simpleFields.length % 2 === 0 ? "" : "bg-slate-50"}>
              <td className="p-3 font-medium text-slate-600">Holati</td>
              <td className="p-3 text-right">{STATUS_LABELS[record.status]}</td>
            </tr>
            <tr className="bg-slate-50">
              <td className="p-3 font-medium text-slate-600">E'lon qilingan sana</td>
              <td className="p-3 text-right">
                {record.published_at ? new Date(record.published_at).toLocaleDateString("uz-UZ") : "—"}
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
        Tekshirish kodi: {record.verify_code} — bu ko'chirmaning haqiqiyligini{" "}
        <span className="underline">/verify</span> orqali tekshirishingiz mumkin.
      </p>
    </div>
  );
}
