import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/constants";

// Proxy (antes "middleware"): corre en el Edge runtime, así que no usa Prisma.
// Solo verifica que la cookie de sesión sea un JWT válido.
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await isValidSession(token);

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Protege el panel de propietario y el de administración.
// (El control fino ADMIN vs OWNER se hace en cada página/route.)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
