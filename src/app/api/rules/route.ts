import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  communityName: z.string().min(1).max(120),
  poolCapacity: z.number().int().min(1).max(1000),
  maxGuestsPerDay: z.number().int().min(0).max(100),
  maxGuestsPerWeek: z.number().int().min(0).max(200),
  maxGuestsPerSeason: z.number().int().min(0).max(1000),
  seasonStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  seasonEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administración." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const updated = await prisma.settings.update({
    where: { id: 1 },
    data: {
      communityName: d.communityName,
      poolCapacity: d.poolCapacity,
      maxGuestsPerDay: d.maxGuestsPerDay,
      maxGuestsPerWeek: d.maxGuestsPerWeek,
      maxGuestsPerSeason: d.maxGuestsPerSeason,
      seasonStart: new Date(`${d.seasonStart}T00:00:00.000Z`),
      seasonEnd: new Date(`${d.seasonEnd}T00:00:00.000Z`),
    },
  });

  return NextResponse.json({ ok: true, settings: updated });
}
