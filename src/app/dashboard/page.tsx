import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/quotas";
import Header from "@/components/Header";
import DeclarationForm from "@/components/DeclarationForm";
import DeclarationList from "@/components/DeclarationList";
import { toDateString } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const settings = await getSettings();

  const seasonAgg = await prisma.guestDeclaration.aggregate({
    _sum: { guests: true },
    where: {
      ownerId: session.ownerId,
      status: "ACTIVE",
      date: { gte: settings.seasonStart, lte: settings.seasonEnd },
    },
  });
  const seasonUsed = seasonAgg._sum.guests ?? 0;
  const seasonLeft = Math.max(0, settings.maxGuestsPerSeason - seasonUsed);

  const declarations = await prisma.guestDeclaration.findMany({
    where: { ownerId: session.ownerId, status: "ACTIVE" },
    orderBy: { date: "asc" },
  });

  const list = declarations.map((d) => ({
    id: d.id,
    date: toDateString(d.date),
    guests: d.guests,
    note: d.note ?? "",
  }));

  return (
    <>
      <Header name={session.name} role={session.role} communityName={settings.communityName} />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Mis invitados</h1>
          <p className="text-slate-500 text-sm">
            Declara con antelación los invitados que traerás a la piscina. El sistema aplica
            automáticamente las normas de la comunidad.
          </p>
        </section>

        {/* Resumen de temporada */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Invitados / día" value={settings.maxGuestsPerDay} />
          <Stat label="Invitados / semana" value={settings.maxGuestsPerWeek} />
          <Stat label="Temporada" value={`${seasonUsed} / ${settings.maxGuestsPerSeason}`} />
          <Stat label="Te quedan" value={seasonLeft} highlight />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Declarar invitados</h2>
          <DeclarationForm
            seasonStart={toDateString(settings.seasonStart)}
            seasonEnd={toDateString(settings.seasonEnd)}
          />
        </section>

        <section>
          <h2 className="font-semibold text-slate-800 mb-3">Próximas visitas declaradas</h2>
          <DeclarationList items={list} />
        </section>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "bg-pool-50 border-pool-100" : "bg-white border-slate-200"
      }`}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-pool-700" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}
