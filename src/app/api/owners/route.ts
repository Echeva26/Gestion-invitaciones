import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  unit: z.string().min(1).max(80),
  role: z.enum(["OWNER", "ADMIN"]).optional(),
});

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "ADMIN" ? session : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Solo administración." }, { status: 403 });
  }
  const owners = await prisma.owner.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ owners });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Solo administración." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const exists = await prisma.owner.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Ya existe un propietario con ese email." }, { status: 409 });
  }

  const owner = await prisma.owner.create({
    data: {
      name: parsed.data.name,
      email,
      unit: parsed.data.unit,
      role: parsed.data.role ?? "OWNER",
    },
  });

  return NextResponse.json({ ok: true, owner }, { status: 201 });
}
