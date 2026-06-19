import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashToken, setSessionCookie } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.APP_URL ?? req.nextUrl.origin;

  const fail = (reason: string) =>
    NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(reason)}`);

  if (!token) return fail("Enlace inválido.");

  const record = await prisma.magicToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { owner: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("El enlace ha caducado o ya se ha usado. Solicita uno nuevo.");
  }
  if (!record.owner.active) return fail("Tu acceso está desactivado.");

  // Marca el token como usado (un solo uso).
  await prisma.magicToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  await setSessionCookie({
    ownerId: record.owner.id,
    role: record.owner.role === "ADMIN" ? "ADMIN" : "OWNER",
    name: record.owner.name,
  });

  const dest = record.owner.role === "ADMIN" ? "/admin" : "/dashboard";
  return NextResponse.redirect(`${appUrl}${dest}`);
}
