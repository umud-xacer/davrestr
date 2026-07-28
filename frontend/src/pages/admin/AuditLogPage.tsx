import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { AuditLogOut } from "../../types";

export function AuditLogPage() {
  const { lang, t } = useLanguage();
  const [logs, setLogs] = useState<AuditLogOut[]>([]);

  useEffect(() => {
    apiClient.get<AuditLogOut[]>("/admin/audit-logs").then(({ data }) => setLogs(data));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("auditLog.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("auditLog.desc")}</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">{t("auditLog.colTime")}</th>
              <th className="p-3">{t("auditLog.colUser")}</th>
              <th className="p-3">{t("auditLog.colAction")}</th>
              <th className="p-3">{t("auditLog.colEntity")}</th>
              <th className="p-3">{t("auditLog.colIp")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="p-3 text-xs text-slate-500">
                  {new Date(l.created_at).toLocaleString(lang === "ru" ? "ru-RU" : "uz-UZ")}
                </td>
                <td className="p-3">{l.actor_username || "—"}</td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3 text-xs text-slate-500">
                  {l.entity_type}
                  {l.entity_id ? ` #${l.entity_id.slice(0, 8)}` : ""}
                </td>
                <td className="p-3 text-xs text-slate-400">{l.ip_address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
