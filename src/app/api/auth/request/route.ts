import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateMagicToken } from "@/lib/auth";
import { sendMagicLink } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email no válido." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const owner = await prisma.owner.findUnique({ where: { email } });

  // Respuesta genérica: no revelamos si el email existe o no (evita enumeración).
  const genericOk = NextResponse.json({
    ok: true,
    message: "Si el email pertenece a un propietario, recibirás un enlace de acceso.",
  });

  if (!owner || !owner.active) return genericOk;

  const { token, tokenHash, expiresAt } = generateMagicToken();
  await prisma.magicToken.create({ data: { ownerId: owner.id, tokenHash, expiresAt } });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/auth/verify?token=${token}`;
  await sendMagicLink(owner.email, link);

  return genericOk;
}
