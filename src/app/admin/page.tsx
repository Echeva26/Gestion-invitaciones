import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/quotas";
import { toDateString } from "@/lib/dates";
import Header from "@/components/Header";
import RulesForm from "@/components/RulesForm";
import OwnerManager from "@/components/OwnerManager";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const settings = await getSettings();
  const owners = await prisma.owner.findMany({ orderBy: { name: "asc" } });

  // Ocupación por día (de hoy en adelante).
  const todayUtc = new Date(toDateString(new Date()) + "T00:00:00.000Z");
  const declarations = await prisma.guestDeclaration.findMany({
    where: { status: "ACTIVE", date: { gte: todayUtc } },
    include: { owner: true },
    orderBy: { date: "asc" },
  });

  const byDay = new Map<string, { total: number; rows: { unit: string; name: string; guests: number }[] }>();
  for (const d of declarations) {
    const key = toDateString(d.date);
    const entry = byDay.get(key) ?? { total: 0, rows: [] };
    entry.total += d.guests;
    entry.rows.push({ unit: d.owner.unit, name: d.owner.name, guests: d.guests });
    byDay.set(key, entry);
  }
  const days = [...byDay.entries()];

  return (
    <>
      <Header name={session.name} role={session.role} communityName={settings.communityName} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h1 className="text-xl font-bold text-slate-900">Administración</h1>
          <p className="text-slate-500 text-sm">
            Configura las normas, gestiona los propietarios y consulta la ocupación prevista.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Normas de invitados</h2>
          <RulesForm
            initial={{
              communityName: settings.communityName,
              poolCapacity: settings.poolCapacity,
              maxGuestsPerDay: settings.maxGuestsPerDay,
              maxGuestsPerWeek: settings.maxGuestsPerWeek,
              maxGuestsPerSeason: settings.maxGuestsPerSeason,
              seasonStart: toDateString(settings.seasonStart),
              seasonEnd: toDateString(settings.seasonEnd),
            }}
          />
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">Ocupación prevista</h2>
          {days.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              No hay invitados declarados próximamente.
            </div>
          ) : (
            <div className="space-y-4">
              {days.map(([day, info]) => (
                <div key={day} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{day}</span>
                    <span
                      className={`text-sm font-semibold ${
                        info.total > settings.poolCapacity ? "text-red-600" : "text-pool-700"
                      }`}
                    >
                      {info.total} / {settings.poolCapacity} invitados
                    </span>
                  </div>
                  <ul className="text-sm text-slate-600 divide-y divide-slate-100">
                    {info.rows.map((r, i) => (
                      <li key={i} className="py-1 flex justify-between">
                        <span>
                          {r.unit} · {r.name}
                        </span>
                        <span className="text-slate-500">{r.guests}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Propietarios</h2>
          <OwnerManager
            initial={owners.map((o) => ({
              id: o.id,
              name: o.name,
              email: o.email,
              unit: o.unit,
              role: o.role as "OWNER" | "ADMIN",
              active: o.active,
            }))}
          />
        </section>
      </main>
    </>
  );
}
