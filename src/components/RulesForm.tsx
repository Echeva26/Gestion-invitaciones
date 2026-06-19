"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rules = {
  communityName: string;
  poolCapacity: number;
  maxGuestsPerDay: number;
  maxGuestsPerWeek: number;
  maxGuestsPerSeason: number;
  seasonStart: string;
  seasonEnd: string;
};

export default function RulesForm({ initial }: { initial: Rules }) {
  const router = useRouter();
  const [form, setForm] = useState<Rules>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof Rules>(key: K, value: Rules[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Normas guardadas." });
      router.refresh();
    } else {
      const d = await res.json();
      setMsg({ type: "err", text: d.error ?? "Error al guardar." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nombre de la comunidad">
        <input
          type="text"
          value={form.communityName}
          onChange={(e) => set("communityName", e.target.value)}
          className="input"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Aforo de la piscina (personas)">
          <NumberInput value={form.poolCapacity} onChange={(v) => set("poolCapacity", v)} />
        </Field>
        <Field label="Máx. invitados por día y propietario">
          <NumberInput value={form.maxGuestsPerDay} onChange={(v) => set("maxGuestsPerDay", v)} />
        </Field>
        <Field label="Máx. invitados por semana y propietario">
          <NumberInput value={form.maxGuestsPerWeek} onChange={(v) => set("maxGuestsPerWeek", v)} />
        </Field>
        <Field label="Máx. invitados por temporada y propietario">
          <NumberInput
            value={form.maxGuestsPerSeason}
            onChange={(v) => set("maxGuestsPerSeason", v)}
          />
        </Field>
        <Field label="Inicio de temporada">
          <input
            type="date"
            value={form.seasonStart}
            onChange={(e) => set("seasonStart", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Fin de temporada">
          <input
            type="date"
            value={form.seasonEnd}
            onChange={(e) => set("seasonEnd", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {msg && (
        <div
          className={`text-sm rounded-lg p-2 ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-pool-600 hover:bg-pool-700 disabled:opacity-60 text-white font-medium rounded-lg px-6 py-2.5 transition"
      >
        {saving ? "Guardando…" : "Guardar normas"}
      </button>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem;
        }
        :global(.input:focus) {
          outline: none;
          box-shadow: 0 0 0 2px #0ea5a4;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="input"
    />
  );
}
