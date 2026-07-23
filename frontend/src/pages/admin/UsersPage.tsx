import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "../../api/client";
import { OrganizationOut, ROLE_LABELS, Role, UserOut } from "../../types";

const ROLES: Role[] = ["cabinet_employee", "cabinet_approver", "org_admin", "superadmin"];

export function UsersPage() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [orgs, setOrgs] = useState<OrganizationOut[]>([]);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("cabinet_employee");
  const [organizationId, setOrganizationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiClient.get<UserOut[]>("/admin/users").then(({ data }) => setUsers(data));
    apiClient.get<OrganizationOut[]>("/admin/organizations").then(({ data }) => setOrgs(data)).catch(() => {});
  };
  useEffect(load, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.post("/admin/users", {
        full_name: fullName,
        username,
        password,
        role,
        organization_id: organizationId || null,
      });
      setFullName("");
      setUsername("");
      setPassword("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: UserOut) => {
    await apiClient.patch(`/admin/users/${u.id}`, { is_active: false });
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-semibold text-slate-800">Foydalanuvchilar va huquqlar</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">F.I.SH</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Foydalanuvchi nomi</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Vaqtinchalik parol</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700">Tashkilot</label>
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
            <option value="">— (superadmin uchun shart emas)</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="col-span-2 rounded-md bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "Yaratilmoqda..." : "Foydalanuvchi yaratish"}
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">F.I.SH</th>
              <th className="p-3">Login</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.full_name}</td>
                <td className="p-3">{u.username}</td>
                <td className="p-3">{ROLE_LABELS[u.role]}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u)} className="text-xs text-red-500 hover:underline">
                    Bloklash
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
