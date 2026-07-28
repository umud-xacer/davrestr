import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { useLanguage } from "../../context/LanguageContext";
import { ApplicationOut, ApplicationStatus } from "../../types";

const STATUS_FLOW: ApplicationStatus[] = [
  "under_review",
  "payment_pending",
  "paid",
  "approved",
];

export function ApplicationsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ApplicationOut[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const STATUS_LABELS: Record<ApplicationStatus, string> = {
    submitted: t("applicationStatus.submitted"),
    under_review: t("applicationStatus.under_review"),
    payment_pending: t("applicationStatus.payment_pending"),
    paid: t("applicationStatus.paid"),
    approved: t("applicationStatus.approved"),
    rejected: t("applicationStatus.rejected"),
  };

  const STATUS_COLORS: Record<ApplicationStatus, string> = {
    submitted: "bg-slate-100 text-slate-600",
    under_review: "bg-amber-100 text-amber-700",
    payment_pending: "bg-orange-100 text-orange-700",
    paid: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  };

  const load = () => {
    setLoading(true);
    apiClient
      .get<ApplicationOut[]>("/admin/applications", {
        params: statusFilter ? { status_filter: statusFilter } : {},
      })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const changeStatus = async (id: string, status: ApplicationStatus) => {
    setActionError(null);
    try {
      await apiClient.patch(`/admin/applications/${id}/status`, { status });
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || t("adminApplications.genericError"));
    }
  };

  const nextStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const prevStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx <= 0) return null;
    return STATUS_FLOW[idx - 1];
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">{t("adminApplications.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("adminApplications.desc")}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["", ...STATUS_FLOW, "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${
              statusFilter === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {s === "" ? t("adminApplications.all") : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-center text-slate-500">{t("adminApplications.loading")}</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-slate-500">{t("adminApplications.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">{t("adminApplications.colService")}</th>
                  <th className="p-3">{t("adminApplications.colApplicant")}</th>
                  <th className="p-3">{t("adminApplications.colPhone")}</th>
                  <th className="p-3">{t("adminApplications.colStatus")}</th>
                  <th className="p-3">{t("adminApplications.colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => {
                  const next = nextStatus(a.status);
                  const prev = prevStatus(a.status);
                  return (
                    <tr key={a.id}>
                      <td className="p-3 font-medium text-slate-800">{a.service_title}</td>
                      <td className="p-3">{a.full_name}</td>
                      <td className="p-3 text-xs text-slate-500">{a.phone}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[a.status]}`}>
                          {STATUS_LABELS[a.status]}
                        </span>
                      </td>
                      <td className="p-3">
                        {a.status !== "approved" && a.status !== "rejected" && (
                          <div className="flex flex-wrap gap-1">
                            {next && (
                              <button
                                onClick={() => changeStatus(a.id, next)}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                              >
                                {STATUS_LABELS[next]}
                              </button>
                            )}
                            {prev && (
                              <button
                                onClick={() => changeStatus(a.id, prev)}
                                className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
                              >
                                {t("adminApplications.backBtn")}
                              </button>
                            )}
                            <button
                              onClick={() => changeStatus(a.id, "rejected")}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                            >
                              {t("adminApplications.rejectBtn")}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
