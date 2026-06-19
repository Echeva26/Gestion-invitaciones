import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().min(1).max(120).optional(),
  unit: z.string().min(1).max(80).optional(),
  role: z.enum(["OWNER", "ADMIN"]).optional(),
});

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Solo administración." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  const { id } = await params;
  const owner = await prisma.owner.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true, owner });
}
