import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toUtcDay } from "@/lib/dates";
import { computeTotals } from "@/lib/quotas";
import { validateDeclaration, remainingQuotas } from "@/lib/rules";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha YYYY-MM-DD"),
  guests: z.number().int().min(1).max(50),
  note: z.string().max(280).optional(),
});

/** GET → declaraciones propias + cupos restantes (opcionalmente para ?date=). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date");

  const declarations = await prisma.guestDeclaration.findMany({
    where: { ownerId: session.ownerId, status: "ACTIVE" },
    orderBy: { date: "asc" },
  });

  let remaining = null;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const day = toUtcDay(dateParam);
    const totals = await computeTotals(session.ownerId, day);
    remaining = remainingQuotas({ date: day, ...totals });
  }

  return NextResponse.json({ declarations, remaining });
}

/** POST → crea una declaración tras validar todas las normas. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const day = toUtcDay(parsed.data.date);
  const totals = await computeTotals(session.ownerId, day);
  const result = validateDeclaration({ date: day, guests: parsed.data.guests, ...totals });

  if (!result.ok) {
    return NextResponse.json(
      { error: "No se cumplen las normas.", violations: result.violations },
      { status: 422 },
    );
  }

  const created = await prisma.guestDeclaration.create({
    data: {
      ownerId: session.ownerId,
      date: day,
      guests: parsed.data.guests,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true, declaration: created }, { status: 201 });
}
