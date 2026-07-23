import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { RegistryRecordOut, RegistryStatus, STATUS_LABELS } from "../../types";

const APPROVER_ROLES = ["cabinet_approver", "org_admin", "superadmin"];

export function CabinetDashboardPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RegistryRecordOut[]>([]);
  const [statusFilter, setStatusFilter] = useState<RegistryStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const canApprove = user && APPROVER_ROLES.includes(user.role);

  const load = () => {
    setLoading(true);
    apiClient
      .get<RegistryRecordOut[]>("/cabinet/records", {
        params: statusFilter ? { status_filter: statusFilter } : {},
      })
      .then(({ data }) => setRecords(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleSign = async (id: string) => {
    setActionError(null);
    try {
      await apiClient.post(`/cabinet/records/${id}/sign`);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handleStatusChange = async (id: string, newStatus: RegistryStatus) => {
    setActionError(null);
    try {
      await apiClient.post(`/cabinet/records/${id}/status/${newStatus}`);
      load();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Idora Kabineti — Reestr yozuvlari</h1>
        <Link
          to="/cabinet/records/new"
          className="inline-block rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
        >
          + Yangi yozuv kiritish
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["", "draft", "active", "suspended", "terminated", "violated"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs ${
              statusFilter === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {s === "" ? "Barchasi" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Yuklanmoqda...</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-center text-slate-500">Yozuvlar topilmadi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">Raqami</th>
                  <th className="p-3">Subyekt</th>
                  <th className="p-3">Holati</th>
                  <th className="p-3">Kanal</th>
                  <th className="p-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-medium text-brand-700">
                      <Link to={r.status === "draft" ? `/cabinet/records/${r.id}/edit` : `/record/${r.record_number}`}>
                        {r.record_number}
                      </Link>
                    </td>
                    <td className="p-3">{r.subject_name || "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{STATUS_LABELS[r.status]}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{r.source_channel}</td>
                    <td className="p-3">
                      {r.status === "draft" && canApprove && (
                        <button
                          onClick={() => handleSign(r.id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        >
                          E-IMZO bilan tasdiqlash
                        </button>
                      )}
                      {r.status === "active" && canApprove && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(r.id, "suspended")}
                            className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
                          >
                            To'xtatish
                          </button>
                          <button
                            onClick={() => handleStatusChange(r.id, "terminated")}
                            className="rounded bg-slate-500 px-2 py-1 text-xs text-white hover:bg-slate-600"
                          >
                            Tugatish
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
