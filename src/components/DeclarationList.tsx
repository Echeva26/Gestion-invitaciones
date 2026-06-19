"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; date: string; guests: number; note: string };

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[date.getUTCDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
}

// Los items vienen del servidor (Server Component) y son la fuente de verdad.
// Tras crear o cancelar una declaración se llama a router.refresh(), que
// re-renderiza el servidor y propaga la lista actualizada por props. Por eso
// NO guardamos los items en estado local (se quedaría obsoleto en el refresco).
export default function DeclarationList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter((i) => i.date >= today);

  async function cancel(id: string) {
    if (!confirm("¿Cancelar esta declaración de invitados?")) return;
    setBusy(id);
    const res = await fetch(`/api/declarations/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.refresh();
  }

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
        No tienes visitas declaradas próximamente.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {upcoming.map((i) => (
        <li
          key={i.id}
          className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3"
        >
          <div>
            <div className="font-medium text-slate-800">{formatDate(i.date)}</div>
            <div className="text-sm text-slate-500">
              {i.guests} invitado{i.guests > 1 ? "s" : ""}
              {i.note && <span className="text-slate-400"> · {i.note}</span>}
            </div>
          </div>
          <button
            onClick={() => cancel(i.id)}
            disabled={busy === i.id}
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {busy === i.id ? "…" : "Cancelar"}
          </button>
        </li>
      ))}
    </ul>
  );
}
