"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Remaining = { day: number; week: number; season: number; capacity: number };
type Violation = { code: string; message: string };

export default function DeclarationForm({
  seasonStart,
  seasonEnd,
}: {
  seasonStart: string;
  seasonEnd: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState("");
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [errors, setErrors] = useState<Violation[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Al elegir fecha, consultamos los cupos restantes de ese día.
  useEffect(() => {
    if (!date) {
      setRemaining(null);
      return;
    }
    let active = true;
    fetch(`/api/declarations?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setRemaining(d.remaining ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [date]);

  const maxAllowed = remaining
    ? Math.min(remaining.day, remaining.week, remaining.season, remaining.capacity)
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    const res = await fetch("/api/declarations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, guests, note: note || undefined }),
    });
    setSubmitting(false);

    if (res.ok) {
      setDate("");
      setGuests(1);
      setNote("");
      setRemaining(null);
      router.refresh();
      return;
    }
    const data = await res.json();
    setErrors(data.violations ?? [{ code: "ERR", message: data.error ?? "Error." }]);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Día</label>
          <input
            type="date"
            required
            min={seasonStart}
            max={seasonEnd}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pool-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nº de invitados
          </label>
          <input
            type="number"
            required
            min={1}
            max={50}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pool-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nota (opcional)
        </label>
        <input
          type="text"
          maxLength={280}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="P.ej. visita familiar"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pool-500"
        />
      </div>

      {/* Vista previa de cupos del día seleccionado */}
      {remaining && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
          Para ese día puedes traer hasta{" "}
          <strong className="text-pool-700">{maxAllowed}</strong> invitado(s).
          <span className="text-slate-400">
            {" "}
            (día {remaining.day} · semana {remaining.week} · temporada {remaining.season} ·
            aforo {remaining.capacity})
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
          {errors.map((v, i) => (
            <li key={i}>• {v.message}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={submitting || !date}
        className="w-full sm:w-auto bg-pool-600 hover:bg-pool-700 disabled:opacity-60 text-white font-medium rounded-lg px-6 py-2.5 transition"
      >
        {submitting ? "Guardando…" : "Declarar invitados"}
      </button>
    </form>
  );
}
