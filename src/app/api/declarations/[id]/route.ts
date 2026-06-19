import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** DELETE → cancela una declaración propia (soft-delete: status = CANCELLED). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { id } = await params;
  const decl = await prisma.guestDeclaration.findUnique({ where: { id } });
  if (!decl || decl.ownerId !== session.ownerId) {
    return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  }

  await prisma.guestDeclaration.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
