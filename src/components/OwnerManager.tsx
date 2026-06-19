"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Owner = {
  id: string;
  name: string;
  email: string;
  unit: string;
  role: "OWNER" | "ADMIN";
  active: boolean;
};

export default function OwnerManager({ initial }: { initial: Owner[] }) {
  const router = useRouter();
  const [owners, setOwners] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", unit: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addOwner(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const { owner } = await res.json();
      setOwners((prev) => [...prev, owner].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", email: "", unit: "" });
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al crear.");
    }
  }

  async function toggleActive(o: Owner) {
    const res = await fetch(`/api/owners/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !o.active }),
    });
    if (res.ok) {
      setOwners((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, active: !o.active } : x)),
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addOwner} className="grid sm:grid-cols-4 gap-3 items-end">
        <Input label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Input
          label="Vivienda"
          value={form.unit}
          onChange={(v) => setForm({ ...form, unit: v })}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-pool-600 hover:bg-pool-700 disabled:opacity-60 text-white font-medium rounded-lg py-2 transition"
        >
          {saving ? "…" : "Añadir"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 font-medium">Nombre</th>
              <th className="py-2 font-medium">Vivienda</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Rol</th>
              <th className="py-2 font-medium text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {owners.map((o) => (
              <tr key={o.id} className={o.active ? "" : "opacity-50"}>
                <td className="py-2 text-slate-800">{o.name}</td>
                <td className="py-2 text-slate-600">{o.unit}</td>
                <td className="py-2 text-slate-600">{o.email}</td>
                <td className="py-2 text-slate-600">{o.role === "ADMIN" ? "Admin" : "Propietario"}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => toggleActive(o)}
                    className={`text-xs rounded-full px-2 py-1 ${
                      o.active
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {o.active ? "Activo" : "Inactivo"}
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

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pool-500"
      />
    </div>
  );
}
